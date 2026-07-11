/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { RepoSelector } from '../components/RepoSelector';
import { ZipUploader } from '../components/ZipUploader';
import { FileTreePreview } from '../components/FileTreePreview';
import { ProgressBar } from '../components/ProgressBar';
import { HistoryList } from '../components/HistoryList';
import { GitHubRepo, ZipFileInfo, UploadProgress } from '../types';
import { parseZipFile, fileToBase64, createZipFromFiles } from '../utils/zip';
import { 
  getRepoTree, 
  uploadFile, 
  createBlob, 
  createTree, 
  createCommit, 
  getBranchRef, 
  updateRef, 
  createRef,
  TreeItem 
} from '../services/github';
import { 
  GitCommit, 
  Play, 
  Sparkles, 
  HelpCircle,
  LogOut,
  FolderOpen,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import JSZip from 'jszip';

export const Dashboard: React.FC = () => {
  const { user, token, history, clearHistory, logout, addHistoryItem, settings } = useApp();
  const navigate = useNavigate();

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

  // Form states
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [targetBranch, setTargetBranch] = useState(settings.defaultBranch || 'main');
  const [commitMessage, setCommitMessage] = useState(settings.defaultCommitMessage || 'Upload via Zip2Git 📦');

  // Update form states when settings change (if not customized yet)
  useEffect(() => {
    if (settings.defaultBranch) {
      setTargetBranch(settings.defaultBranch);
    }
    if (settings.defaultCommitMessage) {
      setCommitMessage(settings.defaultCommitMessage);
    }
  }, [settings.defaultBranch, settings.defaultCommitMessage]);
  
  // ZIP / Folder states
  const [uploadMode, setUploadMode] = useState<'zip' | 'folder'>('zip');
  const [selectedFile, setSelectedFile] = useState<File | { name: string; size: number } | null>(null);
  const [zipFileInfo, setZipFileInfo] = useState<ZipFileInfo | null>(null);
  const [zipInstance, setZipInstance] = useState<JSZip | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  // Pre-fetched SHA Map for diff preview
  const [shaMap, setShaMap] = useState<Map<string, string> | null>(null);
  const [isLoadingShaMap, setIsLoadingShaMap] = useState(false);

  // Upload state
  const [progress, setProgress] = useState<UploadProgress>({
    status: 'idle',
    percent: 0,
    currentFile: '',
    uploadedCount: 0,
    totalCount: 0,
    estimatedSecondsRemaining: 0,
    error: null,
  });

  // Fetch file tree of selected repo to analyze New vs Overwrite statuses
  useEffect(() => {
    let active = true;
    const fetchShaMap = async () => {
      if (!token || !selectedRepo || !targetBranch.trim()) {
        setShaMap(null);
        return;
      }
      setIsLoadingShaMap(true);
      try {
        const owner = user?.login || selectedRepo.full_name.split('/')[0];
        const repoName = selectedRepo.name;
        const map = await getRepoTree(token, owner, repoName, targetBranch);
        if (active) {
          setShaMap(map);
        }
      } catch (err) {
        console.error('Gagal mengambil struktur repositori:', err);
        if (active) {
          setShaMap(null);
        }
      } finally {
        if (active) {
          setIsLoadingShaMap(false);
        }
      }
    };

    fetchShaMap();
    return () => {
      active = false;
    };
  }, [token, selectedRepo, targetBranch, user]);

  const handleZipSelected = async (file: File) => {
    setIsParsing(true);
    setSelectedFile(file);
    try {
      const { zip, info } = await parseZipFile(file, settings.customIgnoreRules);
      setZipInstance(zip);
      setZipFileInfo(info);
    } catch (err: any) {
      toast.error('Gagal mengekstrak berkas ZIP. Pastikan format berkas valid.');
      setSelectedFile(null);
      setZipInstance(null);
      setZipFileInfo(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFolderSelected = async (filesList: File[]) => {
    if (filesList.length === 0) return;
    setIsParsing(true);
    const rootName = filesList[0]?.webkitRelativePath?.split('/')[0] || 'folder-upload';
    const totalSize = filesList.reduce((acc, f) => acc + f.size, 0);
    
    setSelectedFile({
      name: rootName,
      size: totalSize,
    });

    try {
      const { zip, info } = await createZipFromFiles(filesList, settings.customIgnoreRules);
      setZipInstance(zip);
      setZipFileInfo(info);
    } catch (err: any) {
      toast.error('Gagal memproses folder proyek. Coba unggah arsip ZIP saja.');
      setSelectedFile(null);
      setZipInstance(null);
      setZipFileInfo(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setZipFileInfo(null);
    setZipInstance(null);
    setProgress({
      status: 'idle',
      percent: 0,
      currentFile: '',
      uploadedCount: 0,
      totalCount: 0,
      estimatedSecondsRemaining: 0,
      error: null,
    });
  };

  const handleUpload = async () => {
    if (!token) return;
    if (!selectedRepo) {
      toast.error('Pilih repositori target terlebih dahulu!');
      return;
    }
    if (!targetBranch.trim()) {
      toast.error('Branch target tidak boleh kosong!');
      return;
    }
    if (!zipInstance || !zipFileInfo) {
      toast.error('Silakan unggah berkas atau folder terlebih dahulu!');
      return;
    }

    const { files, totalFiles } = zipFileInfo;
    if (files.length === 0) {
      toast.error('Proyek kosong atau tidak berisi berkas yang valid.');
      return;
    }

    // Initialize progress
    setProgress({
      status: 'extracting',
      percent: 5,
      currentFile: 'Memeriksa struktur repositori...',
      uploadedCount: 0,
      totalCount: totalFiles,
      estimatedSecondsRemaining: 0,
      error: null,
    });

    try {
      const owner = user?.login || selectedRepo.full_name.split('/')[0];
      const repoName = selectedRepo.name;

      setProgress((prev) => ({
        ...prev,
        percent: 10,
        currentFile: 'Memeriksa status branch target...',
      }));

      // Fetch target branch reference (commit & tree)
      const branchInfo = await getBranchRef(token, owner, repoName, targetBranch);

      setProgress((prev) => ({
        ...prev,
        status: 'uploading',
        percent: 15,
      }));

      let startTime = Date.now();
      const message = commitMessage.trim() || 'Upload via Zip2Git';
      let lastProgressUpdate = 0;
      let uploadedCount = 0;
      const treeItems: TreeItem[] = [];

      // Worker helper to upload a single file's blob and register it to treeItems
      const uploadFileBlob = async (index: number) => {
        const fileMeta = files[index];
        const jszipFile = zipInstance.file(fileMeta.path);
        if (!jszipFile) {
          return; // Skip folders or empty structures
        }

        const base64Content = await fileToBase64(jszipFile);
        const blobSha = await createBlob(token, owner, repoName, base64Content);
        
        treeItems.push({
          path: fileMeta.path,
          mode: '100644', // 100644 is normal blob, 100755 for executables
          type: 'blob',
          sha: blobSha,
        });

        uploadedCount++;
        const percent = Math.min(15 + Math.round((uploadedCount / totalFiles) * 75), 90);
        const elapsedTime = Date.now() - startTime;
        const avgTimePerFile = elapsedTime / uploadedCount;
        const remainingFiles = totalFiles - uploadedCount;
        const estimatedSecondsRemaining = Math.max(0, Math.round((avgTimePerFile * remainingFiles) / 1000));

        const now = Date.now();
        if (now - lastProgressUpdate > 200 || uploadedCount === totalFiles || uploadedCount === 1) {
          setProgress((prev) => ({
            ...prev,
            percent,
            uploadedCount,
            estimatedSecondsRemaining,
            currentFile: fileMeta.path,
          }));
          lastProgressUpdate = now;
        }
      };

      const uploadMethod = settings.uploadMethod || 'parallel';
      let parallelUploadSuccess = false;

      if (uploadMethod === 'parallel') {
        let currentParallelLimit = settings.parallelLimit || 10;
        let keepTryingParallel = true;

        while (keepTryingParallel && !parallelUploadSuccess) {
          try {
            // Reset state for this attempt to ensure no duplicates or corrupted file tracking
            treeItems.length = 0;
            uploadedCount = 0;
            startTime = Date.now();
            lastProgressUpdate = 0;

            let nextIndex = 0;
            let hasError = false;
            let errorMessage = '';

            const worker = async () => {
              while (nextIndex < totalFiles && !hasError) {
                const index = nextIndex++;
                try {
                  await uploadFileBlob(index);
                } catch (err: any) {
                  console.error(`Gagal membuat blob untuk file indeks ${index} (Batas Utas: ${currentParallelLimit}):`, err);
                  hasError = true;
                  let friendlyError = `Gagal mengunggah file ke-${index + 1}: `;
                  if (err.status === 401) {
                    friendlyError += 'Token akses tidak valid atau telah kedaluwarsa.';
                  } else if (err.status === 403) {
                    friendlyError += 'Rate limit GitHub habis atau otorisasi kurang.';
                  } else {
                    friendlyError += err.message || 'Error tidak diketahui.';
                  }
                  errorMessage = friendlyError;
                }
              }
            };

            const workers = Array.from(
              { length: Math.min(currentParallelLimit, totalFiles) },
              () => worker()
            );
            
            await Promise.all(workers);

            if (hasError) {
              throw new Error(errorMessage);
            }
            parallelUploadSuccess = true;
          } catch (err: any) {
            console.warn(`Pengunggahan paralel gagal dengan ${currentParallelLimit} utas:`, err);
            
            if (currentParallelLimit > 50) {
              // Fallback tier 1: Downgrade to 50 threads
              currentParallelLimit = 50;
              console.log(`Mengurangi konkurensi menjadi 50 utas dan mencoba kembali...`);
              
              setProgress((prev) => ({
                ...prev,
                percent: 15,
                currentFile: 'Terjadi limitasi API. Menurunkan jumlah simultan ke 50 utas dan mencoba kembali...',
              }));
              
              // Wait 1.5 seconds for GitHub API rate limiting to cool down slightly
              await new Promise((resolve) => setTimeout(resolve, 1500));
            } else {
              // Fallback tier 2: Stop parallel retry, proceed to sequential mode
              keepTryingParallel = false;
              console.warn('Pengunggahan paralel dengan 50 utas atau kurang masih terhambat. Beralih ke sekuensial...');
            }
          }
        }
      }

      // If uploadMethod is sequential OR if parallel upload failed/exhausted all fallback tiers
      if (!parallelUploadSuccess) {
        console.log('Memulai pengunggahan sekuensial...');
        // Clear items uploaded in parallel so far and run sequentially for complete safety and absolute integrity
        treeItems.length = 0;
        uploadedCount = 0;
        startTime = Date.now();
        lastProgressUpdate = 0;
        
        setProgress((prev) => ({
          ...prev,
          percent: 15,
          currentFile: 'Beralih ke mode sekuensial otomatis demi integritas data...',
        }));

        // Sequential Mode: create blobs one by one
        for (let i = 0; i < totalFiles; i++) {
          try {
            await uploadFileBlob(i);
          } catch (err: any) {
            console.error(`Gagal membuat blob untuk ${files[i].path}:`, err);
            let friendlyError = `Gagal mengunggah "${files[i].path}": `;
            if (err.status === 401) {
              friendlyError += 'Token akses tidak valid atau telah kedaluwarsa.';
            } else if (err.status === 403) {
              friendlyError += 'Rate limit GitHub habis atau otorisasi kurang.';
            } else {
              friendlyError += err.message || 'Error tidak diketahui.';
            }
            throw new Error(friendlyError);
          }
        }
      }

      setProgress((prev) => ({
        ...prev,
        percent: 92,
        currentFile: 'Membuat pohon berkas (Git Tree)...',
      }));

      const newTreeSha = await createTree(
        token,
        owner,
        repoName,
        treeItems,
        branchInfo?.treeSha || undefined
      );

      setProgress((prev) => ({
        ...prev,
        percent: 96,
        currentFile: 'Membuat Git Commit...',
      }));

      const newCommitSha = await createCommit(
        token,
        owner,
        repoName,
        message,
        newTreeSha,
        branchInfo ? [branchInfo.commitSha] : []
      );

      setProgress((prev) => ({
        ...prev,
        percent: 98,
        currentFile: 'Memperbarui referensi branch...',
      }));

      if (branchInfo) {
        await updateRef(token, owner, repoName, targetBranch, newCommitSha);
      } else {
        await createRef(token, owner, repoName, targetBranch, newCommitSha);
      }

      // Completed Successfully
      setProgress((prev) => ({
        ...prev,
        status: 'completed',
        percent: 100,
        currentFile: '',
      }));

      // Refresh local SHA Map to reflect newly uploaded files!
      try {
        const freshMap = await getRepoTree(token, owner, repoName, targetBranch);
        setShaMap(freshMap);
      } catch (fErr) {
        console.warn('Gagal memperbarui daftar berkas setelah unggah selesai:', fErr);
      }

      // Register success to history
      const githubRepoUrl = `${selectedRepo.html_url}/tree/${targetBranch}`;
      addHistoryItem({
        repoName: selectedRepo.full_name,
        zipName: selectedFile?.name || 'unknown.zip',
        fileCount: totalFiles,
        status: 'completed',
        url: githubRepoUrl,
      });
      toast.success('Proyek berhasil diunggah ke GitHub!');

    } catch (err: any) {
      console.error('Proses unggah gagal:', err);
      const errMsg = err.message || 'Gagal mengunggah kode sumber.';
      
      setProgress((prev) => ({
        ...prev,
        status: 'failed',
        error: errMsg,
      }));

      addHistoryItem({
        repoName: selectedRepo?.full_name || 'repositori-tidak-diketahui',
        zipName: selectedFile?.name || 'unknown.zip',
        fileCount: totalFiles,
        status: 'failed',
        url: null,
      });
      toast.error('Gagal mengunggah berkas ke GitHub.');
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm shadow-md">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Sedang memuat data sesi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Top Welcome Card */}
      <section className="bg-slate-900 text-white dark:bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 text-left shadow-lg">
        <div className="flex items-center gap-4 min-w-0">
          <img
            src={user.avatar_url}
            alt={user.login}
            className="h-16 w-16 rounded-full ring-4 ring-white/10 shrink-0"
          />
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold tracking-tight truncate">
              Halo, {user.name || user.login}!
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              @{user.login} • Repositori: {user.public_repos} Publik
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const loggedOut = logout();
              if (loggedOut) {
                navigate('/login');
              }
            }}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 dark:hover:bg-slate-800 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            Keluar Sesi
          </button>
        </div>
      </section>

      {/* Main Workflow Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Options Form Column */}
        <div className="lg:col-span-1 space-y-6">
          
          <RepoSelector
            selectedRepo={selectedRepo}
            onSelectRepo={setSelectedRepo}
            targetBranch={targetBranch}
            onSetTargetBranch={setTargetBranch}
          />

          {selectedRepo && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 text-left">
              <h3 className="font-bold text-sm tracking-tight flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <GitCommit className="h-4.5 w-4.5 text-indigo-500" />
                Pesan Commit
              </h3>
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Upload via Zip2Git"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-400">
                  Pesan penanda perubahan yang akan disimpan di riwayat git GitHub Anda.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Right Uploader and Previews Column */}
        <div className="lg:col-span-2 space-y-6">
          
          <ZipUploader
            onZipSelected={handleZipSelected}
            onFolderSelected={handleFolderSelected}
            selectedFile={selectedFile}
            onClearFile={handleClearFile}
            uploadMode={uploadMode}
            setUploadMode={setUploadMode}
          />

          {isParsing && (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <Loader2 className="h-6 w-6 text-indigo-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Menganalisis isi berkas proyek Anda...</p>
            </div>
          )}

          {/* Render parsed tree preview before starting upload */}
          {zipFileInfo && progress.status === 'idle' && (
            <div className="space-y-6">
              <FileTreePreview 
                info={zipFileInfo} 
                zipInstance={zipInstance}
                shaMap={shaMap}
                isLoadingShaMap={isLoadingShaMap}
              />
              
              {selectedRepo ? (
                <button
                  onClick={handleUpload}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md text-sm active:scale-[0.99]"
                >
                  <Play className="h-4.5 w-4.5" />
                  Mulai Unggah ke Repositori
                </button>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl text-center text-xs text-slate-500 font-medium">
                  💡 Silakan pilih atau buat repositori target di panel sebelah kiri untuk memulai unggah.
                </div>
              )}
            </div>
          )}

          {/* Render active progress bar */}
          {progress.status !== 'idle' && (
            <div className="space-y-6">
              <ProgressBar progress={progress} />
              {progress.status === 'completed' && (
                <button
                  onClick={handleClearFile}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs"
                >
                  Selesai & Bersihkan Workspace
                </button>
              )}
              {progress.status === 'failed' && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleUpload}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md text-xs active:scale-[0.99]"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Coba Lagi (Retry)
                  </button>
                  <button
                    onClick={handleClearFile}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs"
                  >
                    Reset & Ganti Berkas
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Historical Session List */}
          <HistoryList history={history} onClear={clearHistory} />

        </div>

      </div>

    </div>
  );
};

// Simple loader helper inside same module
const Loader2: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
};
