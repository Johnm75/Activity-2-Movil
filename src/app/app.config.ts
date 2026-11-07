/**
 * Proveedores raíz de Angular, Ionic 9, interceptores HTTP JWT e hidratación previa de sesión.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';

import { appRoutes } from './app.routes';
import { JwtAuthenticationService } from './services/auth-jwt.service';
import { jwtAuthInterceptor } from './interceptors/jwt.interceptor';
import { mockRestApiInterceptor } from './interceptors/mock-api.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Agrupa eventos del DOM en un mismo ciclo para reducir detecciones innecesarias en móvil.
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Conserva vivas en caché las vistas al alternar entre pestañas de Ionic.
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideRouter(appRoutes),
    provideIonicAngular({}),
    // `jwtAuthInterceptor` precede a `mockRestApiInterceptor` para que el mock valide la cabecera Bearer inyectada.
    provideHttpClient(withInterceptors([jwtAuthInterceptor, mockRestApiInterceptor])),
    // Restaura la sesión desde `@capacitor/preferences` antes de resolver la ruta inicial.
    provideAppInitializer(() => inject(JwtAuthenticationService).restorePersistedSession()),
  ],
};
