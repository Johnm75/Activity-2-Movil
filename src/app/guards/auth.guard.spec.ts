/**
 * @fileoverview Pruebas unitarias de `authGuard`, `guestGuard` y `sanitizeReturnUrl`.
 *
 * @description
 * Verifica la protección de rutas privadas (`/tabs/**`), la redirección de
 * invitados a `/login` y el bloqueo estricto de vectores de redirección abierta
 * (`//evil.com`, `https://evil.com`, `/tabs/..//evil`) en `returnUrl`.
 *
 * @author @quality-security-auditor (Fase 6)
 * @phase SDD Fase 6 — Calidad, Accesibilidad y Seguridad
 */

// Contenedor de inyección de pruebas de Angular.
import { TestBed } from '@angular/core/testing';

// Tipos y utilidades del router de Angular para evaluar guards funcionales.
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  convertToParamMap,
  provideRouter,
} from '@angular/router';

// Guards funcionales bajo prueba.
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';

// Servicio de autenticación simulado.
import { AuthJwtService } from '../services/auth-jwt.service';

// Utilidad de sanitización de URLs de retorno.
import { DEFAULT_RETURN_URL, sanitizeReturnUrl } from '../utils/return-url.util';

describe('authGuard, guestGuard y sanitizeReturnUrl', () => {
  // Doble de prueba para controlar el estado de autenticación.
  let authStub: { isAuthenticated: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authStub = {
      isAuthenticated: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthJwtService, useValue: authStub },
      ],
    });
  });

  it('authGuard debe permitir el paso cuando existe una sesión válida', async () => {
    authStub.isAuthenticated.mockResolvedValue(true);

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/tabs/tab2' } as RouterStateSnapshot)
    );

    expect(result).toBe(true);
  });

  it('authGuard debe redirigir a /login con returnUrl sanitizado cuando no hay sesión', async () => {
    authStub.isAuthenticated.mockResolvedValue(false);

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/tabs/tab3' } as RouterStateSnapshot)
    );

    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/login?returnUrl=%2Ftabs%2Ftab3');
  });

  it('guestGuard debe redirigir a un usuario autenticado al destino interno seguro y rechazar open redirects', async () => {
    authStub.isAuthenticated.mockResolvedValue(true);

    const maliciousRoute = {
      queryParamMap: convertToParamMap({ returnUrl: '//sitio-malicioso.example/phish' }),
    } as unknown as ActivatedRouteSnapshot;

    const result = await TestBed.runInInjectionContext(() =>
      guestGuard(maliciousRoute, { url: '/login' } as RouterStateSnapshot)
    );

    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe(DEFAULT_RETURN_URL);
  });

  it('sanitizeReturnUrl debe rechazar esquemas externos, traversal y URLs protocol-relative', () => {
    expect(sanitizeReturnUrl('/tabs/tab2')).toBe('/tabs/tab2');
    expect(sanitizeReturnUrl('https://evil.example/login')).toBe(DEFAULT_RETURN_URL);
    expect(sanitizeReturnUrl('//evil.example/tabs')).toBe(DEFAULT_RETURN_URL);
    expect(sanitizeReturnUrl('/tabs/../../login')).toBe(DEFAULT_RETURN_URL);
    expect(sanitizeReturnUrl('javascript:alert(1)')).toBe(DEFAULT_RETURN_URL);
  });
});
