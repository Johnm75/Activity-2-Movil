/**
 * @fileoverview Página «Cuenta» (Tab 3): perfil de sesión y cierre de sesión.
 *
 * @description
 * Muestra los datos no sensibles de la sesión JWT activa (nombre, correo,
 * rol, vista enmascarada del token y minutos restantes) y ofrece el botón de
 * cerrar sesión, que delega en `AuthJwtService.logout()`: el servicio limpia
 * `Preferences`, vacía la signal de sesión y redirige a `/login` con
 * `replaceUrl`. Las fotografías locales NO se borran (AC-005).
 *
 * La confirmación se implementa con un `ion-alert` en línea (patrón
 * recomendado de Ionic 9: `trigger` + `[buttons]`), accesible por defecto
 * para TalkBack/VoiceOver.
 *
 * @author @ionic-ui-animator (Fase 5B — Desarrollo UI)
 * @phase SDD Fase 5B — Desarrollo de componentes y navegación
 */

// Núcleo de Angular: componente e inyección con `inject()`.
import { Component, inject } from '@angular/core';

// Registro de iconos de ionicons para builds con tree-shaking.
import { addIcons } from 'ionicons';

// Iconos de la página: `person` (avatar), `keyOutline` (fila del token),
// `timeOutline` (fila de expiración) y `logOutOutline` (botón de salir).
import { keyOutline, logOutOutline, person, timeOutline } from 'ionicons/icons';

// Servicio de autenticación: signals de sesión y caso de uso `logout()`.
import { AuthJwtService } from '../services/auth-jwt.service';

// Tipo de botón del `ion-alert` de confirmación (texto + rol + handler) y
// contrato de ciclo de vida Ionic al entrar en la pestaña.
import type { AlertButton, ViewDidEnter } from '@ionic/angular';

// Utilidad de accesibilidad para anunciar la navegación SPA (WCAG 2.4.2 / 2.4.3).
import { announceScreen } from '../utils/a11y-announce.util';

/**
 * Componente de la pestaña «Cuenta».
 *
 * Se declara en `Tab3PageModule` (patrón NgModule de la plantilla tabs).
 */
@Component({
  // Selector usado por el router de pestañas.
  selector: 'app-tab3',
  // Plantilla con el perfil de sesión y la acción de logout.
  templateUrl: 'tab3.page.html',
  // Estilos con safe areas y micro-interacción del botón.
  styleUrls: ['tab3.page.scss'],
  // Patrón NgModule consistente con el resto de páginas.
  standalone: false,
})
export class Tab3Page implements ViewDidEnter {
  // ---------------------------------------------------------------------------
  // Dependencias inyectadas
  // ---------------------------------------------------------------------------

  /**
   * Servicio de autenticación: única fuente de verdad de la sesión y único
   * camino para cerrarla (la página no toca `TokenStorageService` directamente).
   */
  private readonly auth = inject(AuthJwtService);

  // ---------------------------------------------------------------------------
  // Estado expuesto a la plantilla (signals del servicio)
  // ---------------------------------------------------------------------------

  /** Sesión activa (`token`, `expiresAt`, `user`) o `null` si no la hay. */
  readonly session = this.auth.session;

  /** Vista enmascarada del token para diagnóstico visual (SEC-007). */
  readonly tokenPreview = this.auth.tokenPreview;

  /** Minutos restantes de sesión calculados por el servicio. */
  readonly expiresInMinutes = this.auth.expiresInMinutes;

  // ---------------------------------------------------------------------------
  // Configuración de la confirmación de logout
  // ---------------------------------------------------------------------------

  /**
   * Botones del `ion-alert` de confirmación.
   *
   * - «Cancelar» con `role: 'cancel'`: cierra sin efectos y los lectores de
   *   pantalla lo anuncian como acción segura.
   * - «Cerrar sesión» con `role: 'destructive'`: ejecuta `logout()`; el rol
   *   comunica el carácter irreversible (se pierde la sesión, no las fotos).
   */
  readonly alertButtons: AlertButton[] = [
    {
      text: 'Cancelar',
      role: 'cancel',
    },
    {
      text: 'Cerrar sesión',
      role: 'destructive',
      // Handler del botón destructivo: dispara el caso de uso de logout.
      handler: () => {
        this.logout();
      },
    },
  ];

  /**
   * Constructor: registra los iconos usados por la plantilla en el registry
   * global de ionicons (necesario por el tree-shaking del build).
   */
  constructor() {
    addIcons({
      // Avatar genérico del perfil.
      person,
      // Fila de la vista enmascarada del token.
      keyOutline,
      // Fila de los minutos restantes de sesión.
      timeOutline,
      // Botón de cerrar sesión.
      logOutOutline,
    });
  }

  /**
   * Hook de ciclo de vida de Ionic al activarse la pestaña «Cuenta».
   *
   * Actualiza el título del documento y enfoca el encabezado principal para
   * que TalkBack y VoiceOver confirmen el cambio de pantalla.
   */
  ionViewDidEnter(): void {
    announceScreen('Cuenta — Galería de Fotos', 'account-title');
  }

  // ---------------------------------------------------------------------------
  // Casos de uso de la plantilla
  // ---------------------------------------------------------------------------

  /**
   * Cierra la sesión activa.
   *
   * Delega por completo en `AuthJwtService.logout()`, cuya promesa:
   * 1. Borra token, expiración y perfil de `@capacitor/preferences`.
   * 2. Vacía la signal `session` (la UI reacciona sola).
   * 3. Navega a `/login` con `replaceUrl` para impedir volver atrás.
   *
   * La promesa se marca con `void`: no hay nada que esperar en la página y
   * los errores de red no aplican (logout es local).
   */
  logout(): void {
    void this.auth.logout();
  }
}
