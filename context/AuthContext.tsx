import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { Storage, INITIAL_USER, DEMO_USER } from '../lib/storage';
import { calculateStreakMultiplier, getXpRequiredForLevel, LEVEL_RANKS } from '../lib/gamification';

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

const SESSION_KEY = 'life_os_session_v1';
const DEMO_MODE_KEY = 'life_os_demo_mode_v1';
const LAST_ACTIVITY_KEY = 'life_os_last_activity_date_v1';

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getPreviousDateString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d);
};

const createSessionToken = () =>
  `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const hasSession = Boolean(localStorage.getItem(SESSION_KEY));
      const savedUser = Storage.getUser();

      if (hasSession && savedUser) {
        setUser(savedUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const establishSession = (nextUser: UserProfile, demoMode = false) => {
    Storage.setUser(nextUser);
    localStorage.setItem(SESSION_KEY, createSessionToken());
    localStorage.setItem(DEMO_MODE_KEY, demoMode ? '1' : '0');
    setUser(nextUser);
    setIsAuthenticated(true);
  };

  const login = async (email?: string, _password?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const normalizedEmail = email?.trim().toLowerCase() || 'user@lifeos.local';
      let loggedUser = Storage.getUser();

      if (!loggedUser || loggedUser.email.toLowerCase() !== normalizedEmail) {
        loggedUser = {
          ...INITIAL_USER,
          id: `usr_${Date.now()}`,
          email: normalizedEmail,
          name: normalizedEmail.split('@')[0] || 'User',
          createdAt: new Date().toISOString(),
          settings: { ...INITIAL_USER.settings },
        };
      }

      establishSession(loggedUser, false);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = () => {
    establishSession({ ...DEMO_USER, settings: { ...DEMO_USER.settings } }, true);
  };

  const signup = async (email: string, name: string, _password?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const displayName = name.trim() || normalizedEmail.split('@')[0] || 'User';
      const newUser: UserProfile = {
        ...INITIAL_USER,
        id: `usr_${Date.now()}`,
        email: normalizedEmail,
        name: displayName,
        title: 'Initiate Apprentice',
        createdAt: new Date().toISOString(),
        settings: { ...INITIAL_USER.settings },
      };

      establishSession(newUser, false);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(DEMO_MODE_KEY);
    setIsAuthenticated(false);
    setUser(null);
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
    if (!Number.isFinite(amount) || amount <= 0) return;

    setUser((prev) => {
      if (!prev) return null;

      let newCurrentXp = prev.currentXp + amount;
      let newLevel = prev.level;
      let nextXp = prev.nextLevelXp || getXpRequiredForLevel(newLevel);

      while (newCurrentXp >= nextXp && newLevel < 100) {
        newCurrentXp -= nextXp;
        newLevel += 1;
        nextXp = getXpRequiredForLevel(newLevel);
      }

      const matchedRank = [...LEVEL_RANKS].reverse().find((r) => newLevel >= r.level);
      const newTitle = matchedRank?.title || prev.title;

      // Global activity streak: one increase per calendar day, regardless of activity type.
      const today = getLocalDateString();
      const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
      let nextStreak = prev.streakDays || 0;
      if (lastActivity !== today) {
        nextStreak = lastActivity === getPreviousDateString() ? nextStreak + 1 : 1;
        localStorage.setItem(LAST_ACTIVITY_KEY, today);
      }

      const updated: UserProfile = {
        ...prev,
        currentXp: newCurrentXp,
        level: newLevel,
        nextLevelXp: nextXp,
        streakDays: nextStreak,
        title: newTitle,
      };

      Storage.setUser(updated);

      // Keep the dedicated gamification streak model synchronized with the user profile.
      try {
        const streak = Storage.getStreakData();
        const multiplier = calculateStreakMultiplier(nextStreak);
        const milestones = streak.milestones.map((milestone) => ({
          ...milestone,
          reached: milestone.reached || nextStreak >= milestone.days,
        }));
        Storage.setStreakData({
          ...streak,
          currentStreak: nextStreak,
          bestStreak: Math.max(streak.bestStreak, nextStreak),
          multiplier,
          lastActiveDate: today,
          milestones,
        });
      } catch {
        // Keep the XP path resilient if legacy streak data is malformed.
      }

      try {
        Storage.recordXpTransaction({
          amount,
          reason: reason || 'Activity completed',
          category: 'general',
          timestamp: new Date().toISOString(),
        });
      } catch {
        // XP should never fail because the audit ledger is unavailable.
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
