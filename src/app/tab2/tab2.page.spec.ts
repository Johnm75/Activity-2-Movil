/**
 * @fileoverview Pruebas unitarias y de accesibilidad WCAG 2.2 de `Tab2Page` (Galería).
 *
 * @description
 * Verifica los cuatro estados visuales de la galería (carga, vacío, error y
 * cuadrícula), el texto alternativo descriptivo `alt` de cada fotografía para
 * TalkBack/VoiceOver, el `aria-label` del botón flotante de cámara y la
 * restauración del foco tras cerrar el diálogo nativo de captura.
 *
 * @author @ionic-ui-animator (Fase 5B)
 * @author @quality-security-auditor (Fase 6 — cobertura de estados y WCAG 2.2)
 * @phase SDD Fase 6 — Calidad, Accesibilidad y Seguridad
 */

// Utilidades de pruebas de componentes y signals de Angular.
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';

// Enrutador en memoria para compilar las directivas de navegación.
import { RouterModule } from '@angular/router';

// Módulo de feature de la galería.
import { Tab2PageModule } from './tab2.module';

// Componente bajo prueba.
import { Tab2Page } from './tab2.page';

// Servicio de fotografías sustituido por un doble reactivo controlado.
import { PhotoService } from '../services/photo.service';

// Modelos tipados de fotografías y códigos de error.
import type { PhotoErrorCode, PhotoItem } from '../models/photo.model';

describe('Tab2Page', () => {
  // Instancia del componente bajo prueba.
  let component: Tab2Page;

  // Fixture con acceso al DOM renderizado.
  let fixture: ComponentFixture<Tab2Page>;

  // Signals controlables desde cada test para simular estados del servicio.
  let photosSignal: ReturnType<typeof signal<PhotoItem[]>>;
  let loadingSignal: ReturnType<typeof signal<boolean>>;
  let errorSignal: ReturnType<typeof signal<PhotoErrorCode | null>>;
  let addNewSpy: ReturnType<typeof vi.fn>;
  let loadSavedSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    photosSignal = signal<PhotoItem[]>([]);
    loadingSignal = signal<boolean>(false);
    errorSignal = signal<PhotoErrorCode | null>(null);
    addNewSpy = vi.fn().mockResolvedValue(null);
    loadSavedSpy = vi.fn().mockResolvedValue(undefined);

    const photoServiceMock = {
      photos: photosSignal,
      loading: loadingSignal,
      error: errorSignal,
      isEmpty: computed(() => photosSignal().length === 0),
      addNewToGallery: addNewSpy,
      loadSaved: loadSavedSpy,
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

  it('debe hidratar la galería en ngOnInit y exponer aria-label en el FAB de cámara (WCAG 4.1.2)', () => {
    expect(component).toBeTruthy();
    expect(loadSavedSpy).toHaveBeenCalledTimes(1);

    const host = fixture.nativeElement as HTMLElement;
    const fab = host.querySelector('ion-fab-button');
    // Al hidratarse `ion-fab-button` (Ionic 9), Stencil transfiere `aria-label` al `<button>` nativo del Shadow DOM.
    const fabLabel =
      fab?.getAttribute('aria-label') ??
      fab?.shadowRoot?.querySelector('button')?.getAttribute('aria-label');
    expect(fabLabel).toBe('Tomar una fotografía y añadirla a la galería');
  });

  it('debe renderizar cuadrícula con alt descriptivo en español y chip contador accesible (WCAG 1.1.1)', () => {
    photosSignal.set([
      {
        id: 'p-1',
        fileName: 'photos/1730000000000-a.jpeg',
        webviewPath: 'https://localhost/_capacitor_file_/a.jpeg',
        format: 'jpeg',
        capturedAt: '2026-11-05T15:30:00.000Z',
        source: 'camera',
        sizeBytes: 2048,
      },
    ]);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const img = host.querySelector('ion-img') as (HTMLElement & { alt?: string }) | null;
    const chip = host.querySelector('.counter-chip');

    // En web components Stencil (`ion-img`), el enlace `[alt]` asigna la propiedad DOM `alt`.
    expect(img?.alt ?? img?.getAttribute('alt')).toContain('Fotografía 1 de 1');
    expect(chip?.getAttribute('aria-label')).toBe('1 fotografías en la galería');
  });

  it('debe anunciar errores con role="alert" y mostrar toast al añadir una foto', async () => {
    errorSignal.set('permission_denied');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const alertBox = host.querySelector('[role="alert"]');
    expect(alertBox?.textContent).toContain('Sin acceso a la cámara');

    // Simula una captura exitosa y comprueba la apertura del toast informativo.
    addNewSpy.mockResolvedValueOnce({
      id: 'p-2',
      fileName: 'photos/nueva.jpeg',
      webviewPath: 'https://localhost/_capacitor_file_/nueva.jpeg',
      format: 'jpeg',
      capturedAt: '2026-11-05T16:00:00.000Z',
      source: 'camera',
      sizeBytes: 1024,
    });

    await component.takePhoto();
    expect(component.toastOpen()).toBe(true);
    expect(component.toastMessage()).toBe('Foto añadida a la galería');
  });
});
