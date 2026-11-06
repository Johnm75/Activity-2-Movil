/**
 * @fileoverview Página «Inicio» (`Tab1Page`).
 *
 * @description
 * Panel de bienvenida que orienta al estudiante sobre las capacidades nativas
 * de la aplicación (captura con `@capacitor/camera`, almacenamiento privado en
 * `Directory.Data` y sesión protegida con JWT) y ofrece botones directos hacia
 * la Galería y la Cuenta.
 *
 * @author @ionic-ui-animator (Fase 5B)
 * @author @quality-security-auditor (Fase 6 — accesibilidad y comentarios)
 * @phase SDD Fase 5B — Desarrollo de componentes y navegación
 */

// Decorador de componente del núcleo de Angular.
import { Component } from '@angular/core';

// Registro de iconos de Ionicons usados en las tarjetas y botones de inicio.
import { addIcons } from 'ionicons';
import {
  cameraOutline,
  imagesOutline,
  personCircleOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';

// Contrato de ciclo de vida Ionic al activarse la pestaña.
import type { ViewDidEnter } from '@ionic/angular';

// Utilidad accesible para anunciar la ruta activa a TalkBack y VoiceOver.
import { announceScreen } from '../utils/a11y-announce.util';

/**
 * Componente de la pestaña «Inicio».
 */
@Component({
  // Selector empleado por el router de pestañas.
  selector: 'app-tab1',
  // Plantilla HTML con tarjeta hero y botones de acción directa.
  templateUrl: 'tab1.page.html',
  // Hoja de estilos encapsulada de la pestaña de inicio.
  styleUrls: ['tab1.page.scss'],
  // Declarado en `Tab1PageModule`.
  standalone: false,
})
export class Tab1Page implements ViewDidEnter {
  /**
   * Registra los iconos decorativos utilizados en el panel de bienvenida.
   */
  constructor() {
    addIcons({
      cameraOutline,
      imagesOutline,
      personCircleOutline,
      shieldCheckmarkOutline,
    });
  }

  /**
   * Anuncia el cambio de pestaña a lectores de pantalla y traslada el foco al título.
   */
  ionViewDidEnter(): void {
    announceScreen('Inicio — Galería de Fotos', 'tab1-title');
  }
}
