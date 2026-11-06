/**
 * @fileoverview Configuración de entorno de desarrollo para photo-gallery.
 *
 * @description
 * Contiene la URL base de la API, el flag para activar el mock sin backend,
 * las credenciales de demostración y las claves de almacenamiento local.
 * Este archivo se reemplaza por `environment.prod.ts` en builds de producción
 * mediante `fileReplacements` de `angular.json`.
 *
 * @author @capacitor-architect (Fase 3)
 * @phase SDD Fase 3 — Arquitectura Capacitor
 */

/**
 * Objeto de entorno de desarrollo.
 *
 * `useMockApi: true` permite la demo académica sin backend propio (REQ-014).
 * `mockDelayMs` simula latencia de red para que el skeleton sea visible.
 * `demoCredentials` son ficticias y solo válidas cuando el mock está activo.
 * `jwt` centraliza las claves y parámetros de expiración del token.
 * `gallery` define la clave del índice local y el límite máximo de fotos.
 */
export const environment = {
  // Indica que este no es un build de producción.
  production: false,

  // URL base de la API REST; usada por los servicios y por el interceptor JWT.
  apiUrl: 'https://api.example.com/v1',

  // Activa el backend simulado para login y catálogo remoto.
  useMockApi: true,

  // Retraso artificial de las respuestas mock en milisegundos.
  mockDelayMs: 400,

  // Credenciales de demostración; nunca deben usarse en producción.
  demoCredentials: {
    email: 'estudiante@example.com',
    password: 'Demo1234!',
  },

  // Configuración del token JWT y de las claves de Preferences.
  jwt: {
    // Clave donde se persiste el token JWT.
    tokenKey: 'auth.jwt.token',

    // Clave donde se persiste la marca de expiración (epoch en milisegundos).
    expiresAtKey: 'auth.jwt.expiresAt',

    // Clave donde se persiste el perfil del usuario serializado como JSON.
    profileKey: 'auth.user.profile',

    // Margen de seguridad contra desfases de reloj al validar expiración (segundos).
    clockSkewSeconds: 30,

    // TTL por defecto si la respuesta del servidor no incluye `expiresIn`.
    defaultTtlSeconds: 3600,
  },

  // Configuración de la galería local.
  gallery: {
    // Clave del índice de metadatos en Preferences.
    indexKey: 'gallery.index.v1',

    // Límite práctico de fotos antes de considerar migrar a index.json en Filesystem.
    maxItems: 500,
  },
};
