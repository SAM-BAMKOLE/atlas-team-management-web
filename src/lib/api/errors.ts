/**
 * Normalizes NestJS error payloads (`{ statusCode, message, error }`) into
 * a single error type that pages and forms can render directly.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly messages: string[];

  constructor(status: number, messages: string[]) {
    super(messages.join(" ") || `Request failed (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.messages = messages;
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isConflict(): boolean {
    return this.status === 409;
  }

  get isThrottled(): boolean {
    return this.status === 429;
  }
}

const FALLBACK_MESSAGES: Record<number, string> = {
  0: "Unable to reach the server. Check that the API is running.",
  400: "The request was invalid.",
  401: "Your session has expired. Please sign in again.",
  403: "You do not have permission to do that.",
  404: "The requested resource was not found.",
  409: "That conflicts with existing data.",
  422: "The request was invalid.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on the server.",
};

export function toApiError(status: number, payload: unknown): ApiError {
  if (payload && typeof payload === "object") {
    const body = payload as { message?: unknown; error?: unknown };

    if (
      Array.isArray(body.message) &&
      body.message.length > 0 &&
      body.message.every((m) => typeof m === "string")
    ) {
      return new ApiError(status, body.message as string[]);
    }

    if (typeof body.message === "string" && body.message.length > 0) {
      return new ApiError(status, [body.message]);
    }

    if (typeof body.error === "string" && body.error.length > 0) {
      return new ApiError(status, [body.error]);
    }
  }

  const fallback =
    FALLBACK_MESSAGES[status] ?? `Request failed with status ${status}.`;
  return new ApiError(status, [fallback]);
}

export function networkError(): ApiError {
  return new ApiError(0, [FALLBACK_MESSAGES[0]]);
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** First human-readable message, for toasts and inline form errors. */
export function errorMessage(error: unknown): string {
  if (isApiError(error)) return error.messages[0];
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}
