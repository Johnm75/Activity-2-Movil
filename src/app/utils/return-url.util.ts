/**
 * @fileoverview Sanitización del destino post-login (`returnUrl`).
 *
 * @description
 * `authGuard`, `guestGuard` y `LoginPage` restauran la ruta que el usuario
 * intentaba abrir. Un `returnUrl` controlado por la query string no puede
 * confiar en `startsWith('/tabs')`: secuencias como `/tabs/..//sitio-externo`
 * sobreviven a ese prefijo y, al normalizarse, pueden convertirse en una
 * redirección abierta. Esta utilidad reconstruye solo rutas internas de
 * pestañas y descarta el resto.
 *
 * @author @quality-security-auditor (Fase 6)
 * @phase SDD Fase 6 — Calidad, Accesibilidad y Seguridad
 */

/**
 * Destino seguro por defecto cuando el `returnUrl` falta o no es de confianza.
 * La galería es la pantalla principal del dominio.
 */
export const DEFAULT_RETURN_URL = '/tabs/tab2';

/**
 * Segmento de ruta permitido: identificadores de pestaña del proyecto, sin
 * puntos (evita `.` y `..`), barras ni esquemas.
 */
const SAFE_SEGMENT = /^[A-Za-z0-9_-]+$/;

/**
 * Longitud máxima aceptada. Las rutas reales son cortas; un valor enorme
 * solo serviría para inflar la query string.
 */
const MAX_RETURN_URL_LENGTH = 200;

/**
 * Devuelve una ruta interna de pestañas o el destino por defecto.
 *
 * Rechaza esquemas (`https:`), URLs protocol-relative (`//host`), barras
 * invertidas, espacios de control y cualquier path que, tras la
 * normalización del constructor `URL`, deje de vivir bajo `/tabs`.
 *
 * @param raw Valor crudo de `returnUrl` o de `RouterState.url`.
 * @returns Ruta interna segura (`/tabs` o `/tabs/<pestaña>`).
 */
export function sanitizeReturnUrl(raw: string | null | undefined): string {
  // Ausencia o tipo inesperado: no hay destino que restaurar.
  if (typeof raw !== 'string') {
    return DEFAULT_RETURN_URL;
  }

  // Recorta espacios de los extremos; el resto de espacios se rechaza abajo.
  const trimmed = raw.trim();

  // Prefijo obligatorio de ruta relativa. `//` sería protocol-relative.
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return DEFAULT_RETURN_URL;
  }

  // Tope defensivo antes de parsear.
  if (trimmed.length > MAX_RETURN_URL_LENGTH) {
    return DEFAULT_RETURN_URL;
  }

  // Caracteres que no aparecen en las rutas de la app y que suelen usarse
  // para colar esquemas, hosts o saltos de cabecera.
  if (/[\u0000-\u001F\u007F\s\\@]/.test(trimmed) || trimmed.includes(':')) {
    return DEFAULT_RETURN_URL;
  }

  // El constructor `URL` normaliza `%2e%2e` y `..`. Si el resultado cambia
  // de origen, la cadena no es una ruta interna.
  let parsed: URL;
  try {
    parsed = new URL(trimmed, 'https://gallery.local');
  } catch {
    return DEFAULT_RETURN_URL;
  }

  // Un origen distinto significa que el parser interpretó un host externo.
  if (parsed.origin !== 'https://gallery.local' || parsed.username || parsed.password) {
    return DEFAULT_RETURN_URL;
  }

  // Segmentos ya normalizados. `..` vacío tras normalizar no debe colarse.
  const segments = parsed.pathname.split('/').filter(segment => segment.length > 0);

  // Solo `/tabs` o `/tabs/<id>`. Más profundidad no existe en el router.
  if (segments.length === 0 || segments.length > 2 || segments[0] !== 'tabs') {
    return DEFAULT_RETURN_URL;
  }

  // Cada segmento debe ser un identificador simple (sin puntos ni codificación).
  if (segments.some(segment => !SAFE_SEGMENT.test(segment))) {
    return DEFAULT_RETURN_URL;
  }

  // Se reconstruye la ruta. Query y hash se descartan: las pestañas no los usan
  // y podrían reintroducir un destino no revisado.
  return `/${segments.join('/')}`;
}
