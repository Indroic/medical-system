import { createContext, useContext, useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";

export interface AppUser {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  is_active: boolean;
}

interface AuthState {
  token: string | null;
  user: AppUser | null;
  isLoading: boolean;
  login: (token: string, user: AppUser) => void;
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
  const [user, setUser] = useState<AppUser | null>(null);
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

  const login = (newToken: string, newUser: AppUser) => {
    localStorage.setItem(STORAGE_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    // El estado local se limpia primero y de forma sincrónica: la UI no debe
    // quedarse en un limbo "autenticado" si la llamada de red falla.
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);

    // Invalidar también la sesión en el servidor. Sin esto la cookie de
    // Better-Auth seguía viva y bastaba recargar para volver a entrar.
    void authClient.signOut().catch(() => {
      // Sesión ya expirada o server inaccesible: la sesión local ya está limpia.
    });
  };

  return { token, user, isLoading, login, logout };
}
