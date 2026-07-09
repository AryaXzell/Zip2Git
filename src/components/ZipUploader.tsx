/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { UploadCloud, FileArchive, FolderOpen, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { shouldIgnore } from '../utils/zip';

interface ZipUploaderProps {
  onZipSelected: (file: File) => void;
  onFolderSelected: (files: File[]) => void;
  selectedFile: { name: string; size: number } | null;
  onClearFile: () => void;
  uploadMode: 'zip' | 'folder';
  setUploadMode: (mode: 'zip' | 'folder') => void;
}

export const ZipUploader: React.FC<ZipUploaderProps> = ({
  onZipSelected,
  onFolderSelected,
  selectedFile,
  onClearFile,
  uploadMode,
  setUploadMode,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.items) {
      const files: File[] = [];
      const traverseFileTree = async (item: any, path = "") => {
        const itemPath = path + item.name;
        // Skip ignored directories/files early so we don't recurse into giant directories like node_modules
        if (shouldIgnore(itemPath)) {
          return;
        }

        if (item.isFile) {
          const file = await new Promise<File>((resolve) => item.file(resolve));
          // Define a custom path property to match webkitRelativePath
          Object.defineProperty(file, 'webkitRelativePath', {
            value: itemPath,
            writable: false,
          });
          files.push(file);
        } else if (item.isDirectory) {
          const dirReader = item.createReader();
          
          // Read all entries recursively, skipping directory early if ignored
          const readAllEntries = async (reader: any): Promise<any[]> => {
            const allEntries: any[] = [];
            const readBatch = async (): Promise<any[]> => {
              const entries = await new Promise<any[]>((resolve) => reader.readEntries(resolve));
              if (entries.length === 0) {
                return allEntries;
              }
              allEntries.push(...entries);
              return readBatch();
            };
            return readBatch();
          };

          try {
            const entries = await readAllEntries(dirReader);
            for (const entry of entries) {
              await traverseFileTree(entry, itemPath + "/");
            }
          } catch (err) {
            console.error('Failed to read entries from directory:', err);
          }
        }
      };

      const entriesToProcess: any[] = [];
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i].webkitGetAsEntry();
        if (item) {
          entriesToProcess.push(traverseFileTree(item));
        }
      }

      if (entriesToProcess.length > 0) {
        toast.loading('Menganalisis folder...', { id: 'folder-loading' });
        await Promise.all(entriesToProcess);
        toast.dismiss('folder-loading');
        
        if (files.length > 0) {
          if (uploadMode === 'zip' && files.length > 1) {
            setUploadMode('folder');
          }
          onFolderSelected(files);
          toast.success(`Berhasil memuat folder dengan ${files.length} berkas!`);
        } else {
          toast.error('Tidak ada berkas valid yang ditemukan.');
        }
        return;
      }
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (uploadMode === 'zip') {
        const file = e.dataTransfer.files[0];
        validateAndSetZip(file);
      } else {
        onFolderSelected(Array.from(e.dataTransfer.files));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetZip(file);
    }
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFolderSelected(filesArray);
      toast.success(`Folder dengan ${filesArray.length} berkas berhasil dimuat!`);
    }
  };

  const validateAndSetZip = (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isZip = fileExtension === 'zip' || file.type === 'application/zip' || file.type === 'application/x-zip-compressed';
    
    if (!isZip) {
      toast.error('Berkas harus berformat .ZIP!');
      return;
    }

    onZipSelected(file);
    toast.success(`Berkas "${file.name}" berhasil dimuat!`);
  };

  const handleContainerClick = () => {
    if (selectedFile) return;
    if (uploadMode === 'zip' && fileInputRef.current) {
      fileInputRef.current.click();
    } else if (uploadMode === 'folder' && folderInputRef.current) {
      folderInputRef.current.click();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2.5">
        <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
          {uploadMode === 'zip' ? (
            <FileArchive className="h-4.5 w-4.5 text-indigo-500" />
          ) : (
            <FolderOpen className="h-4.5 w-4.5 text-indigo-500" />
          )}
          Unggah Kode Proyek
        </h3>

        {/* Custom Segmented Control */}
        {!selectedFile && (
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/40 dark:border-slate-800/80 text-[10px] font-bold">
            <button
              onClick={() => setUploadMode('zip')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                uploadMode === 'zip'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Arsip ZIP
            </button>
            <button
              onClick={() => setUploadMode('folder')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                uploadMode === 'folder'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Folder Langsung
            </button>
          </div>
        )}
      </div>

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleContainerClick}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleContainerClick();
            }
          }}
          className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 dark:border-indigo-500/50 dark:bg-indigo-950/20'
              : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50 dark:border-slate-800 dark:hover:border-indigo-500/30 dark:hover:bg-slate-900/40'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".zip,application/zip,application/x-zip-compressed"
            className="hidden"
          />
          <input
            type="file"
            ref={folderInputRef}
            onChange={handleFolderChange}
            {...({ webkitdirectory: "", directory: "" } as any)}
            multiple
            className="hidden"
          />

          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-full border border-slate-100 dark:border-slate-800 text-slate-400">
            <UploadCloud className="h-8 w-8 text-indigo-500 animate-pulse" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800 dark:text-white">
              {uploadMode === 'zip'
                ? 'Seret & lepas berkas ZIP di sini'
                : 'Seret & lepas FOLDER proyek di sini'}
            </p>
            <p className="text-xs text-slate-400">
              Atau klik untuk menelusuri penyimpanan lokal Anda
            </p>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
            {uploadMode === 'zip'
              ? 'Hanya mendukung berkas .ZIP. Folder node_modules, dist, .DS_Store, dan .git otomatis diabaikan.'
              : 'Pilih direktori proyek secara langsung. Berkas dependensi dan cache otomatis disaring keluar.'}
          </p>
        </div>
      ) : (
        <div className="p-4 bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100/60 dark:border-indigo-900/30 rounded-xl flex items-center justify-between text-left">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-indigo-500 text-white rounded-lg shrink-0">
              {uploadMode === 'zip' ? (
                <FileArchive className="h-5 w-5" />
              ) : (
                <FolderOpen className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-400 font-mono">
                {selectedFile.size > 0
                  ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                  : 'Struktur Folder'}
              </p>
            </div>
          </div>
          <button
            onClick={onClearFile}
            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500/30"
            title="Hapus berkas"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      )}
    </div>
  );
};
