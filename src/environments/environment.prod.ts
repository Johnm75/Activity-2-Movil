/**
 * Configuración de compilación productiva (`npm run build` y paquete nativo Android/iOS).
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */
export const environment = {
  production: true,
  // Origen base confiable contra el que el interceptor autoriza el envío del JWT.
  apiBaseUrl: 'https://api.example.com/v1',
  // Habilitado para ejecución autónoma del APK en emulador o dispositivo sin servidor externo;
  // cambiar a `false` al conectar un backend productivo real.
  useMockApi: true,
  mockNetworkDelayMs: 300,
  demoAccountCredentials: {
    email: 'estudiante@example.com',
    password: 'Demo1234!',
  },
  // Claves dedicadas a la sesión autenticada dentro de `@capacitor/preferences`.
  jwtSession: {
    accessTokenKey: 'auth.jwt.token',
    expirationKey: 'auth.jwt.expiresAt',
    userProfileKey: 'auth.user.profile',
    clockSkewSeconds: 30,
    defaultTimeToLiveSeconds: 3600,
  },
  // Configuración del índice JSON persistido para las fotografías locales.
  galleryStorage: {
    indexKey: 'gallery.index.v1',
    maxPhotosLimit: 500,
  },
};
