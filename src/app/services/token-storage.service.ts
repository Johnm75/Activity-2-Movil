/**
 * Fachada de almacenamiento local sobre `@capacitor/preferences` exclusiva para la sesión JWT.
 * Separa las claves de autenticación del índice de fotografías para preservar la galería al cerrar sesión.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

import type { AuthenticatedUserProfile } from '../models/auth.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class JwtSessionStorageService {
  // Claves dedicadas a la sesión para no interferir con otros datos locales de la app.
  private readonly accessTokenKey = environment.jwtSession.accessTokenKey;
  private readonly expirationKey = environment.jwtSession.expirationKey;
  private readonly userProfileKey = environment.jwtSession.userProfileKey;

  /**
   * Lee el token JWT almacenado en preferencias del dispositivo, o `null` si no existe.
   */
  async getAccessToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: this.accessTokenKey });
    return value;
  }

  /**
   * Guarda el token de acceso JWT en el almacenamiento clave-valor nativo.
   */
  async saveAccessToken(accessToken: string): Promise<void> {
    await Preferences.set({ key: this.accessTokenKey, value: accessToken });
  }

  /**
   * Obtiene la marca de expiración en milisegundos y descarta valores no numéricos.
   */
  async getExpirationTimestamp(): Promise<number | null> {
    const { value } = await Preferences.get({ key: this.expirationKey });
    if (!value) {
      return null;
    }

    const parsedTimestamp = Number.parseInt(value, 10);
    return Number.isNaN(parsedTimestamp) ? null : parsedTimestamp;
  }

  /**
   * Persiste la fecha límite de validez del token serializada como texto.
   */
  async saveExpirationTimestamp(expirationTimestampMs: number): Promise<void> {
    await Preferences.set({
      key: this.expirationKey,
      value: String(expirationTimestampMs),
    });
  }

  /**
   * Recupera y deserializa el perfil del usuario autenticado desde preferencias.
   */
  async getAuthenticatedUserProfile(): Promise<AuthenticatedUserProfile | null> {
    const { value } = await Preferences.get({ key: this.userProfileKey });
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as AuthenticatedUserProfile;
    } catch {
      // Si el JSON almacenado se corrompe, se limpia la clave para forzar una sesión limpia.
      await Preferences.remove({ key: this.userProfileKey });
      return null;
    }
  }

  /**
   * Guarda los datos básicos del usuario autenticado en formato JSON.
   */
  async saveAuthenticatedUserProfile(userProfile: AuthenticatedUserProfile): Promise<void> {
    await Preferences.set({
      key: this.userProfileKey,
      value: JSON.stringify(userProfile),
    });
  }

  /**
   * Elimina únicamente las claves de sesión JWT sin tocar el índice local de fotos.
   */
  async clearStoredSession(): Promise<void> {
    await Promise.all([
      Preferences.remove({ key: this.accessTokenKey }),
      Preferences.remove({ key: this.expirationKey }),
      Preferences.remove({ key: this.userProfileKey }),
    ]);
  }
}
