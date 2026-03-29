/**
 * HTTP client defaults
 *
 * All API requests should go through this client.
 * It attaches the current Bearer token when available and
 * unwraps the backend ApiResponse<T> shape without breaking raw JSON responses.
 */
import { useAppStore } from "../store";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

interface ApiResponseEnvelope<T> {
  status: number;
  message: string;
  data?: T;
}

type RequestOptions = Omit<RequestInit, "body"> & {
  auth?: boolean;
  body?: unknown;
};

function isApiResponseEnvelope<T>(
  value: unknown,
): value is ApiResponseEnvelope<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    typeof (value as { status?: unknown }).status === "number"
  );
}

function getAccessToken() {
  return useAppStore.getState().accessToken;
}

function buildHeaders(
  headers: HeadersInit | undefined,
  body: unknown,
  auth: boolean,
) {
  const requestHeaders = new Headers(headers);
  const accessToken = getAccessToken();

  if (auth && accessToken && !requestHeaders.has("Authorization")) {
    requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  if (
    body !== undefined &&
    !(body instanceof FormData) &&
    !requestHeaders.has("Content-Type")
  ) {
    requestHeaders.set("Content-Type", "application/json");
  }

  return requestHeaders;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();

  if (!text) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  return text;
}

function unwrapResponseData<T>(payload: unknown): T {
  if (isApiResponseEnvelope<T>(payload)) {
    return (
      Object.prototype.hasOwnProperty.call(payload, "data")
        ? payload.data
        : undefined
    ) as T;
  }

  return payload as T;
}

function extractErrorMessage(payload: unknown, response: Response) {
  const fallbackMessage = `HTTP ${response.status}: ${response.statusText}`;

  if (!payload) {
    return fallbackMessage;
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (typeof payload === "object" && payload !== null) {
    const message = (payload as Record<string, unknown>).message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }

    const nestedData = (payload as Record<string, unknown>).data;

    if (typeof nestedData === "object" && nestedData !== null) {
      const nestedMessage = (nestedData as Record<string, unknown>).message;

      if (typeof nestedMessage === "string" && nestedMessage.trim()) {
        return nestedMessage;
      }
    }
  }

  return fallbackMessage;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { auth = true, body, headers, ...rest } = options;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: buildHeaders(headers, body, auth),
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, response));
  }

  return unwrapResponseData<T>(payload);
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: "GET", ...options }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: "POST", body, ...options }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: "PUT", body, ...options }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { method: "PATCH", body, ...options }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: "DELETE", ...options }),
};
