/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ZipFileInfo } from '../types';
import { formatBytes } from '../utils/zip';
import { FileText, ListCollapse, Search, Eye, X, Copy, Check } from 'lucide-react';
import JSZip from 'jszip';
import toast from 'react-hot-toast';

interface FileTreePreviewProps {
  info: ZipFileInfo | null;
  zipInstance: JSZip | null;
  shaMap?: Map<string, string> | null;
  isLoadingShaMap?: boolean;
}

export const FileTreePreview: React.FC<FileTreePreviewProps> = ({ 
  info, 
  zipInstance, 
  shaMap = null,
  isLoadingShaMap = false
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
  
  if (!info) return null;

  const filteredFiles = info.files.filter((file) =>
    file.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      {isLoadingShaMap && (
        <div className="flex items-center gap-2 text-[10px] text-indigo-500 font-mono animate-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping"></span>
          Menghubungkan status berkas dengan repositori aktif...
        </div>
      )}

      {/* Filter and Search */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari berkas dalam arsip..."
          className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white"
        />
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
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

              return (
                <div
                  key={idx}
                  className="px-3.5 py-2 hover:bg-slate-100/50 dark:hover:bg-slate-900/30 flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <div className="truncate text-left flex-1">
                      {dir && (
                        <span className="text-slate-400 dark:text-slate-500 text-[10px] mr-1.5">
                          {dir}/
                        </span>
                      )}
                      <span className="text-slate-800 dark:text-slate-200 font-medium">{name}</span>
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
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-white truncate">
                  {activeFileName}
                </span>
              </div>
              <div className="flex items-center gap-2">
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

            {/* Modal Body / Preformated Code */}
            <div className="flex-1 p-5 overflow-auto bg-slate-950 text-slate-300 font-mono text-xs text-left leading-relaxed">
              <pre className="whitespace-pre-wrap select-text">
                <code>
                  {activeFileContent}
                </code>
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-950/40 font-mono">
              <span>Encoding: UTF-8</span>
              <span>Tekan ESC untuk menutup</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
