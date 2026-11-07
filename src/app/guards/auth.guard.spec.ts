/**
 * Pruebas unitarias de `authenticatedRouteGuard`, `unauthenticatedOnlyGuard` y `sanitizePostLoginRedirectUrl`.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  convertToParamMap,
  provideRouter,
} from '@angular/router';

import { authenticatedRouteGuard } from './auth.guard';
import { unauthenticatedOnlyGuard } from './guest.guard';
import { JwtAuthenticationService } from '../services/auth-jwt.service';
import {
  DEFAULT_AUTHENTICATED_REDIRECT_URL,
  sanitizePostLoginRedirectUrl,
} from '../utils/return-url.util';

describe('Guardas de navegación JWT y sanitización de redirecciones', () => {
  let authenticationStub: { hasActiveSession: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authenticationStub = {
      hasActiveSession: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: JwtAuthenticationService, useValue: authenticationStub },
      ],
    });
  });

  it('authenticatedRouteGuard debe permitir el acceso cuando existe una sesión válida', async () => {
    authenticationStub.hasActiveSession.mockResolvedValue(true);

    const guardResult = await TestBed.runInInjectionContext(() =>
      authenticatedRouteGuard(
        {} as ActivatedRouteSnapshot,
        { url: '/tabs/tab2' } as RouterStateSnapshot
      )
    );

    expect(guardResult).toBe(true);
  });

  it('authenticatedRouteGuard debe redirigir a /login conservando el returnUrl sanitizado', async () => {
    authenticationStub.hasActiveSession.mockResolvedValue(false);

    const guardResult = await TestBed.runInInjectionContext(() =>
      authenticatedRouteGuard(
        {} as ActivatedRouteSnapshot,
        { url: '/tabs/tab3' } as RouterStateSnapshot
      )
    );

    expect(guardResult instanceof UrlTree).toBe(true);
    expect((guardResult as UrlTree).toString()).toBe('/login?returnUrl=%2Ftabs%2Ftab3');
  });

  it('unauthenticatedOnlyGuard debe redirigir sesiones activas al destino seguro bloqueando open redirects', async () => {
    authenticationStub.hasActiveSession.mockResolvedValue(true);

    const maliciousRoute = {
      queryParamMap: convertToParamMap({ returnUrl: '//sitio-malicioso.example/phish' }),
    } as unknown as ActivatedRouteSnapshot;

    const guardResult = await TestBed.runInInjectionContext(() =>
      unauthenticatedOnlyGuard(maliciousRoute, { url: '/login' } as RouterStateSnapshot)
    );

    expect(guardResult instanceof UrlTree).toBe(true);
    expect((guardResult as UrlTree).toString()).toBe(DEFAULT_AUTHENTICATED_REDIRECT_URL);
  });

  it('sanitizePostLoginRedirectUrl debe rechazar esquemas externos, traversal y URLs relativas al protocolo', () => {
    expect(sanitizePostLoginRedirectUrl('/tabs/tab2')).toBe('/tabs/tab2');
    expect(sanitizePostLoginRedirectUrl('https://evil.example/login')).toBe(
      DEFAULT_AUTHENTICATED_REDIRECT_URL
    );
    expect(sanitizePostLoginRedirectUrl('//evil.example/tabs')).toBe(
      DEFAULT_AUTHENTICATED_REDIRECT_URL
    );
    expect(sanitizePostLoginRedirectUrl('/tabs/../../login')).toBe(
      DEFAULT_AUTHENTICATED_REDIRECT_URL
    );
    expect(sanitizePostLoginRedirectUrl('javascript:alert(1)')).toBe(
      DEFAULT_AUTHENTICATED_REDIRECT_URL
    );
  });
});
