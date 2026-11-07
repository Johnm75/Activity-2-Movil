/**
 * Pruebas unitarias de `ExploreContainerComponent`.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExploreContainerComponent } from './explore-container.component';
import { ExploreContainerComponentModule } from './explore-container.module';

describe('ExploreContainerComponent', () => {
  let component: ExploreContainerComponent;
  let fixture: ComponentFixture<ExploreContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExploreContainerComponentModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ExploreContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe renderizar el título recibido y proteger el enlace externo con noopener noreferrer', () => {
    fixture.componentRef.setInput('sectionTitle', 'Vista de prueba');
    fixture.detectChanges();

    expect(component).toBeTruthy();
    const hostElement = fixture.nativeElement as HTMLElement;
    expect(hostElement.querySelector('strong')?.textContent).toContain('Vista de prueba');
    expect(hostElement.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
  });
});
