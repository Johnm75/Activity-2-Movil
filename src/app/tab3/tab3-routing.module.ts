/**
 * Enrutamiento hijo de la pestaña `/tabs/tab3`.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Tab3Page } from './tab3.page';

// Ruta base del módulo perezoso asociado a la vista de cuenta (`/tabs/tab3`).
const tab3Routes: Routes = [
  {
    path: '',
    component: Tab3Page,
  },
];

// Habilita el enrutamiento hijo para la pestaña de cuenta y cierre de sesión.
@NgModule({
  imports: [RouterModule.forChild(tab3Routes)],
  exports: [RouterModule],
})
export class Tab3PageRoutingModule {}
