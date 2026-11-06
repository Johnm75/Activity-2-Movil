/**
 * @fileoverview Anuncio de cambio de pantalla para lectores de pantalla.
 *
 * @description
 * El WebView no anuncia las navegaciones de una SPA. Estas funciones actualizan
 * `document.title` y mueven el foco al encabezado de la pantalla (WCAG 2.4.2
 * y 2.4.3) para que TalkBack y VoiceOver confirmen el destino. También
 * restauran el foco al control que abrió un diálogo nativo (cámara).
 *
 * @author @quality-security-auditor (Fase 6)
 * @phase SDD Fase 6 — Calidad, Accesibilidad y Seguridad
 */

/**
 * Publica el título de la pantalla y enfoca su encabezado.
 *
 * @param title Título del documento, visible en el conmutador de Android.
 * @param headingId `id` del `<h1>` de la pantalla (debe poder recibir foco).
 */
export function announceScreen(title: string, headingId: string): void {
  // El título del documento es el anuncio de respaldo del sistema operativo.
  document.title = title;

  // El encabezado debe existir en la vista ya renderizada.
  const heading = document.getElementById(headingId);
  if (!(heading instanceof HTMLElement)) {
    return;
  }

  // `tabindex="-1"` permite enfocar un encabezado que no es un control.
  if (!heading.hasAttribute('tabindex')) {
    heading.tabIndex = -1;
  }

  // Mover el foco hace que el lector anuncie el nombre de la pantalla.
  heading.focus();
}

/**
 * Devuelve el foco al control que disparó una UI nativa (cámara, alerta).
 *
 * Tras cerrarse el modal nativo el foco suele caer en `<body>` y el usuario
 * de teclado o switch pierde la posición.
 *
 * @param element Control que tenía el foco antes de la ida nativa.
 */
export function restoreFocus(element: HTMLElement | null): void {
  // Si el nodo ya no está en el documento, no hay nada que restaurar.
  if (!element || !element.isConnected) {
    return;
  }

  element.focus();
}
