/**
 * @fileoverview Módulo de feature del contenedor de pestañas (`TabsPageModule`).
 *
 * @description
 * Declara `TabsPage` e importa los Custom Elements standalone de navegación de
 * `@ionic/angular` (`IonTabs`, `IonTabBar`, `IonTabButton`, `IonIcon`, `IonLabel`)
 * para garantizar su hidratación completa junto a `provideIonicAngular()`.
 *
 * @author @capacitor-architect (Fase 3)
 * @author @ionic-ui-animator (Fase 5B — Custom Elements Ionic 9)
 * @phase SDD Fase 5B — Desarrollo de componentes y navegación
 */

// Decorador NgModule del núcleo de Angular.
import { NgModule } from '@angular/core';

// Directivas estructurales comunes de Angular.
import { CommonModule } from '@angular/common';

// Soporte de formularios estándar de Angular.
import { FormsModule } from '@angular/forms';

// Componentes standalone de Ionic 9 para la barra inferior de pestañas.
import {
  IonIcon,
  IonLabel,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/angular';

// Módulo de rutas hijas que conecta `tab1`, `tab2` y `tab3`.
import { TabsPageRoutingModule } from './tabs-routing.module';

// Componente anfitrión de la barra de navegación inferior.
import { TabsPage } from './tabs.page';

/**
 * NgModule que encapsula el layout principal de pestañas.
 */
@NgModule({
  // Importa los web components Ionic de navegación y el enrutamiento hijo.
  imports: [
    CommonModule,
    FormsModule,
    TabsPageRoutingModule,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
  ],
  // Declara el componente contenedor de pestañas.
  declarations: [TabsPage],
})
export class TabsPageModule {}
