/**
 * Contratos de dominio para autenticación de usuarios y ciclo de vida del token JWT.
 *
 * @author John Fredy Marciales Morales
 * @date 2026-11-06
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthenticatedUserProfile {
  id: string;
  fullName: string;
  email: string;
  role: 'student';
}

export interface LoginApiResponse {
  token: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
  user: AuthenticatedUserProfile;
}

/**
 * Sesión normalizada en memoria; `expiresAtTimestampMs` usa milisegundos epoch
 * para comparaciones directas contra `Date.now()`.
 */
export interface AuthenticatedSession {
  accessToken: string;
  expiresAtTimestampMs: number;
  userProfile: AuthenticatedUserProfile;
}

export type AuthenticationErrorCode =
  | 'invalid_credentials'
  | 'network_error'
  | 'token_expired'
  | 'unexpected_error';
