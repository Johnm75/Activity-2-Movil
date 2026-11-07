/**
 * Componente contenedor raíz de la aplicación.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {}
