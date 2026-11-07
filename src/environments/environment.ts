/**
 * Configuración del entorno de desarrollo: API REST, sesión JWT e índice local de fotografías.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */
export const environment = {
  production: false,
  // Origen base confiable contra el que se validan todas las peticiones con token Bearer.
  apiBaseUrl: 'https://api.example.com/v1',
  // Mantiene activo el interceptor simulado para probar login y consumo REST sin backend externo.
  useMockApi: true,
  mockNetworkDelayMs: 350,
  // Cuenta preconfigurada para pruebas rápidas durante desarrollo y evaluación académica.
  demoAccountCredentials: {
    email: 'estudiante@example.com',
    password: 'Demo1234!',
  },
  // Nombres de claves en `@capacitor/preferences` y parámetros de expiración JWT.
  jwtSession: {
    accessTokenKey: 'auth.jwt.token',
    expirationKey: 'auth.jwt.expiresAt',
    userProfileKey: 'auth.user.profile',
    // Margen preventivo (en segundos) para renovar o descartar tokens próximos a vencer.
    clockSkewSeconds: 30,
    defaultTimeToLiveSeconds: 3600,
  },
  // Índice estructurado de metadatos que apunta a los binarios en `Directory.Data`.
  galleryStorage: {
    indexKey: 'gallery.index.v1',
    maxPhotosLimit: 500,
  },
};
