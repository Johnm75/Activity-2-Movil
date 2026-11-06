/**
 * @fileoverview Pruebas unitarias y de accesibilidad de `LoginPage`.
 *
 * @description
 * Comprueba la validación reactiva de correo/contraseña, la traducción de
 * códigos de error en un banner `role="alert"` y la sanitización del destino
 * `returnUrl` tras un inicio de sesión exitoso.
 *
 * @author @ionic-ui-animator (Fase 5B)
 * @author @quality-security-auditor (Fase 6 — pruebas de validación, error y seguridad)
 * @phase SDD Fase 6 — Calidad, Accesibilidad y Seguridad
 */

// Utilidades de pruebas de componentes de Angular.
import { ComponentFixture, TestBed } from '@angular/core/testing';

// Enrutador para verificar redirecciones post-login.
import { ActivatedRoute, Router, RouterModule, convertToParamMap } from '@angular/router';

// Módulo de feature de la pantalla de login.
import { LoginPageModule } from './login.module';

// Componente bajo prueba.
import { LoginPage } from './login.page';

// Servicio de autenticación simulado.
import { AuthJwtService } from '../services/auth-jwt.service';

describe('LoginPage', () => {
  // Instancia del componente bajo prueba.
  let component: LoginPage;

  // Fixture de prueba con acceso al DOM.
  let fixture: ComponentFixture<LoginPage>;

  // Doble del servicio de autenticación.
  let authStub: { login: ReturnType<typeof vi.fn> };

  // Espía sobre `Router.navigateByUrl`.
  let router: Router;

  beforeEach(async () => {
    authStub = {
      login: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginPageModule, RouterModule.forRoot([])],
      providers: [
        { provide: AuthJwtService, useValue: authStub },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ returnUrl: '//atacante.example/phish' }),
            },
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('no debe invocar AuthJwtService.login si el formulario es inválido y debe exponer mensajes en español', async () => {
    await component.onSubmit();

    expect(authStub.login).not.toHaveBeenCalled();
    expect(component.fieldError('email')).toContain('obligatorio');
    expect(component.fieldError('password')).toContain('obligatoria');
  });

  it('debe navegar a /tabs/tab2 descartando un returnUrl malicioso tras login exitoso', async () => {
    const navSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    authStub.login.mockResolvedValue({
      token: 'jwt',
      expiresAt: Date.now() + 60_000,
      user: { id: 'u-1', name: 'Demo', email: 'estudiante@example.com', role: 'student' },
    });

    component.form.setValue({
      email: 'estudiante@example.com',
      password: 'Demo1234!',
    });
    await component.onSubmit();

    expect(navSpy).toHaveBeenCalledWith('/tabs/tab2', { replaceUrl: true });
  });

  it('debe renderizar un banner accesible role="alert" cuando el login rechaza con invalid_credentials', async () => {
    authStub.login.mockRejectedValue('invalid_credentials');

    component.form.setValue({
      email: 'estudiante@example.com',
      password: 'Incorrecta1!',
    });
    await component.onSubmit();
    fixture.detectChanges();

    const alertEl = (fixture.nativeElement as HTMLElement).querySelector('.login-error[role="alert"]');
    expect(alertEl?.textContent).toContain('Correo o contraseña incorrectos');
  });

  it('debe autocompletar las credenciales de demostración al invocar fillDemoCredentials()', () => {
    component.fillDemoCredentials();

    expect(component.form.getRawValue()).toEqual(component.demoCredentials);
    expect(component.form.valid).toBe(true);
  });
});
