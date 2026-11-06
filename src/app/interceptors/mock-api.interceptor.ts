/**
 * @fileoverview Interceptor que simula un backend REST para la demo académica.
 *
 * @description
 * `mockApiInterceptor` responde localmente a `POST /auth/login` y `GET /photos`
 * cuando `environment.useMockApi` es `true`. Permite probar el interceptor JWT
 * y la galería sin depender de un servidor real (REQ-014).
 *
 * @author @capacitor-architect (Fase 5A)
 * @author @quality-security-auditor (Fase 6 — alcance de URL y alg del mock)
 * @phase SDD Fase 5A — Plugins Nativos y Almacenamiento
 * @phase SDD Fase 6 — Calidad, Accesibilidad y Seguridad
 */

// Tipo de interceptor funcional de Angular.
import type { HttpInterceptorFn } from '@angular/common/http';

// Utilidades para construir respuestas HTTP simuladas y errores.
import { HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';

// Operadores rxjs para introducir retardo y trabajar con observables.
import { delay, of, throwError } from 'rxjs';

// Importa los modelos de autenticación.
import type { LoginCredentials, LoginResponse, UserProfile } from '../models/auth.model';

// Importa el modelo de fotos remotas.
import type { RemotePhoto } from '../models/photo.model';

// Importa la configuración de entorno (flag mock, delay, credenciales demo).
import { environment } from '../../environments/environment';

// Misma comparación estricta que el interceptor JWT: el mock no debe
// responder a un host que solo comparte el prefijo de `apiUrl`.
import { isApiUrl } from '../utils/api-url.util';

/**
 * Interceptor funcional de API mock.
 *
 * Se registra después de `jwtInterceptor` para poder observar la cabecera
 * `Authorization` ya añadida y alimentar el diagnóstico de la app.
 */
export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  // Si el mock está desactivado, delega al siguiente interceptor/servicio.
  if (!environment.useMockApi) {
    return next(req);
  }

  // Solo intercepta peticiones cuyo origen y path son exactamente los de la API.
  if (!isApiUrl(req.url, environment.apiUrl)) {
    return next(req);
  }

  // Path relativo respecto a la base (`/v1/auth/login` → `/auth/login`).
  const relativeUrl = relativeApiPath(req.url, environment.apiUrl);

  // Responde según el método y la ruta.
  if (req.method === 'POST' && relativeUrl === '/auth/login') {
    return handleLoginMock(req);
  }

  if (req.method === 'GET' && relativeUrl === '/photos') {
    return handlePhotosMock(req);
  }

  // Cualquier otra petición pasa al siguiente manejador.
  return next(req);
};

/**
 * Simula el endpoint de login.
 *
 * @param req Petición POST con las credenciales.
 * @returns Observable con la respuesta mock o un error 401.
 */
function handleLoginMock(req: HttpRequest<unknown>) {
  const credentials = req.body as LoginCredentials;
  const demo = environment.demoCredentials;

  // Verifica credenciales de demostración.
  const valid = credentials?.email === demo.email && credentials?.password === demo.password;

  if (!valid) {
    // Devuelve 401 con un pequeño retardo para simular latencia de red.
    return createErrorResponse(401, { error: 'invalid_credentials' }).pipe(
      delay(environment.mockDelayMs)
    );
  }

  // Construye un perfil de estudiante de demostración.
  const user: UserProfile = {
    id: 'u-mock-001',
    name: 'Estudiante de Demo',
    email: demo.email,
    role: 'student',
  };

  // JWT de prueba. `alg` no es `none` (un backend ingenuo podría aceptar
  // ese algoritmo). La firma sigue siendo literal y no criptográfica (SEC-010):
  // solo vale mientras `useMockApi` está activo.
  const header = base64UrlEncode({ alg: 'HS256', typ: 'JWT' });
  const payload = base64UrlEncode({
    sub: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + environment.jwt.defaultTtlSeconds,
  });
  const token = `${header}.${payload}.mock-signature`;

  const response: LoginResponse = {
    token,
    tokenType: 'Bearer',
    expiresIn: environment.jwt.defaultTtlSeconds,
    user,
  };

  return of(new HttpResponse({ status: 200, body: response })).pipe(
    delay(environment.mockDelayMs)
  );
}

/**
 * Simula el catálogo remoto de fotografías.
 *
 * @param req Petición GET a /photos.
 * @returns Observable con 6 fotos de ejemplo o 401 si falta autorización.
 */
function handlePhotosMock(req: HttpRequest<unknown>) {
  // Comprueba que el interceptor JWT haya añadido la cabecera Authorization.
  const authHeader = req.headers.get('Authorization');
  const hasBearer = !!authHeader && authHeader.startsWith('Bearer ');

  if (!hasBearer) {
    return createErrorResponse(401, { error: 'unauthorized' }).pipe(
      delay(environment.mockDelayMs)
    );
  }

  // Catálogo de demostración con 6 elementos.
  const photos: RemotePhoto[] = [
    { id: 'r-1', title: 'Amanecer en la biblioteca', author: 'Demo', thumbUrl: 'https://picsum.photos/seed/demo1/200' },
    { id: 'r-2', title: 'Diagrama en la pizarra', author: 'Demo', thumbUrl: 'https://picsum.photos/seed/demo2/200' },
    { id: 'r-3', title: 'Proyecto grupal', author: 'Demo', thumbUrl: 'https://picsum.photos/seed/demo3/200' },
    { id: 'r-4', title: 'Notas de clase', author: 'Demo', thumbUrl: 'https://picsum.photos/seed/demo4/200' },
    { id: 'r-5', title: 'Laboratorio', author: 'Demo', thumbUrl: 'https://picsum.photos/seed/demo5/200' },
    { id: 'r-6', title: 'Presentación final', author: 'Demo', thumbUrl: 'https://picsum.photos/seed/demo6/200' },
  ];

  return of(new HttpResponse({ status: 200, body: photos })).pipe(
    delay(environment.mockDelayMs)
  );
}

/**
 * Crea un observable que emite un error HTTP simulado.
 *
 * @param status Código de estado HTTP.
 * @param body Cuerpo del error.
 * @returns Observable que falla con `HttpErrorResponse`.
 */
function createErrorResponse(status: number, body: unknown) {
  // Construye un HttpErrorResponse de Angular con la información necesaria.
  const error = new HttpErrorResponse({
    error: body,
    status,
    statusText: status === 401 ? 'Unauthorized' : 'Error',
  });
  // Devuelve un observable que falla inmediatamente.
  return throwError(() => error);
}

/**
 * Codifica un objeto como base64url, formato usado en JWT.
 *
 * @param data Objeto a codificar.
 * @returns String base64url.
 */
/**
 * Extrae el path de la petición relativo a la base de la API.
 *
 * @param url URL absoluta de la petición.
 * @param apiUrl Base configurada.
 * @returns Path que empieza por `/`, sin query string.
 */
function relativeApiPath(url: string, apiUrl: string): string {
  const apiPath = new URL(apiUrl).pathname.replace(/\/+$/, '');
  const targetPath = new URL(url).pathname;
  // Si la base es `/v1`, se recorta ese prefijo y se conserva el resto.
  const relative = targetPath.slice(apiPath.length);
  return relative.startsWith('/') ? relative : `/${relative}`;
}

/**
 * Codifica un objeto como base64url, formato usado en JWT.
 *
 * @param data Objeto a codificar.
 * @returns String base64url.
 */
function base64UrlEncode(data: Record<string, unknown>): string {
  const json = JSON.stringify(data);
  const base64 = btoa(json);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
