/** Thin fetch wrapper that injects the JWT and normalises errors. */
const TOKEN_KEY = 'dd_token';

/**
 * Base URL for the API. In dev this stays empty so calls hit `/api` and the
 * Vite proxy forwards to localhost. In production (Vercel) set VITE_API_URL to
 * the Render backend origin, e.g. https://dental-v3.onrender.com
 */
const API_BASE = ((import.meta as any).env?.VITE_API_URL ?? '').replace(/\/$/, '');

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/** True when a client-only demo session is active (set by the dev-mode login). */
function isDevSession(): boolean {
  return !!localStorage.getItem('dd_dev_user');
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  // Dev/demo mode: never hit the network. Resolve null so callers fall back to
  // their bundled demo data (they all read with `?? fallback`).
  if (isDevSession()) {
    return null as unknown as T;
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    throw new Error(data?.error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
};
