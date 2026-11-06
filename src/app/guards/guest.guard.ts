/**
 * @fileoverview Guard funcional `guestGuard` para rutas de invitados.
 *
 * @description
 * Protege la ruta `/login`: si ya existe una sesión JWT vigente, no tiene
 * sentido mostrar el formulario de acceso, por lo que redirige a la galería
 * (`/tabs/tab2`) o al `returnUrl` pendiente. Es el complementario de
 * `authGuard` y evita el estado incoherente «usuario autenticado viendo la
 * pantalla de login» (REQ-016).
 *
 * Patrón funcional (`CanActivateFn`) coherente con el resto de guards del
 * proyecto y con la arquitectura standalone de la app.
 *
 * @author @ionic-ui-animator (Fase 5B — Desarrollo UI)
 * @author @quality-security-auditor (Fase 6 — sanitización de returnUrl)
 * @phase SDD Fase 5B — Desarrollo de componentes y navegación
 * @phase SDD Fase 6 — Calidad, Accesibilidad y Seguridad
 */

// Núcleo de Angular: `inject` resuelve dependencias dentro del guard.
import { inject } from '@angular/core';

// Router y tipo del guard funcional.
import { Router, type CanActivateFn } from '@angular/router';

// Servicio de autenticación consultado para saber si hay sesión activa.
import { AuthJwtService } from '../services/auth-jwt.service';

// Sanitiza `returnUrl` antes de `parseUrl` para impedir redirecciones abiertas.
import { sanitizeReturnUrl } from '../utils/return-url.util';

/**
 * Guard de activación para rutas exclusivas de invitados (login).
 *
 * @param route Snapshot de la ruta; se lee `returnUrl` de los query params.
 * @returns `true` si NO hay sesión (el invitado puede ver el login);
 *          `UrlTree` hacia las pestañas si el usuario ya está autenticado.
 */
export const guestGuard: CanActivateFn = async (route) => {
  // Resuelve las dependencias en el contexto de inyección del router.
  const auth = inject(AuthJwtService);
  const router = inject(Router);

  // Promesa de validación de sesión (token vigente + expiración + skew).
  const authenticated = await auth.isAuthenticated();

  if (!authenticated) {
    // Sin sesión: el login es la pantalla correcta; se permite activarla.
    return true;
  }

  // Sesión activa: restaura solo un destino interno ya sanitizado. La query
  // es entrada del usuario, así que no se confía en el prefijo `/tabs`.
  const returnUrl = route.queryParamMap.get('returnUrl');
  const target = sanitizeReturnUrl(returnUrl);

  // `parseUrl` convierte la ruta segura en un `UrlTree`. El valor ya no puede
  // ser protocol-relative ni un esquema externo.
  return router.parseUrl(target);
};
