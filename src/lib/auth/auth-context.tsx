import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { UserResponse } from "@/api/model";
import { tokenStorage } from "./token-storage";
import { loginUser, getCurrentUserInfo, logoutUser, registerUser } from "@/api/auth/auth";

interface AuthContextValue {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Check if user has one of the given roles */
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(() => !!tokenStorage.getAccessToken());

  // Fetch current user from /auth/me
  const fetchUser = useCallback(async () => {
    try {
      const userData = await getCurrentUserInfo();
      setUser(userData);
    } catch {
      tokenStorage.clearTokens();
      setUser(null);
    }
  }, []);

  // On mount: if we have a token, try to load user
  useEffect(() => {
    if (tokenStorage.getAccessToken()) {
      fetchUser().finally(() => setIsLoading(false));
    }
  }, [fetchUser]);

  // Listen for forced logout (from axios 401 interceptor)
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
    };
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const tokens = await loginUser({ username, password });
      tokenStorage.setTokens(tokens.access_token, tokens.refresh_token);
      await fetchUser();
    },
    [fetchUser]
  );

  const register = useCallback(
    async (email: string, username: string, password: string) => {
      await registerUser({ email, username, password });
      // Auto-login after registration
      await login(username, password);
    },
    [login]
  );

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await logoutUser({ refresh_token: refreshToken });
      } catch {
        // Ignore logout API errors — we clear tokens anyway
      }
    }
    tokenStorage.clearTokens();
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (...roles: string[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      hasRole,
    }),
    [user, isLoading, login, register, logout, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
