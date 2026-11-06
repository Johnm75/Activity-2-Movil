/**
 * @fileoverview Validación de rutas, formatos y URLs de imagen de la galería.
 *
 * @description
 * El índice de fotos vive en `@capacitor/preferences` y puede ser alterado
 * en un dispositivo comprometido. Antes de llamar a `Filesystem` o de pintar
 * `Capacitor.convertFileSrc` en un `<img>`, se rechazan traversal (`..`),
 * rutas absolutas y esquemas que el WebView no debería cargar (`javascript:`,
 * hosts remotos arbitrarios).
 *
 * @author @quality-security-auditor (Fase 6)
 * @phase SDD Fase 6 — Calidad, Accesibilidad y Seguridad
 */

/**
 * Extensiones que la galería acepta escribir y mostrar.
 * Cualquier otra se normaliza a JPEG para no persistir HTML/SVG ejecutables.
 */
const ALLOWED_FORMATS = new Set(['jpeg', 'jpg', 'png', 'webp', 'heic']);

/**
 * Ruta relativa permitida dentro de `Directory.Data`.
 * Ejemplo válido: `photos/1730000000000-uuid.jpeg`.
 */
const SAFE_PHOTO_PATH =
  /^photos\/[A-Za-z0-9][A-Za-z0-9._-]{0,120}\.(jpeg|jpg|png|webp|heic)$/i;

/**
 * Comprueba que `fileName` sea una ruta relativa segura de la carpeta `photos`.
 *
 * @param fileName Ruta guardada en el índice (`PhotoItem.fileName`).
 * @returns `true` si se puede pasar a `Filesystem` sin riesgo de traversal.
 */
export function isSafePhotoPath(fileName: string): boolean {
  // Vacío, no-string o demasiado largo: se descarta.
  if (typeof fileName !== 'string' || fileName.length === 0 || fileName.length > 160) {
    return false;
  }

  // Traversal, rutas absolutas, UNC y bytes nulos no son nombres de foto.
  if (
    fileName.includes('..') ||
    fileName.includes('\\') ||
    fileName.includes('\0') ||
    fileName.startsWith('/') ||
    fileName.includes('//')
  ) {
    return false;
  }

  return SAFE_PHOTO_PATH.test(fileName);
}

/**
 * Reduce un formato informado por el plugin o por la extensión a uno permitido.
 *
 * @param format Extensión o valor de `Photo.format`.
 * @returns Extensión en minúsculas de la lista blanca, o `jpeg` si no es fiable.
 */
export function normalizeImageFormat(format: string): string {
  // Se eliminan separadores y puntos para que `svg/../../html` no sobreviva.
  const cleaned = format.toLowerCase().replace(/[^a-z0-9]/g, '');
  return ALLOWED_FORMATS.has(cleaned) ? cleaned : 'jpeg';
}

/**
 * Indica si `webPath` de `Camera.getPhoto` es un origen de lectura de confianza.
 *
 * En web el plugin entrega un `blob:`. En nativo se prefiere `photo.path` y
 * esta función solo cubre el respaldo. No se hace `fetch` de URLs arbitrarias.
 *
 * @param webPath URL temporal devuelta por el plugin de cámara.
 * @returns `true` si es seguro leerla desde el WebView.
 */
export function isTrustedCaptureWebPath(webPath: string): boolean {
  return isLocalWebViewUrl(webPath, true);
}

/**
 * Indica si una URL producida por `Capacitor.convertFileSrc` puede usarse en `<img>`.
 *
 * @param src URL candidata para `ion-img`.
 * @returns `true` si el esquema es el del WebView local, no un host remoto.
 */
export function isDisplayableWebviewSrc(src: string): boolean {
  // `blob:` no se espera tras `convertFileSrc`, pero tampoco es un host remoto.
  return isLocalWebViewUrl(src, true);
}

/**
 * Clasifica una URL como local al WebView de Capacitor.
 *
 * @param value URL a inspeccionar.
 * @param allowBlob Si `true`, acepta URLs `blob:` (captura en navegador).
 * @returns `true` cuando el esquema y el host son de confianza.
 */
function isLocalWebViewUrl(value: string, allowBlob: boolean): boolean {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) {
    return false;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }

  // `blob:` solo se admite para la captura web, nunca como destino persistido
  // reconstruido: el llamador decide con `allowBlob`.
  if (allowBlob && parsed.protocol === 'blob:') {
    return true;
  }

  // Esquemas del runtime de Capacitor / Ionic.
  if (parsed.protocol === 'capacitor:' || parsed.protocol === 'ionic:') {
    return true;
  }

  // `androidScheme: 'https'` hace que `convertFileSrc` use `https://localhost`.
  if (
    (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
    (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')
  ) {
    return true;
  }

  return false;
}
