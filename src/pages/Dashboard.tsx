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
  createPullRequest,
  TreeItem 
} from '../services/github';
import { 
  GitCommit, 
  Play, 
  Sparkles, 
  HelpCircle,
  LogOut,
  FolderOpen,
  RefreshCw,
  Sliders,
  EyeOff,
  ShieldAlert,
  Settings2,
  Rocket,
  FileUp,
  Bug,
  Gift,
  Zap,
  ExternalLink
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
  const [commitMessage, setCommitMessage] = useState(settings.defaultCommitMessage || 'Upload via Zip2Git');

  // Pull Request options
  const [shouldCreatePR, setShouldCreatePR] = useState(false);
  const [prBaseBranch, setPrBaseBranch] = useState('main');
  const [prTitle, setPrTitle] = useState('PR: Update from Zip2Git');
  const [prBody, setPrBody] = useState('Pull Request ini dibuat otomatis oleh Zip2Git setelah pengunggahan berkas.');
  const [createdPrUrl, setCreatedPrUrl] = useState<string | null>(null);

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

  // File exclusion & custom ignore preset states
  const [excludedFiles, setExcludedFiles] = useState<Set<string>>(new Set());
  const [folderFilesList, setFolderFilesList] = useState<File[]>([]);
  const [ignoreNodeModules, setIgnoreNodeModules] = useState(true);
  const [ignoreBuild, setIgnoreBuild] = useState(true);
  const [ignoreEnv, setIgnoreEnv] = useState(true);
  const [ignoreSystem, setIgnoreSystem] = useState(true);
  const [customIgnoreText, setCustomIgnoreText] = useState(settings.customIgnoreRules || '');

  // Helper to construct full combined ignore rules string
  const getCombinedIgnoreRules = () => {
    const rules: string[] = [];
    if (ignoreNodeModules) rules.push('node_modules');
    if (ignoreBuild) rules.push('dist', 'build', '.next', 'out');
    if (ignoreEnv) rules.push('.env', '.env.local', '.env.development', '.env.production');
    if (ignoreSystem) rules.push('.ds_store', 'thumbs.db');
    
    if (customIgnoreText.trim()) {
      customIgnoreText.split(/[\n,]+/).forEach(r => {
        if (r.trim()) rules.push(r.trim());
      });
    }
    return rules.join('\n');
  };

  // Toggle single file selection
  const handleToggleFile = (path: string) => {
    setExcludedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // Toggle multiple files selection at once
  const handleToggleMultipleFiles = (paths: string[], exclude: boolean) => {
    setExcludedFiles((prev) => {
      const next = new Set(prev);
      paths.forEach(path => {
        if (exclude) {
          next.add(path);
        } else {
          next.delete(path);
        }
      });
      return next;
    });
  };

  // Toggle all files selection
  const handleToggleAll = (selectNone: boolean) => {
    if (!zipFileInfo) return;
    if (selectNone) {
      setExcludedFiles(new Set(zipFileInfo.files.map((f) => f.path)));
    } else {
      setExcludedFiles(new Set());
    }
  };

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

  // Re-parse ZIP or Folder when ignore rules change
  useEffect(() => {
    if (!selectedFile) return;
    
    const reparseFile = async () => {
      setIsParsing(true);
      try {
        const rules = getCombinedIgnoreRules();
        if (uploadMode === 'folder' && folderFilesList.length > 0) {
          const { zip, info } = await createZipFromFiles(folderFilesList, rules);
          setZipInstance(zip);
          setZipFileInfo(info);
        } else if (uploadMode === 'zip' && selectedFile && 'type' in selectedFile) {
          const { zip, info } = await parseZipFile(selectedFile as File, rules);
          setZipInstance(zip);
          setZipFileInfo(info);
        }
      } catch (err) {
        console.error('Error re-parsing on rule change:', err);
      } finally {
        setIsParsing(false);
      }
    };

    const timer = setTimeout(() => {
      reparseFile();
    }, 450); // Debounce to allow seamless slider/text typing adjustments

    return () => clearTimeout(timer);
  }, [ignoreNodeModules, ignoreBuild, ignoreEnv, ignoreSystem, customIgnoreText, selectedFile, uploadMode]);

  const handleZipSelected = async (file: File) => {
    setIsParsing(true);
    setExcludedFiles(new Set());
    setFolderFilesList([]);
    setSelectedFile(file);
    try {
      const rules = getCombinedIgnoreRules();
      const { zip, info } = await parseZipFile(file, rules);
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
    setExcludedFiles(new Set());
    setFolderFilesList(filesList);
    const rootName = filesList[0]?.webkitRelativePath?.split('/')[0] || 'folder-upload';
    const totalSize = filesList.reduce((acc, f) => acc + f.size, 0);
    
    setSelectedFile({
      name: rootName,
      size: totalSize,
    });

    try {
      const rules = getCombinedIgnoreRules();
      const { zip, info } = await createZipFromFiles(filesList, rules);
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
    setExcludedFiles(new Set());
    setFolderFilesList([]);
    setCreatedPrUrl(null);
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

    // Filter files to only upload checked ones
    const filesToUpload = zipFileInfo.files.filter(f => !excludedFiles.has(f.path));
    const totalFiles = filesToUpload.length;
    if (totalFiles === 0) {
      toast.error('Semua berkas dikecualikan! Pilih setidaknya satu berkas untuk diunggah.');
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
        const fileMeta = filesToUpload[index];
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
            console.error(`Gagal membuat blob untuk ${filesToUpload[i].path}:`, err);
            let friendlyError = `Gagal mengunggah "${filesToUpload[i].path}": `;
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

      // Automatic Pull Request Creation
      let autoPrUrl: string | null = null;
      if (shouldCreatePR && targetBranch.toLowerCase() !== prBaseBranch.toLowerCase()) {
        try {
          setProgress((prev) => ({
            ...prev,
            currentFile: 'Membuat Pull Request otomatis...',
          }));
          const prData = await createPullRequest(
            token,
            owner,
            repoName,
            prTitle.trim() || `PR: Update dari Zip2Git (${targetBranch})`,
            targetBranch,
            prBaseBranch,
            prBody.trim() || 'Pull Request dibuat secara otomatis oleh Zip2Git.'
          );
          autoPrUrl = prData.html_url;
          setCreatedPrUrl(prData.html_url);
          toast.success(`Pull Request #${prData.number} berhasil dibuat!`);
        } catch (prErr: any) {
          console.error('Gagal membuat Pull Request:', prErr);
          toast.error(`Gagal membuat Pull Request otomatis: ${prErr.message}`);
        }
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
      const githubRepoUrl = autoPrUrl || `${selectedRepo.html_url}/tree/${targetBranch}`;
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

          {/* Ignore Presets and Filters Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 text-left">
            <h3 className="font-bold text-sm tracking-tight flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Sliders className="h-4.5 w-4.5 text-indigo-500" />
              Saringan Berkas (Ignore Rules)
            </h3>
            
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ignoreNodeModules"
                  checked={ignoreNodeModules}
                  onChange={(e) => setIgnoreNodeModules(e.target.checked)}
                  className="h-3.5 w-3.5 rounded text-indigo-600 focus:ring-indigo-500/30 dark:bg-slate-950 dark:border-slate-850 border-slate-300 dark:border-slate-800 cursor-pointer"
                />
                <label htmlFor="ignoreNodeModules" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  Abaikan <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px] font-mono">node_modules/</code>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ignoreBuild"
                  checked={ignoreBuild}
                  onChange={(e) => setIgnoreBuild(e.target.checked)}
                  className="h-3.5 w-3.5 rounded text-indigo-600 focus:ring-indigo-500/30 dark:bg-slate-950 dark:border-slate-850 border-slate-300 dark:border-slate-800 cursor-pointer"
                />
                <label htmlFor="ignoreBuild" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  Abaikan folder build/dist/out
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ignoreEnv"
                  checked={ignoreEnv}
                  onChange={(e) => setIgnoreEnv(e.target.checked)}
                  className="h-3.5 w-3.5 rounded text-indigo-600 focus:ring-indigo-500/30 dark:bg-slate-950 dark:border-slate-850 border-slate-300 dark:border-slate-800 cursor-pointer"
                />
                <label htmlFor="ignoreEnv" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  Abaikan berkas <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px] font-mono">.env</code> rahasia
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ignoreSystem"
                  checked={ignoreSystem}
                  onChange={(e) => setIgnoreSystem(e.target.checked)}
                  className="h-3.5 w-3.5 rounded text-indigo-600 focus:ring-indigo-500/30 dark:bg-slate-950 dark:border-slate-850 border-slate-300 dark:border-slate-800 cursor-pointer"
                />
                <label htmlFor="ignoreSystem" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  Abaikan sampah OS (.DS_Store)
                </label>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                Pola Pengabaian Kustom (Koma/Baris baru):
              </label>
              <textarea
                value={customIgnoreText}
                onChange={(e) => setCustomIgnoreText(e.target.value)}
                placeholder="contoh: *.log, test/, private.key"
                className="w-full h-16 px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white resize-none"
              />
              <p className="text-[9px] text-slate-400">
                Setiap aturan akan dicocokkan sebagai bagian dari jalur berkas Anda secara dinamis.
              </p>
            </div>
          </div>

          {selectedRepo && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 text-left">
              <h3 className="font-bold text-sm tracking-tight flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <GitCommit className="h-4.5 w-4.5 text-indigo-500" />
                Pesan Commit
              </h3>
              <div className="space-y-2.5">
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

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-indigo-500 animate-pulse" />
                    Template Pesan Instan:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Inisialisasi', text: 'Initial commit via Zip2Git', icon: <Rocket className="h-3 w-3 text-indigo-500" /> },
                      { label: 'Perbarui Berkas', text: 'Update files via Zip2Git', icon: <FileUp className="h-3 w-3 text-indigo-500" /> },
                      { label: 'Perbaikan Bug', text: 'Fix bugs and refactor code', icon: <Bug className="h-3 w-3 text-rose-500" /> },
                      { label: 'Rilis', text: 'Release new version', icon: <Gift className="h-3 w-3 text-emerald-500" /> },
                    ].map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCommitMessage(preset.text)}
                        className="px-2 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        {preset.icon}
                        <span>{preset.label}</span>
                      </button>
                    ))}
                    {selectedFile && (
                      <button
                        type="button"
                        onClick={() => {
                          const dateStr = new Date().toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          });
                          setCommitMessage(`Update: ${selectedFile.name} (${dateStr})`);
                        }}
                        className="px-2 py-1 bg-indigo-50/50 hover:bg-indigo-100/50 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-900/30 rounded-lg text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Zap className="h-3 w-3 text-indigo-500" />
                        <span>Otomatis Nama Berkas</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedRepo && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
                  <Settings2 className="h-4.5 w-4.5 text-indigo-500" />
                  Alur Pull Request (PR)
                </h3>
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold rounded font-sans uppercase">
                  Otomasi
                </span>
              </div>
              
              <div className="space-y-3.5">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="shouldCreatePR"
                    checked={shouldCreatePR}
                    onChange={(e) => setShouldCreatePR(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30 cursor-pointer dark:bg-slate-950 dark:border-slate-800"
                  />
                  <label htmlFor="shouldCreatePR" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    Buat Pull Request otomatis setelah unggah
                  </label>
                </div>

                {shouldCreatePR && (
                  <div className="space-y-3 pt-2 pl-4 border-l-2 border-indigo-100 dark:border-indigo-900/50">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        Target Penggabungan (Base Branch):
                      </label>
                      <input
                        type="text"
                        value={prBaseBranch}
                        onChange={(e) => setPrBaseBranch(e.target.value)}
                        placeholder="contoh: main atau master"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        Judul Pull Request:
                      </label>
                      <input
                        type="text"
                        value={prTitle}
                        onChange={(e) => setPrTitle(e.target.value)}
                        placeholder="PR: Update dari Zip2Git"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        Deskripsi Pull Request:
                      </label>
                      <textarea
                        value={prBody}
                        onChange={(e) => setPrBody(e.target.value)}
                        placeholder="Deskripsikan isi Pull Request ini..."
                        className="w-full h-16 px-2.5 py-1.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white resize-none"
                      />
                    </div>

                    {targetBranch.toLowerCase() === prBaseBranch.toLowerCase() && (
                      <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-lg text-[10px] text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <strong>Peringatan:</strong> Branch target ({targetBranch}) sama dengan Base Branch ({prBaseBranch}). Pull Request hanya dapat dibuat jika kedua branch berbeda.
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
                excludedFiles={excludedFiles}
                onToggleFile={handleToggleFile}
                onToggleMultipleFiles={handleToggleMultipleFiles}
                onToggleAll={handleToggleAll}
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
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
                  <HelpCircle className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Silakan pilih atau buat repositori target di panel sebelah kiri untuk memulai unggah.</span>
                </div>
              )}
            </div>
          )}

          {/* Render active progress bar */}
          {progress.status !== 'idle' && (
            <div className="space-y-6">
              <ProgressBar progress={progress} />

              {progress.status === 'completed' && createdPrUrl && (
                <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-150 dark:border-indigo-900/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in text-left">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                      <Sparkles className="h-4.5 w-4.5 text-indigo-500 animate-pulse" />
                      Pull Request Berhasil Dibuat!
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Cabang fitur Anda telah dikirim dan Pull Request otomatis Anda siap ditinjau di GitHub.
                    </p>
                  </div>
                  <a
                    href={createdPrUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-lg"
                  >
                    <span>Buka Pull Request</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}

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
