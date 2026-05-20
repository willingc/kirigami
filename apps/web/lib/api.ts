import type { ApiResult } from "@/lib/types";

const DEFAULT_API_BASE_URL = "http://localhost:8000";
const DEFAULT_PUBLIC_API_BASE_URL = "";

export function apiBaseUrl() {
  return (
    process.env.KIRIGAMI_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    DEFAULT_API_BASE_URL
  ).replace(/\/$/, "");
}

export function clientApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_PUBLIC_API_BASE_URL).replace(
    /\/$/,
    "",
  );
}

export async function fetchApi<T>(path: string): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${clientApiBaseUrl()}${path}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      let error = `API request failed with ${response.status} ${response.statusText}`;
      try {
        const payload = (await response.json()) as { detail?: string };
        if (payload.detail) {
          error = payload.detail;
        }
      } catch {
        // Keep the status-based error when the API response is not JSON.
      }
      return {
        ok: false,
        error,
      };
    }

    return {
      ok: true,
      data: (await response.json()) as T,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "API request failed",
    };
  }
}
