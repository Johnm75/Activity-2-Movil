/**
 * @fileoverview Pruebas unitarias y de seguridad de `jwtInterceptor` e `isApiUrl`.
 *
 * @description
 * Comprueba que el token Bearer solo se adjunta a peticiones cuyo origen y
 * ruta pertenecen estrictamente a `environment.apiUrl` (impidiendo filtración
 * a dominios engañosos con el mismo prefijo) y que un 401 en recursos
 * protegidos dispara el cierre de sesión una única vez.
 *
 * @author @quality-security-auditor (Fase 6)
 * @phase SDD Fase 6 — Calidad, Accesibilidad y Seguridad
 */

// Contenedor de pruebas de Angular.
import { TestBed } from '@angular/core/testing';

// Cliente HTTP con soporte de interceptores funcionales y controlador de pruebas.
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

// Operador para consumir respuestas observables como promesas en los tests.
import { firstValueFrom } from 'rxjs';

// Interceptor funcional bajo prueba.
import { jwtInterceptor } from './jwt.interceptor';

// Servicio de autenticación simulado para controlar el token activo.
import { AuthJwtService } from '../services/auth-jwt.service';

// Entorno con la URL base configurada.
import { environment } from '../../environments/environment';

describe('jwtInterceptor', () => {
  // Cliente HTTP instrumentado con `jwtInterceptor`.
  let http: HttpClient;

  // Controlador para inspeccionar cabeceras enviadas.
  let httpMock: HttpTestingController;

  // Doble de prueba de `AuthJwtService`.
  let authStub: {
    getValidToken: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authStub = {
      getValidToken: vi.fn().mockResolvedValue('jwt-seguro-demo'),
      logout: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthJwtService, useValue: authStub },
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('debe inyectar Authorization Bearer en peticiones dirigidas a environment.apiUrl', async () => {
    const requestPromise = firstValueFrom(http.get(`${environment.apiUrl}/photos`));

    // Espera un microtask para que `from(authService.getValidToken())` emita el token.
    await Promise.resolve();

    const req = httpMock.expectOne(`${environment.apiUrl}/photos`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-seguro-demo');
    req.flush([]);

    await requestPromise;
  });

  it('NO debe filtrar el token a un host o path que solo comparta el prefijo de apiUrl (SEC-004)', async () => {
    const attackerUrl = `${environment.apiUrl}.evil.example.org/photos`;
    const siblingPathUrl = 'https://api.example.com/v10/photos';

    const p1 = firstValueFrom(http.get(attackerUrl));
    const p2 = firstValueFrom(http.get(siblingPathUrl));

    const req1 = httpMock.expectOne(attackerUrl);
    const req2 = httpMock.expectOne(siblingPathUrl);

    expect(req1.request.headers.has('Authorization')).toBe(false);
    expect(req2.request.headers.has('Authorization')).toBe(false);

    req1.flush({});
    req2.flush({});
    await Promise.all([p1, p2]);
  });

  it('debe cerrar sesión una sola vez ante un 401 de un endpoint protegido, pero no en /auth/login', async () => {
    // 1) Un 401 en `/auth/login` representa credenciales inválidas, no sesión caducada.
    const loginCall = firstValueFrom(http.post(`${environment.apiUrl}/auth/login`, {}));
    await Promise.resolve();
    const loginReq = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    loginReq.flush({ error: 'invalid' }, { status: 401, statusText: 'Unauthorized' });
    await expect(loginCall).rejects.toBeTruthy();
    expect(authStub.logout).not.toHaveBeenCalled();

    // 2) Un 401 en `/photos` sí debe invocar `logout({ redirect: true })`.
    const photosCall = firstValueFrom(http.get(`${environment.apiUrl}/photos`));
    await Promise.resolve();
    const photosReq = httpMock.expectOne(`${environment.apiUrl}/photos`);
    photosReq.flush({ error: 'expired' }, { status: 401, statusText: 'Unauthorized' });
    await expect(photosCall).rejects.toBeTruthy();
    expect(authStub.logout).toHaveBeenCalledTimes(1);
    expect(authStub.logout).toHaveBeenCalledWith({ redirect: true });
  });
});
