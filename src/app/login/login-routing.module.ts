/**
 * Enrutamiento hijo de la pantalla `/login`.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginPage } from './login.page';

// Ruta raíz del módulo perezoso asociado a `/login`.
const loginRoutes: Routes = [
  {
    path: '',
    component: LoginPage,
  },
];

// Registra las rutas hijas del módulo y reexporta `RouterModule` hacia la página.
@NgModule({
  imports: [RouterModule.forChild(loginRoutes)],
  exports: [RouterModule],
})
export class LoginPageRoutingModule {}
