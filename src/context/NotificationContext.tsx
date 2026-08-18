import React, { createContext, useContext, useEffect, useState } from 'react';
import { NotificationItem, RoutePath } from '../types';
import { Storage } from '../lib/storage';
import { Bell, CheckCircle2, AlertCircle, Info, AlertTriangle, X, Zap } from 'lucide-react';

interface Toast {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'xp';
  xpAmount?: number;
}

interface ToastPayload {
  title?: string;
  description?: string;
  message?: string;
  type?: 'success' | 'error' | 'info' | 'warning' | 'xp';
  xpAmount?: number;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  showToast: (payload: string | ToastPayload, type?: 'success' | 'error' | 'info' | 'warning' | 'xp', duration?: number) => void;
  addNotification: (item: {
    title: string;
    message: string;
    type: 'quest' | 'streak' | 'lesson' | 'system' | 'trading';
    link?: RoutePath;
  }) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    try {
      const items = Storage.getNotifications();
      setNotifications(items);
    } catch {
      setNotifications([]);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const showToast = (
    payload: string | ToastPayload,
    type: 'success' | 'error' | 'info' | 'warning' | 'xp' = 'success',
    duration: number = 3500
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    let message = '';
    let title: string | undefined = undefined;
    let toastType = type;
    let xpAmount: number | undefined = undefined;

    if (typeof payload === 'string') {
      message = payload;
    } else if (payload && typeof payload === 'object') {
      title = payload.title;
      message = payload.description || payload.message || payload.title || '';
      if (payload.type) toastType = payload.type;
      if (payload.xpAmount) xpAmount = payload.xpAmount;
    }

    setToasts((prev) => [...prev, { id, title, message, type: toastType, xpAmount }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      Storage.setNotifications(updated);
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      Storage.setNotifications(updated);
      return updated;
    });
  };

  const clearNotifications = () => {
    setNotifications([]);
    Storage.setNotifications([]);
  };

  const addNotification = (item: {
    title: string;
    message: string;
    type: 'quest' | 'streak' | 'lesson' | 'system' | 'trading';
    link?: RoutePath;
  }) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: item.title,
      message: item.message,
      type: item.type,
      timestamp: new Date().toISOString(),
      read: false,
      link: item.link,
    };
    setNotifications((prev) => {
      const updated = [newNotif, ...prev];
      Storage.setNotifications(updated);
      return updated;
    });
    showToast(item.title, 'info');
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        showToast,
        addNotification,
      }}
    >
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center justify-between p-3.5 rounded-xl shadow-lg border backdrop-blur-md bg-neutral-900/95 border-neutral-800 text-white text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
              {toast.type === 'xp' && <Zap className="w-4 h-4 text-amber-400 shrink-0" />}
              <div>
                {toast.title && <div className="font-bold text-white text-xs">{toast.title}</div>}
                <div className={toast.title ? 'text-[11px] text-neutral-400' : 'text-xs'}>
                  {toast.message}
                </div>
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-neutral-400 hover:text-white p-1 rounded transition-colors ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
