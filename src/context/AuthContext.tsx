import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { Storage, INITIAL_USER, DEMO_USER } from '../lib/storage';
import { getXpRequiredForLevel, LEVEL_RANKS } from '../lib/gamification';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email?: string, password?: string) => Promise<boolean>;
  loginAsDemo: () => void;
  signup: (email: string, name: string, password?: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  addXp: (amount: number, reason?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate session on mount
  useEffect(() => {
    async function initAuth() {
      const token = localStorage.getItem('lifeos_auth_token');
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
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // fallback to local cache
        }
      }

      // Check local storage cache
      try {
        const savedUser = Storage.getUser();
        if (savedUser) {
          setUser(savedUser);
          setIsAuthenticated(true);
        } else {
          setUser(INITIAL_USER);
          Storage.setUser(INITIAL_USER);
          setIsAuthenticated(true);
        }
      } catch {
        setUser(INITIAL_USER);
        setIsAuthenticated(true);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email?: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (email && password) {
        const resp = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (resp.ok) {
          const data = await resp.json();
          if (data.token && data.user) {
            localStorage.setItem('lifeos_auth_token', data.token);
            setUser(data.user);
            Storage.setUser(data.user);
            setIsAuthenticated(true);
            return true;
          }
        }
      }

      // Fallback/Local login support
      let loggedUser = Storage.getUser();
      if (!loggedUser || (email && loggedUser.email !== email)) {
        loggedUser = {
          ...INITIAL_USER,
          email: email || 'alex@lifeos.internal',
          name: email ? email.split('@')[0] : 'Alex',
        };
      }
      Storage.setUser(loggedUser);
      setUser(loggedUser);
      setIsAuthenticated(true);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = () => {
    Storage.setUser(DEMO_USER);
    setUser(DEMO_USER);
    setIsAuthenticated(true);
  };

  const signup = async (email: string, name: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (email && password) {
        const resp = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, password }),
        });

        if (resp.ok) {
          const data = await resp.json();
          if (data.token && data.user) {
            localStorage.setItem('lifeos_auth_token', data.token);
            setUser(data.user);
            Storage.setUser(data.user);
            setIsAuthenticated(true);
            return true;
          }
        }
      }

      const newUser: UserProfile = {
        id: `usr_${Date.now()}`,
        email,
        name,
        title: 'Initiate Apprentice',
        level: 1,
        currentXp: 0,
        nextLevelXp: 400,
        streakDays: 0,
        createdAt: new Date().toISOString(),
        settings: {
          theme: 'dark',
          notificationsEnabled: true,
          aiInsightsEnabled: true,
          compactView: false,
        },
      };
      Storage.setUser(newUser);
      setUser(newUser);
      setIsAuthenticated(true);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('lifeos_auth_token');
    setIsAuthenticated(false);
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

