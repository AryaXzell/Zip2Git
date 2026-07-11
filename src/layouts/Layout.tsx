/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { 
  Github, 
  Settings, 
  LayoutDashboard, 
  Home, 
  LogOut, 
  LogIn, 
  Sun, 
  Moon, 
  Menu, 
  X,
  Keyboard,
  UserCheck,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { 
    user, 
    logout, 
    settings, 
    toggleTheme, 
    isLogoutConfirmOpen, 
    setLogoutConfirmOpen 
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showShortcutModal, setShowShortcutModal] = useState(false);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    let lastKey = '';
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      ) {
        return;
      }

      // Ignore shortcuts when modifier keys are pressed (Ctrl, Cmd, Alt)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      const key = e.key.toLowerCase();

      // Theme toggle shortcut: "t"
      if (key === 't') {
        e.preventDefault();
        toggleTheme();
        toast.success(`Tema diubah ke ${settings.theme === 'dark' ? 'Terang' : 'Gelap'}`);
        return;
      }

      // Help modal shortcut: "?"
      if (key === '?' || (key === '/' && e.shiftKey)) {
        e.preventDefault();
        setShowShortcutModal(prev => !prev);
        return;
      }

      // Navigation sequences starting with "g"
      if (lastKey === 'g') {
        if (key === 'h') {
          e.preventDefault();
          navigate('/');
          toast('Navigasi: Beranda');
        } else if (key === 'd') {
          e.preventDefault();
          if (user) {
            navigate('/dashboard');
            toast('Navigasi: Dasbor');
          } else {
            navigate('/login');
            toast('Navigasi: Silakan masuk');
          }
        } else if (key === 'a') {
          e.preventDefault();
          if (user) {
            navigate('/sesi');
            toast('Navigasi: Sesi Aktif');
          } else {
            navigate('/login');
            toast('Navigasi: Silakan masuk');
          }
        } else if (key === 'i') {
          e.preventDefault();
          navigate('/tentang');
          toast('Navigasi: Tentang');
        } else if (key === 's') {
          e.preventDefault();
          navigate('/pengaturan');
          toast('Navigasi: Pengaturan');
        } else if (key === 'l') {
          e.preventDefault();
          if (user) {
            const loggedOut = logout();
            if (loggedOut) {
              navigate('/login');
            }
          } else {
            navigate('/login');
            toast('Navigasi: Masuk');
          }
        }
        lastKey = ''; // Reset sequence
      } else if (key === 'g') {
        lastKey = 'g';
        // Reset key after 1 second if no follow-up key is pressed
        setTimeout(() => {
          if (lastKey === 'g') lastKey = '';
        }, 1000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [user, settings.theme, navigate, logout, toggleTheme]);

  // Close mobile menu on navigate
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5 font-bold text-lg hover:opacity-90">
            <div className="p-1.5 bg-slate-900 text-white rounded-lg dark:bg-slate-100 dark:text-slate-950">
              <Github className="h-5 w-5" />
            </div>
            <span className="tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Zip2Git
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/'
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900/50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Home className="h-4 w-4" />
                Beranda
              </span>
            </Link>

            {user && (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === '/dashboard'
                      ? 'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900/50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <LayoutDashboard className="h-4 w-4" />
                    Dasbor
                  </span>
                </Link>

                <Link
                  to="/sesi"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === '/sesi'
                      ? 'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900/50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4" />
                    Sesi Aktif
                  </span>
                </Link>
              </>
            )}

            <Link
              to="/tentang"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/tentang'
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900/50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4" />
                Tentang
              </span>
            </Link>

            <Link
              to="/pengaturan"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/pengaturan'
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900/50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Settings className="h-4 w-4" />
                Pengaturan
              </span>
            </Link>
          </nav>

          {/* Actions & Profile */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Shortcut key info */}
            <button
              onClick={() => setShowShortcutModal(true)}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors"
              title="Pintasan Keyboard"
            >
              <Keyboard className="h-4 w-4" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors"
              aria-label="Toggle theme"
            >
              {settings.theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
                <img
                  src={user.avatar_url}
                  alt={user.login}
                  className="h-8 w-8 rounded-full ring-2 ring-slate-200 dark:ring-slate-800"
                />
                <div className="text-left">
                  <p className="text-xs font-semibold leading-tight max-w-[100px] truncate">
                    {user.name || user.login}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[100px]">
                    @{user.login}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const loggedOut = logout();
                    if (loggedOut) {
                      navigate('/login');
                    }
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                  title="Keluar"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-sm font-semibold rounded-lg transition-colors shadow-sm"
              >
                <LogIn className="h-4 w-4" />
                Masuk GitHub
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900 rounded-lg"
            >
              {settings.theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 py-3 px-4 flex flex-col space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2 py-2 px-3 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-sm font-medium"
          >
            <Home className="h-4 w-4" />
            Beranda
          </Link>
          {user && (
            <>
              <Link
                to="/dashboard"
                className="flex items-center gap-2 py-2 px-3 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-sm font-medium"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dasbor
              </Link>
              <Link
                to="/sesi"
                className="flex items-center gap-2 py-2 px-3 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-sm font-medium"
              >
                <UserCheck className="h-4 w-4" />
                Sesi Aktif
              </Link>
            </>
          )}
          <Link
            to="/tentang"
            className="flex items-center gap-2 py-2 px-3 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-sm font-medium"
          >
            <HelpCircle className="h-4 w-4" />
            Tentang
          </Link>
          <Link
            to="/pengaturan"
            className="flex items-center gap-2 py-2 px-3 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-sm font-medium"
          >
            <Settings className="h-4 w-4" />
            Pengaturan
          </Link>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setShowShortcutModal(true);
            }}
            className="flex items-center gap-2 w-full text-left py-2 px-3 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-sm font-medium"
          >
            <Keyboard className="h-4 w-4" />
            Pintasan Keyboard
          </button>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between">
            {user ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <img src={user.avatar_url} className="h-7 w-7 rounded-full" />
                  <span className="text-xs font-semibold">{user.name || user.login}</span>
                </div>
                <button
                  onClick={() => {
                    const loggedOut = logout();
                    if (loggedOut) {
                      navigate('/login');
                    }
                  }}
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="w-full text-center py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-lg text-xs font-semibold"
              >
                Masuk GitHub
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto w-full border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Zip2Git. Dipersembahkan untuk kolaborasi open-source yang cepat.</p>
          <div className="flex space-x-4">
            <Link to="/tentang" className="hover:underline">Tentang</Link>
            <span>•</span>
            <Link to="/legal" className="hover:underline">Syarat & Privasi</Link>
            <span>•</span>
            <Link to="/pengaturan" className="hover:underline">Pengaturan</Link>
            <span>•</span>
            <button onClick={() => setShowShortcutModal(true)} className="hover:underline">Pintasan</button>
          </div>
        </div>
      </footer>

      {/* Keyboard Shortcuts Modal */}
      {showShortcutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                <Keyboard className="h-5 w-5" />
                Pintasan Keyboard App
              </h3>
              <button
                onClick={() => setShowShortcutModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Navigasi ke Beranda</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono font-bold text-slate-800 dark:text-slate-200 shadow-sm">
                  g + h
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Navigasi ke Dasbor</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono font-bold text-slate-800 dark:text-slate-200 shadow-sm">
                  g + d
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Navigasi ke Sesi Aktif</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono font-bold text-slate-800 dark:text-slate-200 shadow-sm">
                  g + a
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Navigasi ke Tentang</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono font-bold text-slate-800 dark:text-slate-200 shadow-sm">
                  g + i
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Navigasi ke Pengaturan</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono font-bold text-slate-800 dark:text-slate-200 shadow-sm">
                  g + s
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Masuk / Keluar Sesi</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono font-bold text-slate-800 dark:text-slate-200 shadow-sm">
                  g + l
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Ganti Tema (Gelap/Terang)</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono font-bold text-slate-800 dark:text-slate-200 shadow-sm">
                  t
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Tampilkan / Tutup Modal Ini</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono font-bold text-slate-800 dark:text-slate-200 shadow-sm">
                  ?
                </kbd>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                onClick={() => setShowShortcutModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Logout Confirmation Modal */}
      <AnimatePresence>
        {isLogoutConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLogoutConfirmOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-slate-950/60"
            />
            
            {/* Modal card content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden z-10"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl">
                  <AlertTriangle className="h-6 w-6 animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans tracking-tight">
                    Konfirmasi Keluar Sesi
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Apakah Anda yakin ingin keluar dari sesi? Token akses pribadi GitHub dan riwayat unggah sementara Anda akan dihapus sepenuhnya dari memori browser demi keamanan.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setLogoutConfirmOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    logout(false);
                    setLogoutConfirmOpen(false);
                    navigate('/login');
                  }}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-red-600/10"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Keluar Sesi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
