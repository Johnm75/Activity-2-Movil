/**
 * @fileoverview Modelos de dominio para autenticación JWT.
 *
 * @description
 * Define las interfaces y tipos de error usados por `AuthJwtService`,
 * `TokenStorageService` y el interceptor JWT. Mantener los modelos separados
 * facilita los tests y evita dependencias circulares entre servicios.
 *
 * @author @capacitor-architect (Fase 3)
 * @phase SDD Fase 3 — Arquitectura Capacitor
 */

/**
 * Credenciales enviadas en el cuerpo de `POST /auth/login`.
 *
 * No se persiste la contraseña en ningún momento (SEC-008).
 */
export interface LoginCredentials {
  // Correo electrónico del estudiante.
  email: string;

  // Contraseña en texto plano; solo vive durante la petición.
  password: string;
}

/**
 * Perfil mínimo del usuario devuelto por la API.
 *
 * No incluye datos sensibles ni credenciales.
 */
export interface UserProfile {
  // Identificador único del usuario.
  id: string;

  // Nombre completo o de visualización.
  name: string;

  // Correo electrónico del usuario.
  email: string;

  // Rol único del dominio académico (CON-005).
  role: 'student';
}

/**
 * Respuesta esperada del endpoint `POST /auth/login`.
 */
export interface LoginResponse {
  // Token JWT en formato compacto.
  token: string;

  // Tipo de token; siempre Bearer en este dominio.
  tokenType: 'Bearer';

  // Tiempo de vida en segundos.
  expiresIn: number;

  // Perfil del usuario autenticado.
  user: UserProfile;
}

/**
 * Sesión normalizada que vive en memoria como signal de Angular.
 *
 * `expiresAt` se almacena como epoch en milisegundos para comparaciones rápidas.
 */
export interface AuthSession {
  // Token JWT vigente.
  token: string;

  // Momento de expiración en milisegundos desde epoch.
  expiresAt: number;

  // Perfil del usuario autenticado.
  user: UserProfile;
}

/**
 * Códigos estables de error de autenticación.
 *
 * La UI traduce estos códigos a mensajes en español en un único mapa (GUD-005),
 * evitando dispersar literales de texto por los servicios.
 */
export type AuthErrorCode =
  | 'invalid_credentials'   // Credenciales incorrectas (401).
  | 'network_error'         // Fallo de red o servidor no disponible.
  | 'token_expired'         // Token vencido localmente.
  | 'unexpected_error';     // Cualquier otro error no clasificado.
