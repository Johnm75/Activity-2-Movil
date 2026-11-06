/**
 * @fileoverview Configuración nativa del puente Capacitor para la aplicación photo-gallery.
 *
 * @description
 * Este archivo declara la identidad de la app (`appId`, `appName`), el directorio de salida
 * del build web (`webDir`) y opciones de servidor que afectan al runtime híbrido.
 * Se ejecuta tanto en la CLI de Capacitor (`npx cap sync`) como en runtime cuando la app
 * corre dentro del WebView nativo, por lo que no debe importar código Angular.
 *
 * @author @capacitor-architect (Fase 3 / Fase 5A)
 * @phase SDD Fase 3 — Arquitectura Capacitor
 * @phase SDD Fase 5A — Plugins Nativos y Almacenamiento
 */

// Importa el tipo de configuración oficial de Capacitor; usar `type` evita que el
// valor real se emita en el bundle de la app y mantiene el archivo seguro para runtime nativo.
import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Configuración principal del proyecto Capacitor.
 *
 * `appId` sigue la convención de dominio invertido requerida por Android/iOS.
 * `appName` es el nombre visible en el launcher del dispositivo.
 * `webDir` apunta a `www`, carpeta generada por `ionic build` / `ng build`.
 * `bundledWebRuntime` se mantiene en `false` porque usamos los paquetes npm de Capacitor.
 * `server.androidScheme` se fija en `https` para evitar avisos de contenido mixto
 * cuando se cargan recursos locales o se hacen peticiones a la API.
 */
const config: CapacitorConfig = {
  // Identificador único de la aplicación en Android e iOS.
  appId: 'com.example.photo.gallery',

  // Nombre legible que aparece bajo el icono en el dispositivo.
  appName: 'Galería de Fotos',

  // Carpeta que Capacitor copia al proyecto nativo durante `npx cap sync`.
  webDir: 'www',

  // No embebemos el runtime web de Capacitor; usamos la versión de npm.
  bundledWebRuntime: false,

  // Configuración del servidor embebido y del WebView.
  server: {
    // Esquema HTTPS en Android: imprescindible para peticiones fetch a API modernas
    // y para que `Capacitor.convertFileSrc` genere URLs seguras.
    androidScheme: 'https',
  },
};

// Exportación por defecto requerida por la CLI de Capacitor.
export default config;
