import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { getMeRequest, loginRequest, logoutRequest } from '../api/auth.api';
import { setLogoutHandler } from '../api/client';
import { AuthContext } from './AuthContext';
import type { AuthState } from '../types';

interface AuthProviderProps {
  children: ReactNode;
}

const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

export default function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // We still clear local auth state even if the server logout request fails.
    }

    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await loginRequest(username, password);

    setAuthState({
      user: result.user,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    setLogoutHandler(() => {
      void logout();
    });

    const loadSession = async () => {
      try {
        const user = await getMeRequest();

        if (!isMounted) {
          return;
        }

        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        if (!isMounted) {
          return;
        }

        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    void loadSession();

    return () => {
      isMounted = false;
      setLogoutHandler(() => {});
    };
  }, [logout]);

  return <AuthContext.Provider value={{ authState, login, logout }}>{children}</AuthContext.Provider>;
}
