/**
 * Authentication API service.
 *
 * Handles token storage, the request helper with silent refresh interceptor,
 * and all auth/admin API calls.
 */

const API_BASE_URL = '/api';

// ---------------------------------------------------------------------------
// Token storage
// ---------------------------------------------------------------------------

let accessToken: string | null = localStorage.getItem('access_token');
let refreshToken: string | null = localStorage.getItem('refresh_token');

/** Single in-flight refresh promise to prevent concurrent refresh storms (R13). */
let refreshPromise: Promise<boolean> | null = null;

export const setToken = (token: string): void => {
  accessToken = token;
  localStorage.setItem('access_token', token);
};

export const clearToken = (): void => {
  accessToken = null;
  localStorage.removeItem('access_token');
};

export const getToken = (): string | null => accessToken;

export const setRefreshToken = (token: string): void => {
  refreshToken = token;
  localStorage.setItem('refresh_token', token);
};

export const clearRefreshToken = (): void => {
  refreshToken = null;
  localStorage.removeItem('refresh_token');
};

export const getRefreshToken = (): string | null => refreshToken;

// ---------------------------------------------------------------------------
// Silent refresh
// ---------------------------------------------------------------------------

/**
 * Attempt a silent token refresh using the stored refresh token.
 * Returns true on success, false if refresh is not possible or fails.
 * A single shared promise prevents concurrent refresh storms.
 */
async function attemptRefresh(): Promise<boolean> {
  if (!refreshToken) return false;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) return false;
      const data = await response.json();
      setToken(data.access_token);
      setRefreshToken(data.refresh_token);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ---------------------------------------------------------------------------
// Core request helper
// ---------------------------------------------------------------------------

/**
 * Typed HTTP helper with Authorization header injection and 401 → silent
 * refresh → retry flow (R12).
 */
export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

  if (response.status === 401) {
    // Attempt silent refresh (R12)
    const refreshed = await attemptRefresh();
    if (refreshed) {
      // Retry original request with new access token
      const retryHeaders = { ...headers, Authorization: `Bearer ${accessToken}` };
      const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: retryHeaders,
      });
      if (!retryResponse.ok) {
        if (retryResponse.status === 401) {
          clearToken();
          clearRefreshToken();
          window.location.href = '/login';
        }
        const error = await retryResponse.json().catch(() => ({ detail: '오류가 발생했습니다' }));
        throw new Error(error.detail || '요청 실패');
      }
      return retryResponse.json();
    } else {
      // Refresh failed — clear credentials and redirect (R12)
      clearToken();
      clearRefreshToken();
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: '오류가 발생했습니다' }));
    throw new Error(error.detail || '요청 실패');
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Admin interfaces
// ---------------------------------------------------------------------------

export interface Admin {
  id: number;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  permissions: Record<string, string[]>;
}

export interface AdminCreate {
  username: string;
  password: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  permissions?: string[];
}

export interface AdminUpdate {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  is_active?: boolean;
  permissions?: string[];
}

// ---------------------------------------------------------------------------
// Auth API namespace
// ---------------------------------------------------------------------------

export const authAPI = {
  login: (username: string, password: string) =>
    request<{ access_token: string; token_type: string; refresh_token?: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ username, password }) },
    ),

  me: () =>
    request<{ id: number; username: string; name: string; role: string }>('/auth/me'),

  initSuperAdmin: (username: string, password: string, name: string) =>
    request('/auth/init-super-admin', {
      method: 'POST',
      body: JSON.stringify({ username, password, name }),
    }),

  listAdmins: () => request<Admin[]>('/auth/admins'),

  registerAdmin: (data: AdminCreate) =>
    request<Admin>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  updateAdmin: (id: number, data: AdminUpdate) =>
    request<Admin>(`/auth/admins/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteAdmin: (id: number) =>
    request<{ message: string }>(`/auth/admins/${id}`, { method: 'DELETE' }),

  logout: () => request('/auth/logout', { method: 'POST' }),
};

// ---------------------------------------------------------------------------
// Refresh API namespace (thin — used internally and by AuthContext)
// ---------------------------------------------------------------------------

export const refreshAPI = {
  refresh: (token: string) =>
    request<{ access_token: string; token_type: string; refresh_token: string }>(
      '/auth/refresh',
      { method: 'POST', body: JSON.stringify({ refresh_token: token }) },
    ),

  logout: () => request('/auth/logout', { method: 'POST' }),
};
