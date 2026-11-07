/**
 * Servicio de fotografías: gestiona captura nativa con `@capacitor/camera`,
 * persistencia binaria privada en `@capacitor/filesystem` (`Directory.Data`),
 * índice estructurado en `@capacitor/preferences` y consumo del catálogo API REST.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Camera, CameraResultType, CameraSource, type Photo } from '@capacitor/camera';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

import type {
  GalleryErrorCode,
  PersistedGalleryIndex,
  PersistedPhotoMetadata,
  PhotoOriginSource,
  RemoteCatalogPhoto,
  SavedPhoto,
} from '../models/photo.model';
import { environment } from '../../environments/environment';
import {
  isSafeRelativePhotoPath,
  isSafeWebviewImageSource,
  isTrustedCameraWebPath,
  sanitizeImageExtension,
} from '../utils/media-security.util';

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  private readonly httpClient = inject(HttpClient);

  readonly savedPhotos = signal<SavedPhoto[]>([]);
  readonly remoteCatalogPhotos = signal<RemoteCatalogPhoto[]>([]);
  readonly isLoadingGallery = signal<boolean>(false);
  readonly isLoadingRemoteCatalog = signal<boolean>(false);
  readonly galleryErrorCode = signal<GalleryErrorCode | null>(null);
  readonly remoteCatalogErrorMessage = signal<string | null>(null);
  readonly isGalleryEmpty = computed(() => this.savedPhotos().length === 0);

  private readonly galleryIndexKey = environment.galleryStorage.indexKey;
  private readonly privatePhotosDirectory = 'photos';

  private readonly defaultCameraOptions = {
    resultType: CameraResultType.Uri,
    quality: 85,
    width: 2048,
    correctOrientation: true,
    saveToGallery: false,
    allowEditing: false,
  } as const;

  /**
   * Captura una imagen desde la cámara o biblioteca y la persiste en almacenamiento privado.
   * Devuelve `null` si el usuario cancela voluntariamente el selector nativo.
   */
  async captureAndSavePhoto(
    captureSource: CameraSource = CameraSource.Prompt
  ): Promise<SavedPhoto | null> {
    const capturedPhoto = await this.requestPhotoFromDevice(captureSource);
    if (!capturedPhoto) {
      return null;
    }

    try {
      const base64ImageContent = await this.readCapturedPhotoAsBase64(capturedPhoto);
      const imageExtension = sanitizeImageExtension(this.resolvePhotoExtension(capturedPhoto));
      const originSource: PhotoOriginSource =
        captureSource === CameraSource.Photos ? 'library' : 'camera';

      const savedPhoto = await this.writePhotoToPrivateStorage(
        base64ImageContent,
        imageExtension,
        originSource
      );
      await this.prependSavedPhoto(savedPhoto);

      return savedPhoto;
    } catch {
      this.galleryErrorCode.set('write_failed');
      throw new Error('write_failed');
    }
  }

  async requestPhotoFromDevice(
    captureSource: CameraSource = CameraSource.Prompt
  ): Promise<Photo | null> {
    try {
      this.galleryErrorCode.set(null);
      return await Camera.getPhoto({
        ...this.defaultCameraOptions,
        source: captureSource,
      });
    } catch (cameraError) {
      if (this.isCameraCancelledByUser(cameraError)) {
        return null;
      }
      this.galleryErrorCode.set('permission_denied');
      throw new Error('permission_denied');
    }
  }

  /**
   * En Android/iOS lee directamente el archivo temporal desde `capturedPhoto.path`;
   * en navegador convierte el `blob:` generado por `@ionic/pwa-elements` a Base64.
   */
  async readCapturedPhotoAsBase64(capturedPhoto: Photo): Promise<string> {
    if (capturedPhoto.path) {
      const nativeFile = await Filesystem.readFile({ path: capturedPhoto.path });
      return nativeFile.data as string;
    }

    if (!capturedPhoto.webPath || !isTrustedCameraWebPath(capturedPhoto.webPath)) {
      throw new Error('read_failed');
    }

    const fetchResponse = await fetch(capturedPhoto.webPath);
    const imageBlob = await fetchResponse.blob();
    return this.convertImageBlobToBase64(imageBlob);
  }

  convertImageBlobToBase64(imageBlob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();

      fileReader.onerror = () => reject(new Error('read_failed'));
      fileReader.onload = () => {
        const dataUrl = fileReader.result as string;
        const rawBase64Payload = dataUrl.split(',')[1];
        if (!rawBase64Payload) {
          reject(new Error('read_failed'));
          return;
        }
        resolve(rawBase64Payload);
      };

      fileReader.readAsDataURL(imageBlob);
    });
  }

  async writePhotoToPrivateStorage(
    base64Content: string,
    rawFormat: string,
    originSource: PhotoOriginSource = 'camera'
  ): Promise<SavedPhoto> {
    const safeExtension = sanitizeImageExtension(rawFormat);
    const uniqueFileName = `${Date.now()}-${this.generateUniqueIdentifier()}.${safeExtension}`;
    const relativeFilePath = `${this.privatePhotosDirectory}/${uniqueFileName}`;

    await Filesystem.writeFile({
      path: relativeFilePath,
      data: base64Content,
      directory: Directory.Data,
      recursive: true,
    });

    const nativeFileUri = await Filesystem.getUri({
      path: relativeFilePath,
      directory: Directory.Data,
    });
    const fileMetadata = await Filesystem.stat({
      path: relativeFilePath,
      directory: Directory.Data,
    });

    return {
      id: this.generateUniqueIdentifier(),
      relativeFilePath,
      webviewDisplayUrl: Capacitor.convertFileSrc(nativeFileUri.uri),
      imageExtension: safeExtension,
      capturedAtIso: new Date().toISOString(),
      originSource,
      fileSizeBytes: typeof fileMetadata.size === 'number' ? fileMetadata.size : 0,
    };
  }

  /**
   * Hidrata la galería verificando que cada entrada del índice exista físicamente
   * en `Directory.Data` y cumpla las reglas anti-*path-traversal*.
   */
  async loadSavedPhotos(): Promise<void> {
    this.isLoadingGallery.set(true);
    this.galleryErrorCode.set(null);

    try {
      const galleryIndex = await this.readPersistedGalleryIndex();
      const verifiedPhotos: SavedPhoto[] = [];

      for (const persistedItem of galleryIndex.items) {
        if (!isSafeRelativePhotoPath(persistedItem.relativeFilePath)) {
          continue;
        }

        try {
          const nativeFileUri = await Filesystem.getUri({
            path: persistedItem.relativeFilePath,
            directory: Directory.Data,
          });

          const webviewDisplayUrl = Capacitor.convertFileSrc(nativeFileUri.uri);
          if (!isSafeWebviewImageSource(webviewDisplayUrl)) {
            continue;
          }

          verifiedPhotos.push({
            ...persistedItem,
            imageExtension: sanitizeImageExtension(persistedItem.imageExtension),
            webviewDisplayUrl,
          });
        } catch {
          // Omite entradas cuyo archivo físico ya no exista sin interrumpir el resto de la galería.
        }
      }

      verifiedPhotos.sort((first, second) =>
        second.capturedAtIso.localeCompare(first.capturedAtIso)
      );
      this.savedPhotos.set(verifiedPhotos);
    } catch {
      this.galleryErrorCode.set('read_failed');
    } finally {
      this.isLoadingGallery.set(false);
    }
  }

  async deleteSavedPhoto(photoId: string): Promise<void> {
    const currentPhotos = this.savedPhotos();
    const photoToDelete = currentPhotos.find(photo => photo.id === photoId);
    if (!photoToDelete) {
      return;
    }

    if (isSafeRelativePhotoPath(photoToDelete.relativeFilePath)) {
      try {
        await Filesystem.deleteFile({
          path: photoToDelete.relativeFilePath,
          directory: Directory.Data,
        });
      } catch {
        // Si el archivo ya fue eliminado del disco, igualmente se depura el índice.
      }
    }

    const remainingPhotos = currentPhotos.filter(photo => photo.id !== photoId);
    await this.saveGalleryIndexToPreferences(remainingPhotos);
    this.savedPhotos.set(remainingPhotos);
  }

  /**
   * Consume el endpoint protegido `GET /photos`; `jwtAuthInterceptor` adjunta
   * automáticamente `Authorization: Bearer <token>` antes de salir por HTTP.
   */
  async loadRemotePhotoCatalog(): Promise<RemoteCatalogPhoto[]> {
    const catalogEndpointUrl = `${environment.apiBaseUrl}/photos`;
    this.isLoadingRemoteCatalog.set(true);
    this.remoteCatalogErrorMessage.set(null);

    try {
      const catalogItems = await firstValueFrom(
        this.httpClient.get<RemoteCatalogPhoto[]>(catalogEndpointUrl)
      );
      this.remoteCatalogPhotos.set(catalogItems);
      return catalogItems;
    } catch {
      this.remoteCatalogErrorMessage.set(
        'No fue posible sincronizar el catálogo remoto autenticado.'
      );
      return [];
    } finally {
      this.isLoadingRemoteCatalog.set(false);
    }
  }

  private async prependSavedPhoto(newPhoto: SavedPhoto): Promise<void> {
    const updatedPhotos = [newPhoto, ...this.savedPhotos()];
    await this.saveGalleryIndexToPreferences(updatedPhotos);
    this.savedPhotos.set(updatedPhotos);
  }

  private async readPersistedGalleryIndex(): Promise<PersistedGalleryIndex> {
    const { value } = await Preferences.get({ key: this.galleryIndexKey });
    if (!value) {
      return this.createEmptyGalleryIndex();
    }

    try {
      const parsedIndex = JSON.parse(value) as PersistedGalleryIndex;
      if (!parsedIndex || !Array.isArray(parsedIndex.items)) {
        throw new Error('index_corrupt');
      }
      return parsedIndex;
    } catch {
      // Conserva respaldo forense del índice dañado y restaura un estado vacío operativo.
      await Preferences.set({ key: `${this.galleryIndexKey}.corrupt`, value });
      return this.createEmptyGalleryIndex();
    }
  }

  private async saveGalleryIndexToPreferences(photos: SavedPhoto[]): Promise<void> {
    const persistedItems: PersistedPhotoMetadata[] = photos.map(
      ({ webviewDisplayUrl: _ignoredUrl, ...metadata }) => metadata
    );

    const galleryIndex: PersistedGalleryIndex = {
      schemaVersion: 1,
      updatedAtIso: new Date().toISOString(),
      items: persistedItems,
    };

    await Preferences.set({
      key: this.galleryIndexKey,
      value: JSON.stringify(galleryIndex),
    });
  }

  private createEmptyGalleryIndex(): PersistedGalleryIndex {
    return {
      schemaVersion: 1,
      updatedAtIso: new Date().toISOString(),
      items: [],
    };
  }

  private resolvePhotoExtension(capturedPhoto: Photo): string {
    if (capturedPhoto.format) {
      return capturedPhoto.format.toLowerCase();
    }

    const candidatePath = capturedPhoto.path || capturedPhoto.webPath || '';
    const extensionMatch = candidatePath.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
    return extensionMatch ? extensionMatch[1].toLowerCase() : 'jpeg';
  }

  private generateUniqueIdentifier(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    const randomBytes = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      crypto.getRandomValues(randomBytes);
    } else {
      for (let index = 0; index < randomBytes.length; index++) {
        randomBytes[index] = Math.floor(Math.random() * 256);
      }
    }

    return Array.from(randomBytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  private isCameraCancelledByUser(error: unknown): boolean {
    if (error instanceof Error) {
      const normalizedMessage = error.message.toLowerCase();
      return (
        normalizedMessage.includes('cancel') ||
        normalizedMessage.includes('canceled') ||
        normalizedMessage.includes('user cancelled')
      );
    }
    return false;
  }
}
