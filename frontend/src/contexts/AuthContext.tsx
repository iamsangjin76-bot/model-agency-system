import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  authAPI,
  getToken,
  clearToken,
  setToken,
  setRefreshToken,
  clearRefreshToken,
  getRefreshToken,
} from '../services/api';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  admin: User | null;  // alias for user (backward compatibility)
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (resource: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = getToken();
    if (!token) {
      // Also check if we have a refresh token to silently re-authenticate
      const rt = getRefreshToken();
      if (!rt) {
        setIsLoading(false);
        return;
      }
    }

    try {
      const userData = await authAPI.me();
      setUser(userData);
    } catch {
      clearToken();
      clearRefreshToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const result = await authAPI.login(username, password);
    setToken(result.access_token);
    if (result.refresh_token) {
      setRefreshToken(result.refresh_token);
    }
    const userData = await authAPI.me();
    setUser(userData);
  };

  const logout = () => {
    // Fire-and-forget: revoke server-side refresh tokens (R8).
    // Errors are silently swallowed so the client-side logout always succeeds.
    authAPI.logout().catch(() => undefined);
    clearToken();
    clearRefreshToken();
    setUser(null);
  };

  // Simple permission check — super_admin bypasses all checks
  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    if (user.role === 'admin' && resource !== 'admin') return true;
    if (user.role === 'manager' && ['read', 'update'].includes(action)) return true;
    if (user.role === 'viewer' && action === 'read') return true;
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        admin: user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
