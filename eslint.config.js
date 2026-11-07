// @ts-check
/**
 * Reglas de análisis estático ESLint para TypeScript y plantillas HTML de Angular/Ionic.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = tseslint.config(
  {
    files: ["**/*.ts"],
    ignores: ["projects/**/*"],
    extends: [...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      // Permite conservar los módulos de página tradicionales de la plantilla `tabs` de Ionic.
      "@angular-eslint/prefer-standalone": "off",
      "@angular-eslint/component-class-suffix": [
        "error",
        { suffixes: ["Page", "Component"] },
      ],
      "@angular-eslint/component-selector": [
        "error",
        { type: "element", prefix: "app", style: "kebab-case" },
      ],
      "@angular-eslint/directive-selector": [
        "error",
        { type: "attribute", prefix: "app", style: "camelCase" },
      ],
    },
  },
  {
    // Revisión de sintaxis y accesibilidad sobre plantillas externas `.html`.
    files: ["**/*.html"],
    extends: [...angular.configs.templateRecommended],
    rules: {},
  }
);
