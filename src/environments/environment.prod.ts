/**
 * @fileoverview Configuración de entorno de empaquetado (`npm run build` / APK Android).
 *
 * @description
 * Define la URL HTTPS de la API y mantiene activo el interceptor simulado local
 * (`useMockApi: true`) mientras el proyecto opere en modalidad académica autónoma
 * sin servidor remoto desplegado (`REQ-014`), garantizando que el inicio de sesión
 * funcione tanto en `ionic serve` como dentro del APK nativo de Android.
 * Cuando se conecte un backend real, basta cambiar `useMockApi` a `false` y
 * apuntar `apiUrl` al dominio productivo.
 *
 * @author @capacitor-architect (Fase 3 / Fase 8)
 * @phase SDD Fase 8 — Release y Despliegue Nativo
 */

/**
 * Objeto de entorno utilizado en el bundle empaquetado hacia `www/` y Capacitor.
 */
export const environment = {
  // Marca de compilación optimizada de Angular.
  production: true,

  // Endpoint base sobre HTTPS verificado por `isApiUrl` en el interceptor JWT.
  apiUrl: 'https://api.example.com/v1',

  // Activa el backend simulado autónomo para que el APK funcione offline en sustentación.
  useMockApi: true,

  // Latencia breve simulada (ms) para mostrar el spinner accesible del botón de envío.
  mockDelayMs: 300,

  // Credenciales académicas de demostración validadas por `mockApiInterceptor`.
  demoCredentials: {
    email: 'estudiante@example.com',
    password: 'Demo1234!',
  },

  // Parámetros y claves de sesión JWT persistidos en `@capacitor/preferences`.
  jwt: {
    tokenKey: 'auth.jwt.token',
    expiresAtKey: 'auth.jwt.expiresAt',
    profileKey: 'auth.user.profile',
    clockSkewSeconds: 30,
    defaultTtlSeconds: 3600,
  },

  // Parámetros del índice local de fotografías en `@capacitor/preferences`.
  gallery: {
    indexKey: 'gallery.index.v1',
    maxItems: 500,
  },
};
