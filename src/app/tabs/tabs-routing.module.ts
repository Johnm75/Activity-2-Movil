/**
 * Árbol de rutas internas para las tres pestañas principales (`/tabs/tab1`, `/tabs/tab2`, `/tabs/tab3`).
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TabsPage } from './tabs.page';

// Carga cada pestaña bajo demanda y establece `tab2` (Galería) como vista inicial dentro de `/tabs`.
const tabRoutes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'tab1',
        loadChildren: () => import('../tab1/tab1.module').then(m => m.Tab1PageModule),
      },
      {
        path: 'tab2',
        loadChildren: () => import('../tab2/tab2.module').then(m => m.Tab2PageModule),
      },
      {
        path: 'tab3',
        loadChildren: () => import('../tab3/tab3.module').then(m => m.Tab3PageModule),
      },
      {
        path: '',
        redirectTo: 'tab2',
        pathMatch: 'full',
      },
    ],
  },
];

// Registra el árbol hijo del contenedor de pestañas en el enrutador de Angular.
@NgModule({
  imports: [RouterModule.forChild(tabRoutes)],
  exports: [RouterModule],
})
export class TabsPageRoutingModule {}
