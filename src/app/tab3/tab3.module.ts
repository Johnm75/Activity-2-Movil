/**
 * @fileoverview Módulo de feature de la página «Cuenta» (`Tab3PageModule`).
 *
 * @description
 * Declara `Tab3Page` importando los Custom Elements standalone de `@ionic/angular`
 * (`IonAvatar`, `IonList`, `IonItem`, `IonButton`, `IonAlert`, etc.) para que
 * la tarjeta de perfil y el botón de cierre de sesión se hidraten con sus estilos
 * e interacciones nativas en Ionic 9.
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

// Componentes standalone de Ionic 9 empleados en la pantalla de cuenta.
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

// Componente de la pestaña «Cuenta».
import { Tab3Page } from './tab3.page';

// Módulo de enrutamiento hijo de la pestaña 3.
import { Tab3PageRoutingModule } from './tab3-routing.module';

/**
 * Módulo de feature de la pestaña 3 (Cuenta).
 */
@NgModule({
  // Importa los web components Ionic necesarios para perfil, diagnóstico JWT y alerta.
  imports: [
    CommonModule,
    FormsModule,
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
  // Declara el componente `Tab3Page`.
  declarations: [Tab3Page],
})
export class Tab3PageModule {}
