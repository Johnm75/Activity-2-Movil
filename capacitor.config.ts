/**
 * Configuración del puente nativo Capacitor para Android e iOS.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import type { CapacitorConfig } from '@capacitor/cli';

const capacitorConfig: CapacitorConfig = {
  appId: 'com.example.photo.gallery',
  appName: 'Galería de Fotos',
  webDir: 'www',
  bundledWebRuntime: false,
  server: {
    // Sirve el WebView sobre HTTPS local para evitar bloqueos de contenido mixto con APIs REST y archivos locales.
    androidScheme: 'https',
  },
};

export default capacitorConfig;
