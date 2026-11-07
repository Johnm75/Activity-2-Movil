/**
 * Módulo de la pestaña «Inicio» (`Tab1Page`): resumen local y catálogo sincronizado por API REST (JWT).
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonButton,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSpinner,
  IonThumbnail,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { Tab1Page } from './tab1.page';
import { Tab1PageRoutingModule } from './tab1-routing.module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    Tab1PageRoutingModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonChip,
    IonLabel,
    IonList,
    IonItem,
    IonThumbnail,
    IonNote,
    IonSpinner,
  ],
  declarations: [Tab1Page],
})
export class Tab1PageModule {}
