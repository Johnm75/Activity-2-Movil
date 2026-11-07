/**
 * Polyfill de `window.matchMedia` requerido por los Web Components de Ionic en pruebas con jsdom.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

if (!window.matchMedia) {
  window.matchMedia = (mediaQuery: string): MediaQueryList =>
    ({
      matches: false,
      media: mediaQuery,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
