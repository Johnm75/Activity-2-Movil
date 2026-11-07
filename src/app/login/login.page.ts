/**
 * Controlador de la pantalla de inicio de sesión con validación reactiva y autenticación JWT.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import type { ViewDidEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  camera,
  logInOutline,
  sparklesOutline,
} from 'ionicons/icons';

import { JwtAuthenticationService } from '../services/auth-jwt.service';
import type { AuthenticationErrorCode } from '../models/auth.model';
import { environment } from '../../environments/environment';
import { sanitizePostLoginRedirectUrl } from '../utils/return-url.util';
import { announcePageNavigation } from '../utils/a11y-announce.util';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  standalone: false,
})
export class LoginPage implements ViewDidEnter {
  private readonly authenticationService = inject(JwtAuthenticationService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  readonly isSubmittingCredentials = signal<boolean>(false);
  readonly hasAttemptedSubmit = signal<boolean>(false);
  readonly authenticationErrorCode = signal<AuthenticationErrorCode | null>(null);
  readonly authenticationErrorMessage = signal<string | null>(null);

  readonly isDemoModeEnabled = environment.useMockApi;
  readonly demoAccountCredentials = environment.demoAccountCredentials;

  readonly credentialsForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    addIcons({
      camera,
      logInOutline,
      sparklesOutline,
      alertCircleOutline,
    });
  }

  ionViewDidEnter(): void {
    announcePageNavigation('Iniciar sesión — Galería de Fotos', 'login-title');
  }

  populateDemoCredentials(): void {
    this.credentialsForm.setValue({
      email: this.demoAccountCredentials.email,
      password: this.demoAccountCredentials.password,
    });
    this.authenticationErrorCode.set(null);
    this.authenticationErrorMessage.set(null);
  }

  async submitLoginForm(): Promise<void> {
    if (this.isSubmittingCredentials()) {
      return;
    }

    this.hasAttemptedSubmit.set(true);
    if (this.credentialsForm.invalid) {
      this.credentialsForm.markAllAsTouched();
      return;
    }

    this.isSubmittingCredentials.set(true);
    this.authenticationErrorCode.set(null);
    this.authenticationErrorMessage.set(null);

    try {
      await this.authenticationService.authenticateWithCredentials(
        this.credentialsForm.getRawValue()
      );

      const requestedReturnUrl = this.activatedRoute.snapshot.queryParamMap.get('returnUrl');
      const safeTargetUrl = sanitizePostLoginRedirectUrl(requestedReturnUrl);
      await this.router.navigateByUrl(safeTargetUrl, { replaceUrl: true });
    } catch (authError) {
      const normalizedErrorCode: AuthenticationErrorCode =
        typeof authError === 'string'
          ? (authError as AuthenticationErrorCode)
          : 'unexpected_error';

      this.authenticationErrorCode.set(normalizedErrorCode);
      this.authenticationErrorMessage.set(this.mapErrorCodeToUserMessage(normalizedErrorCode));
    } finally {
      this.isSubmittingCredentials.set(false);
    }
  }

  getFieldValidationMessage(fieldName: 'email' | 'password'): string | undefined {
    const control = this.credentialsForm.controls[fieldName];
    if (control.valid || !(control.touched || this.hasAttemptedSubmit())) {
      return undefined;
    }

    if (control.hasError('required')) {
      return fieldName === 'email'
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

  private mapErrorCodeToUserMessage(errorCode: AuthenticationErrorCode): string {
    switch (errorCode) {
      case 'invalid_credentials':
        return 'Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.';
      case 'network_error':
        return 'No se pudo contactar con el servidor. Comprueba tu conexión a internet.';
      case 'token_expired':
        return 'La sesión ha caducado. Inicia sesión de nuevo.';
      default:
        return 'Ocurrió un error inesperado al iniciar sesión.';
    }
  }
}
