/**
 * Sanitización de rutas de retorno post-autenticación para prevenir redirecciones abiertas (*open redirect*).
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

export const DEFAULT_AUTHENTICATED_REDIRECT_URL = '/tabs/tab2';

const SAFE_ROUTE_SEGMENT_PATTERN = /^[A-Za-z0-9_-]+$/;
const MAX_REDIRECT_URL_LENGTH = 200;

/**
 * Reconstruye únicamente rutas internas válidas bajo `/tabs`, descartando esquemas externos,
 * rutas relativas al protocolo (`//dominio`) y secuencias de escape `..`.
 */
export function sanitizePostLoginRedirectUrl(rawRedirectUrl: string | null | undefined): string {
  if (typeof rawRedirectUrl !== 'string') {
    return DEFAULT_AUTHENTICATED_REDIRECT_URL;
  }

  const trimmedUrl = rawRedirectUrl.trim();
  if (
    !trimmedUrl.startsWith('/') ||
    trimmedUrl.startsWith('//') ||
    trimmedUrl.length > MAX_REDIRECT_URL_LENGTH ||
    /[\u0000-\u001F\u007F\s\\@]/.test(trimmedUrl) ||
    trimmedUrl.includes(':')
  ) {
    return DEFAULT_AUTHENTICATED_REDIRECT_URL;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl, 'https://gallery.local');
  } catch {
    return DEFAULT_AUTHENTICATED_REDIRECT_URL;
  }

  if (parsedUrl.origin !== 'https://gallery.local' || parsedUrl.username || parsedUrl.password) {
    return DEFAULT_AUTHENTICATED_REDIRECT_URL;
  }

  const routeSegments = parsedUrl.pathname.split('/').filter(segment => segment.length > 0);
  if (routeSegments.length === 0 || routeSegments.length > 2 || routeSegments[0] !== 'tabs') {
    return DEFAULT_AUTHENTICATED_REDIRECT_URL;
  }

  if (routeSegments.some(segment => !SAFE_ROUTE_SEGMENT_PATTERN.test(segment))) {
    return DEFAULT_AUTHENTICATED_REDIRECT_URL;
  }

  return `/${routeSegments.join('/')}`;
}
