/**
 * @fileoverview Página de la galería de fotografías (Tab 2).
 *
 * @description
 * Vista principal del dominio de galería: muestra la cuadrícula de fotos
 * locales persistidas por `PhotoService`, el estado vacío, el estado de
 * carga, los errores traducidos a español y el botón flotante (FAB) que
 * abre la cámara nativa mediante `PhotoService.addNewToGallery()`.
 *
 * Decisiones de diseño (Fase 4) y de ciclo de vida (Fase 5B):
 * - El estado se consume como *signals* directamente desde `PhotoService`,
 *   de modo que la UI se actualiza sola cuando el servicio prepone una foto
 *   nueva o hidrata la galería desde disco.
 * - La carga inicial se dispara en `ngOnInit` con `loadSaved()`; al ser un
 *   servicio singleton, el estado sobrevive al caché de páginas de
 *   `ion-router-outlet` cuando el usuario cambia de pestaña.
 * - Los mensajes de error se derivan de códigos estables (`PhotoErrorCode`)
 *   para no mezclar texto de UI con la lógica del servicio.
 *
 * @author @ionic-ui-animator (Fase 4 — Diseño / Fase 5B — Desarrollo UI / Fase 7 — Animación)
 * @phase SDD Fase 4 — Diseño Ionic y UX móvil nativa
 * @phase SDD Fase 5B — Desarrollo de componentes y ciclo de vida
 * @phase SDD Fase 7 — Animaciones y micro-interacciones
 */

// Núcleo de Angular: decorador de componente, hook `OnInit`, inyección con
// `inject()` y signals reactivos (`signal` para estado local, `computed`
// para valores derivados de los signals del servicio).
import { Component, OnInit, computed, inject, signal } from '@angular/core';

// Función de ionicons que registra iconos por nombre para que `<ion-icon
// name="...">` pueda resolverlos en runtime. Se registran en el constructor
// porque la app compila con tree-shaking y sin registro el icono quedaría vacío.
import { addIcons } from 'ionicons';

// Iconos concretos usados en esta página: `camera` para el FAB de captura,
// `images` para el estado vacío y `alertCircle` para los mensajes de error.
import { alertCircle, camera, images } from 'ionicons/icons';

// Servicio singleton de la galería: expone los signals `photos`, `loading`
// y `error`, y los casos de uso `loadSaved()` y `addNewToGallery()`.
import { PhotoService } from '../services/photo.service';

// Modelos de dominio: `PhotoErrorCode` para traducir errores a texto en
// español y `PhotoItem` para tipar la pista de orden (track) de la cuadrícula.
import type { PhotoErrorCode } from '../models/photo.model';

// Contrato de ciclo de vida Ionic para anunciar la pantalla al entrar.
import type { ViewDidEnter } from '@ionic/angular';

// Utilidades de accesibilidad (Fase 6): anuncio de ruta SPA y restauración de
// foco tras cerrar el modal nativo de la cámara (WCAG 2.4.3).
import { announceScreen, restoreFocus } from '../utils/a11y-announce.util';

/**
 * Componente de página que implementa la galería de fotografías locales.
 *
 * Se declara en `Tab2PageModule` (patrón NgModule de la plantilla tabs),
 * por eso `standalone: false`.
 */
@Component({
  // Selector usado por el router de pestañas al instanciar la página.
  selector: 'app-tab2',
  // Plantilla externa con la estructura Ionic de la galería.
  templateUrl: 'tab2.page.html',
  // Hoja de estilos con tokens de diseño, safe areas y animaciones (Fase 7).
  styleUrls: ['tab2.page.scss'],
  // La plantilla tabs de Ionic 9 genera páginas NgModule; se conserva el patrón.
  standalone: false,
})
export class Tab2Page implements OnInit, ViewDidEnter {
  // ---------------------------------------------------------------------------
  // Dependencias inyectadas
  // ---------------------------------------------------------------------------

  /**
   * Servicio de galería inyectado con la función `inject()` (estilo Angular
   * moderno). Es la única fuente de verdad de las fotografías locales.
   */
  private readonly photoService = inject(PhotoService);

  // ---------------------------------------------------------------------------
  // Estado expuesto a la plantilla (signals)
  // ---------------------------------------------------------------------------

  /**
   * Lista de fotografías locales ordenada de más reciente a más antigua.
   * Se reexpone el signal del servicio para que la plantilla lo lea con `photos()`.
   */
  readonly photos = this.photoService.photos;

  /**
   * Indica si la galería está hidratándose desde disco (`true` durante
   * `loadSaved()`); la plantilla lo usa para mostrar el spinner y bloquear el FAB.
   */
  readonly loading = this.photoService.loading;

  /**
   * Atajo al `computed` del servicio: `true` cuando no hay fotografías.
   * Permite alternar entre el estado vacío y la cuadrícula.
   */
  readonly isEmpty = this.photoService.isEmpty;

  /**
   * Contador derivado de fotos para el `ion-chip` de la cabecera.
   * `computed` garantiza que solo se recalcula cuando cambia `photos()`.
   */
  readonly photoCount = computed(() => this.photos().length);

  /**
   * Mensaje de error legible derivado del código estable del servicio.
   * Devuelve `null` cuando no hay error para que la plantilla oculte el aviso.
   */
  readonly errorMessage = computed<string | null>(() => {
    // Lee el código de error actual del servicio (p. ej. 'read_failed').
    const code = this.photoService.error();
    // Sin código no hay banner que mostrar.
    return code ? this.describeError(code) : null;
  });

  // ---------------------------------------------------------------------------
  // Estado local del toast (retroalimentación no bloqueante)
  // ---------------------------------------------------------------------------

  /**
   * Controla la visibilidad del `ion-toast` de forma declarativa
   * (`[isOpen]`), evitando imperativos con `ToastController`.
   */
  readonly toastOpen = signal<boolean>(false);

  /**
   * Texto que muestra el toast: éxito al añadir una foto o error de captura.
   */
  readonly toastMessage = signal<string>('');

  /**
   * Constructor: registra los iconos de ionicons usados por esta página.
   *
   * El registro es global y idempotente; se hace aquí para que la página sea
   * autosuficiente aunque la plantilla tabs no registre iconos por defecto
   * en builds con tree-shaking.
   */
  constructor() {
    // Mapa nombre-en-plantilla → objeto SVG importado.
    addIcons({
      // Icono del botón flotante de cámara.
      camera,
      // Icono decorativo del estado vacío.
      images,
      // Icono del banner de error; el nombre en kebab-case coincide con el
      // atributo `name="alert-circle"` de la plantilla.
      'alert-circle': alertCircle,
    });
  }

  /**
   * Hook de ciclo de vida de Angular: se ejecuta una única vez al crear la página.
   *
   * Dispara la hidratación de la galería desde `@capacitor/preferences` y
   * `Filesystem` (REQ-008). Se usa `void` para marcar la promesa como
   * intencionadamente no esperada: la UI reacciona vía signals.
   */
  ngOnInit(): void {
    // `loadSaved()` nunca lanza excepciones (las captura y fija `error`),
    // así que no hace falta try/catch en la página.
    void this.photoService.loadSaved();
  }

  /**
   * Hook de ciclo de vida de Ionic ejecutado cada vez que la pestaña queda visible.
   *
   * Anuncia el cambio de vista en lectores de pantalla actualizando el título
   * del documento y enfocando el encabezado principal (WCAG 2.4.2 / 2.4.3).
   */
  ionViewDidEnter(): void {
    announceScreen('Galería — Galería de Fotos', 'gallery-title');
  }

  // ---------------------------------------------------------------------------
  // Casos de uso de la plantilla
  // ---------------------------------------------------------------------------

  /**
   * Abre la cámara (o el prompt nativo cámara/galería) y añade la foto
   * resultante a la cuadrícula.
   *
   * Flujo:
   * 1. `addNewToGallery()` devuelve `null` si el usuario cancela → no se hace nada.
   * 2. Si devuelve un `PhotoItem`, el servicio ya lo prepondrá en `photos()`
   *    y la celda nueva entra animada en la cuadrícula (Fase 7).
   * 3. Si la promesa se rechaza (permiso denegado, fallo de escritura),
   *    se muestra un toast con el mensaje en español correspondiente.
   */
  async takePhoto(): Promise<void> {
    // Guarda el elemento enfocado antes de abrir el modal nativo de cámara
    // para devolverle el foco al cerrar (trampa Capacitor #10, WCAG 2.4.3).
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    try {
      // Promesa de captura + persistencia; `source` por defecto es
      // `CameraSource.Prompt` para que el usuario elija cámara o galería.
      const saved = await this.photoService.addNewToGallery();

      if (saved) {
        // Retroalimentación positiva breve: confirma que la foto se guardó
        // en el almacenamiento privado de la app (propósito: feedback).
        this.showToast('Foto añadida a la galería');
      }
      // `saved === null` significa cancelación del usuario: silencio intencional.
    } catch {
      // El servicio ya fijó su signal `error`; aquí solo se notifica al usuario.
      const code = this.photoService.error();
      this.showToast(code ? this.describeError(code) : 'No se pudo completar la captura');
    } finally {
      // Restaura el foco al botón disparador tras regresar de la vista nativa.
      restoreFocus(previousFocus);
    }
  }

  /**
   * Reintenta la hidratación de la galería tras un error de lectura.
   *
   * Se expone en el botón «Reintentar» del banner de error para que el
   * usuario pueda recuperarse sin salir de la pestaña.
   */
  retryLoad(): void {
    // Misma promesa de carga inicial; se marca como no esperada con `void`.
    void this.photoService.loadSaved();
  }

  /**
   * Cierra el toast cuando termina su duración o el usuario lo descarta.
   *
   * Se conecta al evento `(didDismiss)` del `ion-toast` para resetear el
   * estado y permitir abrir otro toast más adelante.
   */
  dismissToast(): void {
    this.toastOpen.set(false);
  }

  // ---------------------------------------------------------------------------
  // Utilidades de presentación
  // ---------------------------------------------------------------------------

  /**
   * Formatea una fecha ISO 8601 en texto legible en español para el `alt`
   * de cada imagen (accesibilidad: TalkBack/VoiceOver leen la descripción).
   *
   * @param iso Fecha de captura en formato ISO (p. ej. '2026-11-05T14:30:00.000Z').
   * @returns Cadena como '5 nov 2026, 14:30'; si la fecha es inválida devuelve 'fecha desconocida'.
   */
  formatDate(iso: string): string {
    // Convierte el string ISO a objeto Date del navegador.
    const date = new Date(iso);

    // Defensa ante metadatos corruptos: una fecha inválida no debe romper el `alt`.
    if (Number.isNaN(date.getTime())) {
      return 'fecha desconocida';
    }

    // `Intl.DateTimeFormat` usa la configuración regional del dispositivo,
    // coherente con una app nativa (sin hardcodear el orden de los campos).
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  /**
   * Calcula el retardo de la animación de entrada en cascada (stagger) de
   * las celdas de la cuadrícula (Fase 7).
   *
   * Solo se escalonan las primeras 10 celdas para que galerías grandes no
   * acumulen retardos largos; las demás entran de inmediato.
   *
   * @param index Posición de la celda dentro del `@for`.
   * @returns Retardo en milisegundos (0–360 ms, pasos de 40 ms).
   */
  staggerDelay(index: number): number {
    // `Math.min` limita el índice escalonado; 40 ms es el paso recomendado
    // por la guía de animación (rango 30–80 ms).
    return Math.min(index, 9) * 40;
  }

  // ---------------------------------------------------------------------------
  // Métodos privados
  // ---------------------------------------------------------------------------

  /**
   * Activa el toast con un mensaje concreto.
   *
   * @param message Texto en español que se mostrará al usuario.
   */
  private showToast(message: string): void {
    // Fija primero el mensaje y después abre el toast para que el contenido
    // esté listo cuando Ionic inicie la transición de entrada.
    this.toastMessage.set(message);
    this.toastOpen.set(true);
  }

  /**
   * Traduce un código estable de error del servicio a un mensaje en español
   * apto para usuarios finales (sin detalles técnicos ni stack traces).
   *
   * @param code Código de `PhotoErrorCode` fijado por `PhotoService`.
   * @returns Mensaje descriptivo en español.
   */
  private describeError(code: PhotoErrorCode): string {
    // Tabla de traducción código → mensaje; el caso por defecto cubre
    // códigos futuros sin romper la compilación.
    switch (code) {
      case 'permission_denied':
        return 'Sin acceso a la cámara. Revisa los permisos en los ajustes del dispositivo.';
      case 'write_failed':
        return 'No se pudo guardar la fotografía en el almacenamiento local.';
      case 'read_failed':
        return 'No se pudieron leer las fotografías guardadas.';
      case 'index_corrupt':
        return 'El índice de la galería estaba dañado y se reinició.';
      case 'unsupported_format':
        return 'El formato de la imagen no es compatible con la galería.';
      case 'cancelled':
        return 'Operación cancelada.';
      default:
        return 'Ocurrió un error inesperado en la galería.';
    }
  }
}
