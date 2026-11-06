/**
 * @fileoverview Componente contenedor de la navegación inferior por pestañas (`TabsPage`).
 *
 * @description
 * Aloja `<ion-tabs>` e `<ion-tab-bar>` registrando explícitamente los iconos
 * `home` (Inicio), `images` (Galería) y `person` (Cuenta) en el registro global
 * de Ionicons para garantizar su renderizado con tree-shaking activo.
 *
 * @author @ionic-ui-animator (Fase 4 / Fase 5B — Diseño y Navegación)
 * @phase SDD Fase 4 — Diseño Ionic y UX móvil nativa
 */

// Decorador de componente del núcleo de Angular.
import { Component } from '@angular/core';

// Registro explícito de iconos de Ionicons para compilaciones optimizadas.
import { addIcons } from 'ionicons';
import { home, images, person } from 'ionicons/icons';

/**
 * Componente raíz de la barra de pestañas (`TabsPageModule`).
 */
@Component({
  // Selector del layout de navegación por pestañas.
  selector: 'app-tabs',
  // Plantilla con `<ion-tabs>` y los tres botones inferiores.
  templateUrl: 'tabs.page.html',
  // Hoja de estilos del contenedor de pestañas.
  styleUrls: ['tabs.page.scss'],
  // Declarado dentro de `TabsPageModule`.
  standalone: false,
})
export class TabsPage {
  /**
   * Registra los iconos de las tres pestañas principales al crear el contenedor.
   */
  constructor() {
    addIcons({
      // Pestaña 1: resumen e inicio rápido.
      home,
      // Pestaña 2: cuadrícula y cámara de la galería.
      images,
      // Pestaña 3: perfil de sesión y cierre de sesión.
      person,
    });
  }
}
