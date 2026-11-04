import type { TokenPair } from "@/lib/api/types";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveSession,
} from "@/lib/auth/session";
import { SESSION_EXPIRED_EVENT } from "@/lib/auth/cookies";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"
).replace(/\/+$/, "");
const API_PREFIX = "/api/v1";

const NETWORK_ERROR_MESSAGE =
  "We could not reach the server. Check your connection and try again.";
const FALLBACK_ERROR_MESSAGE = "Something went wrong. Please try again.";

export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type ApiRequestOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: HeadersInit;
  /**
   * Attach the access token and retry once through the refresh token on a 401.
   * Defaults to `true`; auth endpoints opt out so a failed login cannot recurse.
   */
  auth?: boolean;
};

let refreshInFlight: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  // Concurrent 401s share one refresh request.
  refreshInFlight ??= (async () => {
    try {
      const tokens = await send<TokenPair>("/auth/refresh", {
        method: "POST",
        body: { refresh_token: refreshToken },
        auth: false,
      });
      saveSession(tokens);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

function serializeBody(body: unknown): BodyInit | undefined {
  if (body === undefined) return undefined;
  if (typeof FormData !== "undefined" && body instanceof FormData) return body;
  if (typeof body === "string") return body;
  return JSON.stringify(body);
}

async function parseError(response: Response): Promise<ApiError> {
  let detail: unknown;

  try {
    const payload = (await response.json()) as { detail?: unknown };
    detail = payload?.detail;
  } catch {
    // Non-JSON error body; fall back to the generic message.
  }

  let message = FALLBACK_ERROR_MESSAGE;

  if (typeof detail === "string") {
    message = detail;
  } else if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: unknown };
    if (typeof first?.msg === "string") {
      message = first.msg.replace(/^Value error, /, "");
    }
  } else if (
    detail &&
    typeof detail === "object" &&
    typeof (detail as { message?: unknown }).message === "string"
  ) {
    message = (detail as { message: string }).message;
  }

  return new ApiError(message, response.status, detail);
}

async function sendResponse(
  path: string,
  { body, headers, auth = true, ...init }: ApiRequestOptions,
): Promise<Response> {
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  if (body !== undefined && !isFormData) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const accessToken = auth ? getAccessToken() : null;
  if (accessToken) {
    requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
      ...init,
      headers: requestHeaders,
      body: serializeBody(body),
    });
  } catch {
    throw new ApiError(NETWORK_ERROR_MESSAGE, 0);
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  return response;
}

async function send<T>(
  path: string,
  options: ApiRequestOptions,
): Promise<T> {
  const response = await sendResponse(path, options);

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

function expireSession() {
  clearSession();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
}

/**
 * Fetch wrapper used for every backend call.
 *
 * - adds the bearer access token,
 * - on `401` refreshes the session once (single-flight) and retries the request,
 * - clears the session and emits `SESSION_EXPIRED_EVENT` when refreshing fails,
 * - throws `ApiError` with FastAPI's `detail` message for non-2xx responses.
 */
async function requestWithAuth(
  path: string,
  options: ApiRequestOptions,
): Promise<Response> {
  const auth = options.auth ?? true;

  try {
    return await sendResponse(path, options);
  } catch (error) {
    const canRefresh = auth && error instanceof ApiError && error.status === 401;

    if (!canRefresh || !getRefreshToken()) {
      throw error;
    }

    const refreshed = await refreshTokens();

    if (!refreshed) {
      expireSession();
      throw error;
    }

    return sendResponse(path, options);
  }
}

export async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await requestWithAuth(path, options);

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Download a binary response (for example a CSV export) with auth handling. */
export async function apiDownload(
  path: string,
  options: ApiRequestOptions = {},
): Promise<Blob> {
  const response = await requestWithAuth(path, options);
  return response.blob();
}
