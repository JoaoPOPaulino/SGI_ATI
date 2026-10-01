const API_URL = import.meta.env.DEV ? "http://localhost:3001/api" : "https://sgi-ati-lon5.onrender.com/api";

const TOKEN_KEY = "sgi.auth.token";
function readStoredToken(): string | null {
  try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
}
let authToken: string | null = readStoredToken();

export function setToken(token: string | null) {
  authToken = token;
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Navegadores com armazenamento bloqueado continuam funcionando em memória.
  }
}

export function getToken(): string | null {
  return authToken;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: { raw?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    ...(path === "/auth/me" ? { signal: AbortSignal.timeout(75000) } : {}),
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && authToken) {
    setToken(null);
    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
  }

  if (options.raw) return res as T;

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
