/**
 * Módulo de la pestaña «Cuenta» (`Tab3Page`).
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonAlert,
  IonAvatar,
  IonButton,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { Tab3Page } from './tab3.page';
import { Tab3PageRoutingModule } from './tab3-routing.module';

@NgModule({
  imports: [
    CommonModule,
    Tab3PageRoutingModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonAvatar,
    IonChip,
    IonLabel,
    IonList,
    IonItem,
    IonIcon,
    IonNote,
    IonButton,
    IonAlert,
  ],
  declarations: [Tab3Page],
})
export class Tab3PageModule {}
