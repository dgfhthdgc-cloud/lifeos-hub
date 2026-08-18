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

  useEffect(() => {
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
  }, []);

  const login = async (email?: string, _password?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      let loggedUser = Storage.getUser();
      if (!loggedUser || (email && loggedUser.email !== email)) {
        loggedUser = {
          ...INITIAL_USER,
          email: email || 'user@lifeos.internal',
          name: email ? email.split('@')[0] : 'User',
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

  const signup = async (email: string, name: string, _password?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
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
    setIsAuthenticated(false);
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      Storage.setUser(updated);
      return updated;
    });
  };

  const addXp = (amount: number, reason?: string) => {
    if (amount <= 0) return;
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
