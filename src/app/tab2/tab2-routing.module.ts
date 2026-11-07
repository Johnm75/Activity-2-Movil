/**
 * Enrutamiento hijo de la pestaña `/tabs/tab2`.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Tab2Page } from './tab2.page';

// Ruta base del módulo perezoso correspondiente a la galería (`/tabs/tab2`).
const tab2Routes: Routes = [
  {
    path: '',
    component: Tab2Page,
  },
];

// Configura el enrutamiento interno de la pestaña de galería.
@NgModule({
  imports: [RouterModule.forChild(tab2Routes)],
  exports: [RouterModule],
})
export class Tab2PageRoutingModule {}
