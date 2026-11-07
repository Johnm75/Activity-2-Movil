/**
 * Enrutamiento hijo de la pantalla `/login`.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginPage } from './login.page';

const loginRoutes: Routes = [
  {
    path: '',
    component: LoginPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(loginRoutes)],
  exports: [RouterModule],
})
export class LoginPageRoutingModule {}
