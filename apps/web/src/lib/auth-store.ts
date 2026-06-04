import { createContext, useContext, useEffect, useState } from "react";

import type { UserResponse } from "./python-api";

interface AuthState {
  token: string | null;
  user: UserResponse | null;
  isLoading: boolean;
  login: (token: string, user: UserResponse) => void;
  logout: () => void;
}

const STORAGE_KEY = "ms_token";
const USER_KEY = "ms_user";

export const AuthContext = createContext<AuthState>({
  token: null,
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export function useAuthStore() {
  return useContext(AuthContext);
}

export function useAuthState(): AuthState {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (stored) setToken(stored);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {}
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: UserResponse) => {
    localStorage.setItem(STORAGE_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  return { token, user, isLoading, login, logout };
}
