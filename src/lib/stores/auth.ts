import { create } from "zustand";
import { authApi } from "@/lib/api/auth";
import { refreshAuthSession } from "@/lib/api/client";
import { setAccessToken, setSessionExpiredHandler } from "@/lib/api/tokens";
import type {
  AuthSession,
  LoginInput,
  RegisterInput,
  SafeUser,
} from "@/lib/api/types";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: SafeUser | null;
  status: AuthStatus;
  bootstrap: () => Promise<void>;
  signIn: (input: LoginInput) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signInWithGoogle: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearSession: () => void;
}

let bootstrapInFlight: Promise<void> | null = null;

/**
 * Hands the refresh token to the BFF (HttpOnly cookie) and keeps the access
 * token in memory. Throws when the cookie cannot be set so callers surface
 * the failure instead of half-opening a session.
 */
async function establishSession(session: AuthSession): Promise<void> {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });
  if (!response.ok) {
    throw new Error("Could not start your session. Please try again.");
  }
  setAccessToken(session.accessToken);
  useAuthStore.setState({ user: session.user, status: "authenticated" });
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "loading",

  /**
   * Restores the session from the refresh cookie. Runs once per page load;
   * concurrent callers share the same promise. Until the backend returns an
   * access token from refresh, a reload cannot restore the session and lands
   * on the login page.
   */
  bootstrap: () => {
    if (!bootstrapInFlight) {
      bootstrapInFlight = (async () => {
        try {
          if (await refreshAuthSession()) {
            const user = await authApi.me();
            set({ user, status: "authenticated" });
            return;
          }
        } catch {
          // Fall through to signed-out state.
        }
        setAccessToken(null);
        set({ user: null, status: "unauthenticated" });
      })();
    }
    return bootstrapInFlight;
  },

  signIn: async (input) => {
    const session = await authApi.login(input);
    await establishSession(session);
  },

  signUp: async (input) => {
    const session = await authApi.register(input);
    await establishSession(session);
  },

  signInWithGoogle: async (code) => {
    const session = await authApi.googleExchange(code);
    await establishSession(session);
  },

  signOut: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Local state is cleared regardless.
    }
    setAccessToken(null);
    set({ user: null, status: "unauthenticated" });
  },

  clearSession: () => {
    setAccessToken(null);
    set({ user: null, status: "unauthenticated" });
  },
}));

// The API client reports failed refreshes here (see tokens.ts).
setSessionExpiredHandler(() => {
  useAuthStore.getState().clearSession();
});
