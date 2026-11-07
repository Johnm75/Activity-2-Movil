/**
 * Servicio central de autenticación JWT: gestiona login contra la API REST,
 * hidratación temprana desde almacenamiento nativo, control de vigencia y cierre de sesión.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { JwtSessionStorageService } from './token-storage.service';
import type {
  AuthenticatedSession,
  AuthenticationErrorCode,
  LoginApiResponse,
  LoginCredentials,
} from '../models/auth.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class JwtAuthenticationService {
  private readonly httpClient = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly sessionStorage = inject(JwtSessionStorageService);

  readonly activeSession = signal<AuthenticatedSession | null>(null);

  /**
   * Expone únicamente los extremos del JWT para diagnóstico visual sin revelar el payload ni la firma completa.
   */
  readonly maskedTokenPreview = computed(() => {
    const rawToken = this.activeSession()?.accessToken;
    if (!rawToken) {
      return '';
    }
    return `${rawToken.slice(0, 10)}…${rawToken.slice(-4)}`;
  });

  readonly remainingSessionMinutes = computed(() => {
    const expiresAtMs = this.activeSession()?.expiresAtTimestampMs;
    if (!expiresAtMs) {
      return null;
    }
    const remainingMs = expiresAtMs - Date.now();
    return remainingMs > 0 ? Math.floor(remainingMs / 60_000) : 0;
  });

  private restorationPromise: Promise<void> | null = null;

  /**
   * Restaura la sesión persistida una única vez antes de que Angular evalúe las guardas de ruta.
   */
  async restorePersistedSession(): Promise<void> {
    if (!this.restorationPromise) {
      this.restorationPromise = this.hydrateSessionFromStorage();
    }
    return this.restorationPromise;
  }

  async authenticateWithCredentials(credentials: LoginCredentials): Promise<AuthenticatedSession> {
    const loginEndpointUrl = `${environment.apiBaseUrl}/auth/login`;

    try {
      const apiResponse = await firstValueFrom(
        this.httpClient.post<LoginApiResponse>(loginEndpointUrl, credentials)
      );

      const expiresAtTimestampMs = this.calculateExpirationTimestamp(apiResponse);
      const authenticatedSession: AuthenticatedSession = {
        accessToken: apiResponse.token,
        expiresAtTimestampMs,
        userProfile: apiResponse.user,
      };

      await Promise.all([
        this.sessionStorage.saveAccessToken(authenticatedSession.accessToken),
        this.sessionStorage.saveExpirationTimestamp(authenticatedSession.expiresAtTimestampMs),
        this.sessionStorage.saveAuthenticatedUserProfile(authenticatedSession.userProfile),
      ]);

      this.activeSession.set(authenticatedSession);
      return authenticatedSession;
    } catch (httpError) {
      throw this.translateHttpAuthError(httpError);
    }
  }

  /**
   * Devuelve el token activo solo si supera la ventana preventiva `clockSkewSeconds`;
   * de lo contrario limpia la sesión vencida para evitar peticiones rechazadas en vuelo.
   */
  async getValidAccessToken(): Promise<string | null> {
    const currentSession = this.activeSession();
    if (!currentSession) {
      return null;
    }

    const effectiveExpirationMs =
      currentSession.expiresAtTimestampMs - environment.jwtSession.clockSkewSeconds * 1000;

    if (effectiveExpirationMs <= Date.now()) {
      await this.signOutSession({ navigateToLogin: false });
      return null;
    }

    return currentSession.accessToken;
  }

  async hasActiveSession(): Promise<boolean> {
    const validToken = await this.getValidAccessToken();
    return validToken !== null;
  }

  async signOutSession(options: { navigateToLogin?: boolean } = {}): Promise<void> {
    const shouldNavigateToLogin = options.navigateToLogin ?? true;

    await this.sessionStorage.clearStoredSession();
    this.activeSession.set(null);

    if (shouldNavigateToLogin) {
      await this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  private async hydrateSessionFromStorage(): Promise<void> {
    try {
      const [accessToken, expiresAtTimestampMs, userProfile] = await Promise.all([
        this.sessionStorage.getAccessToken(),
        this.sessionStorage.getExpirationTimestamp(),
        this.sessionStorage.getAuthenticatedUserProfile(),
      ]);

      if (!accessToken || !expiresAtTimestampMs || !userProfile) {
        this.activeSession.set(null);
        return;
      }

      const effectiveExpirationMs =
        expiresAtTimestampMs - environment.jwtSession.clockSkewSeconds * 1000;

      if (effectiveExpirationMs <= Date.now()) {
        await this.sessionStorage.clearStoredSession();
        this.activeSession.set(null);
        return;
      }

      this.activeSession.set({
        accessToken,
        expiresAtTimestampMs,
        userProfile,
      });
    } catch {
      this.activeSession.set(null);
    }
  }

  private calculateExpirationTimestamp(response: LoginApiResponse): number {
    if (response.expiresInSeconds && response.expiresInSeconds > 0) {
      return Date.now() + response.expiresInSeconds * 1000;
    }

    const jwtExpClaimSeconds = this.extractJwtExpirationClaim(response.token);
    if (jwtExpClaimSeconds) {
      return jwtExpClaimSeconds * 1000;
    }

    return Date.now() + environment.jwtSession.defaultTimeToLiveSeconds * 1000;
  }

  private extractJwtExpirationClaim(compactJwt: string): number | null {
    try {
      const payloadSegment = compactJwt.split('.')[1];
      if (!payloadSegment) {
        return null;
      }

      const standardBase64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = JSON.parse(atob(standardBase64)) as { exp?: number };
      return decodedPayload.exp ?? null;
    } catch {
      return null;
    }
  }

  private translateHttpAuthError(error: unknown): AuthenticationErrorCode {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        return 'invalid_credentials';
      }
      if (error.status === 0) {
        return 'network_error';
      }
    }
    return 'unexpected_error';
  }
}
