/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { 
  Key, 
  Github, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ArrowRight,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

// Set this to your registered GitHub OAuth App's Client ID.
// Configure via Vite env var VITE_GITHUB_CLIENT_ID (safe to expose — it's public by design).
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID as string | undefined;

function startGitHubOAuth() {
  if (!GITHUB_CLIENT_ID) {
    console.error('VITE_GITHUB_CLIENT_ID is not configured.');
    return;
  }

  // Random CSRF-protection state, verified again in AuthCallback.
  const state = crypto.randomUUID();
  sessionStorage.setItem('zip2git_oauth_state', state);

  const redirectUri = `${window.location.origin}/auth/callback`;
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'repo delete_repo read:user',
    state,
    allow_signup: 'true',
  });

  window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export const Login: React.FC = () => {
  const { login, isAuthenticating, user } = useApp();
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPatForm, setShowPatForm] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedToken = tokenInput.trim();
    if (!trimmedToken) {
      setErrorMsg('Token tidak boleh kosong.');
      return;
    }

    if (!trimmedToken.startsWith('ghp_') && !trimmedToken.startsWith('github_pat_')) {
      setErrorMsg('Token tampaknya tidak valid. Token GitHub Classic biasanya diawali dengan "ghp_" dan Token Berbutir Halus (Fine-grained) diawali dengan "github_pat_".');
      return;
    }

    const success = await login(trimmedToken);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-10">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        
        {/* Banner */}
        <div className="bg-slate-900 dark:bg-slate-950 p-6 text-center text-white border-b border-slate-200 dark:border-slate-800 flex flex-col items-center">
          <div className="p-3 bg-white/10 rounded-full mb-3">
            <Github className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Otentikasi Token</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-[260px] mx-auto">
            Gunakan Token Akses Pribadi (PAT) Anda untuk berinteraksi secara aman dengan GitHub.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-left">

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-100 dark:bg-red-950/20 dark:border-red-900/40 text-xs text-red-600 dark:text-red-400 rounded-xl flex gap-2">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Primary: GitHub OAuth login */}
          <button
            type="button"
            onClick={startGitHubOAuth}
            disabled={isAuthenticating || !GITHUB_CLIENT_ID}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md disabled:opacity-50"
          >
            <Github className="h-4 w-4" />
            Masuk dengan GitHub
          </button>

          {!GITHUB_CLIENT_ID && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 -mt-2.5 text-center">
              Login GitHub OAuth belum dikonfigurasi (env <code>VITE_GITHUB_CLIENT_ID</code> hilang). Gunakan Token Akses Pribadi di bawah.
            </p>
          )}

          {/* Secure details for OAuth */}
          <div className="bg-slate-50 border border-slate-100 dark:bg-slate-950 dark:border-slate-800 p-3 rounded-xl flex items-start gap-2.5">
            <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              <strong>Sesi tersimpan otomatis:</strong> Setelah masuk, sesi Anda disimpan di peramban (localStorage) agar Anda tidak perlu login ulang setiap membuka aplikasi ini. Anda bisa keluar kapan pun melalui tombol logout.
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">atau</span>
            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
          </div>

          {/* Secondary: PAT login (collapsible) */}
          <button
            type="button"
            onClick={() => setShowPatForm((v) => !v)}
            className="w-full py-2.5 bg-transparent border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Key className="h-4 w-4" />
            Masuk dengan Personal Access Token
          </button>

          {showPatForm && (
            <form onSubmit={handleSubmit} className="space-y-5 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Personal Access Token (PAT)
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxx"
                    disabled={isAuthenticating}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-slate-900 dark:text-white"
                  />
                  <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-3 h-4 w-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    tabIndex={-1}
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    Masuk
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Instructions to get token */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 text-xs space-y-2 text-slate-500 dark:text-slate-400">
                <h4 className="font-semibold text-slate-700 dark:text-slate-300">Bagaimana cara mendapatkan PAT?</h4>
                <ol className="list-decimal list-inside space-y-1 pl-1">
                  <li>Buka <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline inline-flex items-center gap-0.5">GitHub Developer Settings <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Klik <strong>Generate new token</strong> (pilih <strong>Generate new token (classic)</strong>)</li>
                  <li>Berikan nama (contoh: "Zip2Git")</li>
                  <li>Centang hak akses (scope) <strong><code>repo</code></strong> (ini wajib agar bisa mengunggah berkas)</li>
                  <li>Klik <strong>Generate token</strong> di bagian bawah dan salin kodenya ke sini</li>
                </ol>
              </div>
            </form>
          )}

          {/* Legal Disclaimer Link */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 text-center text-[11px] text-slate-450 dark:text-slate-500">
            Dengan masuk, Anda menyetujui <a href="#/legal" className="text-indigo-500 hover:underline font-medium">Syarat & Ketentuan</a> serta <a href="#/legal" className="text-indigo-500 hover:underline font-medium">Kebijakan Privasi</a> kami.
          </div>

        </div>
      </div>
    </div>
  );
};
