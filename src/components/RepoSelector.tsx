/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { GitHubRepo } from '../types';
import { 
  FolderGit, 
  Plus, 
  Lock, 
  Globe, 
  RefreshCw, 
  BookOpen, 
  ArrowLeft,
  Settings2,
  Search,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';

interface RepoSelectorProps {
  selectedRepo: GitHubRepo | null;
  onSelectRepo: (repo: GitHubRepo | null) => void;
  targetBranch: string;
  onSetTargetBranch: (branch: string) => void;
}

export const RepoSelector: React.FC<RepoSelectorProps> = ({
  selectedRepo,
  onSelectRepo,
  targetBranch,
  onSetTargetBranch,
}) => {
  const { repos, isLoadingRepos, refreshRepos, createNewRepo } = useApp();
  const [mode, setMode] = useState<'select' | 'create'>('select');
  
  // Custom dropdown state
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter repositories based on search
  const filteredRepos = repos.filter((repo) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // New Repo Form State
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDesc, setNewRepoDesc] = useState('');
  const [newRepoPrivate, setNewRepoPrivate] = useState(true);
  const [newRepoAutoInit, setNewRepoAutoInit] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoName.trim()) {
      toast.error('Nama repositori wajib diisi.');
      return;
    }

    setIsCreating(true);
    try {
      const created = await createNewRepo(
        newRepoName.trim(),
        newRepoDesc.trim(),
        newRepoPrivate,
        newRepoAutoInit
      );
      onSelectRepo(created);
      onSetTargetBranch(created.default_branch || 'main');
      
      // Reset form
      setNewRepoName('');
      setNewRepoDesc('');
      setMode('select');
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat repositori baru.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
          <FolderGit className="h-4.5 w-4.5 text-indigo-500" />
          Repositori Target
        </h3>
        
        {mode === 'select' ? (
          <button
            onClick={() => setMode('create')}
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            <Plus className="h-3.5 w-3.5" />
            Repositori Baru
          </button>
        ) : (
          <button
            onClick={() => setMode('select')}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali
          </button>
        )}
      </div>

      {mode === 'select' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Repo List Select - Custom Searchable Dropdown */}
            <div className="space-y-1.5 relative" ref={dropdownRef}>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Pilih Repositori</span>
                <button
                  type="button"
                  onClick={refreshRepos}
                  disabled={isLoadingRepos}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Muat ulang"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoadingRepos ? 'animate-spin' : ''}`} />
                </button>
              </label>
              
              {/* Activator Button */}
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={isLoadingRepos}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-sm flex items-center justify-between transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white disabled:opacity-50 text-left cursor-pointer"
              >
                <span className="truncate flex items-center gap-2">
                  {selectedRepo ? (
                    <>
                      {selectedRepo.private ? (
                        <Lock className="h-4 w-4 text-amber-500 shrink-0" />
                      ) : (
                        <Globe className="h-4 w-4 text-emerald-500 shrink-0" />
                      )}
                      <span className="font-bold">{selectedRepo.name}</span>
                    </>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">Cari & Pilih Repositori...</span>
                  )}
                </span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
                )}
              </button>

              {/* Custom Dropdown list */}
              {isOpen && (
                <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[340px]">
                  {/* Sticky Search Input */}
                  <div className="p-2 border-b border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 relative">
                    <input
                      type="text"
                      placeholder="Cari repositori..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white"
                      autoFocus
                    />
                    <Search className="absolute left-4.5 top-4.5 h-3.5 w-3.5 text-slate-400" />
                  </div>

                  {/* Options List */}
                  <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 max-h-[260px] scrollbar-thin">
                    {filteredRepos.length > 0 ? (
                      filteredRepos.map((repo) => {
                        const isSelected = selectedRepo?.id === repo.id;
                        return (
                          <button
                            key={repo.id}
                            type="button"
                            onClick={() => {
                              onSelectRepo(repo);
                              onSetTargetBranch(repo.default_branch || 'main');
                              setIsOpen(false);
                              setSearchQuery('');
                            }}
                            className={`w-full px-3.5 py-2.5 flex items-start gap-2.5 transition-colors text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                              isSelected ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {repo.private ? (
                                <Lock className="h-3.5 w-3.5 text-amber-500" />
                              ) : (
                                <Globe className="h-3.5 w-3.5 text-emerald-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold truncate ${
                                isSelected ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-800 dark:text-slate-200'
                              }`}>
                                {repo.name}
                              </p>
                              {repo.description ? (
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                  {repo.description}
                                </p>
                              ) : (
                                <p className="text-[10px] text-slate-300 dark:text-slate-600 italic mt-0.5">
                                  Tidak ada deskripsi.
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <Check className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-1" />
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-slate-400 dark:text-slate-500 text-xs">
                        Tidak ada repositori ditemukan.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Branch name input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Settings2 className="h-3 w-3" />
                Branch Target
              </label>
              <input
                type="text"
                value={targetBranch}
                onChange={(e) => onSetTargetBranch(e.target.value.trim())}
                placeholder="main"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white"
              />
            </div>

          </div>

          {selectedRepo && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <div className="space-y-1 text-left">
                <p className="font-bold text-slate-800 dark:text-white inline-flex items-center gap-1">
                  {selectedRepo.private ? <Lock className="h-3 w-3 text-amber-500" /> : <Globe className="h-3 w-3 text-emerald-500" />}
                  {selectedRepo.full_name}
                </p>
                {selectedRepo.description && (
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm truncate">{selectedRepo.description}</p>
                )}
              </div>
              <a
                href={selectedRepo.html_url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold rounded-lg transition-colors text-[11px]"
              >
                Buka
              </a>
            </div>
          )}
        </div>
      ) : (
        /* Create New Repository Form */
        <form onSubmit={handleCreateRepo} className="space-y-4 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nama Repositori *
              </label>
              <input
                type="text"
                value={newRepoName}
                onChange={(e) => setNewRepoName(e.target.value.replace(/[^a-zA-Z0-9._-]/g, '-'))}
                placeholder="my-awesome-project"
                required
                disabled={isCreating}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Deskripsi (Opsional)
              </label>
              <input
                type="text"
                value={newRepoDesc}
                onChange={(e) => setNewRepoDesc(e.target.value)}
                placeholder="Deskripsi singkat proyek..."
                disabled={isCreating}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white"
              />
            </div>

          </div>

          <div className="flex flex-wrap items-center gap-6 pt-1">
            {/* Privacy selection */}
            <div className="flex items-center gap-4">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Visibilitas:</label>
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  checked={newRepoPrivate}
                  onChange={() => setNewRepoPrivate(true)}
                  disabled={isCreating}
                  className="text-indigo-600 focus:ring-indigo-500/30"
                />
                <Lock className="h-3.5 w-3.5" />
                Privat
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  checked={!newRepoPrivate}
                  onChange={() => setNewRepoPrivate(false)}
                  disabled={isCreating}
                  className="text-indigo-600 focus:ring-indigo-500/30"
                />
                <Globe className="h-3.5 w-3.5" />
                Publik
              </label>
            </div>

            {/* Auto Init Selection */}
            <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={newRepoAutoInit}
                onChange={(e) => setNewRepoAutoInit(e.target.checked)}
                disabled={isCreating}
                className="rounded text-indigo-600 border-slate-300 focus:ring-indigo-500/30"
              />
              <BookOpen className="h-3.5 w-3.5" />
              Inisialisasi README.md
            </label>
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-current" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Membuat...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Buat Repositori
              </>
            )}
          </button>
        </form>
      )}

    </div>
  );
};
