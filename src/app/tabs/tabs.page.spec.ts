/**
 * Pruebas unitarias de `TabsPage`.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';

import { TabsPageModule } from './tabs.module';
import { TabsPage } from './tabs.page';

describe('TabsPage', () => {
  let component: TabsPage;
  let fixture: ComponentFixture<TabsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabsPageModule, RouterModule.forRoot([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TabsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crear el contenedor y renderizar las tres pestañas principales', () => {
    expect(component).toBeTruthy();

    const tabButtons = (fixture.nativeElement as HTMLElement).querySelectorAll('ion-tab-button');
    expect(tabButtons.length).toBe(3);
    expect(tabButtons[0]?.getAttribute('tab')).toBe('tab1');
    expect(tabButtons[1]?.getAttribute('tab')).toBe('tab2');
    expect(tabButtons[2]?.getAttribute('tab')).toBe('tab3');
  });
});
