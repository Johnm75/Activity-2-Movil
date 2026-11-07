/**
 * Pruebas unitarias de `Tab1Page` (Inicio y consumo API REST con JWT).
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { RouterModule } from '@angular/router';

import { Tab1PageModule } from './tab1.module';
import { Tab1Page } from './tab1.page';
import { PhotoService } from '../services/photo.service';
import { JwtAuthenticationService } from '../services/auth-jwt.service';
import type { RemoteCatalogPhoto, SavedPhoto } from '../models/photo.model';

describe('Tab1Page', () => {
  let component: Tab1Page;
  let fixture: ComponentFixture<Tab1Page>;
  let loadRemoteCatalogSpy: ReturnType<typeof vi.fn>;
  let loadSavedPhotosSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    loadRemoteCatalogSpy = vi.fn().mockResolvedValue([]);
    loadSavedPhotosSpy = vi.fn().mockResolvedValue(undefined);

    const photoServiceMock = {
      savedPhotos: signal<SavedPhoto[]>([]),
      remoteCatalogPhotos: signal<RemoteCatalogPhoto[]>([
        {
          id: 'api-01',
          title: 'Recurso REST Protegido',
          authorName: 'API Académica',
          categoryLabel: 'JWT',
          thumbnailUrl: 'data:image/svg+xml;utf8,test',
        },
      ]),
      isLoadingRemoteCatalog: signal<boolean>(false),
      remoteCatalogErrorMessage: signal<string | null>(null),
      loadSavedPhotos: loadSavedPhotosSpy,
      loadRemotePhotoCatalog: loadRemoteCatalogSpy,
    };

    const authenticationServiceMock = {
      maskedTokenPreview: signal<string>('eyJhbGciOi…hmac'),
    };

    await TestBed.configureTestingModule({
      imports: [Tab1PageModule, RouterModule.forRoot([])],
      providers: [
        { provide: PhotoService, useValue: photoServiceMock },
        { provide: JwtAuthenticationService, useValue: authenticationServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Tab1Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe sincronizar el catálogo API REST en ngOnInit y renderizar los elementos recibidos', () => {
    expect(component).toBeTruthy();
    expect(loadSavedPhotosSpy).toHaveBeenCalledTimes(1);
    expect(loadRemoteCatalogSpy).toHaveBeenCalledTimes(1);

    const hostText = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(hostText).toContain('Recurso REST Protegido');
    expect(hostText).toContain('eyJhbGciOi…hmac');

    component.ionViewDidEnter();
    expect(document.title).toContain('Inicio');
  });
});
