/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { 
  Settings, 
  Sun, 
  Moon, 
  User, 
  LogOut, 
  ShieldAlert, 
  Code2, 
  Sparkles,
  Info,
  GitBranch
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, settings, toggleTheme, updateSettings, logout } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'tampilan' | 'git' | 'sesi' | 'tentang'>('tampilan');

  // Route protection
  useEffect(() => {
    if (!user) {
      const isLoggingOut = sessionStorage.getItem('zip2git_logging_out');
      if (isLoggingOut) {
        sessionStorage.removeItem('zip2git_logging_out');
        navigate('/login');
        return;
      }
      navigate('/login');
    }
  }, [user, navigate]);

  const getTabClass = (tab: 'tampilan' | 'git' | 'sesi' | 'tentang') => {
    const isSelected = activeTab === tab;
    return `w-full text-left flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
      isSelected
        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/30 dark:border-indigo-900/40 shadow-sm'
        : 'text-slate-600 hover:bg-slate-100/50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900/50 dark:hover:text-slate-200'
    }`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 text-left">
      
      {/* Page Header */}
      <div className="space-y-1.5 border-b border-slate-250 dark:border-slate-800 pb-4">
        <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
          <Settings className="h-5.5 w-5.5 text-indigo-500" />
          Pengaturan Aplikasi
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Kelola preferensi tampilan, sesi keamanan, dan pelajari detail arsitektur Zip2Git.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-2">
          <button
            onClick={() => setActiveTab('tampilan')}
            className={getTabClass('tampilan')}
          >
            <Sun className="h-4 w-4" />
            Tema & Tampilan
          </button>
          <button
            onClick={() => setActiveTab('git')}
            className={getTabClass('git')}
          >
            <GitBranch className="h-4 w-4" />
            Git & Preferensi Upload
          </button>
          <button
            onClick={() => setActiveTab('sesi')}
            className={getTabClass('sesi')}
          >
            <User className="h-4 w-4" />
            Detail Sesi Sampingan
          </button>
          <button
            onClick={() => setActiveTab('tentang')}
            className={getTabClass('tentang')}
          >
            <Info className="h-4 w-4" />
            Tentang Zip2Git
          </button>
        </div>

        {/* Configurations List */}
        <div className="md:col-span-2">
          
          {/* Theme selection */}
          {activeTab === 'tampilan' && (
            <section id="tampilan" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-sm tracking-tight flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Sun className="h-4.5 w-4.5 text-indigo-500" />
                Tema & Tampilan
              </h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-white">Ubah Tema Antarmuka</p>
                  <p className="text-[11px] text-slate-400 leading-normal max-w-[280px]">
                    Pilih antara tema Gelap (bawaan) atau Terang sesuai preferensi kenyamanan mata Anda.
                  </p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {settings.theme === 'dark' ? (
                    <>
                      <Sun className="h-3.5 w-3.5" />
                      Mode Terang
                    </>
                  ) : (
                    <>
                      <Moon className="h-3.5 w-3.5" />
                      Mode Gelap
                    </>
                  )}
                </button>
              </div>
            </section>
          )}

          {/* Git & Repository Preferences */}
          {activeTab === 'git' && (
            <section id="git" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-sm tracking-tight flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <GitBranch className="h-4.5 w-4.5 text-indigo-500" />
                Git & Preferensi Upload
              </h3>

              <div className="space-y-4">
                {/* Default branch */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-white">
                    Default Target Branch
                  </label>
                  <input
                    type="text"
                    value={settings.defaultBranch || 'main'}
                    onChange={(e) => updateSettings({ defaultBranch: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    placeholder="Contoh: main, master, production"
                  />
                  <p className="text-[10px] text-slate-400">
                    Branch default target yang akan diisi otomatis saat memilih repositori.
                  </p>
                </div>

                {/* Default commit message */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-white">
                    Template Pesan Commit
                  </label>
                  <input
                    type="text"
                    value={settings.defaultCommitMessage || 'Upload via Zip2Git 📦'}
                    onChange={(e) => updateSettings({ defaultCommitMessage: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    placeholder="Contoh: Initial commit"
                  />
                  <p className="text-[10px] text-slate-400">
                    Pesan commit default untuk file-file yang diunggah ke repositori GitHub.
                  </p>
                </div>

                {/* Auto overwrite toggle */}
                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-white">Deteksi & Timpa Otomatis</p>
                    <p className="text-[10px] text-slate-400 leading-normal max-w-xs sm:max-w-md">
                      Secara otomatis menyelesaikan SHA bentrok dan menimpa berkas yang sudah ada tanpa kegagalan.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoOverwrite ?? true}
                      onChange={(e) => updateSettings({ autoOverwrite: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Metode Upload (Sequential vs Parallel) */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                  <div className="space-y-0.5">
                    <label className="block text-xs font-bold text-slate-800 dark:text-white">
                      Metode Pengunggahan Berkas
                    </label>
                    <p className="text-[10px] text-slate-400 leading-normal max-w-xs sm:max-w-md">
                      Pilih bagaimana berkas Anda diunggah ke GitHub. Pengunggahan paralel mempercepat proses namun menggunakan lebih banyak batas API sekaligus.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => updateSettings({ uploadMethod: 'sequential' })}
                      className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        settings.uploadMethod === 'sequential'
                          ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                      }`}
                    >
                      <span className="text-xs font-bold flex items-center gap-1">
                        ⏱️ Sekuensial
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-normal">
                        Unggah satu demi satu. Sangat aman dari limitasi secondary rate limit GitHub API.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateSettings({ uploadMethod: 'parallel' })}
                      className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        settings.uploadMethod === 'parallel'
                          ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                      }`}
                    >
                      <span className="text-xs font-bold flex items-center gap-1">
                        ⚡ Paralel
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-normal">
                        Unggah beberapa berkas sekaligus secara bersamaan untuk kecepatan maksimal.
                      </span>
                    </button>
                  </div>
                </div>

                {/* Parallel Limit (Only shown if Parallel is selected) */}
                {settings.uploadMethod === 'parallel' && (
                  <div className="space-y-2 pl-3 border-l-2 border-indigo-500/30 dark:border-indigo-500/20">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800 dark:text-white">
                        Batas Konkurensi Paralel (Simultan)
                      </label>
                      <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md">
                        {settings.parallelLimit || 10} Berkas
                      </span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="150"
                      step="1"
                      value={settings.parallelLimit || 10}
                      onChange={(e) => updateSettings({ parallelLimit: parseInt(e.target.value, 10) })}
                      className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[5, 10, 25, 50, 100, 150].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => updateSettings({ parallelLimit: val })}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                            (settings.parallelLimit || 10) === val
                              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                          }`}
                        >
                          {val}x
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal pt-1">
                      Rekomendasi: <strong>5-10 berkas</strong>. Menyetel batas di atas 10 (seperti 25, 50, 100, atau 150) mempercepat unggahan proyek masif secara ekstrim, namun meningkatkan risiko pemblokiran rate limit sementara oleh API GitHub jika token Anda memiliki batasan ketat.
                    </p>
                  </div>
                )}

                {/* Custom ignore rules */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <label className="block text-xs font-bold text-slate-800 dark:text-white">
                    Aturan Abaikan Kustom (.gitignore style)
                  </label>
                  <textarea
                    rows={4}
                    value={settings.customIgnoreRules || ''}
                    onChange={(e) => updateSettings({ customIgnoreRules: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 leading-relaxed resize-y"
                    placeholder="# Contoh:&#10;*.jks&#10;*.pem&#10;*.apk&#10;local.properties"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Tulis ekstensi file, nama file, atau nama folder yang ingin diabaikan saat proses parsing ZIP (satu per baris). Format mendukung wildcard seperti <code>*.ext</code>.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Session settings */}
          {activeTab === 'sesi' && (
            <section id="sesi" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-sm tracking-tight flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <User className="h-4.5 w-4.5 text-indigo-500" />
                Sesi Otentikasi GitHub
              </h3>

              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-xl">
                    <img src={user.avatar_url} alt={user.login} className="h-10 w-10 rounded-full" />
                    <div className="space-y-0.5 text-left">
                      <p className="text-xs font-extrabold text-slate-800 dark:text-white">{user.name || user.login}</p>
                      <p className="text-[10px] text-slate-400 font-mono">@{user.login} • UID: {user.id}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-white">Status Penyimpanan PAT</p>
                      <p className="text-[11px] text-slate-400 leading-normal max-w-[280px]">
                        Token PAT aktif disimpan di dalam <code>sessionStorage</code> peramban Anda. Token tidak akan disimpan permanen.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const loggedOut = logout();
                        if (loggedOut) {
                          navigate('/login');
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Keluar Sesi
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Tidak ada sesi otentikasi aktif. Silakan masuk terlebih dahulu di menu utama.
                </div>
              )}
            </section>
          )}

          {/* About section */}
          {activeTab === 'tentang' && (
            <section id="tentang" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-sm tracking-tight flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Info className="h-4.5 w-4.5 text-indigo-500" />
                Tentang Zip2Git
              </h3>
              
              <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <p>
                  <strong>Zip2Git</strong> dikembangkan sebagai solusi migrasi kode sumber yang cepat, aman, dan tanpa hambatan bagi para pengembang perangkat lunak. Tanpa perlu memasang Git Client di perangkat Anda, Anda dapat langsung mengunggah arsip proyek dalam format ZIP ke repositori GitHub.
                </p>
                
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl space-y-2">
                  <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Code2 className="h-4 w-4 text-indigo-500" />
                    Stack Teknologi Utama:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] pl-1">
                    <li><strong>Vite + React (TypeScript):</strong> Mesin antarmuka responsif dan teroptimasi.</li>
                    <li><strong>Tailwind CSS:</strong> Kerangka desain utilitas tinggi dengan mode gelap elegan.</li>
                    <li><strong>JSZip Engine:</strong> Dekompresi arsip ZIP langsung di memori peramban klien.</li>
                    <li><strong>GitHub REST API:</strong> Integrasi langsung dengan backend tepercaya milik GitHub.</li>
                  </ul>
                </div>

                <div className="p-3.5 bg-indigo-50/20 border border-indigo-100/40 dark:bg-indigo-950/20 dark:border-indigo-900/40 rounded-xl flex items-start gap-2.5">
                  <ShieldAlert className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-indigo-950 dark:text-indigo-400">Prinsip Privasi:</p>
                    <p className="text-[11px] leading-relaxed">
                      Kode sumber Anda adalah hak milik penuh Anda. Aplikasi ini tidak memiliki penyimpanan basis data pihak ketiga. Transmisi kode dilakukan secara langsung dan aman (point-to-point) dari memori peramban Anda ke server GitHub (API) menggunakan Personal Access Token (PAT) yang Anda simpan sementara di sessionStorage peramban.
                    </p>
                  </div>
                </div>

              </div>
            </section>
          )}

        </div>

      </div>

    </div>
  );
};
