/**
 * Guarda funcional para `/login`: si ya existe una sesión JWT activa, redirige directamente a las pestañas.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';

import { JwtAuthenticationService } from '../services/auth-jwt.service';
import { sanitizePostLoginRedirectUrl } from '../utils/return-url.util';

/**
 * Impide reabrir `/login` con sesión vigente y envía al usuario hacia la ruta interna solicitada.
 */
export const unauthenticatedOnlyGuard: CanActivateFn = async (activatedRoute) => {
  const authenticationService = inject(JwtAuthenticationService);
  const router = inject(Router);

  const isSessionValid = await authenticationService.hasActiveSession();
  if (!isSessionValid) {
    return true;
  }

  const requestedReturnUrl = activatedRoute.queryParamMap.get('returnUrl');
  const safeTargetUrl = sanitizePostLoginRedirectUrl(requestedReturnUrl);
  return router.parseUrl(safeTargetUrl);
};
