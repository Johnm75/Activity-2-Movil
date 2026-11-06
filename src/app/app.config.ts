/**
 * @fileoverview Configuración global de la aplicación Angular standalone.
 *
 * @description
 * Registra los proveedores transversales del proyecto: detección de cambios por
 * zonas, enrutador con `IonicRouteStrategy` (necesario para transiciones y caché
 * de pila entre pestañas), inicialización de Custom Elements standalone de
 * Ionic 9 (`provideIonicAngular`), cliente HTTP con interceptores funcionales
 * (`jwtInterceptor` + `mockApiInterceptor`) e hidratación temprana de la sesión.
 *
 * @author @capacitor-architect (Fase 3 / Fase 5A)
 * @author @ionic-ui-animator (Fase 5B — IonicRouteStrategy y Custom Elements)
 * @phase SDD Fase 3 — Arquitectura Capacitor
 */

// Proveedores nucleares de Angular para zonas, configuración e inicialización temprana.
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';

// Enrutador de Angular y contrato de reutilización de rutas para pestañas móviles.
import { RouteReuseStrategy, provideRouter } from '@angular/router';

// Cliente HTTP reactivo con soporte para interceptores funcionales encadenados.
import { provideHttpClient, withInterceptors } from '@angular/common/http';

// Inicializador oficial de Ionic 9 standalone y estrategia de caché de vistas.
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';

// Árbol principal de rutas de la aplicación (`/login` y `/tabs/**`).
import { routes } from './app.routes';

// Servicio singleton de autenticación JWT que restaura la sesión al arrancar.
import { AuthJwtService } from './services/auth-jwt.service';

// Interceptores HTTP: inyección de Bearer token y backend simulado offline.
import { jwtInterceptor } from './interceptors/jwt.interceptor';
import { mockApiInterceptor } from './interceptors/mock-api.interceptor';

/**
 * Configuración raíz inyectada en `bootstrapApplication(AppComponent, appConfig)`.
 *
 * Orden deliberado de interceptores: `jwtInterceptor` corre antes que
 * `mockApiInterceptor` para que el mock valide la cabecera `Authorization`.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Mantiene sincronizada la vista tras eventos asíncronos de plugins nativos Capacitor.
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Conserva vivas las pestañas visitadas y habilita animaciones nativas de Ionic.
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },

    // Registra el árbol de navegación principal de la aplicación.
    provideRouter(routes),

    // Inicializa Ionic 9 (modo adaptativo Material/Cupertino y soporte de Custom Elements).
    provideIonicAngular({}),

    // Provee `HttpClient` con la cadena de seguridad JWT seguida del mock académico.
    provideHttpClient(withInterceptors([jwtInterceptor, mockApiInterceptor])),

    // Hidrata el token guardado en `@capacitor/preferences` antes de evaluar los guards.
    provideAppInitializer(() => {
      const auth = inject(AuthJwtService);
      return auth.hydrate();
    }),
  ],
};
