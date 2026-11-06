/**
 * @fileoverview Página de inicio de sesión (`LoginPage`).
 *
 * @description
 * Pantalla de acceso autenticada mediante JWT con formulario reactivo de correo
 * y contraseña, validación accesible en tiempo real, conmutador de visibilidad
 * de contraseña, autocompletado rápido de credenciales académicas de prueba y
 * redirección post-login sanitizada contra *open redirects*.
 *
 * @author @ionic-ui-animator (Fase 5B — Desarrollo UI)
 * @author @quality-security-auditor (Fase 6 — accesibilidad y seguridad)
 * @phase SDD Fase 5B — Desarrollo de componentes y navegación
 */

// Núcleo de Angular: decorador de componente, inyección funcional y signals reactivas.
import { Component, inject, signal } from '@angular/core';

// Constructor y validadores tipados para formularios reactivos.
import { FormBuilder, Validators } from '@angular/forms';

// Enrutador de Angular para leer `returnUrl` y navegar tras autenticar.
import { ActivatedRoute, Router } from '@angular/router';

// Registro explícito de iconos Ionicons para builds con tree-shaking.
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  camera,
  logInOutline,
  sparklesOutline,
} from 'ionicons/icons';

// Servicio de dominio encargado del login y persistencia de la sesión JWT.
import { AuthJwtService } from '../services/auth-jwt.service';

// Códigos tipados de error de autenticación.
import type { AuthErrorCode } from '../models/auth.model';

// Variables de entorno para habilitar la ayuda de demostración académica.
import { environment } from '../../environments/environment';

// Sanitizador de rutas internas contra ataques de redirección abierta.
import { sanitizeReturnUrl } from '../utils/return-url.util';

// Anunciador de navegación SPA para lectores de pantalla TalkBack y VoiceOver.
import { announceScreen } from '../utils/a11y-announce.util';

// Contrato de ciclo de vida Ionic al completarse la entrada de la vista.
import type { ViewDidEnter } from '@ionic/angular';

/**
 * Componente de la pantalla de inicio de sesión.
 */
@Component({
  // Selector del componente enrutado en `/login`.
  selector: 'app-login',
  // Plantilla accesible con tarjeta elevada y botones de alto contraste.
  templateUrl: 'login.page.html',
  // Hoja de estilos encapsulada con soporte de safe-area y micro-interacciones.
  styleUrls: ['login.page.scss'],
  // Declarado en `LoginPageModule` junto a los Custom Elements standalone de Ionic 9.
  standalone: false,
})
export class LoginPage implements ViewDidEnter {
  /** Servicio de autenticación JWT. */
  private readonly auth = inject(AuthJwtService);

  /** Constructor de formularios reactivos sin valores nulos. */
  private readonly fb = inject(FormBuilder);

  /** Enrutador para redirigir hacia la galería una vez iniciada la sesión. */
  private readonly router = inject(Router);

  /** Ruta activa desde la que se lee el parámetro opcional `returnUrl`. */
  private readonly route = inject(ActivatedRoute);

  /** `true` mientras la petición de inicio de sesión está en curso. */
  readonly loading = signal<boolean>(false);

  /** `true` después del primer intento de envío para activar mensajes por campo. */
  readonly submitted = signal<boolean>(false);

  /** Último código de error devuelto por el servicio de autenticación. */
  readonly errorCode = signal<AuthErrorCode | null>(null);

  /** Texto legible en español mostrado en el banner `role="alert"`. */
  readonly errorMessage = signal<string | null>(null);

  /** Controla si se muestra el bloque de acceso rápido de demostración (`REQ-014`). */
  readonly showDemoHint = environment.useMockApi;

  /** Credenciales de demostración configuradas en el entorno activo. */
  readonly demoCredentials = environment.demoCredentials;

  /**
   * Formulario reactivo de credenciales con validación de formato y longitud mínima.
   */
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  /**
   * Registra en el catálogo global los iconos utilizados en la vista de acceso.
   */
  constructor() {
    addIcons({
      camera,
      logInOutline,
      sparklesOutline,
      alertCircleOutline,
    });
  }

  /**
   * Anuncia el título de la vista al lector de pantalla al entrar en `/login`.
   */
  ionViewDidEnter(): void {
    announceScreen('Iniciar sesión — Galería de Fotos', 'login-title');
  }

  /**
   * Rellena automáticamente las credenciales académicas de demostración para agilizar pruebas.
   */
  fillDemoCredentials(): void {
    // Carga el correo y contraseña del mock en el formulario y limpia errores previos.
    this.form.setValue({
      email: this.demoCredentials.email,
      password: this.demoCredentials.password,
    });
    this.errorCode.set(null);
    this.errorMessage.set(null);
  }

  /**
   * Procesa el envío del formulario autenticando al estudiante y navegando a su destino.
   */
  async onSubmit(): Promise<void> {
    // Evita envíos duplicados si ya hay una solicitud activa.
    if (this.loading()) {
      return;
    }

    // Marca el formulario como enviado para revelar validaciones pendientes.
    this.submitted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Activa el indicador de carga y limpia alertas anteriores.
    this.loading.set(true);
    this.errorCode.set(null);
    this.errorMessage.set(null);

    try {
      // Solicita el token JWT y persiste la sesión en `@capacitor/preferences`.
      await this.auth.login(this.form.getRawValue());

      // Sanitiza el destino post-login restringiéndolo a rutas internas bajo `/tabs`.
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      const target = sanitizeReturnUrl(returnUrl);

      // Navega reemplazando `/login` en el historial para evitar volver atrás con sesión activa.
      await this.router.navigateByUrl(target, { replaceUrl: true });
    } catch (error) {
      // Normaliza y traduce el código de fallo para presentarlo en el banner accesible.
      const code: AuthErrorCode =
        typeof error === 'string' ? (error as AuthErrorCode) : 'unexpected_error';

      this.errorCode.set(code);
      this.errorMessage.set(this.describeAuthError(code));
    } finally {
      // Restablece el estado interactivo del botón principal.
      this.loading.set(false);
    }
  }

  /**
   * Obtiene el mensaje de validación en español asociado a un control del formulario.
   *
   * @param field Nombre del campo (`email` o `password`).
   * @returns Texto de error o `undefined` cuando el campo es válido o aún no se tocó.
   */
  fieldError(field: 'email' | 'password'): string | undefined {
    const control = this.form.controls[field];

    if (control.valid || !(control.touched || this.submitted())) {
      return undefined;
    }

    if (control.hasError('required')) {
      return field === 'email'
        ? 'El correo electrónico es obligatorio.'
        : 'La contraseña es obligatoria.';
    }
    if (control.hasError('email')) {
      return 'Introduce un correo electrónico válido (p. ej. nombre@dominio.com).';
    }
    if (control.hasError('minlength')) {
      return 'La contraseña debe tener al menos 8 caracteres.';
    }
    return 'Revisa el valor introducido.';
  }

  /**
   * Convierte un `AuthErrorCode` en un mensaje claro para el estudiante.
   *
   * @param code Código de error emitido por `AuthJwtService`.
   * @returns Descripción amigable en español.
   */
  private describeAuthError(code: AuthErrorCode): string {
    switch (code) {
      case 'invalid_credentials':
        return 'Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.';
      case 'network_error':
        return 'No se pudo contactar con el servidor. Comprueba tu conexión a internet.';
      case 'token_expired':
        return 'La sesión ha caducado. Inicia sesión de nuevo.';
      case 'unexpected_error':
        return 'Ocurrió un error inesperado. Inténtalo más tarde.';
      default:
        return 'No se pudo iniciar sesión.';
    }
  }
}
