/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { getRateLimit } from '../services/github';
import { GitHubRateLimit } from '../types';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  RefreshCw, 
  Clock, 
  GitBranch, 
  BookOpen, 
  Users, 
  Globe, 
  Lock, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  MapPin,
  Link as LinkIcon,
  Building,
  Award,
  Search,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ActiveSession: React.FC = () => {
  const { user, token, repos, refreshRepos, isLoadingRepos } = useApp();
  const navigate = useNavigate();
  const [rateLimit, setRateLimit] = useState<GitHubRateLimit | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [repoTypeFilter, setRepoTypeFilter] = useState<'all' | 'public' | 'private'>('all');

  // Route protection
  useEffect(() => {
    if (!token || !user) {
      const isLoggingOut = sessionStorage.getItem('zip2git_logging_out');
      if (isLoggingOut) {
        sessionStorage.removeItem('zip2git_logging_out');
        navigate('/login');
        return;
      }
      toast.error('Silakan masuk menggunakan Token Akses Pribadi terlebih dahulu.');
      navigate('/login');
    }
  }, [token, user, navigate]);

  const fetchRateLimit = async () => {
    if (!token) return;
    setIsLoadingRate(true);
    try {
      const data = await getRateLimit(token);
      setRateLimit(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingRate(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRateLimit();
    }
  }, [token]);

  const handleRefreshAll = async () => {
    const loadToast = toast.loading('Memuat ulang data sesi...');
    try {
      await Promise.all([refreshRepos(), fetchRateLimit()]);
      toast.success('Data sesi berhasil diperbarui!', { id: loadToast });
    } catch (err) {
      toast.error('Gagal memperbarui beberapa data sesi.', { id: loadToast });
    }
  };

  if (!user) return null;

  // Formatting reset time
  const resetDate = rateLimit 
    ? new Date(rateLimit.reset * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--';

  const usedPercentage = rateLimit 
    ? Math.round((rateLimit.used / rateLimit.limit) * 100)
    : 0;

  const remainingPercentage = rateLimit 
    ? Math.round((rateLimit.remaining / rateLimit.limit) * 100)
    : 100;

  // Filtered repositories for display
  const filteredRepos = repos.filter(repo => {
    const matchesSearch = repo.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()));
    if (repoTypeFilter === 'all') return matchesSearch;
    if (repoTypeFilter === 'public') return matchesSearch && !repo.private;
    if (repoTypeFilter === 'private') return matchesSearch && repo.private;
    return matchesSearch;
  });

  const publicCount = repos.filter(r => !r.private).length;
  const privateCount = repos.filter(r => r.private).length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-8 text-left"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Detail Sesi Aktif
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola sesi integrasi GitHub Anda, pantau rate limit API, dan tinjau repositori Anda.
          </p>
        </div>
        <button
          onClick={handleRefreshAll}
          disabled={isLoadingRepos || isLoadingRate}
          className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-500/50 text-white font-semibold rounded-xl text-sm transition-colors shadow-md hover:translate-y-[-1px] cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${(isLoadingRepos || isLoadingRate) ? 'animate-spin' : ''}`} />
          Segarkan Data Sesi
        </button>
      </div>

      {/* Grid Layout: User Profile & Rate Limit Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: User Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            {/* Top decorative gradient blur */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            
            <div className="flex flex-col items-center text-center mt-4">
              <img
                src={user.avatar_url}
                alt={user.login}
                className="h-24 w-24 rounded-full ring-4 ring-indigo-500/20 shadow-lg mb-4"
              />
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {user.name || user.login}
              </h2>
              <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold mt-1">
                @{user.login}
              </p>
              
              {user.bio && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                  {user.bio}
                </p>
              )}
            </div>

            {/* Profile Meta List */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 space-y-3.5">
              {user.company && (
                <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <Building className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate">{user.company}</span>
                </div>
              )}
              {user.location && (
                <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate">{user.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">PAT Aktif & Terverifikasi</span>
              </div>
              <a
                href={user.html_url}
                target="_blank"
                referrerPolicy="no-referrer"
                className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 hover:underline pt-2"
              >
                <span className="flex items-center gap-1">
                  <LinkIcon className="h-3.5 w-3.5" />
                  Buka Profil GitHub
                </span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Account Quick Stats Counter */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm text-center">
              <BookOpen className="h-5 w-5 text-indigo-500 mx-auto mb-2" />
              <p className="text-2xl font-black text-slate-900 dark:text-white">{user.public_repos}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Repo Publik</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm text-center">
              <Award className="h-5 w-5 text-pink-500 mx-auto mb-2" />
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {user.owned_private_repos !== undefined ? user.owned_private_repos : '--'}
              </p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Repo Privat</p>
            </div>
          </div>
        </div>

        {/* Right Columns: Rate Limit & Repositories */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Rate Limit Info Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-indigo-500" />
              Status GitHub API Rate Limit (Kuota API)
            </h3>

            {rateLimit ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                
                {/* Ring Chart */}
                <div className="flex flex-col items-center justify-center p-2">
                  <div className="relative h-28 w-28 flex items-center justify-center">
                    <svg className="absolute transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle 
                        cx="50" cy="50" r="40" 
                        stroke="currentColor" 
                        className="text-slate-100 dark:text-slate-800" 
                        strokeWidth="8" 
                        fill="transparent" 
                      />
                      {/* Active indicator ring */}
                      <circle 
                        cx="50" cy="50" r="40" 
                        stroke="currentColor" 
                        className="text-indigo-500 dark:text-indigo-400 transition-all duration-500" 
                        strokeWidth="8" 
                        fill="transparent" 
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 * (1 - remainingPercentage / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="text-center">
                      <span className="text-xl font-black text-slate-900 dark:text-white">
                        {remainingPercentage}%
                      </span>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Sisa</p>
                    </div>
                  </div>
                </div>

                {/* Details list */}
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 p-3 rounded-xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kuota Tersedia</p>
                      <p className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {rateLimit.remaining} <span className="text-xs font-normal text-slate-500">/ {rateLimit.limit}</span>
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 p-3 rounded-xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Telah Digunakan</p>
                      <p className="text-base font-black text-slate-700 dark:text-slate-300 mt-0.5">
                        {rateLimit.used} <span className="text-xs font-normal text-slate-400">kali</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-900 p-3.5 rounded-xl">
                    <Clock className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span>Batas kuota akan di-reset otomatis pada pukul <strong className="text-slate-800 dark:text-slate-200">{resetDate}</strong>.</span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-6 text-center text-slate-400">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-slate-300" />
                <p className="text-xs">Mengambil informasi rate limit GitHub API...</p>
              </div>
            )}
          </div>

          {/* Repositories Search & List Tab */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            {/* Header dengan Search & Filter */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-indigo-500" />
                  Daftar Repositori ({repos.length})
                </h3>
                
                {/* Filter buttons */}
                <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl self-start sm:self-auto">
                  <button
                    onClick={() => setRepoTypeFilter('all')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      repoTypeFilter === 'all' 
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    Semua ({repos.length})
                  </button>
                  <button
                    onClick={() => setRepoTypeFilter('public')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      repoTypeFilter === 'public' 
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    Publik ({publicCount})
                  </button>
                  <button
                    onClick={() => setRepoTypeFilter('private')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      repoTypeFilter === 'private' 
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    Privat ({privateCount})
                  </button>
                </div>
              </div>

              {/* Search bar input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari repositori berdasarkan nama atau deskripsi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white placeholder-slate-400"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* List Item Repositories */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[350px] overflow-y-auto scrollbar-thin">
              {isLoadingRepos ? (
                <div className="p-12 text-center text-slate-400">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
                  <p className="text-xs">Memuat daftar repositori...</p>
                </div>
              ) : filteredRepos.length > 0 ? (
                filteredRepos.map((repo) => (
                  <div 
                    key={repo.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors group"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-1 p-1.5 bg-slate-100 dark:bg-slate-950 rounded-lg group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/30 transition-colors shrink-0">
                        {repo.private ? (
                          <Lock className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Globe className="h-4 w-4 text-emerald-500" />
                        )}
                      </div>
                      <div className="min-w-0 text-left">
                        <h4 className="text-sm font-bold text-slate-950 dark:text-white truncate">
                          {repo.name}
                        </h4>
                        {repo.description ? (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 max-w-[400px]">
                            {repo.description}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-300 dark:text-slate-650 italic mt-0.5">
                            Tidak ada deskripsi.
                          </p>
                        )}
                        <span className="inline-block mt-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-[10px] font-mono rounded">
                          Default branch: {repo.default_branch}
                        </span>
                      </div>
                    </div>
                    <a
                      href={repo.html_url}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-all shrink-0"
                      title="Lihat di GitHub"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                  Tidak ada repositori ditemukan yang sesuai dengan kriteria.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
};
