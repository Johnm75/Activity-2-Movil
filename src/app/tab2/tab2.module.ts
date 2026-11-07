/**
 * Módulo de la pestaña «Galería» (`Tab2Page`) con soporte de cámara, cuadrícula y hoja de acciones.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonActionSheet,
  IonButton,
  IonChip,
  IonCol,
  IonContent,
  IonFab,
  IonFabButton,
  IonGrid,
  IonHeader,
  IonIcon,
  IonLabel,
  IonRow,
  IonSpinner,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/angular';

import { Tab2Page } from './tab2.page';
import { Tab2PageRoutingModule } from './tab2-routing.module';

// Registra los componentes de cuadrícula, FAB de captura y diálogos de confirmación local.
@NgModule({
  imports: [
    CommonModule,
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
    IonFab,
    IonFabButton,
    IonActionSheet,
    IonToast,
  ],
  declarations: [Tab2Page],
})
export class Tab2PageModule {}
