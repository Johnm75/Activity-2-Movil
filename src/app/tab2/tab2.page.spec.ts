/**
 * Pruebas unitarias de `Tab2Page` (Galería, captura y eliminación local).
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

import { Tab2PageModule } from './tab2.module';
import { Tab2Page } from './tab2.page';
import { PhotoService } from '../services/photo.service';
import type { GalleryErrorCode, SavedPhoto } from '../models/photo.model';

describe('Tab2Page', () => {
  let component: Tab2Page;
  let fixture: ComponentFixture<Tab2Page>;
  let savedPhotosSignal: ReturnType<typeof signal<SavedPhoto[]>>;
  let isLoadingSignal: ReturnType<typeof signal<boolean>>;
  let errorCodeSignal: ReturnType<typeof signal<GalleryErrorCode | null>>;
  let captureAndSaveSpy: ReturnType<typeof vi.fn>;
  let loadSavedPhotosSpy: ReturnType<typeof vi.fn>;
  let deleteSavedPhotoSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    savedPhotosSignal = signal<SavedPhoto[]>([]);
    isLoadingSignal = signal<boolean>(false);
    errorCodeSignal = signal<GalleryErrorCode | null>(null);
    captureAndSaveSpy = vi.fn().mockResolvedValue(null);
    loadSavedPhotosSpy = vi.fn().mockResolvedValue(undefined);
    deleteSavedPhotoSpy = vi.fn().mockResolvedValue(undefined);

    const photoServiceMock = {
      savedPhotos: savedPhotosSignal,
      isLoadingGallery: isLoadingSignal,
      galleryErrorCode: errorCodeSignal,
      isGalleryEmpty: computed(() => savedPhotosSignal().length === 0),
      captureAndSavePhoto: captureAndSaveSpy,
      loadSavedPhotos: loadSavedPhotosSpy,
      deleteSavedPhoto: deleteSavedPhotoSpy,
    };

    await TestBed.configureTestingModule({
      imports: [Tab2PageModule, RouterModule.forRoot([])],
      providers: [{ provide: PhotoService, useValue: photoServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Tab2Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debe cargar las fotos en ngOnInit y exponer aria-label accesible en el FAB de cámara', () => {
    expect(component).toBeTruthy();
    expect(loadSavedPhotosSpy).toHaveBeenCalledTimes(1);

    const host = fixture.nativeElement as HTMLElement;
    const fabButton = host.querySelector('ion-fab-button');
    const fabLabel =
      fabButton?.getAttribute('aria-label') ??
      fabButton?.shadowRoot?.querySelector('button')?.getAttribute('aria-label');
    expect(fabLabel).toBe('Tomar una fotografía y añadirla a la galería');
  });

  it('debe renderizar miniaturas <img> nativas con alt descriptivo y permitir eliminarlas', async () => {
    const samplePhoto: SavedPhoto = {
      id: 'photo-01',
      relativeFilePath: 'photos/1730000000000-a.jpeg',
      webviewDisplayUrl: 'https://localhost/_capacitor_file_/a.jpeg',
      imageExtension: 'jpeg',
      capturedAtIso: '2026-11-06T12:30:00.000Z',
      originSource: 'camera',
      fileSizeBytes: 2048,
    };
    savedPhotosSignal.set([samplePhoto]);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const imgElement = host.querySelector('img.photo-img') as HTMLImageElement | null;
    const counterChip = host.querySelector('.counter-chip');

    expect(imgElement?.getAttribute('alt')).toContain('Fotografía 1 de 1');
    expect(counterChip?.getAttribute('aria-label')).toBe('1 fotografías en la galería');

    component.openPhotoOptions(samplePhoto);
    expect(component.isPhotoActionSheetOpen()).toBe(true);

    await component.confirmDeleteSelectedPhoto();
    expect(deleteSavedPhotoSpy).toHaveBeenCalledWith('photo-01');
    expect(component.isPhotoActionSheetOpen()).toBe(false);
    expect(component.feedbackToastMessage()).toContain('eliminada');
  });

  it('debe presentar alerta en errores de cámara y mostrar toast tras capturar una fotografía', async () => {
    errorCodeSignal.set('permission_denied');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const alertBox = host.querySelector('[role="alert"]');
    expect(alertBox?.textContent).toContain('Sin acceso a la cámara');

    captureAndSaveSpy.mockResolvedValueOnce({
      id: 'photo-02',
      relativeFilePath: 'photos/nueva.jpeg',
      webviewDisplayUrl: 'https://localhost/_capacitor_file_/nueva.jpeg',
      imageExtension: 'jpeg',
      capturedAtIso: '2026-11-06T13:00:00.000Z',
      originSource: 'camera',
      fileSizeBytes: 1024,
    });

    await component.captureNewPhoto();
    expect(component.isFeedbackToastOpen()).toBe(true);
    expect(component.feedbackToastMessage()).toContain('guardada');
  });
});
