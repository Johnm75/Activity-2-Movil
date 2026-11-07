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
  private readonly accessTokenKey = environment.jwtSession.accessTokenKey;
  private readonly expirationKey = environment.jwtSession.expirationKey;
  private readonly userProfileKey = environment.jwtSession.userProfileKey;

  async getAccessToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: this.accessTokenKey });
    return value;
  }

  async saveAccessToken(accessToken: string): Promise<void> {
    await Preferences.set({ key: this.accessTokenKey, value: accessToken });
  }

  async getExpirationTimestamp(): Promise<number | null> {
    const { value } = await Preferences.get({ key: this.expirationKey });
    if (!value) {
      return null;
    }

    const parsedTimestamp = Number.parseInt(value, 10);
    return Number.isNaN(parsedTimestamp) ? null : parsedTimestamp;
  }

  async saveExpirationTimestamp(expirationTimestampMs: number): Promise<void> {
    await Preferences.set({
      key: this.expirationKey,
      value: String(expirationTimestampMs),
    });
  }

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

  async saveAuthenticatedUserProfile(userProfile: AuthenticatedUserProfile): Promise<void> {
    await Preferences.set({
      key: this.userProfileKey,
      value: JSON.stringify(userProfile),
    });
  }

  async clearStoredSession(): Promise<void> {
    await Promise.all([
      Preferences.remove({ key: this.accessTokenKey }),
      Preferences.remove({ key: this.expirationKey }),
      Preferences.remove({ key: this.userProfileKey }),
    ]);
  }
}
