/**
 * @fileoverview Pruebas unitarias de `Tab3Page` (Cuenta).
 *
 * @description
 * Verifica la visualización segura del perfil activo (con token enmascarado,
 * nunca en texto plano completo — SEC-007), el estado defensivo sin sesión y
 * la delegación de `logout()` hacia `AuthJwtService`.
 *
 * @author @ionic-ui-animator (Fase 5B)
 * @author @quality-security-auditor (Fase 6 — pruebas de sesión y enmascaramiento)
 * @phase SDD Fase 6 — Calidad, Accesibilidad y Seguridad
 */

// Utilidades de pruebas de componentes y signals de Angular.
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';

// Enrutador mínimo para compilar la vista.
import { RouterModule } from '@angular/router';

// Módulo de feature de la pestaña «Cuenta».
import { Tab3PageModule } from './tab3.module';

// Componente bajo prueba.
import { Tab3Page } from './tab3.page';

// Servicio de autenticación simulado.
import { AuthJwtService } from '../services/auth-jwt.service';

// Modelo de sesión activa.
import type { AuthSession } from '../models/auth.model';

describe('Tab3Page', () => {
  // Instancia del componente bajo prueba.
  let component: Tab3Page;

  // Fixture con acceso al DOM.
  let fixture: ComponentFixture<Tab3Page>;

  // Signal controlable de sesión y espía de cierre de sesión.
  let sessionSignal: ReturnType<typeof signal<AuthSession | null>>;
  let logoutSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    sessionSignal = signal<AuthSession | null>(null);
    logoutSpy = vi.fn().mockResolvedValue(undefined);

    const authMock = {
      session: sessionSignal,
      tokenPreview: computed(() => {
        const token = sessionSignal()?.token;
        return token ? `${token.slice(0, 10)}…${token.slice(-4)}` : '';
      }),
      expiresInMinutes: computed(() => 55),
      logout: logoutSpy,
    };

    await TestBed.configureTestingModule({
      imports: [Tab3PageModule, RouterModule.forRoot([])],
      providers: [{ provide: AuthJwtService, useValue: authMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Tab3Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe mostrar el estado defensivo role="status" cuando no existe sesión activa', () => {
    const statusEl = (fixture.nativeElement as HTMLElement).querySelector('[role="status"]');
    expect(statusEl?.textContent).toContain('No hay una sesión activa');
  });

  it('debe mostrar el perfil y el token enmascarado sin exponer el JWT íntegro, y delegar logout()', () => {
    const rawToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payloadSecretoNoVisible.9876';
    sessionSignal.set({
      token: rawToken,
      expiresAt: Date.now() + 3_300_000,
      user: {
        id: 'u-1',
        name: 'Estudiante Demo',
        email: 'estudiante@example.com',
        role: 'student',
      },
    });
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Estudiante Demo');
    expect(text).toContain('eyJhbGciOi…9876');
    expect(text).not.toContain('payloadSecretoNoVisible');

    component.logout();
    expect(logoutSpy).toHaveBeenCalledTimes(1);
  });
});
