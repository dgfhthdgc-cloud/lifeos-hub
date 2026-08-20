import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { Storage, DEMO_USER } from '../lib/storage';
import { getXpRequiredForLevel, LEVEL_RANKS } from '../lib/gamification';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  isOffline: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginAsDemo: () => void;
  signup: (email: string, name: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  setAuthoritativeUser: (profile: UserProfile | null) => void;
  addXp: (amount: number, reason?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate session on mount
  useEffect(() => {
    async function initAuth() {
      const token = localStorage.getItem('lifeos_auth_token');
      const isDemo = localStorage.getItem('lifeos_demo_mode') === 'true';

      // Explicit Demo/Guest mode
      if (isDemo) {
        const savedDemo = Storage.getUser() || DEMO_USER;
        setUser(savedDemo);
        setIsAuthenticated(true);
        setIsDemoMode(true);
        setIsOffline(false);
        setIsLoading(false);
        return;
      }

      if (token) {
        try {
          const resp = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (resp.ok) {
            const data = await resp.json();
            if (data.user) {
              setUser(data.user);
              Storage.setUser(data.user);
              setIsAuthenticated(true);
              setIsDemoMode(false);
              setIsOffline(false);
              setIsLoading(false);
              return;
            }
          }

          // Invalid or expired token received from server
          if (resp.status === 401 || resp.status === 403) {
            localStorage.removeItem('lifeos_auth_token');
            setUser(null);
            setIsAuthenticated(false);
            setIsDemoMode(false);
            setIsOffline(false);
            setIsLoading(false);
            return;
          }
        } catch {
          // Server unreachable / network failure
          // Cached user info may be kept for offline inspection, but isAuthenticated MUST NOT be true based solely on cached data
          const savedUser = Storage.getUser();
          setUser(savedUser || null);
          setIsAuthenticated(false);
          setIsDemoMode(false);
          setIsOffline(true);
          setIsLoading(false);
          return;
        }
      }

      // No valid token and not demo mode -> Unauthenticated
      setUser(null);
      setIsAuthenticated(false);
      setIsDemoMode(false);
      setIsOffline(false);
      setIsLoading(false);
    }

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (!email || !password) return false;

      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.token && data.user) {
          localStorage.setItem('lifeos_auth_token', data.token);
          localStorage.removeItem('lifeos_demo_mode');
          setUser(data.user);
          Storage.setUser(data.user);
          setIsAuthenticated(true);
          setIsDemoMode(false);
          setIsOffline(false);
          return true;
        }
      }

      return false;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = () => {
    localStorage.setItem('lifeos_demo_mode', 'true');
    localStorage.removeItem('lifeos_auth_token');
    Storage.setUser(DEMO_USER);
    setUser(DEMO_USER);
    setIsAuthenticated(true);
    setIsDemoMode(true);
    setIsOffline(false);
  };

  const signup = async (email: string, name: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (!email || !password || password.length < 6) return false;

      const resp = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.token && data.user) {
          localStorage.setItem('lifeos_auth_token', data.token);
          localStorage.removeItem('lifeos_demo_mode');
          setUser(data.user);
          Storage.setUser(data.user);
          setIsAuthenticated(true);
          setIsDemoMode(false);
          setIsOffline(false);
          return true;
        }
      }

      return false;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    Storage.clearAllUserData();
    localStorage.removeItem('lifeos_auth_token');
    localStorage.removeItem('lifeos_demo_mode');
    setIsAuthenticated(false);
    setIsDemoMode(false);
    setIsOffline(false);
    setUser(null);
  };

  const setAuthoritativeUser = (profile: UserProfile | null) => {
    setUser(profile);
    if (profile) {
      Storage.setUser(profile);
    }
  };

  const updateUser = async (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      Storage.setUser(updated);
      return updated;
    });

    const token = localStorage.getItem('lifeos_auth_token');
    if (token && !isDemoMode) {
      try {
        await fetch('/api/auth/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        });
      } catch {
        // sync offline
      }
    }
  };

  const addXp = async (amount: number, reason?: string) => {
    if (amount <= 0) return;

    // In demo mode: local computation is legitimate for demonstration
    if (isDemoMode) {
      setUser((prev) => {
        if (!prev) return null;
        let newCurrentXp = prev.currentXp + amount;
        let newLevel = prev.level;
        let nextXp = prev.nextLevelXp;

        while (newCurrentXp >= nextXp) {
          newCurrentXp -= nextXp;
          newLevel += 1;
          nextXp = getXpRequiredForLevel(newLevel);
        }

        const matchedRank = [...LEVEL_RANKS].reverse().find((r) => newLevel >= r.level);
        const newTitle = matchedRank ? matchedRank.title : prev.title;

        const updated: UserProfile = {
          ...prev,
          currentXp: newCurrentXp,
          level: newLevel,
          nextLevelXp: nextXp,
          title: newTitle || prev.title,
        };

        Storage.setUser(updated);
        return updated;
      });
      return;
    }

    // In authenticated mode: XP is strictly server-authoritative.
    // Client-side arbitrary XP requests are forbidden. XP updates occur via server domain mutations.
    console.debug('Client-requested arbitrary XP ignored in authenticated mode; XP is strictly server-authoritative.');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isDemoMode,
        isOffline,
        isLoading,
        login,
        loginAsDemo,
        signup,
        logout,
        updateUser,
        setAuthoritativeUser,
        addXp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
