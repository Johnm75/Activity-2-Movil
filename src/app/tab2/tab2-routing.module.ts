/**
 * Enrutamiento hijo de la pestaña `/tabs/tab2`.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Tab2Page } from './tab2.page';

const tab2Routes: Routes = [
  {
    path: '',
    component: Tab2Page,
  },
];

@NgModule({
  imports: [RouterModule.forChild(tab2Routes)],
  exports: [RouterModule],
})
export class Tab2PageRoutingModule {}
