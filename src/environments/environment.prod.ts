/**
 * Configuración de compilación productiva (`npm run build` y paquete nativo Android/iOS).
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */
export const environment = {
  production: true,
  apiBaseUrl: 'https://api.example.com/v1',
  // Habilitado para ejecución autónoma del APK en emulador o dispositivo sin servidor externo;
  // cambiar a `false` al conectar un backend productivo real.
  useMockApi: true,
  mockNetworkDelayMs: 300,
  demoAccountCredentials: {
    email: 'estudiante@example.com',
    password: 'Demo1234!',
  },
  jwtSession: {
    accessTokenKey: 'auth.jwt.token',
    expirationKey: 'auth.jwt.expiresAt',
    userProfileKey: 'auth.user.profile',
    clockSkewSeconds: 30,
    defaultTimeToLiveSeconds: 3600,
  },
  galleryStorage: {
    indexKey: 'gallery.index.v1',
    maxPhotosLimit: 500,
  },
};
