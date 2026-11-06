/**
 * @fileoverview Interceptor funcional que inyecta el token JWT en las peticiones a la API.
 *
 * @description
 * `jwtInterceptor` es un `HttpInterceptorFn` registrado con `withInterceptors`.
 * Para cada petición cuya URL comience con `environment.apiUrl`, obtiene un token
 * válido desde `AuthJwtService` y añade la cabecera `Authorization: Bearer <token>`.
 * Si el servidor responde 401, limpia la sesión y redirige a `/login` una sola vez
 * para evitar bucles (SEC-004).
 *
 * @author @capacitor-architect (Fase 3)
 * @author @quality-security-auditor (Fase 6 — alcance estricto del token y 401)
 * @phase SDD Fase 3 — Arquitectura Capacitor
 * @phase SDD Fase 6 — Calidad, Accesibilidad y Seguridad
 */

// Importa el tipo de interceptor funcional de Angular.
import type { HttpInterceptorFn } from '@angular/common/http';

// Importa las utilidades de manejo de requests, responses y errores HTTP.
import { HttpErrorResponse, HttpRequest } from '@angular/common/http';

// Importa los operadores rxjs necesarios para transformar y capturar errores.
import { catchError, from, switchMap } from 'rxjs';

// Importa la función de inyección de dependencias de Angular.
import { inject } from '@angular/core';

// Importa el servicio de autenticación para obtener el token y hacer logout.
import { AuthJwtService } from '../services/auth-jwt.service';

// Importa la configuración de entorno para saber a qué URL se le inyecta el token.
import { environment } from '../../environments/environment';

// Comparación estricta de origen/path: evita filtrar el JWT a un host que
// solo comparte el prefijo de `apiUrl` (SEC-004).
import { isApiUrl, isAuthLoginUrl } from '../utils/api-url.util';

/**
 * Interceptor funcional JWT.
 *
 * Reglas:
 * 1. Solo intercepta peticiones dirigidas a `environment.apiUrl`.
 * 2. Si no hay token válido, la petición sigue sin cabecera (el servidor devolverá 401).
 * 3. Ante 401 de un recurso protegido, cierra sesión una sola vez.
 *    El 401 de `POST /auth/login` es una credencial inválida: no cierra sesión.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  // Inyecta el servicio de autenticación en el contexto del interceptor.
  const authService = inject(AuthJwtService);

  // Verifica si la petición va dirigida a nuestra API; si no, no se toca.
  if (!isApiRequest(req)) {
    return next(req);
  }

  // Convierte la promesa del token en observable para encadenarla con `next`.
  return from(authService.getValidToken()).pipe(
    // Añade la cabecera de autorización si existe un token vigente.
    switchMap(token => {
      const authorizedReq = token ? addBearerToken(req, token) : req;
      // Continúa la cadena de interceptores con la petición (modificada o no).
      return next(authorizedReq);
    }),
    // Captura errores de la respuesta.
    catchError(error => {
      // 401 de un recurso protegido: sesión rechazada. El login no entra aquí
      // porque un 401 suyo significa credenciales incorrectas, no token caducado.
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !isAuthLoginUrl(req.url, environment.apiUrl)
      ) {
        // Una sola redirección aunque varias peticiones fallen a la vez (SEC-004).
        handleUnauthorizedOnce(authService);
      }
      // Reenvía el error para que el componente llamante pueda mostrar un mensaje.
      throw error;
    })
  );
};

/**
 * Determina si una petición debe llevar el token JWT.
 *
 * @param req Petición HTTP entrante.
 * @returns `true` si la URL comienza con la API configurada.
 */
function isApiRequest(req: HttpRequest<unknown>): boolean {
  // Origen y path estrictos: `https://api.example.com/v1.evil.com` no coincide
  // con `https://api.example.com/v1` (REQ-003, AC-016, Fase 6).
  return isApiUrl(req.url, environment.apiUrl);
}

/**
 * Evita que varios 401 paralelos disparen varios `logout()` y re-navegaciones.
 *
 * La bandera se libera al terminar la promesa para que un 401 posterior,
 * de una sesión nueva, pueda volver a cerrar sesión.
 */
let unauthorizedInFlight = false;

/**
 * Cierra sesión y redirige a `/login` como máximo una vez por ráfaga de 401.
 *
 * @param authService Servicio que limpia el token y navega.
 */
function handleUnauthorizedOnce(authService: AuthJwtService): void {
  // Otra petición de la misma ráfaga ya está cerrando la sesión.
  if (unauthorizedInFlight) {
    return;
  }

  unauthorizedInFlight = true;
  // `void` porque el interceptor debe propagar el error sin esperar la navegación.
  void authService.logout({ redirect: true }).finally(() => {
    unauthorizedInFlight = false;
  });
}

/**
 * Clona la petición añadiendo la cabecera `Authorization: Bearer <token>`.
 *
 * @param req Petición original.
 * @param token Token JWT válido.
 * @returns Nueva petición con la cabecera de autorización.
 */
function addBearerToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  // Las peticiones HTTP son inmutables; se clonan para añadir cabeceras.
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}
