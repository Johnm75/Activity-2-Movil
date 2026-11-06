/**
 * @fileoverview Enrutamiento interno del contenedor de pestañas (`TabsPage`).
 *
 * @description
 * Define las rutas hijas bajo el punto de montaje `/tabs` declarado con
 * `loadChildren` en `app.routes.ts`. La ruta vacía monta `TabsPage` y anida
 * las tres pestañas perezosas (`tab1`, `tab2` y `tab3`), redirigiendo por
 * defecto a `tab2` (la galería de fotografías, pantalla principal del dominio).
 *
 * @author @capacitor-architect (Fase 3)
 * @author @quality-security-auditor (Fase 6 — corrección de prefijo duplicado y comentarios)
 * @phase SDD Fase 5B — Desarrollo de componentes y navegación
 * @phase SDD Fase 6 — Calidad, Accesibilidad y Seguridad
 */

// Decorador NgModule del núcleo de Angular.
import { NgModule } from '@angular/core';

// Módulo de enrutamiento y contrato tipado de rutas de Angular.
import { RouterModule, Routes } from '@angular/router';

// Componente contenedor que aloja `<ion-tabs>` y `<ion-tab-bar>`.
import { TabsPage } from './tabs.page';

/**
 * Árbol de rutas hijas del módulo de pestañas.
 *
 * Como `app.routes.ts` ya asigna el prefijo `tabs`, aquí la ruta padre es `''`
 * para que las URLs finales sean `/tabs/tab1`, `/tabs/tab2` y `/tabs/tab3`.
 */
const routes: Routes = [
  {
    // Contenedor visual de pestañas montado directamente sobre `/tabs`.
    path: '',
    component: TabsPage,
    children: [
      {
        // Pestaña 1: pantalla de bienvenida / inicio del módulo académico.
        path: 'tab1',
        loadChildren: () => import('../tab1/tab1.module').then(m => m.Tab1PageModule),
      },
      {
        // Pestaña 2: galería de fotografías locales (flujo principal).
        path: 'tab2',
        loadChildren: () => import('../tab2/tab2.module').then(m => m.Tab2PageModule),
      },
      {
        // Pestaña 3: perfil de sesión JWT y cierre de sesión.
        path: 'tab3',
        loadChildren: () => import('../tab3/tab3.module').then(m => m.Tab3PageModule),
      },
      {
        // Redirección interna cuando se navega a `/tabs` sin especificar pestaña.
        path: '',
        redirectTo: 'tab2',
        pathMatch: 'full',
      },
    ],
  },
];

/**
 * Módulo de enrutamiento hijo para la feature de pestañas.
 */
@NgModule({
  // Registra las rutas secundarias dentro del inyector perezoso de `TabsPageModule`.
  imports: [RouterModule.forChild(routes)],
  // Exporta `RouterModule` para que `<ion-tabs>` resuelva las directivas de navegación.
  exports: [RouterModule],
})
export class TabsPageRoutingModule {}
