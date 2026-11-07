/**
 * Interceptor de demostración que simula los endpoints REST `POST /auth/login` y `GET /photos`
 * cuando `environment.useMockApi` está activo, validando la cabecera `Authorization: Bearer <token>`.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import type { HttpInterceptorFn } from '@angular/common/http';
import { HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';
import { delay, of, throwError } from 'rxjs';

import type {
  AuthenticatedUserProfile,
  LoginApiResponse,
  LoginCredentials,
} from '../models/auth.model';
import type { RemoteCatalogPhoto } from '../models/photo.model';
import { environment } from '../../environments/environment';
import { isTrustedApiEndpoint } from '../utils/api-url.util';

export const mockRestApiInterceptor: HttpInterceptorFn = (request, next) => {
  if (!environment.useMockApi || !isTrustedApiEndpoint(request.url, environment.apiBaseUrl)) {
    return next(request);
  }

  const endpointPath = extractRelativeEndpointPath(request.url, environment.apiBaseUrl);

  if (request.method === 'POST' && endpointPath === '/auth/login') {
    return simulateLoginEndpoint(request);
  }

  if (request.method === 'GET' && endpointPath === '/photos') {
    return simulateProtectedPhotosCatalogEndpoint(request);
  }

  return next(request);
};

function simulateLoginEndpoint(request: HttpRequest<unknown>) {
  const submittedCredentials = request.body as LoginCredentials;
  const expectedCredentials = environment.demoAccountCredentials;

  const areCredentialsValid =
    submittedCredentials?.email === expectedCredentials.email &&
    submittedCredentials?.password === expectedCredentials.password;

  if (!areCredentialsValid) {
    return buildErrorResponse(401, { error: 'invalid_credentials' }).pipe(
      delay(environment.mockNetworkDelayMs)
    );
  }

  const authenticatedUser: AuthenticatedUserProfile = {
    id: 'usr-jfm-001',
    fullName: 'Estudiante Desarrollo Móvil',
    email: expectedCredentials.email,
    role: 'student',
  };

  const encodedHeader = encodeJsonAsBase64Url({ alg: 'HS256', typ: 'JWT' });
  const encodedPayload = encodeJsonAsBase64Url({
    sub: authenticatedUser.id,
    email: authenticatedUser.email,
    role: authenticatedUser.role,
    exp: Math.floor(Date.now() / 1000) + environment.jwtSession.defaultTimeToLiveSeconds,
  });

  const loginPayload: LoginApiResponse = {
    token: `${encodedHeader}.${encodedPayload}.demo-hmac-signature`,
    tokenType: 'Bearer',
    expiresInSeconds: environment.jwtSession.defaultTimeToLiveSeconds,
    user: authenticatedUser,
  };

  return of(new HttpResponse({ status: 200, body: loginPayload })).pipe(
    delay(environment.mockNetworkDelayMs)
  );
}

function simulateProtectedPhotosCatalogEndpoint(request: HttpRequest<unknown>) {
  const authorizationHeader = request.headers.get('Authorization');
  const hasBearerToken = Boolean(authorizationHeader?.startsWith('Bearer '));

  if (!hasBearerToken) {
    return buildErrorResponse(401, { error: 'missing_bearer_token' }).pipe(
      delay(environment.mockNetworkDelayMs)
    );
  }

  // Miniaturas vectoriales embebidas en el JSON para garantizar visualización en emulador aun sin salida DNS.
  const remoteCatalog: RemoteCatalogPhoto[] = [
    {
      id: 'api-photo-01',
      title: 'Arquitectura Híbrida Capacitor',
      authorName: 'API Académica',
      categoryLabel: ' Puente Nativo ',
      thumbnailUrl: buildSvgThumbnailDataUrl('#4f46e5', '#0d9488', 'CAP'),
    },
    {
      id: 'api-photo-02',
      title: 'Persistencia Local Filesystem',
      authorName: 'API Académica',
      categoryLabel: ' Directory.Data ',
      thumbnailUrl: buildSvgThumbnailDataUrl('#0d9488', '#0284c7', 'FS'),
    },
    {
      id: 'api-photo-03',
      title: 'Seguridad Bearer Token JWT',
      authorName: 'API Académica',
      categoryLabel: ' RFC 7519 ',
      thumbnailUrl: buildSvgThumbnailDataUrl('#7c3aed', '#e11d48', 'JWT'),
    },
  ];

  return of(new HttpResponse({ status: 200, body: remoteCatalog })).pipe(
    delay(environment.mockNetworkDelayMs)
  );
}

function buildSvgThumbnailDataUrl(
  startColorHex: string,
  endColorHex: string,
  badgeLabel: string
): string {
  const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${startColorHex}"/><stop offset="100%" stop-color="${endColorHex}"/></linearGradient></defs><rect width="160" height="160" rx="28" fill="url(#g)"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="34" font-weight="700">${badgeLabel}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup)}`;
}

function buildErrorResponse(httpStatus: number, responseBody: unknown) {
  const errorResponse = new HttpErrorResponse({
    error: responseBody,
    status: httpStatus,
    statusText: httpStatus === 401 ? 'Unauthorized' : 'Error',
  });
  return throwError(() => errorResponse);
}

function extractRelativeEndpointPath(requestUrl: string, apiBaseUrl: string): string {
  const basePath = new URL(apiBaseUrl).pathname.replace(/\/+$/, '');
  const fullPath = new URL(requestUrl).pathname;
  const relativePath = fullPath.slice(basePath.length);
  return relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
}

function encodeJsonAsBase64Url(payload: Record<string, unknown>): string {
  return btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
