/**
 * Definición raíz de rutas con carga perezosa y protección mediante guardas JWT.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import type { Routes } from '@angular/router';

import { authenticatedRouteGuard } from './guards/auth.guard';
import { unauthenticatedOnlyGuard } from './guards/guest.guard';

export const appRoutes: Routes = [
  {
    path: '',
    redirectTo: 'tabs/tab2',
    pathMatch: 'full',
  },
  {
    path: 'login',
    canActivate: [unauthenticatedOnlyGuard],
    loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule),
  },
  {
    path: 'tabs',
    canActivate: [authenticatedRouteGuard],
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule),
  },
];
