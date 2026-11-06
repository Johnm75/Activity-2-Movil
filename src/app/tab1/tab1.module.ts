/**
 * @fileoverview Módulo de feature de la pestaña «Inicio» (`Tab1PageModule`).
 *
 * @description
 * Declara `Tab1Page` importando los Custom Elements standalone de `@ionic/angular`
 * usados en el panel de bienvenida, garantizando que tarjetas, botones, chips y
 * barra superior se hidraten y estilicen correctamente en Ionic 9.
 *
 * @author @ionic-ui-animator (Fase 5B)
 * @author @quality-security-auditor (Fase 6 — auditoría de comentarios)
 * @phase SDD Fase 5B — Desarrollo de componentes y navegación
 */

// Decorador NgModule del núcleo de Angular.
import { NgModule } from '@angular/core';

// Directivas comunes de Angular.
import { CommonModule } from '@angular/common';

// Módulo de formularios estándar de Angular.
import { FormsModule } from '@angular/forms';

// Módulo de enrutamiento para directivas `routerLink` en acciones rápidas.
import { RouterModule } from '@angular/router';

// Componentes standalone de Ionic 9 empleados en la vista de inicio.
import {
  IonButton,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

// Componente de página correspondiente a la pestaña 1.
import { Tab1Page } from './tab1.page';

// Módulo compartido del contenedor exploratorio conservado por compatibilidad estructural.
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';

// Módulo de enrutamiento hijo de la pestaña 1.
import { Tab1PageRoutingModule } from './tab1-routing.module';

/**
 * NgModule de la pestaña «Inicio».
 */
@NgModule({
  // Dependencias necesarias para renderizar la vista de bienvenida y sus controles Ionic.
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ExploreContainerComponentModule,
    Tab1PageRoutingModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonChip,
    IonLabel,
  ],
  // Declara el componente de vista `Tab1Page`.
  declarations: [Tab1Page],
})
export class Tab1PageModule {}
