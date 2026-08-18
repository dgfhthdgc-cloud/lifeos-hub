import React, { useState, useEffect } from 'react';
import { TargetLanguage, VocabItem, LanguageUnit } from '../../types';
import { Storage } from '../../lib/storage';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Globe,
  Sparkles,
  Zap,
  CheckCircle2,
  Volume2,
  RefreshCw,
  Plus,
  BookOpen,
  Award,
  Layers,
  Heart,
} from 'lucide-react';

export function LanguagesMainView() {
  const { addXp } = useAuth();
  const { showToast } = useNotifications();
  const [selectedLang, setSelectedLang] = useState<TargetLanguage>('spanish');
  const [vocabVault, setVocabVault] = useState<VocabItem[]>([]);
  const [units, setUnits] = useState<LanguageUnit[]>([]);
  const [activeTab, setActiveTab] = useState<'flashcards' | 'vault' | 'units'>('flashcards');

  // Flashcard practice session state
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // New word form state
  const [showAddVocabModal, setShowAddVocabModal] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [newPartOfSpeech, setNewPartOfSpeech] = useState<'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase'>('noun');
  const [newExampleSource, setNewExampleSource] = useState('');
  const [newExampleTarget, setNewExampleTarget] = useState('');

  useEffect(() => {
    loadLanguageData(selectedLang);
  }, [selectedLang]);

  const loadLanguageData = (lang: TargetLanguage) => {
    setVocabVault(Storage.getVocabVault(lang));
    setUnits(Storage.getLanguageUnits(lang));
    setFlashcardIndex(0);
    setFlipped(false);
  };

  const handleLanguageChange = (lang: TargetLanguage) => {
    setSelectedLang(lang);
    Storage.setTargetLanguage(lang);
    showToast(`Switched target language to ${lang.toUpperCase()}`, 'info');
  };

  const currentCard = vocabVault[flashcardIndex];

  const handleNextCard = (mastered: boolean) => {
    if (currentCard) {
      const newLevel = mastered ? Math.min(5, (currentCard.masteryLevel || 1) + 1) : Math.max(1, (currentCard.masteryLevel || 1) - 1);
      Storage.updateVocabMastery(currentCard.id, newLevel);
      if (mastered) {
        addXp(15, `Mastered vocab: ${currentCard.term}`);
        showToast(`Word mastered! +15 XP (SRS Stage ${newLevel})`, 'success');
      }
    }
    setFlipped(false);
    setFlashcardIndex((prev) => (prev + 1) % (vocabVault.length || 1));
  };

  const handleAddVocab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.trim() || !newTranslation.trim()) return;

    Storage.addCustomVocab({
      term: newTerm.trim(),
      translation: newTranslation.trim(),
      partOfSpeech: newPartOfSpeech,
      exampleSource: newExampleSource.trim() || newTranslation,
      exampleTarget: newExampleTarget.trim() || newTerm,
      masteryLevel: 1,
      language: selectedLang,
    });

    setVocabVault(Storage.getVocabVault(selectedLang));
    setShowAddVocabModal(false);
    setNewTerm('');
    setNewTranslation('');
    setNewExampleSource('');
    setNewExampleTarget('');
    showToast('Vocabulary card saved to vault', 'success');
  };

  const languages: { id: TargetLanguage; label: string; flag: string }[] = [
    { id: 'spanish', label: 'Spanish', flag: '🇪🇸' },
    { id: 'japanese', label: 'Japanese', flag: '🇯🇵' },
    { id: 'german', label: 'German', flag: '🇩🇪' },
    { id: 'french', label: 'French', flag: '🇫🇷' },
    { id: 'mandarin', label: 'Mandarin', flag: '🇨🇳' },
    { id: 'italian', label: 'Italian', flag: '🇮🇹' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
            <Globe className="w-6 h-6 text-blue-500" />
            Polyglot Neural Matrix
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Spaced repetition memory algorithms (SRS) with adaptive retention curves
          </p>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-neutral-100 dark:bg-neutral-900 p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
          {languages.map((l) => (
            <button
              key={l.id}
              onClick={() => handleLanguageChange(l.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                selectedLang === l.id
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'flashcards'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            SRS Flashcards ({vocabVault.length})
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'vault'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Vocabulary Vault
          </button>
        </div>

        <button
          onClick={() => setShowAddVocabModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Vocab
        </button>
      </div>

      {activeTab === 'flashcards' ? (
        <div className="max-w-xl mx-auto py-6">
          {currentCard ? (
            <div className="space-y-6">
              {/* Card Container */}
              <div
                onClick={() => setFlipped(!flipped)}
                className="cursor-pointer min-h-[300px] bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/50 rounded-3xl p-8 shadow-xl flex flex-col justify-between text-center transition-all transform duration-300 select-none"
              >
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span className="uppercase font-mono font-semibold">SRS Stage {currentCard.masteryLevel}/5</span>
                  <span className="font-mono">
                    Card {flashcardIndex + 1} of {vocabVault.length}
                  </span>
                </div>

                <div className="my-auto space-y-4">
                  {!flipped ? (
                    <div>
                      <h2 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                        {currentCard.term}
                      </h2>
                      {currentCard.phoneticIPA && (
                        <p className="text-xs font-mono text-neutral-400 mt-2">{currentCard.phoneticIPA}</p>
                      )}
                      <p className="text-xs text-emerald-500 font-medium mt-4">Click to reveal translation</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs uppercase font-bold text-neutral-400 mb-1">{currentCard.partOfSpeech}</div>
                      <h2 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                        {currentCard.translation}
                      </h2>
                      {currentCard.exampleTarget && (
                        <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 text-xs text-neutral-600 dark:text-neutral-300">
                          <p className="font-medium">{currentCard.exampleTarget}</p>
                          <p className="text-[11px] text-neutral-400 mt-0.5">{currentCard.exampleSource}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-neutral-400 font-mono">
                  {flipped ? 'Rate your recall below' : 'Tap card to flip'}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleNextCard(false)}
                  className="py-3 px-4 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Review Again (Reset)
                </button>
                <button
                  onClick={() => handleNextCard(true)}
                  className="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mastered (+15 XP)
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-12 text-center space-y-3">
              <BookOpen className="w-8 h-8 text-neutral-400 mx-auto" />
              <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Vault Empty</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                No vocabulary items in {selectedLang.toUpperCase()} yet. Click 'Add Vocab' to seed your spaced repetition deck.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Vocab Vault Table */
        <div className="bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-950/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 uppercase font-semibold">
                <tr>
                  <th className="p-3.5">Word / Phrase</th>
                  <th className="p-3.5">Translation</th>
                  <th className="p-3.5">Part of Speech</th>
                  <th className="p-3.5">SRS Mastery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/60">
                {vocabVault.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-neutral-900 dark:text-white">{item.term}</td>
                    <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-medium">{item.translation}</td>
                    <td className="p-3.5 text-neutral-500 capitalize">{item.partOfSpeech}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <div
                            key={lvl}
                            className={`w-2.5 h-2.5 rounded-sm ${
                              lvl <= (item.masteryLevel || 1) ? 'bg-emerald-500' : 'bg-neutral-200 dark:bg-neutral-800'
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Vocab Modal */}
      {showAddVocabModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              Add {selectedLang.toUpperCase()} Word
            </h2>
            <form onSubmit={handleAddVocab} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Target Term</label>
                <input
                  type="text"
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  placeholder="e.g. desarrollar"
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3.5 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Translation</label>
                <input
                  type="text"
                  value={newTranslation}
                  onChange={(e) => setNewTranslation(e.target.value)}
                  placeholder="e.g. to develop / to evolve"
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3.5 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">Part of Speech</label>
                  <select
                    value={newPartOfSpeech}
                    onChange={(e) => setNewPartOfSpeech(e.target.value as any)}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none"
                  >
                    <option value="noun">Noun</option>
                    <option value="verb">Verb</option>
                    <option value="adjective">Adjective</option>
                    <option value="adverb">Adverb</option>
                    <option value="phrase">Phrase</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddVocabModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-500 hover:text-neutral-700 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
