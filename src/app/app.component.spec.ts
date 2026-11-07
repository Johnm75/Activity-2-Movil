/**
 * Pruebas unitarias de `AppComponent`.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideIonicAngular(), provideRouter([])],
    }).compileComponents();
  });

  it('debe instanciar el componente raíz y montar ion-app junto a ion-router-outlet', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    const hostElement = fixture.nativeElement as HTMLElement;
    expect(hostElement.querySelector('ion-app')).not.toBeNull();
    expect(hostElement.querySelector('ion-router-outlet')).not.toBeNull();
  });
});
