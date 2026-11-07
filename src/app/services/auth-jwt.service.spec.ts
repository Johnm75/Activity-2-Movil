/**
 * Pruebas unitarias de `JwtAuthenticationService`.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { Preferences } from '@capacitor/preferences';

import { JwtAuthenticationService } from './auth-jwt.service';
import { environment } from '../../environments/environment';

describe('JwtAuthenticationService', () => {
  let authenticationService: JwtAuthenticationService;
  let httpController: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    window.localStorage.clear();
    await Preferences.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    authenticationService = TestBed.inject(JwtAuthenticationService);
    httpController = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpController.verify();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('debe autenticar credenciales válidas, persistir la sesión y enmascarar el token', async () => {
    const authPromise = authenticationService.authenticateWithCredentials({
      email: 'estudiante@example.com',
      password: 'Demo1234!',
    });

    const pendingRequest = httpController.expectOne(`${environment.apiBaseUrl}/auth/login`);
    expect(pendingRequest.request.method).toBe('POST');
    pendingRequest.flush({
      token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1LTEifQ.firmaFinal99',
      tokenType: 'Bearer',
      expiresInSeconds: 3600,
      user: {
        id: 'u-1',
        fullName: 'Estudiante Demo',
        email: 'estudiante@example.com',
        role: 'student',
      },
    });

    const session = await authPromise;
    expect(session.userProfile.email).toBe('estudiante@example.com');
    expect(await authenticationService.hasActiveSession()).toBe(true);
    expect(authenticationService.maskedTokenPreview()).toBe('eyJhbGciOi…al99');
  });

  it('debe mapear un HTTP 401 al código invalid_credentials', async () => {
    const authPromise = authenticationService.authenticateWithCredentials({
      email: 'estudiante@example.com',
      password: 'incorrecta',
    });

    const pendingRequest = httpController.expectOne(`${environment.apiBaseUrl}/auth/login`);
    pendingRequest.flush({ error: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    await expect(authPromise).rejects.toBe('invalid_credentials');
  });

  it('debe descartar tokens próximos a expirar durante restorePersistedSession()', async () => {
    await Preferences.set({
      key: environment.jwtSession.accessTokenKey,
      value: 'token.por.expirar.1234',
    });
    await Preferences.set({
      key: environment.jwtSession.expirationKey,
      value: String(Date.now() + 10_000),
    });
    await Preferences.set({
      key: environment.jwtSession.userProfileKey,
      value: JSON.stringify({
        id: 'u-1',
        fullName: 'Ana',
        email: 'ana@example.com',
        role: 'student',
      }),
    });

    await authenticationService.restorePersistedSession();

    expect(authenticationService.activeSession()).toBeNull();
    const storedToken = await Preferences.get({ key: environment.jwtSession.accessTokenKey });
    expect(storedToken.value).toBeNull();
  });

  it('debe limpiar la sesión y redirigir a /login al invocar signOutSession()', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await Preferences.set({
      key: environment.jwtSession.accessTokenKey,
      value: 'token.vigente.1234',
    });
    await authenticationService.signOutSession();

    expect(authenticationService.activeSession()).toBeNull();
    const storedToken = await Preferences.get({ key: environment.jwtSession.accessTokenKey });
    expect(storedToken.value).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
  });
});
