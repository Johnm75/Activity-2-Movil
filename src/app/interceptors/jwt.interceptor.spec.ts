/**
 * Pruebas unitarias de `jwtAuthInterceptor`.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { jwtAuthInterceptor } from './jwt.interceptor';
import { JwtAuthenticationService } from '../services/auth-jwt.service';
import { environment } from '../../environments/environment';

describe('jwtAuthInterceptor', () => {
  let httpClient: HttpClient;
  let httpController: HttpTestingController;
  let authenticationStub: {
    getValidAccessToken: ReturnType<typeof vi.fn>;
    signOutSession: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authenticationStub = {
      getValidAccessToken: vi.fn().mockResolvedValue('jwt-seguro-demo'),
      signOutSession: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: JwtAuthenticationService, useValue: authenticationStub },
        provideHttpClient(withInterceptors([jwtAuthInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
    vi.restoreAllMocks();
  });

  it('debe adjuntar Authorization Bearer en peticiones dirigidas a environment.apiBaseUrl', async () => {
    const requestPromise = firstValueFrom(httpClient.get(`${environment.apiBaseUrl}/photos`));
    await Promise.resolve();

    const pendingRequest = httpController.expectOne(`${environment.apiBaseUrl}/photos`);
    expect(pendingRequest.request.headers.get('Authorization')).toBe('Bearer jwt-seguro-demo');
    pendingRequest.flush([]);

    await requestPromise;
  });

  it('NO debe adjuntar el token a dominios externos o rutas ajenas', async () => {
    const externalUrl = `${environment.apiBaseUrl}.evil.example.org/photos`;
    const siblingPathUrl = 'https://api.example.com/v10/photos';

    const firstCall = firstValueFrom(httpClient.get(externalUrl));
    const secondCall = firstValueFrom(httpClient.get(siblingPathUrl));

    const firstReq = httpController.expectOne(externalUrl);
    const secondReq = httpController.expectOne(siblingPathUrl);

    expect(firstReq.request.headers.has('Authorization')).toBe(false);
    expect(secondReq.request.headers.has('Authorization')).toBe(false);

    firstReq.flush({});
    secondReq.flush({});
    await Promise.all([firstCall, secondCall]);
  });

  it('debe cerrar sesión ante un 401 en recursos protegidos pero no en /auth/login', async () => {
    const loginCall = firstValueFrom(httpClient.post(`${environment.apiBaseUrl}/auth/login`, {}));
    await Promise.resolve();
    const loginReq = httpController.expectOne(`${environment.apiBaseUrl}/auth/login`);
    loginReq.flush({ error: 'invalid' }, { status: 401, statusText: 'Unauthorized' });
    await expect(loginCall).rejects.toBeTruthy();
    expect(authenticationStub.signOutSession).not.toHaveBeenCalled();

    const protectedCall = firstValueFrom(httpClient.get(`${environment.apiBaseUrl}/photos`));
    await Promise.resolve();
    const protectedReq = httpController.expectOne(`${environment.apiBaseUrl}/photos`);
    protectedReq.flush({ error: 'expired' }, { status: 401, statusText: 'Unauthorized' });
    await expect(protectedCall).rejects.toBeTruthy();
    expect(authenticationStub.signOutSession).toHaveBeenCalledTimes(1);
    expect(authenticationStub.signOutSession).toHaveBeenCalledWith({ navigateToLogin: true });
  });
});
