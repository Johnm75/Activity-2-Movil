/**
 * @fileoverview Pruebas unitarias de `ExploreContainerComponent`.
 *
 * @description
 * Verifica que el contenedor informativo se crea correctamente y renderiza el
 * texto pasado al signal input `name` junto con el enlace seguro externo.
 *
 * @author @quality-security-auditor (Fase 6)
 * @phase SDD Fase 6 — Calidad, Accesibilidad y Seguridad
 */

// Utilidades de pruebas unitarias de componentes de Angular.
import { ComponentFixture, TestBed } from '@angular/core/testing';

// Componente bajo prueba.
import { ExploreContainerComponent } from './explore-container.component';

// Módulo que declara `ExploreContainerComponent`.
import { ExploreContainerComponentModule } from './explore-container.module';

describe('ExploreContainerComponent', () => {
  // Instancia del componente.
  let component: ExploreContainerComponent;

  // Fixture de prueba con acceso al DOM.
  let fixture: ComponentFixture<ExploreContainerComponent>;

  beforeEach(async () => {
    // Compila el módulo compartido en el entorno de pruebas.
    await TestBed.configureTestingModule({
      imports: [ExploreContainerComponentModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ExploreContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crear el componente y renderizar un enlace con rel="noopener noreferrer"', () => {
    // Asigna un nombre de entrada y sincroniza la vista.
    fixture.componentRef.setInput('name', 'Vista de prueba');
    fixture.detectChanges();

    expect(component).toBeTruthy();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('strong')?.textContent).toContain('Vista de prueba');
    expect(host.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
  });
});
