/**
 * @fileoverview Enrutamiento de la feature de login.
 *
 * @description
 * Mapea la ruta vacía dentro del punto de montaje `/login` (definido en
 * `app.routes.ts` con `guestGuard`) al componente `LoginPage`. Se separa en
 * su propio módulo para mantener la carga perezosa de la pantalla de acceso,
 * igual que las pestañas.
 *
 * @author @ionic-ui-animator (Fase 5B — Desarrollo UI)
 * @phase SDD Fase 5B — Desarrollo de componentes
 */

// Núcleo de NgModule de Angular.
import { NgModule } from '@angular/core';

// Router de Angular y tipo de las definiciones de ruta.
import { RouterModule, Routes } from '@angular/router';

// Página de inicio de sesión declarada por la feature.
import { LoginPage } from './login.page';

/**
 * Rutas hijas de la feature de login.
 */
const routes: Routes = [
  {
    // Ruta vacía: el prefijo `/login` lo aporta `loadChildren` en `app.routes.ts`.
    path: '',
    component: LoginPage,
  },
];

/**
 * Módulo de enrutamiento de la feature de login.
 */
@NgModule({
  // Registra las rutas hijas scoped a esta feature.
  imports: [RouterModule.forChild(routes)],
  // Reexporta el router para que `LoginPageModule` no deba importarlo de nuevo.
  exports: [RouterModule],
})
export class LoginPageRoutingModule {}
