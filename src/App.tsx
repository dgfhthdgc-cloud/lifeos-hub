import React, { useState } from 'react';
import { RoutePath } from './types';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { PWAProvider } from './context/PWAContext';
import { AppShell } from './components/layout/AppShell';
import { DashboardView } from './components/dashboard/DashboardView';
import { LoginView } from './components/auth/LoginView';
import { SignupView } from './components/auth/SignupView';
import { ForgotPasswordView } from './components/auth/ForgotPasswordView';
import { SettingsView } from './components/settings/SettingsView';
import { PlannerView } from './components/planner/PlannerView';
import { GoalsView } from './components/goals/GoalsView';
import { HabitsView } from './components/habits/HabitsView';
import { GamificationView } from './components/gamification/GamificationView';
import { LearnView } from './components/learn/LearnView';
import { LanguagesMainView } from './components/languages/LanguagesMainView';
import { TradingMainView } from './components/trading/TradingMainView';
import { AICoachMainView } from './components/ai/AICoachMainView';
import { AnalyticsMainView } from './components/analytics/AnalyticsMainView';
import { BossRaidMainView } from './components/bosses/BossRaidMainView';
import { SkillPerkTreeMainView } from './components/perks/SkillPerkTreeMainView';
import { AutomationsMainView } from './components/automations/AutomationsMainView';
import { SyndicateMainView } from './components/syndicate/SyndicateMainView';
import { IntegrationsMainView } from './components/integrations/IntegrationsMainView';
import { SwarmPage } from './pages/SwarmPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { VaultPage } from './pages/VaultPage';
import { PhasePlaceholderView } from './components/placeholder/PhasePlaceholderView';

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<RoutePath>('/dashboard');

  const navigate = (path: RoutePath) => {
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-10 h-10 rounded-xl bg-white text-neutral-950 font-black text-lg flex items-center justify-center animate-pulse">
          Ω
        </div>
        <p className="text-xs font-mono text-neutral-400">Initializing LIFE OS Environment...</p>
      </div>
    );
  }

  // Unauthenticated Auth views
  if (!isAuthenticated) {
    if (currentPath === '/signup') {
      return <SignupView onNavigate={navigate} />;
    }
    if (currentPath === '/forgot-password') {
      return <ForgotPasswordView onNavigate={navigate} />;
    }
    return <LoginView onNavigate={navigate} />;
  }

  // Render current view inside AppShell
  const renderCurrentView = () => {
    switch (currentPath) {
      case '/':
      case '/dashboard':
        return <DashboardView onNavigate={navigate} />;

      case '/planner':
        return <PlannerView />;

      case '/goals':
        return <GoalsView />;

      case '/habits':
        return <HabitsView />;

      case '/progress':
        return <GamificationView />;

      case '/learn':
        return <LearnView />;

      case '/languages':
        return <LanguagesMainView />;

      case '/trading':
      case '/trading/replay':
      case '/trading/journal':
        return <TradingMainView />;

      case '/ai':
        return <AICoachMainView />;

      case '/analytics':
        return <AnalyticsMainView onNavigate={navigate} />;

      case '/bosses':
        return <BossRaidMainView onNavigate={navigate} />;

      case '/perks':
        return <SkillPerkTreeMainView onNavigate={navigate} />;

      case '/automations':
        return <AutomationsMainView />;

      case '/syndicate':
        return <SyndicateMainView />;

      case '/integrations':
        return <IntegrationsMainView />;

      case '/swarm':
        return <SwarmPage />;

      case '/simulator':
        return <SimulatorPage />;

      case '/vault':
        return <VaultPage />;

      case '/settings':
        return <SettingsView />;

      default:
        return <DashboardView onNavigate={navigate} />;
    }
  };

  return (
    <AppShell currentPath={currentPath} onNavigate={navigate}>
      {renderCurrentView()}
    </AppShell>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <PWAProvider>
            <AppContent />
          </PWAProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
