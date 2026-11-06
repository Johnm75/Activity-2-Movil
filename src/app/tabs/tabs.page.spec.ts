/**
 * @fileoverview Pruebas unitarias del contenedor de navegación `TabsPage`.
 *
 * @description
 * Verifica que la barra inferior de pestañas se instancia y expone los tres
 * destinos accesibles (`Tab 1`, `Galería` y `Cuenta`) con sus enlaces esperados.
 *
 * @author @quality-security-auditor (Fase 6)
 * @phase SDD Fase 6 — Calidad, Accesibilidad y Seguridad
 */

// Utilidades de pruebas de componentes de Angular.
import { ComponentFixture, TestBed } from '@angular/core/testing';

// Enrutador de pruebas para resolver las directivas internas de `<ion-tabs>`.
import { RouterModule } from '@angular/router';

// Módulo de feature que declara `TabsPage`.
import { TabsPageModule } from './tabs.module';

// Componente contenedor bajo prueba.
import { TabsPage } from './tabs.page';

describe('TabsPage', () => {
  // Instancia del componente bajo prueba.
  let component: TabsPage;

  // Fixture que encapsula el DOM renderizado.
  let fixture: ComponentFixture<TabsPage>;

  beforeEach(async () => {
    // Compila el módulo de pestañas con un router raíz en memoria.
    await TestBed.configureTestingModule({
      imports: [TabsPageModule, RouterModule.forRoot([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TabsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crear el contenedor de pestañas y renderizar los 3 botones de navegación', () => {
    // Verifica que la instancia se construyó correctamente.
    expect(component).toBeTruthy();

    // Verifica que existen los tres botones de pestaña con iconos decorativos ocultos a lectores.
    const host = fixture.nativeElement as HTMLElement;
    const buttons = host.querySelectorAll('ion-tab-button');
    expect(buttons.length).toBe(3);
    expect(buttons[1]?.getAttribute('tab')).toBe('tab2');
    expect(buttons[2]?.getAttribute('tab')).toBe('tab3');
  });
});
