/**
 * Punto de entrada de la aplicación Ionic/Angular.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { bootstrapApplication } from '@angular/platform-browser';
import { defineCustomElements } from '@ionic/pwa-elements/loader';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Habilita el modal web de cámara cuando `Camera.getPhoto` se ejecuta en navegador de escritorio.
defineCustomElements(window);

bootstrapApplication(AppComponent, appConfig).catch(bootstrapError =>
  console.error(bootstrapError)
);
