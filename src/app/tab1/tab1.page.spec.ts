/**
 * @fileoverview Pruebas unitarias de `Tab1Page`.
 *
 * @description
 * Comprueba que la primera pestaña se instancia sin errores y actualiza el
 * título accesible del documento al invocar `ionViewDidEnter()`.
 *
 * @author @quality-security-auditor (Fase 6)
 * @phase SDD Fase 6 — Calidad, Accesibilidad y Seguridad
 */

// Utilidades de pruebas unitarias de Angular.
import { ComponentFixture, TestBed } from '@angular/core/testing';

// Router en memoria para satisfacer enlaces internos de Ionic.
import { RouterModule } from '@angular/router';

// Módulo de feature de la pestaña 1.
import { Tab1PageModule } from './tab1.module';

// Componente bajo prueba.
import { Tab1Page } from './tab1.page';

describe('Tab1Page', () => {
  // Referencia al componente instanciado.
  let component: Tab1Page;

  // Fixture con acceso a la plantilla renderizada.
  let fixture: ComponentFixture<Tab1Page>;

  beforeEach(async () => {
    // Configura el módulo de prueba con las dependencias de la pestaña 1.
    await TestBed.configureTestingModule({
      imports: [Tab1PageModule, RouterModule.forRoot([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Tab1Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe instanciar la pestaña 1 y anunciar el título al entrar', () => {
    // Verifica la creación del componente.
    expect(component).toBeTruthy();

    // Ejecuta el hook de Ionic y comprueba que actualiza `document.title`.
    component.ionViewDidEnter();
    expect(document.title).toContain('Inicio');
  });
});
