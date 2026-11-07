/**
 * Pruebas unitarias de `LoginPage`.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, RouterModule, convertToParamMap } from '@angular/router';

import { LoginPageModule } from './login.module';
import { LoginPage } from './login.page';
import { JwtAuthenticationService } from '../services/auth-jwt.service';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authenticationStub: { authenticateWithCredentials: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    authenticationStub = {
      authenticateWithCredentials: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginPageModule, RouterModule.forRoot([])],
      providers: [
        { provide: JwtAuthenticationService, useValue: authenticationStub },
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

  it('no debe enviar credenciales si el formulario es inválido y debe reportar mensajes de validación', async () => {
    await component.submitLoginForm();

    expect(authenticationStub.authenticateWithCredentials).not.toHaveBeenCalled();
    expect(component.getFieldValidationMessage('email')).toContain('obligatorio');
    expect(component.getFieldValidationMessage('password')).toContain('obligatoria');
  });

  it('debe redirigir a /tabs/tab2 descartando un returnUrl malicioso tras autenticar', async () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    authenticationStub.authenticateWithCredentials.mockResolvedValue({
      accessToken: 'jwt',
      expiresAtTimestampMs: Date.now() + 60_000,
      userProfile: {
        id: 'u-1',
        fullName: 'Demo',
        email: 'estudiante@example.com',
        role: 'student',
      },
    });

    component.credentialsForm.setValue({
      email: 'estudiante@example.com',
      password: 'Demo1234!',
    });
    await component.submitLoginForm();

    expect(navigateSpy).toHaveBeenCalledWith('/tabs/tab2', { replaceUrl: true });
  });

  it('debe mostrar alerta accesible role="alert" ante credenciales inválidas', async () => {
    authenticationStub.authenticateWithCredentials.mockRejectedValue('invalid_credentials');

    component.credentialsForm.setValue({
      email: 'estudiante@example.com',
      password: 'Incorrecta1!',
    });
    await component.submitLoginForm();
    fixture.detectChanges();

    const alertElement = (fixture.nativeElement as HTMLElement).querySelector(
      '.login-error[role="alert"]'
    );
    expect(alertElement?.textContent).toContain('Correo o contraseña incorrectos');
  });

  it('debe cargar las credenciales de demostración al invocar populateDemoCredentials()', () => {
    component.populateDemoCredentials();

    expect(component.credentialsForm.getRawValue()).toEqual(component.demoAccountCredentials);
    expect(component.credentialsForm.valid).toBe(true);
  });
});
