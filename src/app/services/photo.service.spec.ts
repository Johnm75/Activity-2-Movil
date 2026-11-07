/**
 * Pruebas unitarias de `PhotoService` y validaciones de seguridad multimedia.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CameraSource } from '@capacitor/camera';
import { CameraWeb } from '@capacitor/camera/dist/esm/web';
import { FilesystemWeb } from '@capacitor/filesystem/dist/esm/web';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

import { PhotoService } from './photo.service';
import { isSafeRelativePhotoPath, sanitizeImageExtension } from '../utils/media-security.util';
import { environment } from '../../environments/environment';

describe('PhotoService', () => {
  let photoService: PhotoService;
  let httpController: HttpTestingController;

  beforeEach(async () => {
    window.localStorage.clear();
    await Preferences.clear();

    vi.spyOn(Capacitor, 'convertFileSrc').mockImplementation(
      (uri: string) => `https://localhost/_capacitor_file_${uri.replace('file://', '')}`
    );

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    photoService = TestBed.inject(PhotoService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('debe capturar una foto, sanitizar su extensión y guardarla al inicio del índice', async () => {
    vi.spyOn(CameraWeb.prototype, 'getPhoto').mockResolvedValue({
      path: 'file:///cache/captura.svg',
      format: 'svg',
      saved: false,
    });
    vi.spyOn(FilesystemWeb.prototype, 'readFile').mockResolvedValue({ data: 'YmFzZTY0RGF0YQ==' });
    vi.spyOn(FilesystemWeb.prototype, 'writeFile').mockResolvedValue({
      uri: 'file:///data/photos/nueva.jpeg',
    });
    vi.spyOn(FilesystemWeb.prototype, 'getUri').mockResolvedValue({
      uri: 'file:///data/photos/nueva.jpeg',
    });
    vi.spyOn(FilesystemWeb.prototype, 'stat').mockResolvedValue({
      name: 'nueva.jpeg',
      type: 'file',
      size: 1024,
      mtime: Date.now(),
      uri: 'file:///data/photos/nueva.jpeg',
    });

    const savedPhoto = await photoService.captureAndSavePhoto(CameraSource.Camera);

    expect(savedPhoto).not.toBeNull();
    expect(savedPhoto?.imageExtension).toBe('jpeg');
    expect(photoService.savedPhotos().length).toBe(1);
    expect(photoService.isGalleryEmpty()).toBe(false);
  });

  it('debe devolver null sin registrar error cuando el usuario cancela la cámara', async () => {
    vi.spyOn(CameraWeb.prototype, 'getPhoto').mockRejectedValue(
      new Error('User cancelled photos app')
    );

    const savedPhoto = await photoService.captureAndSavePhoto();

    expect(savedPhoto).toBeNull();
    expect(photoService.galleryErrorCode()).toBeNull();
  });

  it('debe omitir rutas inseguras y archivos huérfanos durante loadSavedPhotos()', async () => {
    await Preferences.set({
      key: environment.galleryStorage.indexKey,
      value: JSON.stringify({
        schemaVersion: 1,
        updatedAtIso: '2026-11-06T10:00:00.000Z',
        items: [
          {
            id: 'valida',
            relativeFilePath: 'photos/1730000000000-abc.jpeg',
            imageExtension: 'jpeg',
            capturedAtIso: '2026-11-06T10:00:00.000Z',
            originSource: 'camera',
            fileSizeBytes: 512,
          },
          {
            id: 'traversal',
            relativeFilePath: 'photos/../../shared_prefs/auth.xml',
            imageExtension: 'jpeg',
            capturedAtIso: '2026-11-06T11:00:00.000Z',
            originSource: 'camera',
            fileSizeBytes: 128,
          },
          {
            id: 'huerfana',
            relativeFilePath: 'photos/1730000000001-borrada.jpeg',
            imageExtension: 'jpeg',
            capturedAtIso: '2026-11-06T09:00:00.000Z',
            originSource: 'camera',
            fileSizeBytes: 256,
          },
        ],
      }),
    });

    const getUriSpy = vi
      .spyOn(FilesystemWeb.prototype, 'getUri')
      .mockImplementation(async ({ path }) => {
        if (path.includes('borrada')) {
          throw new Error('File does not exist');
        }
        return { uri: `file:///data/${path}` };
      });

    await photoService.loadSavedPhotos();

    expect(photoService.savedPhotos().map(item => item.id)).toEqual(['valida']);
    expect(getUriSpy).toHaveBeenCalledTimes(2);
  });

  it('debe eliminar el archivo en Filesystem y actualizar el índice en deleteSavedPhoto()', async () => {
    const deleteFileSpy = vi
      .spyOn(FilesystemWeb.prototype, 'deleteFile')
      .mockResolvedValue(undefined);

    photoService.savedPhotos.set([
      {
        id: 'foto-1',
        relativeFilePath: 'photos/1730000000000-foto1.jpeg',
        webviewDisplayUrl: 'https://localhost/_capacitor_file_/foto1.jpeg',
        imageExtension: 'jpeg',
        capturedAtIso: '2026-11-06T10:00:00.000Z',
        originSource: 'camera',
        fileSizeBytes: 512,
      },
    ]);

    await photoService.deleteSavedPhoto('foto-1');

    expect(deleteFileSpy).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'photos/1730000000000-foto1.jpeg' })
    );
    expect(photoService.savedPhotos()).toEqual([]);
  });

  it('debe consultar GET /photos y poblar remoteCatalogPhotos en loadRemotePhotoCatalog()', async () => {
    const catalogPromise = photoService.loadRemotePhotoCatalog();

    const pendingRequest = httpController.expectOne(`${environment.apiBaseUrl}/photos`);
    expect(pendingRequest.request.method).toBe('GET');
    pendingRequest.flush([
      {
        id: 'api-1',
        title: 'Foto Remota JWT',
        authorName: 'Servidor REST',
        categoryLabel: 'JWT',
        thumbnailUrl: 'data:image/svg+xml;utf8,demo',
      },
    ]);

    const items = await catalogPromise;
    expect(items.length).toBe(1);
    expect(photoService.remoteCatalogPhotos().length).toBe(1);
  });

  it('debe respaldar un índice corrupto bajo el sufijo .corrupt y recuperar estado vacío', async () => {
    await Preferences.set({
      key: environment.galleryStorage.indexKey,
      value: '<<<json-invalido>>>',
    });

    await photoService.loadSavedPhotos();

    expect(photoService.savedPhotos()).toEqual([]);
    const corruptBackup = await Preferences.get({
      key: `${environment.galleryStorage.indexKey}.corrupt`,
    });
    expect(corruptBackup.value).toBe('<<<json-invalido>>>');
  });

  it('media-security.util debe admitir únicamente rutas relativas en photos/ y extensiones seguras', () => {
    expect(isSafeRelativePhotoPath('photos/1730000000-id1.webp')).toBe(true);
    expect(isSafeRelativePhotoPath('../secret.txt')).toBe(false);
    expect(isSafeRelativePhotoPath('photos/script.html')).toBe(false);
    expect(sanitizeImageExtension('PNG')).toBe('png');
    expect(sanitizeImageExtension('svg+xml')).toBe('jpeg');
  });
});
