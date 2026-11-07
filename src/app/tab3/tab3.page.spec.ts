/**
 * Pruebas unitarias de `Tab3Page` (Cuenta y cierre de sesión).
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

import { Tab3PageModule } from './tab3.module';
import { Tab3Page } from './tab3.page';
import { JwtAuthenticationService } from '../services/auth-jwt.service';
import type { AuthenticatedSession } from '../models/auth.model';

describe('Tab3Page', () => {
  let component: Tab3Page;
  let fixture: ComponentFixture<Tab3Page>;
  let activeSessionSignal: ReturnType<typeof signal<AuthenticatedSession | null>>;
  let signOutSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    activeSessionSignal = signal<AuthenticatedSession | null>(null);
    signOutSpy = vi.fn().mockResolvedValue(undefined);

    const authenticationServiceMock = {
      activeSession: activeSessionSignal,
      maskedTokenPreview: computed(() => {
        const token = activeSessionSignal()?.accessToken;
        return token ? `${token.slice(0, 10)}…${token.slice(-4)}` : '';
      }),
      remainingSessionMinutes: computed(() => 55),
      signOutSession: signOutSpy,
    };

    await TestBed.configureTestingModule({
      imports: [Tab3PageModule, RouterModule.forRoot([])],
      providers: [{ provide: JwtAuthenticationService, useValue: authenticationServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Tab3Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe mostrar estado informativo cuando no existe sesión activa', () => {
    const statusElement = (fixture.nativeElement as HTMLElement).querySelector('[role="status"]');
    expect(statusElement?.textContent).toContain('No hay una sesión activa');
  });

  it('debe renderizar el perfil con el JWT enmascarado y delegar confirmSignOut()', () => {
    const rawToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payloadSecretoNoVisible.9876';
    activeSessionSignal.set({
      accessToken: rawToken,
      expiresAtTimestampMs: Date.now() + 3_300_000,
      userProfile: {
        id: 'u-1',
        fullName: 'Estudiante Demo',
        email: 'estudiante@example.com',
        role: 'student',
      },
    });
    fixture.detectChanges();

    const pageText = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(pageText).toContain('Estudiante Demo');
    expect(pageText).toContain('eyJhbGciOi…9876');
    expect(pageText).not.toContain('payloadSecretoNoVisible');

    component.confirmSignOut();
    expect(signOutSpy).toHaveBeenCalledTimes(1);
  });
});
