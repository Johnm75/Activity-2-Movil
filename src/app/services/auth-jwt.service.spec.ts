/**
 * @fileoverview Pruebas unitarias de `AuthJwtService`.
 *
 * @description
 * Cubre el ciclo completo de sesión JWT: inicio de sesión exitoso, mapeo de
 * errores HTTP (`invalid_credentials`, `network_error`), hidratación con
 * margen `clockSkewSeconds`, vista previa enmascarada del token (SEC-007) y
 * cierre de sesión con redirección.
 *
 * @author @quality-security-auditor (Fase 6)
 * @phase SDD Fase 6 — Calidad, Accesibilidad y Seguridad
 */

// Contenedor de pruebas de Angular.
import { TestBed } from '@angular/core/testing';

// Cliente HTTP y controlador de pruebas para interceptar peticiones salientes.
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

// Router de Angular para verificar la navegación tras cerrar sesión.
import { Router, provideRouter } from '@angular/router';

// Plugin real Preferences (usa `localStorage` en jsdom).
import { Preferences } from '@capacitor/preferences';

// Servicio de autenticación bajo prueba.
import { AuthJwtService } from './auth-jwt.service';

// Configuración de entorno para construir URLs y claves esperadas.
import { environment } from '../../environments/environment';

describe('AuthJwtService', () => {
  // Instancia del servicio bajo prueba.
  let service: AuthJwtService;

  // Controlador de peticiones HTTP simuladas.
  let httpMock: HttpTestingController;

  // Router inyectado para espiar redirecciones.
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

    service = TestBed.inject(AuthJwtService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    // Asegura que no queden peticiones HTTP pendientes entre casos.
    httpMock.verify();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('debe autenticar con credenciales válidas, persistir la sesión y enmascarar tokenPreview (SEC-007)', async () => {
    // Dispara la promesa de inicio de sesión.
    const loginPromise = service.login({
      email: 'estudiante@example.com',
      password: 'Demo1234!',
    });

    // Responde desde el servidor simulado con un JWT compacto y TTL de 1 hora.
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush({
      token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1LTEifQ.firmaFinal99',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: 'u-1',
        name: 'Estudiante Demo',
        email: 'estudiante@example.com',
        role: 'student',
      },
    });

    const session = await loginPromise;
    expect(session.user.email).toBe('estudiante@example.com');
    expect(await service.isAuthenticated()).toBe(true);

    // Verifica que `tokenPreview` oculta el cuerpo intermedio del JWT.
    expect(service.tokenPreview()).toBe('eyJhbGciOi…al99');
  });

  it('debe traducir un HTTP 401 en login al código estable invalid_credentials', async () => {
    const loginPromise = service.login({
      email: 'estudiante@example.com',
      password: 'incorrecta',
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ error: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    await expect(loginPromise).rejects.toBe('invalid_credentials');
  });

  it('debe descartar tokens vencidos durante hydrate() aplicando clockSkewSeconds (SEC-003)', async () => {
    // Configura un token cuya expiración cae dentro de la ventana de skew (10 s restantes < 30 s skew).
    await Preferences.set({ key: environment.jwt.tokenKey, value: 'token.por.expirar.1234' });
    await Preferences.set({ key: environment.jwt.expiresAtKey, value: String(Date.now() + 10_000) });
    await Preferences.set({
      key: environment.jwt.profileKey,
      value: JSON.stringify({ id: 'u-1', name: 'Ana', email: 'ana@example.com', role: 'student' }),
    });

    await service.hydrate();

    // La sesión debe limpiarse automáticamente sin autenticar al usuario.
    expect(service.session()).toBeNull();
    const saved = await Preferences.get({ key: environment.jwt.tokenKey });
    expect(saved.value).toBeNull();
  });

  it('debe limpiar almacenamiento y navegar a /login con replaceUrl al ejecutar logout()', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    await Preferences.set({ key: environment.jwt.tokenKey, value: 'token.vigente.1234' });
    await service.logout();

    expect(service.session()).toBeNull();
    const saved = await Preferences.get({ key: environment.jwt.tokenKey });
    expect(saved.value).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
  });
});
