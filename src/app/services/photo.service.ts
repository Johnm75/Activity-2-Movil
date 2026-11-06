/**
 * @fileoverview Servicio de galería: captura, persistencia local y catálogo remoto.
 *
 * @description
 * `PhotoService` es la única puerta de acceso a `Camera`, `Filesystem` y a la
 * clave `gallery.index.v1` de `Preferences` para el dominio de fotografías.
 * Expone el estado como signals y reconstruye la galería desde disco al arrancar.
 *
 * @author @capacitor-architect (Fase 5A)
 * @phase SDD Fase 5A — Plugins Nativos y Almacenamiento
 */

// Inyección de dependencias y signals de Angular.
import { Injectable, computed, inject, signal } from '@angular/core';

// Cliente HTTP para el catálogo remoto.
import { HttpClient } from '@angular/common/http';

// Operador rxjs para convertir observables en promesas.
import { firstValueFrom } from 'rxjs';

// Plugin de cámara de Capacitor.
import { Camera, CameraResultType, CameraSource, type Photo } from '@capacitor/camera';

// Plugin de sistema de archivos de Capacitor.
import { Directory, Filesystem } from '@capacitor/filesystem';

// Plugin de almacenamiento persistente de Capacitor.
import { Preferences } from '@capacitor/preferences';

// Utilidad de Capacitor para convertir URIs locales a URLs seguras para el WebView.
import { Capacitor } from '@capacitor/core';

// Modelos de dominio de la galería.
import type { GalleryIndex, PersistedPhoto, PhotoErrorCode, PhotoItem, RemotePhoto } from '../models/photo.model';

// Configuración de entorno (URL de API y claves de storage).
import { environment } from '../../environments/environment';

// Utilidades de seguridad de medios (Fase 6): listas blancas de extensión,
// prevención de path traversal en el índice y validación de esquemas WebView.
import {
  isDisplayableWebviewSrc,
  isSafePhotoPath,
  isTrustedCaptureWebPath,
  normalizeImageFormat,
} from '../utils/media-security.util';

/**
 * Servicio singleton de la galería de fotografías.
 */
@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  // Cliente HTTP inyectado para el catálogo remoto.
  private readonly http = inject(HttpClient);

  // Signal con la lista de fotografías locales, ordenada de más reciente a más antigua.
  readonly photos = signal<PhotoItem[]>([]);

  // Signal que indica si la galería está cargando o refrescando.
  readonly loading = signal<boolean>(false);

  // Signal con el último código de error de la galería, o `null` si no hay error.
  readonly error = signal<PhotoErrorCode | null>(null);

  // Computed que indica si la galería está vacía.
  readonly isEmpty = computed(() => this.photos().length === 0);

  // Clave de Preferences donde se guarda el índice de fotografías.
  private readonly indexKey = environment.gallery.indexKey;

  // Carpeta privada dentro de `Directory.Data` donde se escriben las fotos.
  private readonly photosDirectory = 'photos';

  // Opciones base de la cámara: usa URI, calidad 85, ancho máximo 2048 y no guarda en la galería del sistema.
  private readonly cameraOptions = {
    resultType: CameraResultType.Uri,
    quality: 85,
    width: 2048,
    correctOrientation: true,
    saveToGallery: false,
    allowEditing: false,
  } as const;

  /**
   * Punto de entrada de alta nivel: abre la cámara o el selector y añade
   * la fotografía resultante a la galería local.
   *
   * @param source Origen de la captura (`camera` o `library`).
   * @returns El ítem creado o `null` si el usuario cancela.
   */
  async addNewToGallery(source: CameraSource = CameraSource.Prompt): Promise<PhotoItem | null> {
    // Captura o selecciona la imagen.
    const captured = await this.capturePhoto(source);
    if (!captured) {
      return null;
    }

    try {
      // Lee el contenido como base64 para escribirlo en Filesystem.
      const base64Data = await this.readAsBase64(captured);

      // Determina el formato y lo reduce a la lista blanca permitida (SEC-005).
      const format = normalizeImageFormat(this.inferFormat(captured));

      // Determina el origen real: prompt termina siendo camera o library según la elección del usuario.
      const sourceType: 'camera' | 'library' = source === CameraSource.Photos ? 'library' : 'camera';

      // Escribe el archivo en el almacenamiento privado y obtiene el ítem con URI.
      const saved = await this.savePicture(base64Data, format, sourceType);

      // Añade el nuevo ítem al principio del índice y actualiza la señal.
      await this.prependPhoto(saved);

      return saved;
    } catch {
      // Si algo falla después de la captura, reporta error de escritura.
      this.error.set('write_failed');
      throw new Error('write_failed');
    }
  }

  /**
   * Abre la cámara nativa o el selector de imágenes del sistema.
   *
   * @param source Origen de la captura.
   * @returns Objeto `Photo` de Capacitor o `null` si el usuario cancela.
   */
  async capturePhoto(source: CameraSource = CameraSource.Prompt): Promise<Photo | null> {
    try {
      this.error.set(null);
      // Lanza el plugin de cámara con las opciones configuradas.
      const photo = await Camera.getPhoto({
        ...this.cameraOptions,
        source,
      });
      return photo;
    } catch (err) {
      // Detecta si el usuario canceló la operación.
      if (this.isUserCancellation(err)) {
        return null;
      }
      // Otros errores se traducen a permiso denegado o error inesperado.
      this.error.set('permission_denied');
      throw new Error('permission_denied');
    }
  }

  /**
   * Lee el contenido de una foto como base64.
   *
   * En dispositivos híbridos usa `Filesystem.readFile`; en web descarga el blob
   * desde `webPath` y lo convierte.
   *
   * @param photo Objeto `Photo` devuelto por `Camera.getPhoto`.
   * @returns String base64 sin el prefijo data URL.
   */
  async readAsBase64(photo: Photo): Promise<string> {
    // En móvil híbrido, `path` contiene la URI del archivo temporal.
    if (photo.path) {
      const file = await Filesystem.readFile({
        path: photo.path,
      });
      // `readFile` devuelve un string base64 cuando no se solicita `DataURI`.
      return file.data as string;
    }

    // En navegador, `webPath` debe ser una URL local/blob confiable antes de hacer fetch.
    if (!photo.webPath || !isTrustedCaptureWebPath(photo.webPath)) {
      throw new Error('read_failed');
    }

    // Descarga la imagen como blob y la convierte a base64.
    const response = await fetch(photo.webPath);
    const blob = await response.blob();
    return this.convertBlobToBase64(blob);
  }

  /**
   * Convierte un blob en una cadena base64 pura.
   *
   * @param blob Blob de imagen.
   * @returns Base64 sin prefijo data URL.
   */
  convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      // FileReader permite leer el blob de forma asíncrona.
      const reader = new FileReader();

      reader.onerror = () => reject(new Error('read_failed'));
      reader.onload = () => {
        // El resultado incluye el prefijo `data:image/jpeg;base64,`.
        const dataUrl = reader.result as string;
        // Separa el prefijo del contenido base64.
        const base64 = dataUrl.split(',')[1];
        if (!base64) {
          reject(new Error('read_failed'));
          return;
        }
        resolve(base64);
      };

      // Lee el blob como data URL.
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Escribe una imagen base64 en el almacenamiento privado de la app.
   *
   * @param base64 Datos de la imagen en base64.
   * @param format Extensión del archivo (jpeg, png, etc.).
   * @param source Origen de la imagen (`camera` o `library`).
   * @returns Ítem de foto con su `webviewPath` lista para mostrar.
   */
  async savePicture(base64: string, format: string, source: 'camera' | 'library' = 'camera'): Promise<PhotoItem> {
    // Normaliza el formato para impedir extensiones ejecutables o separadores de ruta.
    const safeFormat = normalizeImageFormat(format);

    // Genera un nombre de archivo único y seguro (SEC-005).
    const fileName = `${Date.now()}-${this.randomId()}.${safeFormat}`;
    const relativePath = `${this.photosDirectory}/${fileName}`;

    // Escribe el archivo en el directorio privado de datos de la app.
    await Filesystem.writeFile({
      path: relativePath,
      data: base64,
      directory: Directory.Data,
      recursive: true,
    });

    // Obtiene la URI absoluta del archivo escrito.
    const uriResult = await Filesystem.getUri({
      path: relativePath,
      directory: Directory.Data,
    });

    // Convierte la URI del sistema en una URL segura para el WebView.
    const webviewPath = Capacitor.convertFileSrc(uriResult.uri);

    // Obtiene información del archivo para registrar su tamaño.
    const stat = await Filesystem.stat({
      path: relativePath,
      directory: Directory.Data,
    });

    const photo: PhotoItem = {
      id: this.randomId(),
      fileName: relativePath,
      webviewPath,
      format: safeFormat,
      capturedAt: new Date().toISOString(),
      source,
      sizeBytes: typeof stat.size === 'number' ? stat.size : 0,
    };

    return photo;
  }

  /**
   * Carga las fotografías guardadas desde el índice persistente y verifica
   * que los archivos aún existan en disco (RISK-005).
   */
  async loadSaved(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // Lee el índice de Preferences.
      const index = await this.readIndex();
      const validItems: PhotoItem[] = [];

      // Verifica cada entrada; descarta rutas con traversal o archivos inexistentes.
      for (const item of index.items) {
        if (!isSafePhotoPath(item.fileName)) {
          // Entrada manipulada o fuera de `photos/`: se descarta por seguridad.
          continue;
        }

        try {
          // Obtiene la URI nativa y reconstruye la URL segura para el WebView.
          const uriResult = await Filesystem.getUri({
            path: item.fileName,
            directory: Directory.Data,
          });

          const webviewPath = Capacitor.convertFileSrc(uriResult.uri);
          if (!isDisplayableWebviewSrc(webviewPath)) {
            // Rechaza esquemas no locales que el WebView no debe renderizar.
            continue;
          }

          validItems.push({
            ...item,
            format: normalizeImageFormat(item.format),
            webviewPath,
          });
        } catch {
          // Archivo huérfano: se omite sin interrumpir la carga del resto.
        }
      }

      // Ordena de más reciente a más antigua.
      validItems.sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
      this.photos.set(validItems);
    } catch {
      this.error.set('read_failed');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Elimina una fotografía local previa confirmación.
   *
   * @param id Identificador de la fotografía.
   */
  async deletePhoto(id: string): Promise<void> {
    const current = this.photos();
    const target = current.find(p => p.id === id);
    if (!target) {
      return;
    }

    if (isSafePhotoPath(target.fileName)) {
      try {
        // Borra el archivo del almacenamiento privado solo si la ruta es segura.
        await Filesystem.deleteFile({
          path: target.fileName,
          directory: Directory.Data,
        });
      } catch {
        // Si el archivo ya no existe, continuamos limpiando el índice.
      }
    }

    // Actualiza el índice y la señal.
    const updated = current.filter(p => p.id !== id);
    await this.persistIndex(updated);
    this.photos.set(updated);
  }

  /**
   * Obtiene el catálogo remoto de fotografías.
   *
   * @returns Lista de fotos remotas de ejemplo.
   */
  async fetchRemotePhotos(): Promise<RemotePhoto[]> {
    const url = `${environment.apiUrl}/photos`;
    // El interceptor JWT añade la cabecera Authorization automáticamente.
    const photos = await firstValueFrom(this.http.get<RemotePhoto[]>(url));
    return photos;
  }

  /**
   * Añade una foto al principio del índice y actualiza la señal.
   *
   * @param photo Fotografía recién guardada.
   */
  private async prependPhoto(photo: PhotoItem): Promise<void> {
    const current = this.photos();
    const updated = [photo, ...current];
    await this.persistIndex(updated);
    this.photos.set(updated);
  }

  /**
   * Lee y parsea el índice persistente.
   *
   * Si el JSON es inválido, conserva una copia del valor corrupto y devuelve
   * un índice vacío (REQ-009).
   */
  private async readIndex(): Promise<GalleryIndex> {
    const { value } = await Preferences.get({ key: this.indexKey });
    if (!value) {
      return this.emptyIndex();
    }

    try {
      const parsed = JSON.parse(value) as GalleryIndex;
      // Valida que tenga la forma mínima esperada.
      if (!parsed || !Array.isArray(parsed.items)) {
        throw new Error('index_corrupt');
      }
      return parsed;
    } catch {
      // Guarda una copia del JSON corrupto para diagnóstico.
      await Preferences.set({ key: `${this.indexKey}.corrupt`, value });
      return this.emptyIndex();
    }
  }

  /**
   * Persiste el índice actual en Preferences.
   *
   * @param photos Lista de fotografías con `webviewPath`.
   */
  private async persistIndex(photos: PhotoItem[]): Promise<void> {
    // Omite `webviewPath` porque se reconstruye al cargar (NFR-002).
    const persisted: PersistedPhoto[] = photos.map(({ webviewPath, ...rest }) => rest);

    const index: GalleryIndex = {
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      items: persisted,
    };

    await Preferences.set({ key: this.indexKey, value: JSON.stringify(index) });
  }

  /**
   * Crea un índice vacío con la versión de esquema actual.
   */
  private emptyIndex(): GalleryIndex {
    return {
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
      items: [],
    };
  }

  /**
   * Determina el formato de imagen a partir de la foto capturada.
   *
   * @param photo Foto devuelta por `Camera.getPhoto`.
   * @returns Extensión de archivo (jpeg, png, webp, heic).
   */
  private inferFormat(photo: Photo): string {
    // Si el plugin indica formato, lo usamos directamente.
    if (photo.format) {
      return photo.format.toLowerCase();
    }
    // Fallback: intenta deducir de la extensión de `path` o `webPath`.
    const source = photo.path || photo.webPath || '';
    const match = source.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
    if (match) {
      return match[1].toLowerCase();
    }
    // Valor por defecto seguro.
    return 'jpeg';
  }

  /**
   * Genera un identificador aleatorio seguro.
   *
   * Usa `crypto.randomUUID` cuando esté disponible; si no, recurre a
   * `crypto.getRandomValues` para evitar colisiones (SEC-005).
   */
  private randomId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Respaldo basado en valores aleatorios de 16 bytes convertidos a hex.
    const buffer = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      crypto.getRandomValues(buffer);
    } else {
      // Último recurso para entornos muy limitados (no recomendado en producción).
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Detecta si un error del plugin de cámara corresponde a cancelación del usuario.
   *
   * @param err Error capturado.
   * @returns `true` si el usuario canceló.
   */
  private isUserCancellation(err: unknown): boolean {
    if (err instanceof Error) {
      const message = err.message.toLowerCase();
      return message.includes('cancel') || message.includes('canceled') || message.includes('user cancelled');
    }
    return false;
  }
}
