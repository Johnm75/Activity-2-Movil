/**
 * Guarda funcional que restringe el acceso a `/tabs/**` exigiendo una sesión JWT vigente.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';

import { JwtAuthenticationService } from '../services/auth-jwt.service';
import { sanitizePostLoginRedirectUrl } from '../utils/return-url.util';

export const authenticatedRouteGuard: CanActivateFn = async (_route, routerState) => {
  const authenticationService = inject(JwtAuthenticationService);
  const router = inject(Router);

  const isSessionValid = await authenticationService.hasActiveSession();
  if (isSessionValid) {
    return true;
  }

  const safeReturnUrl = sanitizePostLoginRedirectUrl(routerState.url);
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: safeReturnUrl },
  });
};
