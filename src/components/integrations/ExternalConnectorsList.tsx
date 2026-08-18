import React, { useState } from 'react';
import { WebhookIntegrationConfig } from '../../types';
import { Radio, Link2, Copy, Check, ExternalLink, Calendar, Key, Globe, Shield } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface ExternalConnectorsListProps {
  integrations: WebhookIntegrationConfig[];
  onToggleStatus: (id: string) => void;
}

export function ExternalConnectorsList({
  integrations,
  onToggleStatus,
}: ExternalConnectorsListProps) {
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const handleCopyKey = (id: string, text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google_calendar':
        return <Calendar className="w-5 h-5 text-indigo-500" />;
      case 'custom_webhook':
        return <Globe className="w-5 h-5 text-emerald-500" />;
      case 'oura':
      case 'apple_health':
      case 'whoop':
      default:
        return <Radio className="w-5 h-5 text-sky-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-mono">
          Connected External Integrations & Webhooks
        </h3>
        <span className="text-[11px] text-neutral-400 font-mono">
          Connector Hub • Demo / Mock Telemetry
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {integrations.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 shadow-xs space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                  {getProviderIcon(item.provider)}
                </div>

                <span
                  className={cn(
                    'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border',
                    item.status === 'connected'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500 border-neutral-300'
                  )}
                >
                  {item.status.toUpperCase()}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                  {item.name}
                </h4>
                <div className="text-[11px] text-neutral-400 font-mono mt-1">
                  {item.eventsCount} Events Processed
                </div>
              </div>

              {item.webhookUrl && (
                <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200/70 dark:border-neutral-700 font-mono text-[10px] text-neutral-600 dark:text-neutral-300 truncate">
                  {item.webhookUrl}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
              {item.apiKeyOrToken && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyKey(item.id, item.apiKeyOrToken)}
                  className="text-[11px] h-7 px-2 font-mono"
                >
                  {copiedKeyId === item.id ? (
                    <>
                      <Check className="w-3 h-3 mr-1 text-emerald-500" /> Copied Key
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1 text-neutral-400" /> Copy Secret Key
                    </>
                  )}
                </Button>
              )}

              <Button
                variant={item.status === 'connected' ? 'outline' : 'primary'}
                size="sm"
                onClick={() => onToggleStatus(item.id)}
                className="text-[11px] h-7 px-2.5 ml-auto font-semibold"
              >
                {item.status === 'connected' ? 'Disconnect' : 'Connect API'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
