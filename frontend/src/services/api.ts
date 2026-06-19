/**
 * Core HTTP client.
 * All API calls go through `api()` which handles auth headers,
 * 401 token clearing, and consistent error messages.
 */
import { clearToken, getToken } from "../store/auth";

function resolveApiUrl() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, "");
  }
  const hostname = window.location.hostname || "localhost";
  return `${window.location.protocol}//${hostname}:8000/api/v1`;
}

export const API_URL = resolveApiUrl();

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new Error(
      `Cannot reach the Hawkvision API at ${API_URL}. Check that the backend is running.`
    );
  }
  if (response.status === 401) {
    clearToken();
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(body.detail ?? "Request failed");
  }
  // 204 No Content — return undefined cast to T
  if (response.status === 204) {
    return undefined as unknown as T;
  }
  return response.json() as Promise<T>;
}

/**
 * Trigger a file download via a GET request with auth headers.
 * Throws a user-friendly Error on network or HTTP failures.
 */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const token = getToken();
  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { headers });
  } catch {
    throw new Error(
      `Cannot reach the Hawkvision API at ${API_URL}. Check that the backend is running.`
    );
  }
  if (!response.ok) {
    throw new Error(`Download failed (HTTP ${response.status}). Please try again.`);
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}
