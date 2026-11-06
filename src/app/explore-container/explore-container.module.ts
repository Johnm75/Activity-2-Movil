/**
 * @fileoverview Módulo compartido `ExploreContainerComponentModule`.
 *
 * @description
 * Encapsula y exporta `ExploreContainerComponent` sin depender del punto de
 * entrada legado `@ionic/angular/lazy`, manteniendo compatibilidad total con
 * Ionic 9 standalone.
 *
 * @author @ionic-ui-animator (Fase 5B)
 * @author @quality-security-auditor (Fase 6 — auditoría de comentarios)
 * @phase SDD Fase 5B — Desarrollo de componentes y navegación
 */

// Decorador NgModule del núcleo de Angular.
import { NgModule } from '@angular/core';

// Directivas estructurales comunes de Angular.
import { CommonModule } from '@angular/common';

// Soporte de formularios de Angular.
import { FormsModule } from '@angular/forms';

// Componente compartido declarado y exportado por este módulo.
import { ExploreContainerComponent } from './explore-container.component';

/**
 * NgModule reutilizable del contenedor exploratorio.
 */
@NgModule({
  // Módulos base de Angular requeridos por la plantilla del componente.
  imports: [CommonModule, FormsModule],
  // Declara el componente dentro de este módulo compartido.
  declarations: [ExploreContainerComponent],
  // Lo exporta para que otros módulos de página puedan utilizarlo.
  exports: [ExploreContainerComponent],
})
export class ExploreContainerComponentModule {}
