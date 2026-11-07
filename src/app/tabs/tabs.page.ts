/**
 * Contenedor de la barra inferior de navegación por pestañas.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { Component } from '@angular/core';
import { addIcons } from 'ionicons';
import { home, images, person } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
})
export class TabsPage {
  /**
   * Registra los iconos de las tres pestañas principales de la barra inferior.
   */
  constructor() {
    addIcons({ home, images, person });
  }
}
