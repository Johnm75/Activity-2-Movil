/**
 * @fileoverview Enrutamiento hijo de la pestaña Galería (`Tab2Page`).
 *
 * @description
 * Conecta la ruta vacía dentro de `/tabs/tab2` con el componente `Tab2Page`,
 * manteniendo la carga perezosa por pestaña definida en `TabsPageRoutingModule`.
 *
 * @author @ionic-ui-animator (Fase 5B)
 * @author @quality-security-auditor (Fase 6 — auditoría de comentarios)
 * @phase SDD Fase 5B — Desarrollo de componentes y navegación
 */

// Decorador NgModule del núcleo de Angular.
import { NgModule } from '@angular/core';

// Utilidades de enrutamiento de Angular para módulos secundarios.
import { RouterModule, Routes } from '@angular/router';

// Componente de la galería de fotografías locales.
import { Tab2Page } from './tab2.page';

/**
 * Definición de rutas internas de la pestaña 2.
 */
const routes: Routes = [
  {
    // Ruta raíz de la feature `/tabs/tab2`.
    path: '',
    component: Tab2Page,
  },
];

/**
 * Módulo de rutas secundarias de `Tab2PageModule`.
 */
@NgModule({
  // Registra las rutas hijas sin reinstanciar el servicio global Router.
  imports: [RouterModule.forChild(routes)],
  // Reexporta RouterModule para uso de `Tab2PageModule`.
  exports: [RouterModule],
})
export class Tab2PageRoutingModule {}
