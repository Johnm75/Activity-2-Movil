/**
 * @fileoverview Guard funcional `authGuard` para rutas protegidas.
 *
 * @description
 * Protege el contenedor de pestañas (`/tabs/**`): solo permite la activación
 * de la ruta si `AuthJwtService.isAuthenticated()` confirma que existe un
 * token JWT vigente (con el margen de seguridad contra desfases de reloj).
 * Si no hay sesión, redirige a `/login` conservando la URL solicitada en el
 * query param `returnUrl` para restaurarla tras un login exitoso (REQ-016).
 *
 * Es un guard funcional (`CanActivateFn`), el patrón moderno de Angular: se
 * inyectan las dependencias con `inject()` en el momento de la evaluación,
 * sin necesidad de una clase `@Injectable`.
 *
 * @author @ionic-ui-animator (Fase 5B — Desarrollo UI)
 * @author @quality-security-auditor (Fase 6 — sanitización de returnUrl)
 * @phase SDD Fase 5B — Desarrollo de componentes y navegación
 * @phase SDD Fase 6 — Calidad, Accesibilidad y Seguridad
 */

// Núcleo de Angular: función `inject` para resolver dependencias dentro del
// contexto de inyección que el router crea al ejecutar el guard.
import { inject } from '@angular/core';

// Tipo del guard funcional y contrato del estado de navegación que devuelve
// (`true` para permitir, `UrlTree` para redirigir).
import { Router, type CanActivateFn } from '@angular/router';

// Servicio de autenticación: expone `isAuthenticated()`, que valida el token
// en memoria y su expiración, y limpia la sesión si está vencida (SEC-003).
import { AuthJwtService } from '../services/auth-jwt.service';

// Sanitiza el destino conservado para que solo pueda ser una ruta interna
// de pestañas (sin redirección abierta).
import { sanitizeReturnUrl } from '../utils/return-url.util';

/**
 * Guard de activación para rutas que requieren sesión activa.
 *
 * @param _route Snapshot de la ruta que se intenta activar (no se usa).
 * @param state Estado de navegación; su `url` se conserva como `returnUrl`.
 * @returns `true` si hay token vigente; si no, `UrlTree` hacia `/login`.
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  // Resuelve el servicio de autenticación en el contexto de inyección del guard.
  const auth = inject(AuthJwtService);

  // Resuelve el router para construir el árbol de redirección.
  const router = inject(Router);

  // Promesa de validación de sesión: comprueba token + expiración con el
  // margen `clockSkewSeconds`; si el token caducó, el servicio limpia el
  // almacenamiento antes de devolver `false`.
  const authenticated = await auth.isAuthenticated();

  if (authenticated) {
    // Sesión vigente: se permite activar la ruta protegida.
    return true;
  }

  // Sin sesión: redirige al login conservando un destino ya sanitizado.
  // `sanitizeReturnUrl` descarta esquemas, `//host` y secuencias `..` que
  // un simple `startsWith('/tabs')` dejaría pasar.
  const returnUrl = sanitizeReturnUrl(state.url);
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl },
  });
};
