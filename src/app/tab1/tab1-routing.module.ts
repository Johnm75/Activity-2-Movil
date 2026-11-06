/**
 * @fileoverview Enrutamiento hijo de la pestaña 1 (`Tab1PageRoutingModule`).
 *
 * @description
 * Conecta la ruta vacía de `/tabs/tab1` con el componente `Tab1Page`.
 *
 * @author @ionic-ui-animator (Fase 5B)
 * @author @quality-security-auditor (Fase 6 — auditoría de comentarios)
 * @phase SDD Fase 5B — Desarrollo de componentes y navegación
 */

// Decorador NgModule del núcleo de Angular.
import { NgModule } from '@angular/core';

// Módulo y tipos de enrutamiento de Angular.
import { RouterModule, Routes } from '@angular/router';

// Componente renderizado al activar `/tabs/tab1`.
import { Tab1Page } from './tab1.page';

/**
 * Rutas internas de la feature `tab1`.
 */
const routes: Routes = [
  {
    // Monta `Tab1Page` en la raíz del segmento perezoso.
    path: '',
    component: Tab1Page,
  },
];

/**
 * Módulo de rutas secundarias para `Tab1PageModule`.
 */
@NgModule({
  // Registra las rutas hijas en el inyector de la feature.
  imports: [RouterModule.forChild(routes)],
  // Reexporta RouterModule hacia el módulo padre de la pestaña.
  exports: [RouterModule],
})
export class Tab1PageRoutingModule {}
