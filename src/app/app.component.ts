/**
 * @fileoverview Componente raíz de la aplicación.
 *
 * @description
 * Envuelve la app en `ion-app` y `ion-router-outlet`. Convertido a standalone
 * para poder usar `bootstrapApplication` y la configuración centralizada de
 * `app.config.ts`.
 *
 * @author @capacitor-architect (Fase 3 / Fase 5A)
 * @phase SDD Fase 3 — Arquitectura Capacitor
 * @phase SDD Fase 5A — Plugins Nativos y Almacenamiento
 */

// Decorador de componente de Angular.
import { Component } from '@angular/core';

// Componentes Ionic standalone necesarios para la plantilla.
import { IonApp, IonRouterOutlet } from '@ionic/angular';

/**
 * Componente raíz standalone.
 */
@Component({
  // Selector usado en `src/index.html`.
  selector: 'app-root',

  // Indica que el componente es standalone (no requiere NgModule).
  standalone: true,

  // Importa los componentes Ionic usados directamente en la plantilla.
  imports: [IonApp, IonRouterOutlet],

  // Ruta de la plantilla HTML.
  templateUrl: 'app.component.html',

  // Ruta de los estilos del componente.
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  // No requiere lógica adicional; solo actúa como contenedor de la app.
}
