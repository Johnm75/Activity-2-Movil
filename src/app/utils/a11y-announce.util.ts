/**
 * Utilidades de gestión de foco y anuncio de rutas SPA para lectores de pantalla en WebView.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

/**
 * Actualiza el título del documento y traslada el foco al encabezado principal
 * porque las transiciones internas de una SPA no son anunciadas de oficio por TalkBack/VoiceOver.
 */
export function announcePageNavigation(pageTitle: string, headingElementId: string): void {
  document.title = pageTitle;

  const headingElement = document.getElementById(headingElementId);
  if (!(headingElement instanceof HTMLElement)) {
    return;
  }

  if (!headingElement.hasAttribute('tabindex')) {
    headingElement.tabIndex = -1;
  }

  headingElement.focus();
}

/**
 * Restaura el foco al control que abrió un diálogo nativo (como la cámara),
 * evitando que el cursor accesible quede perdido en `<body>` al regresar.
 */
export function restoreElementFocus(previousElement: HTMLElement | null): void {
  if (!previousElement || !previousElement.isConnected) {
    return;
  }

  previousElement.focus();
}
