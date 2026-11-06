/**
 * @fileoverview Pruebas unitarias de `TokenStorageService`.
 *
 * @description
 * Valida la fachada tipada sobre `@capacitor/preferences` (cuya implementación
 * web `PreferencesWeb` persiste sobre `window.localStorage` en jsdom) para el
 * token JWT, la marca de expiración y el perfil del estudiante, incluyendo
 * recuperación ante JSON corrupto y preservación del índice de fotografías al
 * cerrar sesión.
 *
 * @author @quality-security-auditor (Fase 6)
 * @phase SDD Fase 6 — Calidad, Accesibilidad y Seguridad
 */

// Contenedor de inyección de pruebas de Angular.
import { TestBed } from '@angular/core/testing';

// Plugin real de preferencias de Capacitor (resuelve `PreferencesWeb` en entorno jsdom).
import { Preferences } from '@capacitor/preferences';

// Servicio de almacenamiento de sesión bajo prueba.
import { TokenStorageService } from './token-storage.service';

// Configuración de entorno para comprobar las claves exactas persistidas.
import { environment } from '../../environments/environment';

describe('TokenStorageService', () => {
  // Instancia del servicio resuelta desde TestBed.
  let service: TokenStorageService;

  beforeEach(async () => {
    // Limpia el almacenamiento web subyacente antes de cada caso de prueba.
    window.localStorage.clear();
    await Preferences.clear();

    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenStorageService);
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('debe persistir y recuperar el token JWT y su expiración numérica', async () => {
    // Escribe un token y una marca temporal epoch en milisegundos.
    await service.setToken('jwt.compact.token');
    await service.setExpiresAt(1_800_000_000_000);

    // Verifica que ambos valores se leen con el tipo esperado.
    expect(await service.getToken()).toBe('jwt.compact.token');
    expect(await service.getExpiresAt()).toBe(1_800_000_000_000);
  });

  it('debe devolver null y limpiar la clave si el JSON del perfil está corrupto (GUD-005)', async () => {
    // Inyecta un JSON truncado en la clave del perfil.
    await Preferences.set({ key: environment.jwt.profileKey, value: '{corrupt-json' });

    // Al leer, el servicio debe capturar el fallo, eliminar la clave dañada y devolver null.
    const profile = await service.getProfile();
    expect(profile).toBeNull();
    const raw = await Preferences.get({ key: environment.jwt.profileKey });
    expect(raw.value).toBeNull();
  });

  it('debe limpiar únicamente las claves de sesión en clearSession conservando la galería (AC-005)', async () => {
    // Prepara datos de sesión junto con el índice local de fotografías.
    await service.setToken('token-activo');
    await service.setExpiresAt(Date.now() + 60_000);
    await service.setProfile({
      id: 'u-1',
      name: 'Estudiante',
      email: 'estudiante@example.com',
      role: 'student',
    });
    await Preferences.set({
      key: environment.gallery.indexKey,
      value: '{"schemaVersion":1,"items":[]}',
    });

    // Ejecuta la limpieza de sesión.
    await service.clearSession();

    // Verifica que el token desaparece pero el índice de fotografías permanece intacto.
    expect(await service.getToken()).toBeNull();
    expect(await service.getExpiresAt()).toBeNull();
    expect(await service.getProfile()).toBeNull();
    const gallerySaved = await Preferences.get({ key: environment.gallery.indexKey });
    expect(gallerySaved.value).toBe('{"schemaVersion":1,"items":[]}');
  });
});
