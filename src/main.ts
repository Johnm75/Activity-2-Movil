/**
 * @fileoverview Punto de entrada de la aplicación Angular standalone.
 *
 * @description
 * Arranca la aplicación con `bootstrapApplication` usando la configuración
 * centralizada `appConfig`. Registra los elementos personalizados de
 * `@ionic/pwa-elements` para que la cámara funcione en navegador (REQ-007, RISK-007).
 *
 * @author @capacitor-architect (Fase 3 / Fase 5A)
 * @phase SDD Fase 3 — Arquitectura Capacitor
 * @phase SDD Fase 5A — Plugins Nativos y Almacenamiento
 */

// Función de arranque para aplicaciones standalone.
import { bootstrapApplication } from '@angular/platform-browser';

// Componente raíz de la aplicación.
import { AppComponent } from './app/app.component';

// Configuración centralizada de providers.
import { appConfig } from './app/app.config';

// Registra los elementos web de PWA Elements (cámara, diálogos) en el navegador.
import { defineCustomElements } from '@ionic/pwa-elements/loader';

// Define los custom elements de `@ionic/pwa-elements` en el objeto `window` global.
// Esto es necesario en modo web porque `Camera.getPhoto` usa un modal nativo de HTML.
defineCustomElements(window);

// Arranca la aplicación Angular con la configuración standalone.
bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
