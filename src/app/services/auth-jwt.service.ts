/**
 * @fileoverview Servicio de autenticación JWT: login, logout, hidratación y expiración.
 *
 * @description
 * Gestiona el ciclo de vida de la sesión del estudiante. Persiste el token,
 * la expiración y el perfil mediante `TokenStorageService`, expone el estado
 * como signals reactivas y ofrece métodos para obtener un token válido o cerrar sesión.
 *
 * @author @capacitor-architect (Fase 3)
 * @phase SDD Fase 3 — Arquitectura Capacitor
 */

// Importa las herramientas de inyección y signals de Angular.
import { Injectable, computed, inject, signal } from '@angular/core';

// Importa el cliente HTTP y utilidades para manejar errores de red.
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

// Importa el router para redirigir tras logout.
import { Router } from '@angular/router';

// Importa el operador rxjs que convierte observables en promesas (más cómodo para servicios).
import { firstValueFrom } from 'rxjs';

// Importa el servicio de almacenamiento de sesión.
import { TokenStorageService } from './token-storage.service';

// Importa los modelos de dominio de autenticación.
import type { AuthErrorCode, AuthSession, LoginCredentials, LoginResponse, UserProfile } from '../models/auth.model';

// Importa la configuración de entorno (URL de API, TTL, skew).
import { environment } from '../../environments/environment';

/**
 * Servicio singleton que representa el dominio de autenticación JWT.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthJwtService {
  // Cliente HTTP inyectado para llamar a `POST /auth/login`.
  private readonly http = inject(HttpClient);

  // Router inyectado para navegar en logout.
  private readonly router = inject(Router);

  // Fachada de almacenamiento persistente inyectada.
  private readonly storage = inject(TokenStorageService);

  // Signal con la sesión actual; `null` indica que no hay sesión activa.
  readonly session = signal<AuthSession | null>(null);

  // Computed que devuelve una vista enmascarada del token para diagnóstico (SEC-007).
  readonly tokenPreview = computed(() => {
    const token = this.session()?.token;
    if (!token) {
      return '';
    }
    // Muestra los primeros 10 y últimos 4 caracteres, ocultando el payload.
    return `${token.slice(0, 10)}…${token.slice(-4)}`;
  });

  // Computed con los minutos restantes de sesión (redondeados hacia abajo).
  readonly expiresInMinutes = computed(() => {
    const expiresAt = this.session()?.expiresAt;
    if (!expiresAt) {
      return null;
    }
    const remaining = expiresAt - Date.now();
    return remaining > 0 ? Math.floor(remaining / 60000) : 0;
  });

  // Promesa que se resuelve cuando termina la hidratación inicial.
  private hydratedPromise: Promise<void> | null = null;

  // Bandera para evitar hidrataciones concurrentes.
  private isHydrating = false;

  /**
   * Hidrata la sesión desde el almacenamiento persistente una sola vez.
   *
   * Se invoca desde el inicializador de la aplicación para que los guards
   * puedan consultar el estado antes de activar rutas (REQ-004).
   */
  async hydrate(): Promise<void> {
    // Si ya se inició una hidratación, reutiliza la misma promesa.
    if (this.hydratedPromise) {
      return this.hydratedPromise;
    }
    // Evita lanzar dos hidrataciones simultáneas.
    if (this.isHydrating) {
      return this.hydratedPromise ?? Promise.resolve();
    }

    this.isHydrating = true;
    this.hydratedPromise = this.performHydration();
    return this.hydratedPromise;
  }

  /**
   * Implementación interna de la hidratación.
   */
  private async performHydration(): Promise<void> {
    try {
      // Lee token, expiración y perfil en paralelo.
      const [token, expiresAt, profile] = await Promise.all([
        this.storage.getToken(),
        this.storage.getExpiresAt(),
        this.storage.getProfile(),
      ]);

      // Si falta algún dato esencial, no hay sesión que restaurar.
      if (!token || !expiresAt || !profile) {
        this.session.set(null);
        return;
      }

      // Aplica el margen de seguridad contra desfases de reloj.
      const validUntil = expiresAt - environment.jwt.clockSkewSeconds * 1000;
      if (validUntil <= Date.now()) {
        // Token vencido: limpia storage y memoria sin redirigir en el arranque.
        await this.storage.clearSession();
        this.session.set(null);
        return;
      }

      // Restaura la sesión en memoria.
      this.session.set({ token, expiresAt, user: profile });
    } catch {
      // Ante cualquier error de lectura, deja la sesión vacía para forzar login.
      this.session.set(null);
    }
  }

  /**
   * Realiza login contra `POST /auth/login` y persiste la sesión.
   *
   * @param credentials Correo y contraseña.
   * @returns Sesión creada.
   * @throws Código de error `AuthErrorCode`.
   */
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const url = `${environment.apiUrl}/auth/login`;
    try {
      // Convierte la respuesta observable en promesa y espera el resultado.
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(url, credentials)
      );

      // Calcula la expiración a partir de `expiresIn` o del payload del JWT.
      const expiresAt = this.computeExpiresAt(response);

      // Construye la sesión en memoria.
      const session: AuthSession = {
        token: response.token,
        expiresAt,
        user: response.user,
      };

      // Persiste los tres datos de forma paralela.
      await Promise.all([
        this.storage.setToken(session.token),
        this.storage.setExpiresAt(session.expiresAt),
        this.storage.setProfile(session.user),
      ]);

      // Emite la nueva sesión a los consumidores reactivos.
      this.session.set(session);
      return session;
    } catch (error) {
      // Traduce el error HTTP a un código estable para la UI.
      throw this.mapLoginError(error);
    }
  }

  /**
   * Calcula el momento de expiración a partir de la respuesta del servidor.
   *
   * Si `expiresIn` no está presente, intenta leer `exp` del payload del JWT.
   * Si tampoco existe, usa el TTL por defecto y advierte sin datos sensibles.
   *
   * @param response Respuesta del login.
   * @returns Epoch en milisegundos.
   */
  private computeExpiresAt(response: LoginResponse): number {
    if (response.expiresIn && response.expiresIn > 0) {
      return Date.now() + response.expiresIn * 1000;
    }

    // Intenta extraer `exp` del payload del token JWT (segunda parte base64).
    const decodedExp = this.extractExpFromJwt(response.token);
    if (decodedExp) {
      // `exp` en JWT es en segundos; se convierte a milisegundos.
      return decodedExp * 1000;
    }

    // Fallback: TTL por defecto.
    console.warn('[AuthJwtService] La respuesta no incluye expiración; se aplica TTL por defecto.');
    return Date.now() + environment.jwt.defaultTtlSeconds * 1000;
  }

  /**
   * Extrae la claim `exp` de un token JWT sin validar la firma.
   *
   * @param token Token JWT compacto.
   * @returns `exp` en segundos o `null`.
   */
  private extractExpFromJwt(token: string): number | null {
    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) {
        return null;
      }
      // JWT usa base64url; reemplaza caracteres para que atob pueda decodificar.
      const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      const json = atob(normalized);
      const payload = JSON.parse(json) as { exp?: number };
      return payload.exp ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Mapea un error de login a un código estable.
   *
   * @param error Error capturado.
   * @returns Código de error de autenticación.
   */
  private mapLoginError(error: unknown): AuthErrorCode {
    if (error instanceof HttpErrorResponse) {
      // 401 indica credenciales inválidas.
      if (error.status === 401) {
        return 'invalid_credentials';
      }
      // 0 suele significar que no se pudo conectar al servidor.
      if (error.status === 0) {
        return 'network_error';
      }
    }
    return 'unexpected_error';
  }

  /**
   * Devuelve el token solo si aún es válido.
   *
   * Si el token está vencido, limpia la sesión (sin redirigir) para que el
   * interceptor o los guards decidan el siguiente paso (SEC-003).
   *
   * @returns Token vigente o `null`.
   */
  async getValidToken(): Promise<string | null> {
    const session = this.session();
    if (!session) {
      return null;
    }

    const validUntil = session.expiresAt - environment.jwt.clockSkewSeconds * 1000;
    if (validUntil <= Date.now()) {
      // Token vencido: limpia storage y memoria.
      await this.logout({ redirect: false });
      return null;
    }
    return session.token;
  }

  /**
   * Indica si existe una sesión con token vigente.
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getValidToken();
    return token !== null;
  }

  /**
   * Cierra la sesión, limpia storage y memoria, y redirige opcionalmente a login.
   *
   * @param opts Opciones de redirección.
   */
  async logout(opts: { redirect?: boolean } = {}): Promise<void> {
    // Valor por defecto: sí redirige.
    const redirect = opts.redirect ?? true;

    // Limpia el almacenamiento persistente.
    await this.storage.clearSession();

    // Limpia el estado en memoria.
    this.session.set(null);

    if (redirect) {
      // Navega a login reemplazando la URL actual para evitar volver atrás.
      await this.router.navigate(['/login'], { replaceUrl: true });
    }
  }
}
