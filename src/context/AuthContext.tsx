import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { Storage, INITIAL_USER, DEMO_USER } from '../lib/storage';
import { getXpRequiredForLevel, LEVEL_RANKS } from '../lib/gamification';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginAsDemo: () => void;
  signup: (email: string, name: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  addXp: (amount: number, reason?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
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
            setIsLoading(false);
            return;
          }
        } catch {
          // In case of offline network failure while holding a previously valid token
          const savedUser = Storage.getUser();
          if (savedUser && savedUser.id !== 'usr_init_1') {
            setUser(savedUser);
            setIsAuthenticated(true);
            setIsDemoMode(false);
            setIsLoading(false);
            return;
          }
        }
      }

      // No valid token and not demo mode -> Unauthenticated
      setUser(null);
      setIsAuthenticated(false);
      setIsDemoMode(false);
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
          return true;
        }
      }

      // Explicit authentication failure - Never auto-authenticate
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
    localStorage.removeItem('lifeos_auth_token');
    localStorage.removeItem('lifeos_demo_mode');
    setIsAuthenticated(false);
    setIsDemoMode(false);
    setUser(null);
  };

  const updateUser = async (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      Storage.setUser(updated);
      return updated;
    });

    const token = localStorage.getItem('lifeos_auth_token');
    if (token) {
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

    // Server-Authoritative XP Ledger Call
    const token = localStorage.getItem('lifeos_auth_token');
    if (token) {
      try {
        const resp = await fetch('/api/gamification/award-xp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount, reason }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.user) {
            setUser(data.user);
            Storage.setUser(data.user);
            return;
          }
        }
      } catch {
        // fallback to local calculation
      }
    }

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

      try {
        if (typeof Storage.recordXpTransaction === 'function') {
          Storage.recordXpTransaction({
            amount,
            reason: reason || 'Activity completed',
            category: 'general',
            timestamp: new Date().toISOString(),
          });
        }
      } catch {
        // ignore
      }

      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        loginAsDemo,
        signup,
        logout,
        updateUser,
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

