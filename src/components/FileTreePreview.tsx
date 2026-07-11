/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ZipFileInfo } from '../types';
import { formatBytes } from '../utils/zip';
import { FileText, ListCollapse, Search, Eye, X, Copy, Check, EyeOff, ShieldAlert, Filter } from 'lucide-react';
import JSZip from 'jszip';
import toast from 'react-hot-toast';

interface FileTreePreviewProps {
  info: ZipFileInfo | null;
  zipInstance: JSZip | null;
  shaMap?: Map<string, string> | null;
  isLoadingShaMap?: boolean;
  excludedFiles?: Set<string>;
  onToggleFile?: (path: string) => void;
  onToggleMultipleFiles?: (paths: string[], exclude: boolean) => void;
  onToggleAll?: (selectNone: boolean) => void;
}

export const FileTreePreview: React.FC<FileTreePreviewProps> = ({ 
  info, 
  zipInstance, 
  shaMap = null,
  isLoadingShaMap = false,
  excludedFiles = new Set(),
  onToggleFile,
  onToggleMultipleFiles,
  onToggleAll
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFileContent, setActiveFileContent] = useState<string | null>(null);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isViewing, setIsViewing] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveFileContent(null);
        setActiveFileName(null);
      }
    };
    if (activeFileContent !== null) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeFileContent]);
  
  const [extFilter, setExtFilter] = useState<string>('all');

  if (!info) return null;

  // Filter based on search and extension category
  const filteredFiles = info.files.filter((file) => {
    const matchesSearch = file.path.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    if (extFilter === 'all') return true;
    
    const ext = file.path.split('.').pop()?.toLowerCase() || '';
    if (extFilter === 'code') {
      return ['ts', 'tsx', 'js', 'jsx', 'html', 'css', 'py', 'sh', 'php', 'rb', 'go', 'java', 'cpp', 'h'].includes(ext);
    }
    if (extFilter === 'config') {
      return ['json', 'yaml', 'yml', 'xml', 'toml', 'config', 'properties', 'gradle'].includes(ext);
    }
    if (extFilter === 'media') {
      return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'mp3', 'mp4', 'woff', 'woff2', 'ttf'].includes(ext);
    }
    if (extFilter === 'doc') {
      return ['md', 'txt', 'pdf', 'license'].includes(ext);
    }
    return true;
  });

  // Analyze files for recommendations (Sensitive, junk, or heavy files not currently excluded)
  const getScanRecommendations = () => {
    const sensitive: string[] = [];
    const heavy: string[] = [];
    const junk: string[] = [];
    
    info.files.forEach(file => {
      const pathLower = file.path.toLowerCase();
      const ext = pathLower.split('.').pop() || '';
      
      // Skip if already in excludedFiles set
      if (excludedFiles.has(file.path)) return;
      
      // Sensitive files (keys, env)
      if (
        pathLower.includes('.env') ||
        pathLower.includes('secret') ||
        ['pem', 'key', 'pfx', 'keystore', 'jks'].includes(ext) ||
        pathLower.endsWith('id_rsa') ||
        pathLower.endsWith('id_dsa')
      ) {
        sensitive.push(file.path);
      }
      // Junk files (temporary / system trash)
      else if (
        pathLower.includes('.ds_store') ||
        pathLower.includes('thumbs.db') ||
        pathLower.includes('desktop.ini') ||
        ext === 'tmp' ||
        ext === 'bak' ||
        pathLower.includes('__pycache__') ||
        pathLower.endsWith('.pyc')
      ) {
        junk.push(file.path);
      }
      // Heavy/Archive files (>2MB or package artifacts)
      else if (
        ['zip', 'rar', '7z', 'tar', 'gz', 'mp4', 'mov', 'exe', 'msi', 'dmg', 'apk'].includes(ext) ||
        file.size > 2 * 1024 * 1024 // > 2MB
      ) {
        heavy.push(file.path);
      }
    });
    
    return { sensitive, heavy, junk };
  };

  const recommendations = getScanRecommendations();
  const totalRecs = recommendations.sensitive.length + recommendations.heavy.length + recommendations.junk.length;

  const handleExcludeFiltered = () => {
    if (filteredFiles.length === 0) return;
    
    if (onToggleMultipleFiles) {
      const toExclude = filteredFiles.map(f => f.path);
      onToggleMultipleFiles(toExclude, true);
    } else if (onToggleFile) {
      filteredFiles.forEach(file => {
        if (!excludedFiles.has(file.path)) {
          onToggleFile(file.path);
        }
      });
    }
    toast.success(`Berhasil mengabaikan ${filteredFiles.length} berkas hasil filter.`);
  };

  const handleIncludeFiltered = () => {
    if (filteredFiles.length === 0) return;
    
    if (onToggleMultipleFiles) {
      const toInclude = filteredFiles.map(f => f.path);
      onToggleMultipleFiles(toInclude, false);
    } else if (onToggleFile) {
      filteredFiles.forEach(file => {
        if (excludedFiles.has(file.path)) {
          onToggleFile(file.path);
        }
      });
    }
    toast.success(`Berhasil menyertakan ${filteredFiles.length} berkas hasil filter.`);
  };

  // Count New vs Overwrite files
  let newFilesCount = 0;
  let overwriteFilesCount = 0;

  if (shaMap) {
    info.files.forEach(file => {
      if (shaMap.has(file.path)) {
        overwriteFilesCount++;
      } else {
        newFilesCount++;
      }
    });
  }

  // Find size of the currently active file in the preview modal
  const activeFileMeta = info.files.find(f => f.path === activeFileName);
  const activeFileSizeStr = activeFileMeta ? formatBytes(activeFileMeta.size) : '';

  const handleViewFile = async (path: string) => {
    if (!zipInstance) return;
    const fileObj = zipInstance.file(path);
    if (!fileObj) {
      toast.error('Berkas tidak ditemukan dalam memori.');
      return;
    }

    try {
      setIsViewing(true);
      const ext = path.split('.').pop()?.toLowerCase();
      const isBinary = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'zip', 'pdf', 'mp3', 'mp4', 'woff', 'woff2', 'ttf'].includes(ext || '');
      
      if (isBinary) {
        setActiveFileContent('⚠️ Berkas biner (Gambar/Media/Dokumen) tidak dapat ditampilkan sebagai teks.');
        setActiveFileName(path);
        return;
      }

      const text = await fileObj.async('text');
      setActiveFileContent(text || '// Berkas kosong');
      setActiveFileName(path);
    } catch (err) {
      toast.error('Gagal membaca isi berkas.');
    } finally {
      setIsViewing(false);
    }
  };

  const handleCopy = () => {
    if (!activeFileContent) return;
    navigator.clipboard.writeText(activeFileContent);
    setCopied(true);
    toast.success('Isi berkas berhasil disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 text-left">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-3">
        <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
          <ListCollapse className="h-4.5 w-4.5 text-indigo-500" />
          Pratinjau Struktur Proyek
        </h3>
        
        {/* Statistics badge */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300">
            Berkas: <strong>{info.totalFiles}</strong>
          </span>
          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300">
            Folder: <strong>{info.totalFolders}</strong>
          </span>
          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300">
            Ukuran: <strong>{formatBytes(info.size)}</strong>
          </span>
        </div>
      </div>

      {/* Git status legends if shaMap is available */}
      {shaMap && (
        <div className="flex flex-col gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2.5">
          <div className="flex items-center gap-4 text-[10px] font-mono">
            <span className="text-slate-400">Analisis Perubahan:</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              {newFilesCount} Berkas Baru
            </span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              {overwriteFilesCount} Berkas Ditimpa
            </span>
          </div>
          {shaMap && (shaMap as any).truncated && (
            <div className="p-2 bg-amber-50/70 border border-amber-200/40 dark:bg-amber-950/20 dark:border-amber-900/40 rounded-lg text-[10px] text-amber-800 dark:text-amber-400 font-medium">
              ⚠️ <strong>Repositori Sangat Besar:</strong> Sebagian berkas di GitHub mungkin tidak masuk daftar deteksi otomatis, tetapi proses unggah akan tetap aman berjalan dan menimpa jika berkas sudah ada.
            </div>
          )}
        </div>
      )}

      {/* Dynamic Selection Summary Widget */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-150 dark:border-slate-800/80">
        <div className="space-y-1">
          <div className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Total Terpilih</div>
          <div className="text-xs font-extrabold text-slate-800 dark:text-white font-mono">
            {info.files.length - excludedFiles.size} <span className="text-[9px] text-slate-400 font-normal">/ {info.files.length}</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Dikecualikan</div>
          <div className="text-xs font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            {excludedFiles.size} <span className="text-[9px] text-slate-400 font-normal">berkas</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Komitmen Baru</div>
          <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {shaMap ? info.files.filter(f => !excludedFiles.has(f.path) && !shaMap.has(f.path)).length : info.files.filter(f => !excludedFiles.has(f.path)).length} <span className="text-[9px] text-slate-400 font-normal font-sans">bks</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Menimpa</div>
          <div className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
            {shaMap ? info.files.filter(f => !excludedFiles.has(f.path) && shaMap.has(f.path)).length : 0} <span className="text-[9px] text-slate-400 font-normal font-sans">bks</span>
          </div>
        </div>
      </div>

      {isLoadingShaMap && (
        <div className="flex items-center gap-2 text-[10px] text-indigo-500 font-mono animate-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping"></span>
          Menghubungkan status berkas dengan repositori aktif...
        </div>
      )}

      {/* Scan Recommendations Card */}
      {totalRecs > 0 && (
        <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-150 dark:border-amber-900/30 rounded-xl space-y-2.5 animate-fade-in text-xs">
          <div className="flex items-start gap-2.5 text-amber-800 dark:text-amber-400">
            <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Rekomendasi Pengabaian Berkas</p>
              <p className="text-slate-600 dark:text-slate-400">
                Ada beberapa berkas sensitif, cadangan, atau media besar yang biasanya tidak perlu dimasukkan ke Git:
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1.5 pl-6.5">
            {recommendations.sensitive.length > 0 && (
              <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30 rounded text-[10px] text-rose-700 dark:text-rose-400 font-medium">
                🔑 {recommendations.sensitive.length} Rahasia / Env
              </span>
            )}
            {recommendations.heavy.length > 0 && (
              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 rounded text-[10px] text-blue-700 dark:text-blue-400 font-medium">
                📦 {recommendations.heavy.length} Berkas Besar (&gt;2MB/Arsip)
              </span>
            )}
            {recommendations.junk.length > 0 && (
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-700 rounded text-[10px] text-slate-700 dark:text-slate-300 font-medium">
                🗑️ {recommendations.junk.length} Sampah / Temp
              </span>
            )}
          </div>

          <div className="flex justify-end pl-6.5 pt-1">
            <button
              onClick={() => {
                const allToExclude = [
                  ...recommendations.sensitive,
                  ...recommendations.heavy,
                  ...recommendations.junk
                ];
                if (onToggleMultipleFiles) {
                  onToggleMultipleFiles(allToExclude, true);
                } else if (onToggleFile) {
                  allToExclude.forEach(p => {
                    if (!excludedFiles.has(p)) {
                      onToggleFile(p);
                    }
                  });
                }
                toast.success(`Berhasil mengabaikan ${allToExclude.length} berkas yang direkomendasikan.`);
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1"
            >
              Abaikan Semua Berkas Ini ⚡
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search */}
      <div className="space-y-2.5 pt-1">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berkas dalam arsip..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
          {onToggleAll && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => onToggleAll(false)}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
              >
                Pilih Semua
              </button>
              <button
                onClick={() => onToggleAll(true)}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
              >
                Kosongkan
              </button>
            </div>
          )}
        </div>

        {/* Extension category pill filters */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" />
            Saring tipe:
          </span>
          {[
            { id: 'all', label: 'Semua berkas' },
            { id: 'code', label: 'Kode (.ts, .js, .py, ...)' },
            { id: 'config', label: 'Konfig (.json, .xml, ...)' },
            { id: 'media', label: 'Media (.png, .svg, ...)' },
            { id: 'doc', label: 'Dokumen (.md, .txt, ...)' },
          ].map((cat) => {
            const isSelected = extFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setExtFilter(cat.id)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white font-bold'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-950 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Bulk Filter Actions (Ignore/Include all filtered files) */}
        {(searchQuery.trim() !== '' || extFilter !== 'all') && (
          <div className="p-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/80 rounded-xl flex items-center justify-between gap-3 text-[11px] animate-fade-in">
            <span className="text-slate-500 font-medium text-left">
              Menampilkan <strong className="text-slate-800 dark:text-slate-200">{filteredFiles.length}</strong> dari {info.files.length} berkas hasil penyaringan.
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleIncludeFiltered}
                disabled={filteredFiles.length === 0}
                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/35 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold rounded-lg text-[10px] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sertakan Semua ✓
              </button>
              <button
                onClick={handleExcludeFiltered}
                disabled={filteredFiles.length === 0}
                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 dark:bg-rose-950/20 dark:hover:bg-rose-950/35 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 font-bold rounded-lg text-[10px] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Abaikan Semua ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* File List Scroll Container */}
      <div className="border border-slate-150 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
        <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file, idx) => {
              const parts = file.path.split('/');
              const name = parts.pop();
              const dir = parts.join('/');
              
              // Determine status
              const alreadyExists = shaMap ? shaMap.has(file.path) : false;
              const isExcluded = excludedFiles.has(file.path);

              return (
                <div
                  key={idx}
                  className={`px-3.5 py-2 hover:bg-slate-100/50 dark:hover:bg-slate-900/30 flex items-center justify-between gap-4 group transition-colors ${isExcluded ? 'opacity-45 line-through bg-slate-100/10' : ''}`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {onToggleFile && (
                      <input
                        type="checkbox"
                        checked={!isExcluded}
                        onChange={() => onToggleFile(file.path)}
                        className="h-3.5 w-3.5 rounded text-indigo-600 focus:ring-indigo-500/30 dark:bg-slate-950 dark:border-slate-850 cursor-pointer border-slate-300 dark:border-slate-800 shrink-0"
                      />
                    )}
                    <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <div className="truncate text-left flex-1">
                      {dir && (
                        <span className="text-slate-400 dark:text-slate-500 text-[10px] mr-1.5">
                          {dir}/
                        </span>
                      )}
                      <span className={`font-medium ${isExcluded ? 'text-slate-400 dark:text-slate-600' : 'text-slate-800 dark:text-slate-200'}`}>{name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {shaMap && (
                      alreadyExists ? (
                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-100/30 dark:border-amber-900/30 scale-90">
                          TIMPA
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-100/30 dark:border-emerald-900/30 scale-90">
                          BARU
                        </span>
                      )
                    )}

                    <span className="text-[10px] text-slate-500 font-semibold bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800/80">
                      {formatBytes(file.size)}
                    </span>

                    {/* Interactive Eye/Inspect Button */}
                    <button
                      onClick={() => handleViewFile(file.path)}
                      disabled={isViewing}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                      title="Lihat isi berkas"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              Tidak ada berkas yang cocok dengan pencarian Anda.
            </div>
          )}
        </div>
      </div>

      {info.totalFiles > 150 && (
        <div className="p-3 bg-amber-50 border border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-900/40 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-800 dark:text-amber-400">
          <span className="font-bold shrink-0 mt-0.5">⚠️ Catatan:</span>
          <span>
            Arsip ini berisi lebih dari 150 berkas ({info.totalFiles} berkas). Mengingat batas kecepatan API GitHub (5.000 panggilan/jam), proses unggah mungkin memerlukan beberapa menit dan menghabiskan sebagian kuota API Anda.
          </span>
        </div>
      )}

      {/* Custom Clean File Content Viewer Modal */}
      {activeFileContent !== null && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveFileContent(null);
              setActiveFileName(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/40 font-sans">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-white truncate">
                    {activeFileName}
                  </span>
                  {activeFileSizeStr && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                      Ukuran: {activeFileSizeStr}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                {onToggleFile && activeFileName && (
                  <button
                    onClick={() => onToggleFile(activeFileName)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                      excludedFiles.has(activeFileName)
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400'
                        : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400'
                    }`}
                    title={excludedFiles.has(activeFileName) ? "Sertakan berkas ini dalam proses komit" : "Kecualikan berkas ini dari proses komit"}
                  >
                    {excludedFiles.has(activeFileName) ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Sertakan Berkas
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        Kecualikan Berkas
                      </>
                    )}
                  </button>
                )}
                
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

                <button
                  onClick={handleCopy}
                  className="p-1.5 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Salin isi berkas"
                >
                  {copied ? <Check className="h-4.5 w-4.5 text-emerald-500" /> : <Copy className="h-4.5 w-4.5" />}
                </button>
                <button
                  onClick={() => {
                    setActiveFileContent(null);
                    setActiveFileName(null);
                  }}
                  className="p-1.5 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                  title="Tutup"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Preformatted Code with Line Numbers */}
            <div className="flex-1 overflow-auto bg-slate-950 text-slate-300 font-mono text-xs text-left leading-relaxed flex">
              {activeFileContent !== null && (
                <div className="w-full flex select-text">
                  {/* Line numbers column */}
                  <div className="select-none text-right text-slate-600 bg-slate-900/30 px-3 py-4 border-r border-slate-900/80 min-w-[3.25rem] shrink-0 font-mono text-[11px] leading-5">
                    {activeFileContent.split('\n').map((_, index) => (
                      <div key={index}>{index + 1}</div>
                    ))}
                  </div>
                  {/* Code column */}
                  <pre className="p-4 whitespace-pre select-text flex-1 overflow-x-auto text-[11px] leading-5">
                    <code>{activeFileContent}</code>
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-950/40 font-mono">
              <span className="flex items-center gap-1">
                Status: {activeFileName && excludedFiles.has(activeFileName) ? (
                  <span className="text-rose-500 font-bold">❌ DIABAIKAN</span>
                ) : (
                  <span className="text-emerald-500 font-bold">✓ AKAN DIUNGGAH</span>
                )}
              </span>
              <span>Tekan ESC untuk menutup</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
