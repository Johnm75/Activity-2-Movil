/**
 * Contratos de dominio para fotografías locales persistidas y catálogo remoto vía API REST.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

export type PhotoOriginSource = 'camera' | 'library';

/**
 * Fotografía hidratada para renderizado en la vista.
 * `webviewDisplayUrl` se reconstruye en cada arranque con `Capacitor.convertFileSrc`
 * y se excluye del índice persistido porque las rutas nativas absolutas pueden cambiar.
 */
export interface SavedPhoto {
  id: string;
  relativeFilePath: string;
  webviewDisplayUrl: string;
  imageExtension: string;
  capturedAtIso: string;
  originSource: PhotoOriginSource;
  fileSizeBytes: number;
}

export type PersistedPhotoMetadata = Omit<SavedPhoto, 'webviewDisplayUrl'>;

export interface PersistedGalleryIndex {
  schemaVersion: 1;
  updatedAtIso: string;
  items: PersistedPhotoMetadata[];
}

export interface RemoteCatalogPhoto {
  id: string;
  title: string;
  authorName: string;
  categoryLabel: string;
  thumbnailUrl: string;
}

export type GalleryErrorCode =
  | 'permission_denied'
  | 'cancelled'
  | 'unsupported_format'
  | 'write_failed'
  | 'read_failed'
  | 'index_corrupt';
