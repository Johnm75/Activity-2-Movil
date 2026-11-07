/**
 * Interceptor funcional HTTP que inyecta `Authorization: Bearer <token>` en peticiones
 * dirigidas a la API REST propia y revoca la sesión ante respuestas `401 Unauthorized`.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import type { HttpInterceptorFn } from '@angular/common/http';
import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap } from 'rxjs';

import { JwtAuthenticationService } from '../services/auth-jwt.service';
import { environment } from '../../environments/environment';
import { isAuthenticationLoginEndpoint, isTrustedApiEndpoint } from '../utils/api-url.util';

let isSignOutInProgress = false;

/**
 * Adjunta el token Bearer solo hacia orígenes confiables y cierra sesión si el backend responde `401`.
 */
export const jwtAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const authenticationService = inject(JwtAuthenticationService);

  if (!isTrustedApiEndpoint(request.url, environment.apiBaseUrl)) {
    return next(request);
  }

  return from(authenticationService.getValidAccessToken()).pipe(
    switchMap(accessToken => {
      const authenticatedRequest = accessToken
        ? attachBearerTokenHeader(request, accessToken)
        : request;
      return next(authenticatedRequest);
    }),
    catchError(httpError => {
      if (
        httpError instanceof HttpErrorResponse &&
        httpError.status === 401 &&
        !isAuthenticationLoginEndpoint(request.url, environment.apiBaseUrl)
      ) {
        triggerSingleSessionSignOut(authenticationService);
      }
      throw httpError;
    })
  );
};

/**
 * Clona la petición inmutable agregando la cabecera estándar `Authorization: Bearer`.
 */
function attachBearerTokenHeader(
  request: HttpRequest<unknown>,
  accessToken: string
): HttpRequest<unknown> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

/**
 * Evita redirecciones duplicadas si varias peticiones protegidas concurren y reciben `401`.
 */
function triggerSingleSessionSignOut(authenticationService: JwtAuthenticationService): void {
  if (isSignOutInProgress) {
    return;
  }

  isSignOutInProgress = true;
  void authenticationService.signOutSession({ navigateToLogin: true }).finally(() => {
    isSignOutInProgress = false;
  });
}
