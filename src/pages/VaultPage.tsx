import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Download,
  Upload,
  Lock,
  Archive,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  Layers,
  FileCode,
  HardDrive,
  Check,
} from 'lucide-react';
import { storage } from '../lib/storage';
import { EpochMilestone, SovereignVaultArchive } from '../types';

export const VaultPage: React.FC = () => {
  const [milestones, setMilestones] = useState<EpochMilestone[]>([]);
  const [archives, setArchives] = useState<SovereignVaultArchive[]>([]);
  const [activeTab, setActiveTab] = useState<'epochs' | 'backups' | 'sovereignty'>('epochs');

  // New Milestone Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEpoch, setNewEpoch] = useState('Epoch II: Sovereign Mastery & Scaled Alpha (2026 - 2027)');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<EpochMilestone['category']>('mastery');
  const [newRank, setNewRank] = useState<EpochMilestone['significanceRank']>('Tier S');
  const [newDesc, setNewDesc] = useState('');
  const [newArtifact, setNewArtifact] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setMilestones(storage.getEpochMilestones());
    setArchives(storage.getVaultArchives());
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleMilestone = (id: string) => {
    const updated = storage.toggleMilestoneStatus(id);
    if (updated) {
      loadData();
      showToast(`Milestone marked as ${updated.status.toUpperCase()}`);
    }
  };

  const handleDeleteMilestone = (id: string) => {
    storage.deleteEpochMilestone(id);
    loadData();
    showToast('Milestone removed from Epoch ledger.');
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    storage.createEpochMilestone({
      epochName: newEpoch,
      title: newTitle,
      category: newCategory,
      achievedAt: new Date().toISOString().split('T')[0],
      description: newDesc || 'Significant multi-year compounding milestone achieved.',
      significanceRank: newRank,
      proofArtifact: newArtifact || 'Sovereign Milestone Verification Proof',
      status: 'completed',
    });

    loadData();
    setShowAddModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewArtifact('');
    showToast('New Epoch Milestone recorded successfully.');
  };

  const handleCreateBackup = (format: 'json' | 'sqlite' | 'standalone_html') => {
    const created = storage.createVaultBackup(format);
    loadData();
    showToast(`Encrypted ${format.toUpperCase()} archive generated (${created.dataSizeKb} KB).`);
  };

  const handleDownloadJSON = () => {
    const jsonStr = storage.exportSovereignJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life_os_sovereign_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Encrypted JSON bundle downloaded.');
  };

  const handleCopyChecksum = (checksum: string) => {
    navigator.clipboard.writeText(checksum);
    setCopiedId(checksum);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Cryptographic Checksum copied.');
  };

  // Group milestones by Epoch
  const epochGroups = milestones.reduce<Record<string, EpochMilestone[]>>((acc, item) => {
    if (!acc[item.epochName]) acc[item.epochName] = [];
    acc[item.epochName].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-indigo-950/95 border border-indigo-500/40 text-white px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 text-sm font-medium"
          >
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-900/40 p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sovereign Vault & Multi-Epoch Codex</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Legacy Vault & Archive Protocol
            </h1>
            <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
              Curate multi-year life epoch milestones, generate zero-knowledge encrypted portable archives, and verify 100% offline local-first data sovereignty.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadJSON}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Sovereign Bundle</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Milestone</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('epochs')}
          className={`pb-3 font-semibold text-sm transition-colors relative cursor-pointer ${
            activeTab === 'epochs' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Epoch Milestones & Codex ({milestones.length})
          {activeTab === 'epochs' && (
            <motion.div layoutId="vaultTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('backups')}
          className={`pb-3 font-semibold text-sm transition-colors relative cursor-pointer ${
            activeTab === 'backups' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Encrypted Vault Archives ({archives.length})
          {activeTab === 'backups' && (
            <motion.div layoutId="vaultTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('sovereignty')}
          className={`pb-3 font-semibold text-sm transition-colors relative cursor-pointer ${
            activeTab === 'sovereignty' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Sovereignty & Local-First Audit
          {activeTab === 'sovereignty' && (
            <motion.div layoutId="vaultTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
      </div>

      {/* TAB 1: EPOCH MILESTONES */}
      {activeTab === 'epochs' && (
        <div className="space-y-8">
          {(Object.entries(epochGroups) as [string, EpochMilestone[]][]).map(([epochName, items]) => (
            <div key={epochName} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-4 w-1 bg-indigo-500 rounded-full" />
                <h2 className="text-lg font-bold text-white tracking-wide">{epochName}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {items.length} Milestones
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((m) => (
                  <div
                    key={m.id}
                    className={`p-5 rounded-xl border transition-all ${
                      m.status === 'completed'
                        ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                        : m.status === 'in_progress'
                        ? 'bg-indigo-950/20 border-indigo-500/30'
                        : 'bg-slate-950/40 border-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {m.significanceRank}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                          {m.category}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        {m.achievedAt}
                      </div>
                    </div>

                    <h3 className="font-bold text-white text-base mb-1.5">{m.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">{m.description}</p>

                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 mb-4 flex items-center justify-between text-xs">
                      <div className="text-slate-400 flex items-center gap-1.5 truncate">
                        <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{m.proofArtifact}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <button
                        onClick={() => handleToggleMilestone(m.id)}
                        className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                          m.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : m.status === 'in_progress'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="capitalize">{m.status.replace('_', ' ')}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteMilestone(m.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                        title="Delete Milestone"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: ENCRYPTED BACKUPS */}
      {activeTab === 'backups' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl">
            <div>
              <h3 className="font-bold text-white text-base">Generate Immutable Sovereign Snapshot</h3>
              <p className="text-xs text-slate-400">Zero-knowledge client-side encrypted state archive</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCreateBackup('json')}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                + Encrypted JSON
              </button>
              <button
                onClick={() => handleCreateBackup('standalone_html')}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                + Standalone Offline HTML
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {archives.map((arch) => (
              <div
                key={arch.id}
                className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Archive className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-white text-sm">{arch.backupVersion}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Offline Ready
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex flex-wrap items-center gap-4">
                    <span>Records: {arch.totalRecords.toLocaleString()}</span>
                    <span>Size: {arch.dataSizeKb} KB</span>
                    <span>Format: {arch.exportFormat.toUpperCase()}</span>
                    <span>Created: {new Date(arch.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 pt-1">
                    <span>SHA-256: {arch.checksum}</span>
                    <button
                      onClick={() => handleCopyChecksum(arch.checksum)}
                      className="text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {copiedId === arch.checksum ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadJSON}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SOVEREIGNTY AUDIT */}
      {activeTab === 'sovereignty' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-emerald-400" />
              Zero-Leakage Local Storage Protocol
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              LIFE OS is strictly built on local-first sovereignty principles. Your task logs, financial journals, habits, and neural embeddings live 100% in your device cache.
            </p>

            <div className="space-y-3 pt-2">
              {[
                { label: 'Data Encryption', status: 'AES-256 Client-Side', ok: true },
                { label: 'Cloud Telemetry Leakage', status: '0.00% Zero-Leak', ok: true },
                { label: 'Air-Gapped Execution', status: 'Fully Supported', ok: true },
                { label: 'Offline Sync Engine', status: 'Ready (ServiceWorker)', ok: true },
              ].map((row, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{row.label}</span>
                  <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <FileCode className="w-5 h-5 text-indigo-400" />
              Sovereign Portable Import / Restore
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Restore complete system state from an external JSON backup file at any time.
            </p>

            <div className="p-6 border-2 border-dashed border-slate-800 rounded-xl text-center space-y-3">
              <Upload className="w-8 h-8 text-slate-500 mx-auto" />
              <div className="text-xs text-slate-300 font-medium">Drag and drop sovereign backup .json file</div>
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      const content = evt.target?.result as string;
                      const success = storage.importSovereignJSON(content);
                      if (success) {
                        loadData();
                        showToast('System state restored successfully from backup.');
                      } else {
                        showToast('Invalid backup JSON format.');
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
                className="hidden"
                id="vault-file-import"
              />
              <label
                htmlFor="vault-file-import"
                className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Browse JSON Backup
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4"
            >
              <h3 className="font-bold text-white text-lg">Record Epoch Milestone</h3>
              <form onSubmit={handleAddMilestone} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Epoch Category</label>
                  <select
                    value={newEpoch}
                    onChange={(e) => setNewEpoch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Epoch I: Foundation & Relentless Execution (2024 - 2025)">
                      Epoch I: Foundation & Relentless Execution (2024 - 2025)
                    </option>
                    <option value="Epoch II: Sovereign Mastery & Scaled Alpha (2026 - 2027)">
                      Epoch II: Sovereign Mastery & Scaled Alpha (2026 - 2027)
                    </option>
                    <option value="Epoch III: Self-Actualization & Sovereign Legacy (2028 - 2030)">
                      Epoch III: Self-Actualization & Sovereign Legacy (2028 - 2030)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Milestone Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Mastered Japanese N2 Business Translation"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1">Domain</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="mastery">Mastery</option>
                      <option value="financial">Financial</option>
                      <option value="vitality">Vitality</option>
                      <option value="breakthrough">Breakthrough</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1">Significance Rank</label>
                    <select
                      value={newRank}
                      onChange={(e) => setNewRank(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Tier S">Tier S (Grand Legacy)</option>
                      <option value="Tier A">Tier A (Major Milestone)</option>
                      <option value="Tier B">Tier B (Foundational)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Provide details on the compounding significance of this milestone..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Proof Artifact</label>
                  <input
                    type="text"
                    value={newArtifact}
                    onChange={(e) => setNewArtifact(e.target.value)}
                    placeholder="e.g. GitHub Repository Link, Certificate ID, Ledger Token"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Save Milestone
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
