/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UploadHistoryItem } from '../types';
import { History, ExternalLink, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface HistoryListProps {
  history: UploadHistoryItem[];
  onClear: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onClear }) => {
  if (history.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 text-left">
      
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
          <History className="h-4.5 w-4.5 text-indigo-500" />
          Riwayat Pengunggahan Sesi Ini
        </h3>
        
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-600 dark:hover:text-red-400"
          title="Bersihkan riwayat sesi"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Bersihkan
        </button>
      </div>

      <div className="space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-xl flex items-center justify-between gap-4 text-xs font-mono"
          >
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-800 dark:text-white truncate max-w-[150px] sm:max-w-xs md:max-w-md">
                  {item.repoName}
                </span>
                <span className="text-[10px] text-slate-400 shrink-0">
                  ({item.fileCount} berkas)
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate max-w-[200px] sm:max-w-sm">
                ZIP: {item.zipName} • {item.timestamp}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {item.status === 'completed' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-100/50 dark:border-emerald-900/40">
                  <CheckCircle className="h-3 w-3" />
                  Sukses
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/20 px-2 py-0.5 rounded border border-red-100/50 dark:border-red-900/40">
                  <XCircle className="h-3 w-3" />
                  Gagal
                </span>
              )}

              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
                  title="Buka Repositori"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
