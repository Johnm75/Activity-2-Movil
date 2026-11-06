/**
 * @fileoverview Fachada tipada sobre `@capacitor/preferences` para el dominio de autenticación.
 *
 * @description
 * Aísla las claves de almacenamiento del token JWT, su expiración y el perfil.
 * Permite sustituir el plugin por un doble de prueba sin tocar el resto de la app.
 * Nunca registra el token en consola (SEC-001).
 *
 * @author @capacitor-architect (Fase 3)
 * @phase SDD Fase 3 — Arquitectura Capacitor
 */

// Importa el plugin de preferencias de Capacitor para almacenamiento persistente.
import { Preferences } from '@capacitor/preferences';

// Importa el modelo de perfil tipado.
import type { UserProfile } from '../models/auth.model';

// Importa la configuración de entorno para leer las claves de storage.
import { environment } from '../../environments/environment';

/**
 * Servicio que encapsula todas las operaciones de almacenamiento de sesión.
 *
 * Se marca como injectable en `root` para que exista una única instancia en la app.
 */
import { Injectable } from '@angular/core';

@Injectable({
  // Proveedor singleton a nivel de aplicación.
  providedIn: 'root',
})
export class TokenStorageService {
  // Clave donde se persiste el token JWT.
  private readonly tokenKey = environment.jwt.tokenKey;

  // Clave donde se persiste la expiración en milisegundos.
  private readonly expiresAtKey = environment.jwt.expiresAtKey;

  // Clave donde se persiste el perfil del usuario en JSON.
  private readonly profileKey = environment.jwt.profileKey;

  /**
   * Lee el token JWT almacenado.
   *
   * @returns Token o `null` si no existe.
   */
  async getToken(): Promise<string | null> {
    // `Preferences.get` devuelve un objeto `{ value: string | null }`.
    const { value } = await Preferences.get({ key: this.tokenKey });
    return value;
  }

  /**
   * Persiste el token JWT.
   *
   * @param token Token en formato compacto.
   */
  async setToken(token: string): Promise<void> {
    // Escribe el valor como string en el almacenamiento nativo.
    await Preferences.set({ key: this.tokenKey, value: token });
  }

  /**
   * Lee y convierte la expiración almacenada.
   *
   * @returns Epoch en milisegundos o `null`.
   */
  async getExpiresAt(): Promise<number | null> {
    const { value } = await Preferences.get({ key: this.expiresAtKey });
    // Si no hay valor, la sesión no existe.
    if (!value) {
      return null;
    }
    // Convierte el string guardado a número entero.
    const parsed = parseInt(value, 10);
    // Si el valor es inválido, devuelve null para forzar reautenticación.
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Persiste la expiración como string.
   *
   * @param ms Epoch en milisegundos.
   */
  async setExpiresAt(ms: number): Promise<void> {
    await Preferences.set({ key: this.expiresAtKey, value: String(ms) });
  }

  /**
   * Lee y parsea el perfil del usuario.
   *
   * Si el JSON está corrupto, elimina la clave para evitar comportamientos extraños
   * y devuelve `null` (GUD-005).
   *
   * @returns Perfil o `null`.
   */
  async getProfile(): Promise<UserProfile | null> {
    const { value } = await Preferences.get({ key: this.profileKey });
    if (!value) {
      return null;
    }
    try {
      // Intenta deserializar el perfil almacenado.
      return JSON.parse(value) as UserProfile;
    } catch {
      // Si el JSON es inválido, limpia la clave corrupta.
      await Preferences.remove({ key: this.profileKey });
      return null;
    }
  }

  /**
   * Persiste el perfil del usuario como JSON.
   *
   * @param profile Perfil a serializar.
   */
  async setProfile(profile: UserProfile): Promise<void> {
    await Preferences.set({ key: this.profileKey, value: JSON.stringify(profile) });
  }

  /**
   * Elimina las tres claves de sesión sin borrar la galería local.
   *
   * Se usa en logout para preservar las fotografías del usuario (AC-005).
   */
  async clearSession(): Promise<void> {
    // Elimina cada clave de forma independiente; no se borra el índice de fotos.
    await Preferences.remove({ key: this.tokenKey });
    await Preferences.remove({ key: this.expiresAtKey });
    await Preferences.remove({ key: this.profileKey });
  }
}
