/**
 * @fileoverview Configuración de inicialización para pruebas unitarias en Vitest / jsdom.
 *
 * @description
 * Registra los polyfills mínimos del navegador que `jsdom` no provee de serie
 * pero que los componentes web de Ionic consultan al montarse (como
 * `window.matchMedia` para detectar modo oscuro o pantallas divididas).
 *
 * @author @quality-security-auditor (Fase 6)
 * @phase SDD Fase 6 — Calidad, Accesibilidad y Seguridad
 */

// Implementa un doble seguro de `window.matchMedia` cuando el entorno de pruebas carece de él.
if (!window.matchMedia) {
  // Devuelve un objeto `MediaQueryList` inerte compatible con las consultas CSS de Ionic.
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      // Por defecto ninguna media query coincide en el entorno sintético.
      matches: false,
      // Conserva la cadena de consulta recibida para inspección en pruebas.
      media: query,
      // Manejador de cambio legado sin efecto.
      onchange: null,
      // Métodos legados y modernos de suscripción a eventos de media query.
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      // Despacho sintético de eventos que devuelve `false` por defecto.
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
