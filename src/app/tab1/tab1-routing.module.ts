/**
 * Enrutamiento hijo de la pestaña `/tabs/tab1`.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Tab1Page } from './tab1.page';

// Vincula el segmento base del módulo cargado en diferido con `Tab1Page`.
const tab1Routes: Routes = [
  {
    path: '',
    component: Tab1Page,
  },
];

// Expone la configuración de enrutamiento hijo para la pestaña de inicio.
@NgModule({
  imports: [RouterModule.forChild(tab1Routes)],
  exports: [RouterModule],
})
export class Tab1PageRoutingModule {}
