import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import i18next from "i18next";
import i18n from "@/lib/i18n";
import type { UserResponse } from "@/api/model";
import { tokenStorage } from "./token-storage";
import { loginUser, logoutUser, registerUser, googleAuth } from "@/api/auth/auth";
import { getCurrentUserInfo } from "@/api/users/users";

interface AuthContextValue {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, recaptchaToken?: string, recaptchaType?: "v2" | "v3") => Promise<void>;
  loginWithGoogle: (code: string) => Promise<void>;
  register: (email: string, username: string, password: string, displayName?: string, recaptchaToken?: string, loginRecaptchaToken?: string, recaptchaType?: "v2" | "v3", loginRecaptchaType?: "v2" | "v3") => Promise<void>;
  logout: () => Promise<void>;
  /** Re-fetch current user data (e.g. after avatar/profile update) */
  refetchUser: () => Promise<void>;
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchUser().finally(() => setIsLoading(false));
    }
  }, [fetchUser]);

  // Listen for forced logout (from axios interceptor)
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
    };
    const handleSessionExpired = () => {
      toast.error(i18next.t("session_expired"));
    };
    const handleDeactivated = () => {
      toast.error(i18next.t("account_deactivated"));
    };
    window.addEventListener("auth:logout", handleLogout);
    window.addEventListener("auth:session-expired", handleSessionExpired);
    window.addEventListener("auth:deactivated", handleDeactivated);
    return () => {
      window.removeEventListener("auth:logout", handleLogout);
      window.removeEventListener("auth:session-expired", handleSessionExpired);
      window.removeEventListener("auth:deactivated", handleDeactivated);
    };
  }, []);

  const login = useCallback(
    async (
      username: string,
      password: string,
      recaptchaToken?: string,
      recaptchaType: "v2" | "v3" = "v3",
    ) => {
      const headers: Record<string, string> = {};
      if (recaptchaToken) {
        headers["x-recaptcha-token"] = recaptchaToken;
        if (recaptchaType === "v2") headers["x-recaptcha-type"] = "v2";
      }
      const tokens = await loginUser(
        { username, password },
        // Merge headers rather than replacing — loginUser sets Content-Type: form-urlencoded
        // and customInstance spreads options on top, so we must nest under `headers` only.
        Object.keys(headers).length > 0 ? { headers } : undefined,
      );
      tokenStorage.setTokens(tokens.access_token, tokens.refresh_token);
      await fetchUser();
    },
    [fetchUser]
  );

  const loginWithGoogle = useCallback(
    async (code: string) => {
      const redirectUri = `${window.location.origin}`;
      const tokens = await googleAuth({ code, redirect_uri: redirectUri });
      tokenStorage.setTokens(tokens.access_token, tokens.refresh_token);
      await fetchUser();
    },
    [fetchUser]
  );

  const register = useCallback(
    async (
      email: string,
      username: string,
      password: string,
      displayName?: string,
      recaptchaToken?: string,
      loginRecaptchaToken?: string,
      recaptchaType: "v2" | "v3" = "v3",
      loginRecaptchaType: "v2" | "v3" = "v3",
    ) => {
      // Pass detected browser language so emails arrive in the right language immediately
      const detectedLang = i18n.language?.startsWith("ru") ? "ru" : "en";
      await registerUser({
        email,
        username,
        display_name: displayName || undefined,
        password,
        language: detectedLang,
        recaptcha_token: recaptchaToken || undefined,
        // recaptcha_type field exists on the backend schema (v2/v3 fallback)
        // but isn't yet in the generated TS types until next `gen:api` run.
        recaptcha_type: recaptchaType,
      } as Parameters<typeof registerUser>[0] & { recaptcha_type?: "v2" | "v3" });
      // Auto-login after registration — use a fresh recaptcha token
      await login(username, password, loginRecaptchaToken, loginRecaptchaType);
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
      loginWithGoogle,
      register,
      logout,
      refetchUser: fetchUser,
      hasRole,
    }),
    [user, isLoading, login, loginWithGoogle, register, logout, fetchUser, hasRole]
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
