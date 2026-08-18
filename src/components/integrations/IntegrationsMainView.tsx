import React, { useState, useEffect } from 'react';
import { BiometricReadinessMetric, WebhookIntegrationConfig } from '../../types';
import { Storage } from '../../lib/storage';
import { useNotifications } from '../../context/NotificationContext';
import { BiometricReadinessGauges } from './BiometricReadinessGauges';
import { BiometricSyncControls } from './BiometricSyncControls';
import { ExternalConnectorsList } from './ExternalConnectorsList';
import { Activity, Shield, Key, Radio, Globe, RefreshCw, Smartphone } from 'lucide-react';
import { Button } from '../ui/Button';

export function IntegrationsMainView() {
  const { showToast } = useNotifications();
  const [biometrics, setBiometrics] = useState<BiometricReadinessMetric>(Storage.getBiometrics());
  const [integrations, setIntegrations] = useState<WebhookIntegrationConfig[]>(Storage.getIntegrations());

  const loadData = () => {
    setBiometrics(Storage.getBiometrics());
    setIntegrations(Storage.getIntegrations());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncBiometrics = () => {
    const updated = Storage.simulateBiometricSync();
    loadData();
    showToast({
      title: 'Biometrics Synced Live',
      description: `Readiness evaluated: ${updated.cognitiveReadinessTier} (${updated.sleepScore}% Sleep, ${updated.recoveryIndex}% Recovery). Focus buff applied!`,
      type: 'success',
    });
  };

  const handleToggleConnector = (id: string) => {
    const target = integrations.find((i) => i.id === id);
    if (!target) return;
    const nextStatus = target.status === 'connected' ? 'disconnected' : 'connected';
    Storage.updateIntegration(id, { status: nextStatus });
    loadData();
    showToast({
      title: nextStatus === 'connected' ? 'Connector Linked' : 'Connector Unlinked',
      description: `${target.name} is now ${nextStatus}.`,
      type: nextStatus === 'connected' ? 'success' : 'info',
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Live Readiness & Cognitive Gauge */}
      <BiometricReadinessGauges metrics={biometrics} />

      {/* 2. Bluetooth & Live Sync Controls */}
      <BiometricSyncControls
        metrics={biometrics}
        onSync={handleSyncBiometrics}
      />

      {/* 3. External Connectors & Webhooks Grid */}
      <ExternalConnectorsList
        integrations={integrations}
        onToggleStatus={handleToggleConnector}
      />
    </div>
  );
}
