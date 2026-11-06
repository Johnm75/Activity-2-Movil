/**
 * @fileoverview Comparación estricta de URLs contra la API configurada.
 *
 * @description
 * `startsWith(environment.apiUrl)` adjunta el JWT a hosts o paths que solo
 * comparten el prefijo (`https://api.example.com/v1.evil.com`). Estas
 * funciones exigen el mismo origen y que el path sea exactamente el de la
 * API o un subpath (`/v1` o `/v1/...`).
 *
 * @author @quality-security-auditor (Fase 6)
 * @phase SDD Fase 6 — Calidad, Accesibilidad y Seguridad
 */

/**
 * Indica si `url` pertenece a la API configurada.
 *
 * @param url URL absoluta de la petición.
 * @param apiUrl Base configurada en `environment.apiUrl`.
 * @returns `true` solo si origen y path coinciden de forma estricta.
 */
export function isApiUrl(url: string, apiUrl: string): boolean {
  // Una URL relativa o malformada no recibe el token: es más seguro fallar cerrado.
  let api: URL;
  let target: URL;
  try {
    api = new URL(apiUrl);
    target = new URL(url);
  } catch {
    return false;
  }

  // El host, el puerto y el esquema tienen que ser idénticos.
  if (target.origin !== api.origin || target.username || target.password) {
    return false;
  }

  // Se ignoran barras finales para que `/v1` y `/v1/` sean la misma base.
  const apiPath = api.pathname.replace(/\/+$/, '') || '/';
  const targetPath = target.pathname.replace(/\/+$/, '') || '/';

  // Igualdad exacta o subpath con separador, nunca un prefijo de otro host-path.
  return targetPath === apiPath || targetPath.startsWith(`${apiPath}/`);
}

/**
 * Indica si la petición es el `POST /auth/login` de nuestra API.
 *
 * Un 401 en ese endpoint significa credenciales inválidas, no una sesión
 * caducada: el interceptor no debe cerrar sesión ni redirigir.
 *
 * @param url URL absoluta de la petición.
 * @param apiUrl Base configurada en `environment.apiUrl`.
 * @returns `true` si es el endpoint de login de la API propia.
 */
export function isAuthLoginUrl(url: string, apiUrl: string): boolean {
  // Si ni siquiera es nuestra API, tampoco es nuestro login.
  if (!isApiUrl(url, apiUrl)) {
    return false;
  }

  try {
    // El path ya está acotado al origen de la API por `isApiUrl`.
    return new URL(url).pathname.endsWith('/auth/login');
  } catch {
    return false;
  }
}
