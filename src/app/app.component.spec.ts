/**
 * @fileoverview Pruebas unitarias del componente raíz standalone `AppComponent`.
 *
 * @description
 * Verifica que el shell principal se instancia correctamente en la arquitectura
 * standalone (sin el antiguo `AppModule`) y proyecta `<ion-app>` junto con
 * `<ion-router-outlet>`.
 *
 * @author @quality-security-auditor (Fase 6)
 * @phase SDD Fase 6 — Calidad, Accesibilidad y Seguridad
 */

// Utilidad de configuración del contenedor de pruebas de Angular.
import { TestBed } from '@angular/core/testing';

// Proveedor de enrutamiento vacío para satisfacer a `<ion-router-outlet>`.
import { provideRouter } from '@angular/router';

// Proveedor oficial de Ionic Angular para entornos standalone.
import { provideIonicAngular } from '@ionic/angular';

// Componente raíz bajo prueba.
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    // Configura el módulo de pruebas importando directamente el componente standalone.
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideIonicAngular(), provideRouter([])],
    }).compileComponents();
  });

  it('debe crear el componente raíz y renderizar ion-app e ion-router-outlet', () => {
    // Instancia el componente dentro del fixture de pruebas.
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    // Comprueba que la instancia existe y que la estructura DOM base está montada.
    expect(app).toBeTruthy();
    const nativeEl = fixture.nativeElement as HTMLElement;
    expect(nativeEl.querySelector('ion-app')).not.toBeNull();
    expect(nativeEl.querySelector('ion-router-outlet')).not.toBeNull();
  });
});
