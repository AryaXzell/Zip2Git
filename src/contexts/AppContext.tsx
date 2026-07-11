/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { GitHubUser, GitHubRepo, UploadHistoryItem, AppSettings } from '../types';
import { validateToken, getRepositories, createRepository } from '../services/github';
import toast from 'react-hot-toast';

interface AppContextType {
  user: GitHubUser | null;
  token: string | null;
  repos: GitHubRepo[];
  history: UploadHistoryItem[];
  settings: AppSettings;
  isLogoutConfirmOpen: boolean;
  setLogoutConfirmOpen: (open: boolean) => void;
  isLoadingRepos: boolean;
  isAuthenticating: boolean;
  login: (token: string) => Promise<boolean>;
  logout: (confirmRequired?: boolean) => boolean;
  clearSession: () => void;
  refreshRepos: () => Promise<void>;
  createNewRepo: (name: string, description: string, isPrivate: boolean, autoInit: boolean) => Promise<GitHubRepo>;
  addHistoryItem: (item: Omit<UploadHistoryItem, 'id' | 'timestamp'>) => void;
  toggleTheme: () => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  clearHistory: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('zip2git_token');
  });

  const [user, setUser] = useState<GitHubUser | null>(() => {
    const saved = sessionStorage.getItem('zip2git_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isLogoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const [history, setHistory] = useState<UploadHistoryItem[]>(() => {
    const saved = sessionStorage.getItem('zip2git_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('zip2git_settings_v2');
    const defaultSettings: AppSettings = {
      theme: 'dark',
      clearSessionOnClose: true,
      defaultBranch: 'main',
      defaultCommitMessage: 'Upload via Zip2Git 📦',
      autoOverwrite: true,
      uploadMethod: 'parallel',
      parallelLimit: 10,
      customIgnoreRules: '# Tambahkan ekstensi atau folder yang ingin di-ignore (satu per baris)\n# Contoh:\n# *.jks\n# *.pem\n# *.apk\n# local.properties'
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...defaultSettings,
          ...parsed,
          // Handle legacy theme from localStorage if theme is absent or was saved separately
          theme: parsed.theme || (localStorage.getItem('zip2git_theme') as 'dark' | 'light' | null) || 'dark'
        };
      } catch (e) {
        console.warn('Failed to parse settings:', e);
      }
    }
    
    // Legacy fallback
    const savedTheme = localStorage.getItem('zip2git_theme') as 'dark' | 'light' | null;
    return {
      ...defaultSettings,
      theme: savedTheme || 'dark'
    };
  });

  // Apply theme and persist settings
  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('zip2git_settings_v2', JSON.stringify(settings));
    localStorage.setItem('zip2git_theme', settings.theme);
  }, [settings]);

  // Persist history to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('zip2git_history', JSON.stringify(history));
  }, [history]);

  // Auto-fetch repos if token exists on load
  useEffect(() => {
    if (token && user) {
      fetchRepos(token);
    }
  }, [token]);

  const fetchRepos = async (authToken: string) => {
    setIsLoadingRepos(true);
    try {
      const data = await getRepositories(authToken);
      setRepos(data);
    } catch (err: any) {
      console.error('Gagal mengambil repositori:', err);
      toast.error('Gagal memuat daftar repositori GitHub Anda.');
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const login = async (authToken: string): Promise<boolean> => {
    setIsAuthenticating(true);
    try {
      const userData = await validateToken(authToken);
      sessionStorage.setItem('zip2git_token', authToken);
      sessionStorage.setItem('zip2git_user', JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
      toast.success(`Selamat datang, ${userData.name || userData.login}!`);
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Gagal masuk. Silakan periksa kembali token Anda.');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const clearSession = () => {
    sessionStorage.clear();
    setToken(null);
    setUser(null);
    setRepos([]);
    setHistory([]);
  };

  const logout = (confirmRequired = true): boolean => {
    if (confirmRequired) {
      setLogoutConfirmOpen(true);
      return false;
    }
    
    // Clear the session fully
    clearSession();
    
    // Keep a temporary signpost for silent route protection redirection (without toast error)
    sessionStorage.setItem('zip2git_logging_out', 'true');
    
    toast.success('Sesi berhasil diakhiri.');
    return true;
  };

  const refreshRepos = async () => {
    if (token) {
      await fetchRepos(token);
    }
  };

  const createNewRepo = async (
    name: string,
    description: string,
    isPrivate: boolean,
    autoInit: boolean
  ): Promise<GitHubRepo> => {
    if (!token) throw new Error('Otentikasi diperlukan.');
    
    const newRepo = await createRepository(token, {
      name,
      description,
      private: isPrivate,
      auto_init: autoInit,
    });

    setRepos((prev) => [newRepo, ...prev]);
    toast.success(`Repositori "${name}" berhasil dibuat!`);
    return newRepo;
  };

  const addHistoryItem = (item: Omit<UploadHistoryItem, 'id' | 'timestamp'>) => {
    const newItem: UploadHistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    };
    setHistory((prev) => [newItem, ...prev]);
  };

  const toggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  };

  const clearHistory = () => {
    setHistory([]);
    sessionStorage.removeItem('zip2git_history');
    toast.success('Riwayat berhasil dihapus.');
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        repos,
        history,
        settings,
        isLogoutConfirmOpen,
        setLogoutConfirmOpen,
        isLoadingRepos,
        isAuthenticating,
        login,
        logout,
        clearSession,
        refreshRepos,
        createNewRepo,
        addHistoryItem,
        toggleTheme,
        updateSettings,
        clearHistory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
