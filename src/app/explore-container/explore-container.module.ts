/**
 * Módulo de `ExploreContainerComponent`.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ExploreContainerComponent } from './explore-container.component';

// Declara y exporta el componente auxiliar heredado de la plantilla base `tabs`.
@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [ExploreContainerComponent],
  exports: [ExploreContainerComponent],
})
export class ExploreContainerComponentModule {}
