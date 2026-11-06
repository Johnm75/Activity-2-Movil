/**
 * @fileoverview Enrutamiento hijo de la pestaña Cuenta (`Tab3Page`).
 *
 * @description
 * Conecta la ruta vacía dentro de `/tabs/tab3` con el componente `Tab3Page`,
 * donde el estudiante consulta el estado de su sesión JWT o cierra sesión.
 *
 * @author @ionic-ui-animator (Fase 5B)
 * @author @quality-security-auditor (Fase 6 — auditoría de comentarios)
 * @phase SDD Fase 5B — Desarrollo de componentes y navegación
 */

// Decorador NgModule del núcleo de Angular.
import { NgModule } from '@angular/core';

// Utilidades de enrutamiento de Angular para features cargadas perezosamente.
import { RouterModule, Routes } from '@angular/router';

// Componente de la vista de perfil y cierre de sesión.
import { Tab3Page } from './tab3.page';

/**
 * Definición de rutas internas de la pestaña 3.
 */
const routes: Routes = [
  {
    // Ruta raíz de la feature `/tabs/tab3`.
    path: '',
    component: Tab3Page,
  },
];

/**
 * Módulo de rutas secundarias de `Tab3PageModule`.
 */
@NgModule({
  // Registra la ruta hija dentro del contexto perezoso de la pestaña.
  imports: [RouterModule.forChild(routes)],
  // Exporta RouterModule para que `Tab3PageModule` disponga de las directivas de ruta.
  exports: [RouterModule],
})
export class Tab3PageRoutingModule {}
