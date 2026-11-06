/**
 * @fileoverview Rutas principales de la aplicación Angular standalone.
 *
 * @description
 * Define las rutas de primer nivel con sus guards funcionales (Fase 5B):
 * - `/login`: pantalla de acceso, protegida por `guestGuard` (si ya hay
 *   sesión vigente, redirige a la galería en lugar de mostrar el formulario).
 * - `/tabs`: contenedor de pestañas, protegido por `authGuard` (sin token
 *   JWT válido redirige a `/login` conservando el destino en `returnUrl`).
 * - La ruta raíz redirige a la primera pestaña, que al estar bajo `/tabs`
 *   dispara la evaluación del guard de autenticación.
 *
 * Las features se cargan de forma perezosa mediante `loadChildren`, patrón
 * NgModule de la plantilla tabs.
 *
 * @author @capacitor-architect (Fase 3 / Fase 5A)
 * @author @ionic-ui-animator (Fase 5B — guards y ruta /login)
 * @phase SDD Fase 5B — Desarrollo de componentes y navegación
 */

// Tipo de rutas de Angular.
import type { Routes } from '@angular/router';

// Guard funcional que exige sesión JWT vigente para entrar en `/tabs`.
import { authGuard } from './guards/auth.guard';

// Guard funcional que reserva `/login` a usuarios sin sesión activa.
import { guestGuard } from './guards/guest.guard';

/**
 * Rutas raíz de la aplicación.
 *
 * `TabsPageModule` y `LoginPageModule` siguen el patrón NgModule del starter;
 * Angular permite cargar módulos de rutas hijas (`loadChildren`) desde una
 * app standalone.
 */
export const routes: Routes = [
  {
    // Ruta raíz: redirige a la galería principal; al estar bajo `/tabs`,
    // dispara `authGuard` (exige sesión vigente o desvía a `/login`).
    path: '',
    redirectTo: 'tabs/tab2',
    pathMatch: 'full',
  },
  {
    // Pantalla de inicio de sesión: solo visible para invitados.
    path: 'login',
    canActivate: [guestGuard],
    loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule),
  },
  {
    // Rutas hijas de pestañas: requieren token JWT vigente.
    path: 'tabs',
    canActivate: [authGuard],
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule),
  },
];
