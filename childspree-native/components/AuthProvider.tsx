import React, { createContext, useContext, useEffect, useState } from 'react';
import { getStoredUser, clearAuthToken, clearUser } from '../lib/auth';

export interface User {
  displayName: string;
  mail: string;
  role: 'fa' | 'admin' | 'unknown';
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  isLoading: true,
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  async function loadStoredUser() {
    try {
      const stored = await getStoredUser();
      if (stored) {
        setUser(stored);
      }
    } catch {
      // No stored user
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    await clearAuthToken();
    await clearUser();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
