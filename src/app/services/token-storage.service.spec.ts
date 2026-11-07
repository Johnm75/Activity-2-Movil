/**
 * Pruebas unitarias de `JwtSessionStorageService`.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { TestBed } from '@angular/core/testing';
import { Preferences } from '@capacitor/preferences';

import { JwtSessionStorageService } from './token-storage.service';
import { environment } from '../../environments/environment';

describe('JwtSessionStorageService', () => {
  let sessionStorageService: JwtSessionStorageService;

  beforeEach(async () => {
    window.localStorage.clear();
    await Preferences.clear();

    TestBed.configureTestingModule({});
    sessionStorageService = TestBed.inject(JwtSessionStorageService);
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('debe persistir y recuperar el token de acceso y su marca de expiración', async () => {
    await sessionStorageService.saveAccessToken('jwt.compact.token');
    await sessionStorageService.saveExpirationTimestamp(1_800_000_000_000);

    expect(await sessionStorageService.getAccessToken()).toBe('jwt.compact.token');
    expect(await sessionStorageService.getExpirationTimestamp()).toBe(1_800_000_000_000);
  });

  it('debe limpiar la clave del perfil y devolver null si el JSON almacenado está dañado', async () => {
    await Preferences.set({
      key: environment.jwtSession.userProfileKey,
      value: '{corrupt-json',
    });

    expect(await sessionStorageService.getAuthenticatedUserProfile()).toBeNull();
    const rawStoredProfile = await Preferences.get({
      key: environment.jwtSession.userProfileKey,
    });
    expect(rawStoredProfile.value).toBeNull();
  });

  it('debe borrar solo las claves de sesión al cerrar sesión sin eliminar el índice de galería', async () => {
    await sessionStorageService.saveAccessToken('token-activo');
    await sessionStorageService.saveExpirationTimestamp(Date.now() + 60_000);
    await sessionStorageService.saveAuthenticatedUserProfile({
      id: 'u-1',
      fullName: 'Estudiante',
      email: 'estudiante@example.com',
      role: 'student',
    });
    await Preferences.set({
      key: environment.galleryStorage.indexKey,
      value: '{"schemaVersion":1,"items":[]}',
    });

    await sessionStorageService.clearStoredSession();

    expect(await sessionStorageService.getAccessToken()).toBeNull();
    expect(await sessionStorageService.getExpirationTimestamp()).toBeNull();
    expect(await sessionStorageService.getAuthenticatedUserProfile()).toBeNull();

    const persistedGallery = await Preferences.get({
      key: environment.galleryStorage.indexKey,
    });
    expect(persistedGallery.value).toBe('{"schemaVersion":1,"items":[]}');
  });
});
