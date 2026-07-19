/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Github, AlertCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export const AuthCallback: React.FC = () => {
  const { loginWithOAuthToken } = useApp();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    // React 19 StrictMode / re-renders can fire effects twice — the
    // OAuth "code" is single-use, so guard against running this again.
    if (hasRun.current) return;
    hasRun.current = true;

    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const oauthError = params.get('error');

      if (oauthError) {
        setErrorMsg('Anda membatalkan proses login, atau GitHub menolak permintaan otorisasi.');
        return;
      }

      if (!code) {
        setErrorMsg('Kode otorisasi tidak ditemukan pada URL callback.');
        return;
      }

      const expectedState = sessionStorage.getItem('zip2git_oauth_state');
      sessionStorage.removeItem('zip2git_oauth_state');

      if (!expectedState || state !== expectedState) {
        setErrorMsg('Verifikasi keamanan (state) gagal. Silakan coba login kembali.');
        return;
      }

      try {
        const res = await fetch('/api/auth/github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.access_token) {
          throw new Error(data.error || 'Gagal menukar kode otorisasi dengan access token.');
        }

        const success = await loginWithOAuthToken(data.access_token);
        if (success) {
          navigate('/dashboard', { replace: true });
        } else {
          setErrorMsg('Berhasil mendapatkan token, namun gagal memvalidasi akun GitHub.');
        }
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setErrorMsg(err.message || 'Terjadi kesalahan saat proses login dengan GitHub.');
        toast.error('Gagal login dengan GitHub.');
      }
    };

    run();
  }, [loginWithOAuthToken, navigate]);

  return (
    <div className="flex-1 flex items-center justify-center py-10">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden text-center p-8">
        <div className="flex flex-col items-center">
          <div className="p-3 bg-slate-900 dark:bg-white/10 rounded-full mb-4">
            <Github className="h-8 w-8 text-white" />
          </div>

          {!errorMsg ? (
            <>
              <svg className="animate-spin h-6 w-6 text-indigo-500 mb-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Menyelesaikan login dengan GitHub...
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                Mohon tunggu sebentar, kami sedang memverifikasi akun Anda.
              </p>
            </>
          ) : (
            <>
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-full mb-3 -mt-1">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Login Gagal
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-[300px] mx-auto">
                {errorMsg}
              </p>
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Halaman Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
