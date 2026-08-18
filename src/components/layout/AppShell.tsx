import React, { useState } from 'react';
import { RoutePath } from '../../types';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { SearchModal } from './SearchModal';
import { ToastContainer } from '../ui/ToastContainer';
import { PWAStatusBanner } from './PWAStatusBanner';
import { PWAInstallModal } from './PWAInstallModal';

interface AppShellProps {
  currentPath: RoutePath;
  onNavigate: (path: RoutePath) => void;
  children: React.ReactNode;
}

export function AppShell({ currentPath, onNavigate, children }: AppShellProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-100/60 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col antialiased selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900">
      {/* PWA Offline / Update Banner */}
      <PWAStatusBanner />

      <div className="flex flex-1 w-full min-h-screen">
        {/* Desktop Sidebar */}
        <Sidebar currentPath={currentPath} onNavigate={onNavigate} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
          <TopBar
            currentPath={currentPath}
            onNavigate={onNavigate}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />

          <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Nav & Drawer */}
      <MobileNav
        currentPath={currentPath}
        onNavigate={onNavigate}
        isDrawerOpen={isMobileMenuOpen}
        onCloseDrawer={() => setIsMobileMenuOpen(false)}
      />

      {/* Global Command Palette / Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={onNavigate}
      />

      {/* PWA iOS / Install Instructions Modal */}
      <PWAInstallModal />

      {/* Notification Toast Container */}
      <ToastContainer />
    </div>
  );
}
