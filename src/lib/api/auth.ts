import { apiFetch } from "./client";
import type {
  AuthSession,
  LoginInput,
  MessageResponse,
  RegisterInput,
  SafeUser,
  SuccessResponse,
} from "./types";

/**
 * Authentication endpoints. Refresh and logout are intentionally absent:
 * they require the refresh token, which only the Next.js BFF can read from
 * the HttpOnly cookie (added with the auth state).
 */
export const authApi = {
  register: (input: RegisterInput) =>
    apiFetch<AuthSession>("/auth/register", {
      method: "POST",
      body: input,
      auth: false,
    }),

  login: (input: LoginInput) =>
    apiFetch<AuthSession>("/auth/login", {
      method: "POST",
      body: input,
      auth: false,
    }),

  me: () => apiFetch<SafeUser>("/auth/me"),

  requestPasswordReset: (email: string) =>
    apiFetch<MessageResponse>("/auth/password-reset/request", {
      method: "POST",
      body: { email },
      auth: false,
    }),

  confirmPasswordReset: (input: { token: string; password: string }) =>
    apiFetch<SuccessResponse>("/auth/password-reset/confirm", {
      method: "POST",
      body: input,
      auth: false,
    }),

  verifyEmail: (token: string) =>
    apiFetch<SuccessResponse>("/auth/verify-email", {
      method: "POST",
      body: { token },
      auth: false,
    }),

  /**
   * Exchanges the one-time code the backend hands to /auth/oauth/callback
   * after a Google sign-in for a full token session (single-use, 2 min TTL).
   */
  googleExchange: (code: string) =>
    apiFetch<AuthSession>("/auth/google/exchange", {
      method: "POST",
      body: { code },
      auth: false,
    }),
};
