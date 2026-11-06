/**
 * @fileoverview Modelos de dominio para la galería de fotografías.
 *
 * @description
 * Define las estructuras usadas por `PhotoService`: fotografías locales,
 * índice persistente, elementos remotos y códigos de error. Separar los modelos
 * permite tipar los signals y facilita los dobles de prueba.
 *
 * @author @capacitor-architect (Fase 3 / Fase 5A)
 * @phase SDD Fase 3 — Arquitectura Capacitor
 * @phase SDD Fase 5A — Plugins Nativos y Almacenamiento
 */

/**
 * Fotografía local lista para mostrar en la UI.
 *
 * `webviewPath` se calcula en runtime con `Capacitor.convertFileSrc` y no se persiste,
 * porque la ruta absoluta puede cambiar entre instalaciones (NFR-002).
 */
export interface PhotoItem {
  // Identificador único generado en el dispositivo.
  id: string;

  // Ruta relativa dentro de `Directory.Data`, p. ej. `photos/1234567890-abc.jpeg`.
  fileName: string;

  // URL segura para el WebView, generada en memoria al cargar.
  webviewPath: string;

  // Formato de imagen (jpeg, png, webp, heic).
  format: string;

  // Fecha de captura o selección en formato ISO 8601 UTC.
  capturedAt: string;

  // Origen de la imagen: cámara nativa o galería del sistema.
  source: 'camera' | 'library';

  // Tamaño del archivo en bytes.
  sizeBytes: number;
}

/**
 * Documento del índice local persistido en `@capacitor/preferences`.
 *
 * Incluye `schemaVersion` para futuras migraciones del formato.
 */
export interface GalleryIndex {
  // Versión del esquema; actualmente 1.
  schemaVersion: 1;

  // Fecha de última actualización del índice (ISO 8601).
  updatedAt: string;

  // Lista de fotografías persistidas, sin `webviewPath`.
  items: PersistedPhoto[];
}

/**
 * Forma reducida de `PhotoItem` que se guarda en disco.
 *
 * Omite `webviewPath` porque se reconstruye al hidratar la galería.
 */
export type PersistedPhoto = Omit<PhotoItem, 'webviewPath'>;

/**
 * Elemento devuelto por el catálogo remoto `GET /photos`.
 */
export interface RemotePhoto {
  // Identificador único en el catálogo remoto.
  id: string;

  // Título descriptivo de la fotografía.
  title: string;

  // Autor o propietario de la imagen.
  author: string;

  // URL de la miniatura remota.
  thumbUrl: string;
}

/**
 * Códigos estables de error de la galería.
 *
 * La UI traduce cada código a un mensaje en español.
 */
export type PhotoErrorCode =
  | 'permission_denied'    // El usuario denegó permiso de cámara/galería.
  | 'cancelled'            // El usuario canceló la captura o selección.
  | 'unsupported_format'   // Formato de imagen no soportado.
  | 'write_failed'         // Fallo al escribir en Filesystem.
  | 'read_failed'          // Fallo al leer un archivo o el índice.
  | 'index_corrupt';       // El JSON del índice está corrupto.
