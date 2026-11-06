/**
 * @fileoverview Módulo de feature de la página de inicio de sesión (`LoginPageModule`).
 *
 * @description
 * Registra `LoginPage` importando directamente los Custom Elements standalone de
 * `@ionic/angular` (Ionic 9). Esto garantiza que `<ion-input>`, `<ion-button>`,
 * `<ion-input-password-toggle>`, `<ion-icon>` e `<ion-spinner>` ejecuten
 * `defineCustomElement` en el navegador y el WebView de Android/iOS, evitando
 * controles sin hidratar cuando se usa `provideIonicAngular()`.
 *
 * @author @ionic-ui-animator (Fase 5B — Desarrollo UI)
 * @phase SDD Fase 5B — Desarrollo de componentes y navegación
 */

// Decorador NgModule del núcleo de Angular.
import { NgModule } from '@angular/core';

// Directivas comunes de Angular para plantillas.
import { CommonModule } from '@angular/common';

// Soporte de formularios reactivos (`formGroup`, `formControlName`).
import { ReactiveFormsModule } from '@angular/forms';

// Componentes Ionic 9 standalone que registran sus propios Custom Elements en el DOM.
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonInputPasswordToggle,
  IonSpinner,
} from '@ionic/angular';

// Componente de página de inicio de sesión declarado en este módulo.
import { LoginPage } from './login.page';

// Enrutamiento hijo perezoso de la pantalla `/login`.
import { LoginPageRoutingModule } from './login-routing.module';

/**
 * Módulo de la pantalla de autenticación.
 */
@NgModule({
  // Importa formularios reactivos, rutas hijas y cada control Ionic utilizado en la vista.
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LoginPageRoutingModule,
    IonContent,
    IonInput,
    IonInputPasswordToggle,
    IonButton,
    IonIcon,
    IonSpinner,
  ],
  // Declara el componente `LoginPage`.
  declarations: [LoginPage],
})
export class LoginPageModule {}
