/**
 * @fileoverview Pruebas unitarias y de seguridad de `PhotoService` y `media-security.util`.
 *
 * @description
 * Cubre la captura con `@capacitor/camera`, escritura en `@capacitor/filesystem`,
 * hidratación del índice desde `@capacitor/preferences`, filtrado de archivos
 * huérfanos o rutas con path traversal (`..`), respaldo de índices corruptos y
 * validación de listas blancas de extensión.
 *
 * @author @quality-security-auditor (Fase 6)
 * @phase SDD Fase 6 — Calidad, Accesibilidad y Seguridad
 */

// Contenedor de inyección de pruebas de Angular.
import { TestBed } from '@angular/core/testing';

// Proveedores HTTP para satisfacer la dependencia de catálogo remoto.
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

// Enums y núcleo de Capacitor.
import { CameraSource } from '@capacitor/camera';
import { CameraWeb } from '@capacitor/camera/dist/esm/web';
import { FilesystemWeb } from '@capacitor/filesystem/dist/esm/web';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

// Servicio de fotografías bajo prueba.
import { PhotoService } from './photo.service';

// Utilidades de validación de rutas y formatos multimedia.
import { isSafePhotoPath, normalizeImageFormat } from '../utils/media-security.util';

// Configuración de entorno para validar claves de índice.
import { environment } from '../../environments/environment';

describe('PhotoService', () => {
  // Instancia del servicio bajo prueba.
  let service: PhotoService;

  // Controlador HTTP para validar `fetchRemotePhotos`.
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    window.localStorage.clear();
    await Preferences.clear();

    vi.spyOn(Capacitor, 'convertFileSrc').mockImplementation(
      (uri: string) => `https://localhost/_capacitor_file_${uri.replace('file://', '')}`
    );

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(PhotoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('debe capturar una foto nativa, normalizar su formato y anteponerla al índice local', async () => {
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

    const created = await service.addNewToGallery(CameraSource.Camera);

    // El formato inseguro `svg` debe haberse normalizado a `jpeg` (SEC-005).
    expect(created).not.toBeNull();
    expect(created?.format).toBe('jpeg');
    expect(service.photos().length).toBe(1);
    expect(service.isEmpty()).toBe(false);
  });

  it('debe devolver null sin fijar error cuando el usuario cancela la cámara', async () => {
    vi.spyOn(CameraWeb.prototype, 'getPhoto').mockRejectedValue(
      new Error('User cancelled photos app')
    );

    const created = await service.addNewToGallery();

    expect(created).toBeNull();
    expect(service.error()).toBeNull();
  });

  it('debe filtrar rutas con path traversal y archivos huérfanos en loadSaved() (RISK-005)', async () => {
    await Preferences.set({
      key: environment.gallery.indexKey,
      value: JSON.stringify({
        schemaVersion: 1,
        updatedAt: '2026-11-05T12:00:00.000Z',
        items: [
          {
            id: 'valida',
            fileName: 'photos/1730000000000-abc.jpeg',
            format: 'jpeg',
            capturedAt: '2026-11-05T12:00:00.000Z',
            source: 'camera',
            sizeBytes: 512,
          },
          {
            id: 'traversal',
            fileName: 'photos/../../shared_prefs/auth.xml',
            format: 'jpeg',
            capturedAt: '2026-11-05T13:00:00.000Z',
            source: 'camera',
            sizeBytes: 128,
          },
          {
            id: 'huerfana',
            fileName: 'photos/1730000000001-borrada.jpeg',
            format: 'jpeg',
            capturedAt: '2026-11-05T11:00:00.000Z',
            source: 'camera',
            sizeBytes: 256,
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

    await service.loadSaved();

    // Solo la entrada legítima y existente se expone; la ruta con `..` se bloquea antes de consultar Filesystem.
    expect(service.photos().map(p => p.id)).toEqual(['valida']);
    expect(getUriSpy).toHaveBeenCalledTimes(2);
    expect(getUriSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ path: 'photos/../../shared_prefs/auth.xml' }),
    );
  });

  it('debe respaldar un índice corrupto bajo la clave .corrupt y recuperar galería vacía (REQ-009)', async () => {
    await Preferences.set({
      key: environment.gallery.indexKey,
      value: '<<<json-invalido>>>',
    });

    await service.loadSaved();

    expect(service.photos()).toEqual([]);
    const backup = await Preferences.get({ key: `${environment.gallery.indexKey}.corrupt` });
    expect(backup.value).toBe('<<<json-invalido>>>');
  });

  it('media-security.util debe aceptar solo rutas en photos/ y extensiones de lista blanca', () => {
    expect(isSafePhotoPath('photos/1730000000-id1.webp')).toBe(true);
    expect(isSafePhotoPath('../secret.txt')).toBe(false);
    expect(isSafePhotoPath('photos/script.html')).toBe(false);
    expect(normalizeImageFormat('PNG')).toBe('png');
    expect(normalizeImageFormat('svg+xml')).toBe('jpeg');
  });
});
