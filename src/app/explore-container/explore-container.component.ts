/**
 * @fileoverview Componente informativo reutilizable `ExploreContainerComponent`.
 *
 * @description
 * Muestra un bloque centrado con el nombre de la sección recibido por signal
 * input (`name`) y un enlace de referencia a la documentación de componentes
 * de Ionic. Utilizado por `Tab1Page`.
 *
 * @author @ionic-ui-animator (Fase 5B)
 * @author @quality-security-auditor (Fase 6 — auditoría de comentarios)
 * @phase SDD Fase 5B — Desarrollo de componentes y navegación
 */

// Decorador de componente y función `input` basada en signals de Angular.
import { Component, input } from '@angular/core';

/**
 * Contenedor visual centrado para secciones informativas.
 */
@Component({
  // Selector HTML usado en las plantillas consumidoras.
  selector: 'app-explore-container',
  // Plantilla HTML del bloque centrado.
  templateUrl: './explore-container.component.html',
  // Hoja de estilos encapsulada del componente.
  styleUrls: ['./explore-container.component.scss'],
  // Declarado dentro de `ExploreContainerComponentModule` (patrón NgModule).
  standalone: false,
})
export class ExploreContainerComponent {
  /**
   * Título opcional mostrado como encabezado destacado dentro del contenedor.
   */
  readonly name = input<string>();
}
