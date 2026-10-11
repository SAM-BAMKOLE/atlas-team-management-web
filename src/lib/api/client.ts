import { networkError, toApiError } from "./errors";
import { API_BASE_URL } from "./config";
import {
  getAccessToken,
  notifySessionExpired,
  setAccessToken,
} from "./tokens";

export { API_BASE_URL };

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Send the bearer access token (default: true). */
  auth?: boolean;
  /** Internal flag preventing refresh/retry loops. */
  refreshAttempted?: boolean;
  signal?: AbortSignal;
}

/**
 * Rotates the refresh cookie through the Next.js BFF (`/api/auth/refresh`).
 * Single-flight: concurrent 401s share one rotation. Returns true only when
 * a usable access token is in hand afterwards.
 */
let refreshInFlight: Promise<boolean> | null = null;

export function refreshAuthSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
      .then(async (response) => {
        if (!response.ok) return false;
        const data = (await response.json().catch(() => null)) as {
          accessToken?: string;
        } | null;
        if (data?.accessToken) {
          setAccessToken(data.accessToken);
          return true;
        }
        return false;
      })
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  const text = await response.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Typed fetch for the Atlas API.
 *
 * - Prefixes the API base URL
 * - Attaches the bearer access token
 * - On a cold start (no access token), tries to mint one from the refresh
 *   cookie before sending the request
 * - On 401, refreshes once and retries the original request; if the refresh
 *   fails, clears the session and notifies the auth store
 * - Throws `ApiError` with the NestJS error payload normalized
 */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    auth = true,
    refreshAttempted = false,
    signal,
  } = options;

  if (auth && !refreshAttempted && !getAccessToken()) {
    // Page reload or first authenticated call: try the refresh cookie.
    await refreshAuthSession();
    return apiFetch<T>(path, { ...options, refreshAttempted: true });
  }

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const token = getAccessToken();
  if (auth && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    throw networkError();
  }

  if (response.status === 401 && auth && !refreshAttempted) {
    if (await refreshAuthSession()) {
      return apiFetch<T>(path, { ...options, refreshAttempted: true });
    }
    setAccessToken(null);
    notifySessionExpired();
    throw toApiError(401, await parseBody(response));
  }

  const payload = await parseBody(response);

  if (!response.ok) {
    throw toApiError(response.status, payload);
  }

  return payload as T;
}
