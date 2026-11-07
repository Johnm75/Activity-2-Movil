/**
 * Validación estricta de origen y ruta HTTP para impedir filtración del token Bearer a terceros.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

/**
 * Comprueba que la petición pertenezca exactamente al mismo origen y prefijo de ruta
 * que `configuredApiBaseUrl`, bloqueando dominios engañosos como `api.example.com/v1.evil.org`.
 */
export function isTrustedApiEndpoint(requestUrl: string, configuredApiBaseUrl: string): boolean {
  let apiBase: URL;
  let targetUrl: URL;

  try {
    apiBase = new URL(configuredApiBaseUrl);
    targetUrl = new URL(requestUrl);
  } catch {
    return false;
  }

  if (targetUrl.origin !== apiBase.origin || targetUrl.username || targetUrl.password) {
    return false;
  }

  const normalizedApiPath = apiBase.pathname.replace(/\/+$/, '') || '/';
  const normalizedTargetPath = targetUrl.pathname.replace(/\/+$/, '') || '/';

  return (
    normalizedTargetPath === normalizedApiPath ||
    normalizedTargetPath.startsWith(`${normalizedApiPath}/`)
  );
}

/**
 * Identifica el endpoint de autenticación inicial para que un `401` por contraseña
 * incorrecta no se trate como expiración de una sesión previamente activa.
 */
export function isAuthenticationLoginEndpoint(
  requestUrl: string,
  configuredApiBaseUrl: string
): boolean {
  if (!isTrustedApiEndpoint(requestUrl, configuredApiBaseUrl)) {
    return false;
  }

  try {
    return new URL(requestUrl).pathname.endsWith('/auth/login');
  } catch {
    return false;
  }
}
