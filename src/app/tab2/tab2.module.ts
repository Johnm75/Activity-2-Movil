/**
 * @fileoverview Módulo de feature de la página «Galería» (`Tab2PageModule`).
 *
 * @description
 * Declara `Tab2Page` importando explícitamente los Custom Elements standalone
 * de `@ionic/angular` (Ionic 9) para que la cabecera, cuadrícula, imágenes,
 * botón flotante (FAB), botones de estado y notificaciones toast se registren
 * e hidraten con sus estilos completos en Web y Android/iOS.
 *
 * @author @ionic-ui-animator (Fase 5B — Desarrollo UI)
 * @phase SDD Fase 5B — Desarrollo de componentes y navegación
 */

// Decorador NgModule del núcleo de Angular.
import { NgModule } from '@angular/core';

// Directivas comunes de Angular.
import { CommonModule } from '@angular/common';

// Soporte de formularios estándar de Angular.
import { FormsModule } from '@angular/forms';

// Componentes standalone de Ionic 9 utilizados en la galería fotográfica.
import {
  IonButton,
  IonChip,
  IonCol,
  IonContent,
  IonFab,
  IonFabButton,
  IonGrid,
  IonHeader,
  IonIcon,
  IonImg,
  IonLabel,
  IonRow,
  IonSpinner,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/angular';

// Componente principal de la galería de fotografías.
import { Tab2Page } from './tab2.page';

// Enrutamiento hijo de la pestaña 2.
import { Tab2PageRoutingModule } from './tab2-routing.module';

/**
 * Módulo de feature de la pestaña 2 (Galería).
 */
@NgModule({
  // Importa utilidades Angular y todos los Custom Elements Ionic de la cuadrícula y cámara.
  imports: [
    CommonModule,
    FormsModule,
    Tab2PageRoutingModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonChip,
    IonLabel,
    IonIcon,
    IonSpinner,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonImg,
    IonFab,
    IonFabButton,
    IonToast,
  ],
  // Declara el componente `Tab2Page`.
  declarations: [Tab2Page],
})
export class Tab2PageModule {}
