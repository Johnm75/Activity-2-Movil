/**
 * Componente contenedor base conservado de la plantilla oficial Ionic `tabs`.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { Component, input } from '@angular/core';

@Component({
  selector: 'app-explore-container',
  templateUrl: './explore-container.component.html',
  styleUrls: ['./explore-container.component.scss'],
  standalone: false,
})
export class ExploreContainerComponent {
  readonly sectionTitle = input<string>('');
}
