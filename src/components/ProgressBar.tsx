/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UploadProgress } from '../types';
import { 
  Sparkles, 
  Loader2, 
  Hourglass, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';

interface ProgressBarProps {
  progress: UploadProgress;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const { status, percent, currentFile, uploadedCount, totalCount, estimatedSecondsRemaining, error } = progress;

  if (status === 'idle') return null;

  // Format estimated time
  const formatETA = (seconds: number): string => {
    if (seconds <= 0 || !isFinite(seconds)) return 'Menghitung...';
    if (seconds < 60) return `${Math.ceil(seconds)} detik`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return `${mins} m ${secs} s`;
  };

  const getStatusText = () => {
    switch (status) {
      case 'extracting':
        return 'Mengekstrak arsip ZIP sedia kala...';
      case 'uploading':
        return 'Mengirimkan berkas ke repositori GitHub...';
      case 'completed':
        return 'Pengunggahan berhasil diselesaikan!';
      case 'failed':
        return 'Pengunggahan gagal.';
      default:
        return 'Memproses...';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'extracting':
        return <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />;
      case 'uploading':
        return <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 text-left">
      
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
          {getStatusIcon()}
          {getStatusText()}
        </h3>
        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">
          {percent.toFixed(0)}%
        </span>
      </div>

      {/* Progress Track */}
      <div className="space-y-2">
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              status === 'failed'
                ? 'bg-red-500'
                : status === 'completed'
                ? 'bg-emerald-500'
                : 'bg-indigo-600 dark:bg-indigo-500 animate-pulse'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Dynamic sub-info */}
        <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <span>
            {uploadedCount} / {totalCount} berkas
          </span>
          {status === 'uploading' && (
            <span className="flex items-center gap-1">
              <Hourglass className="h-3 w-3" />
              Sisa waktu: <strong>{formatETA(estimatedSecondsRemaining)}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Current file path indicator */}
      {status === 'uploading' && currentFile && (
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
          <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
            Mengunggah berkas:
          </p>
          <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 truncate">
            {currentFile}
          </p>
        </div>
      )}

      {/* Completed Success Message */}
      {status === 'completed' && (
        <div className="p-3.5 bg-emerald-50/50 border border-emerald-100/60 dark:bg-emerald-950/20 dark:border-emerald-900/40 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-400">
          <Sparkles className="h-4.5 w-4.5 shrink-0 text-emerald-500" />
          <span>
            Seluruh berkas berhasil dikirimkan! Repositori Anda sekarang siap digunakan di GitHub.
          </span>
        </div>
      )}

      {/* Error Output */}
      {status === 'failed' && error && (
        <div className="p-3.5 bg-red-50/50 border border-red-100/60 dark:bg-red-950/20 dark:border-red-900/40 rounded-xl flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-red-500" />
          <div className="space-y-1">
            <span className="font-bold">Gagal mengunggah kode:</span>
            <p className="font-mono text-[11px] leading-relaxed">{error}</p>
          </div>
        </div>
      )}

    </div>
  );
};
