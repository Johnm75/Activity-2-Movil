/**
 * Validaciones de seguridad para rutas de archivos locales y orígenes de imágenes en el WebView.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

const PERMITTED_IMAGE_EXTENSIONS = new Set(['jpeg', 'jpg', 'png', 'webp', 'heic']);

const SAFE_RELATIVE_PHOTO_PATH_PATTERN =
  /^photos\/[A-Za-z0-9][A-Za-z0-9._-]{0,120}\.(jpeg|jpg|png|webp|heic)$/i;

/**
 * Impide ataques de *path traversal* (`..`) o rutas absolutas si el índice de `Preferences`
 * fuese modificado externamente antes de invocar `@capacitor/filesystem`.
 */
export function isSafeRelativePhotoPath(relativeFilePath: string): boolean {
  if (
    typeof relativeFilePath !== 'string' ||
    relativeFilePath.length === 0 ||
    relativeFilePath.length > 160
  ) {
    return false;
  }

  if (
    relativeFilePath.includes('..') ||
    relativeFilePath.includes('\\') ||
    relativeFilePath.includes('\0') ||
    relativeFilePath.startsWith('/') ||
    relativeFilePath.includes('//')
  ) {
    return false;
  }

  return SAFE_RELATIVE_PHOTO_PATH_PATTERN.test(relativeFilePath);
}

/**
 * Restringe el formato de escritura a imágenes raster seguras, degradando a `jpeg`
 * cualquier extensión potencialmente ejecutable en navegador (como `svg` o `html`).
 */
export function sanitizeImageExtension(rawFormat: string): string {
  const normalizedExtension = rawFormat.toLowerCase().replace(/[^a-z0-9]/g, '');
  return PERMITTED_IMAGE_EXTENSIONS.has(normalizedExtension) ? normalizedExtension : 'jpeg';
}

/**
 * Verifica que el `webPath` entregado por la cámara provenga de un esquema local confiable.
 */
export function isTrustedCameraWebPath(cameraWebPath: string): boolean {
  return isTrustedLocalWebviewUrl(cameraWebPath);
}

/**
 * Valida que la URL convertida para `<img>` apunte solo al contenedor local del WebView.
 */
export function isSafeWebviewImageSource(imageSourceUrl: string): boolean {
  return isTrustedLocalWebviewUrl(imageSourceUrl);
}

/**
 * Acepta únicamente esquemas locales usados por Capacitor, Ionic y PWA (`blob:`, `capacitor:`, `localhost`).
 */
function isTrustedLocalWebviewUrl(candidateUrl: string): boolean {
  if (typeof candidateUrl !== 'string' || candidateUrl.length === 0 || candidateUrl.length > 2048) {
    return false;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(candidateUrl);
  } catch {
    return false;
  }

  if (
    parsedUrl.protocol === 'blob:' ||
    parsedUrl.protocol === 'capacitor:' ||
    parsedUrl.protocol === 'ionic:'
  ) {
    return true;
  }

  return (
    (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:') &&
    (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1')
  );
}
