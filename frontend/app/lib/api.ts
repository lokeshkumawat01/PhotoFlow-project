const API_BASE_URL = "http://127.0.0.1:8000";

const ACCESS_TOKEN_KEY = "photoflow_access_token";
const REFRESH_TOKEN_KEY = "photoflow_refresh_token";

export function saveTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}

export async function loginRequest(username: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Invalid username or password.");
  }
  saveTokens(data.access, data.refresh);
  return data;
}

export async function registerRequest(username: string, email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await response.json();
  if (!response.ok) {
    // DRF serializer errors come back as { field: ["message"] }
    const firstError = Object.values(data)[0];
    const message = Array.isArray(firstError) ? firstError[0] : "Could not create account.";
    throw new Error(message as string);
  }
  return data;
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const response = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    clearTokens();
    return null;
  }

  const data = await response.json();
  localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
  return data.access;
}

/**
 * Fetch wrapper that automatically attaches the JWT access token and
 * retries once with a refreshed token if the first attempt gets a 401.
 */
export async function authFetch(path: string, options: RequestInit = {}) {
  let token = getAccessToken();

  const doFetch = (accessToken: string | null) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });

  let response = await doFetch(token);

  if (response.status === 401) {
    token = await refreshAccessToken();
    if (token) {
      response = await doFetch(token);
    }
  }

  return response;
}

export { API_BASE_URL };