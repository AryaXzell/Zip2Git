/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { 
  ArrowRight, 
  UploadCloud, 
  KeyRound, 
  ShieldCheck, 
  GitBranch, 
  CheckCircle2, 
  HelpCircle,
  FolderTree,
  AlertTriangle,
  Zap
} from 'lucide-react';

export const Home: React.FC = () => {
  const { user } = useApp();

  const features = [
    {
      icon: <KeyRound className="h-6 w-6 text-indigo-500" />,
      title: 'Akses Aman via PAT',
      description: 'Otentikasi menggunakan Token Akses Pribadi (PAT) GitHub. Kami tidak pernah menyimpan token Anda di server.',
    },
    {
      icon: <FolderTree className="h-6 w-6 text-indigo-500" />,
      title: 'Ekstraksi ZIP Sisi Klien',
      description: 'ZIP didekompresi langsung di dalam peramban Anda. Tidak ada berkas kode Anda yang dikirim ke server luar.',
    },
    {
      icon: <GitBranch className="h-6 w-6 text-indigo-500" />,
      title: 'Pertahankan Struktur Folder',
      description: 'Struktur folder ZIP Anda akan diunggah secara rekursif dan utuh ke GitHub Contents API.',
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-indigo-500" />,
      title: 'Pengabaian Berkas Cerdas',
      description: 'Secara otomatis mengabaikan berkas sampah seperti node_modules, .DS_Store, .git, dan Thumbs.db.',
    },
    {
      icon: <Zap className="h-6 w-6 text-indigo-500" />,
      title: 'Unggah Cepat & Rekursif',
      description: 'Setiap berkas diunggah secara asinkron dengan estimasi waktu penyelesaian yang akurat.',
    },
    {
      icon: <CheckCircle2 className="h-6 w-6 text-indigo-500" />,
      title: 'Buat Repositori Baru',
      description: 'Buat repositori baru (Publik/Privat) lengkap dengan README.md langsung dari aplikasi.',
    },
  ];

  const steps = [
    {
      num: '1',
      title: 'Masuk dengan PAT',
      description: 'Gunakan token GitHub Anda dengan hak akses `repo`.',
    },
    {
      num: '2',
      title: 'Pilih / Buat Repo',
      description: 'Pilih repositori Anda atau buat yang baru langsung dari dasbor.',
    },
    {
      num: '3',
      title: 'Unggah Berkas ZIP',
      description: 'Seret dan lepas berkas ZIP yang berisi proyek Anda.',
    },
    {
      num: '4',
      title: 'Pantau & Selesai',
      description: 'Lihat progres pengunggahan secara langsung dan buka di GitHub.',
    },
  ];

  const faqs = [
    {
      q: 'Apakah Token Akses Pribadi (PAT) saya aman?',
      a: 'Sangat aman. Token GitHub Anda hanya disimpan di sessionStorage peramban Anda. Ini berarti token akan langsung dihapus setelah Anda menutup tab atau keluar (logout). Kami tidak memiliki pelacakan basis data atau server backend yang menyimpan rahasia Anda.',
    },
    {
      q: 'Hak akses apa yang diperlukan untuk PAT saya?',
      a: 'Agar aplikasi dapat mengunggah berkas dan membuat repositori, Anda perlu mengaktifkan cakupan (scopes) `repo` (Full control of private repositories) saat membuat Classic PAT di GitHub.',
    },
    {
      q: 'Berapa batas ukuran berkas ZIP yang didukung?',
      a: 'Karena ekstraksi dan pengunggahan berkas diproses sepenuhnya di sisi peramban, disarankan untuk mengunggah ZIP dengan ukuran di bawah 50MB atau kurang dari 500 berkas untuk menghindari batasan memori peramban dan batas kecepatan API GitHub.',
    },
    {
      q: 'Bagaimana cara menangani batas kecepatan API GitHub?',
      a: 'GitHub memberlakukan batas 5.000 permintaan per jam untuk API dengan otentikasi PAT. Aplikasi Zip2Git melacak penggunaan dan menginformasikan sisa kuota Anda secara transparan di dasbor.',
    },
  ];

  return (
    <div className="space-y-16">
      
      {/* Hero Section */}
      <section className="text-center py-12 md:py-20 max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-full text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          <UploadCloud className="h-3.5 w-3.5" />
          Ekstraksi ZIP & Unggah Folder 100% Sisi Klien
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-tight">
          Kirim ZIP & Folder Proyek ke{' '}
          <span className="bg-gradient-to-r from-indigo-500 to-sky-500 bg-clip-text text-transparent">
            GitHub
          </span>{' '}
          Secara Instan
        </h1>
        <p className="text-base md:text-lg text-slate-600 dark:text-slate-400">
          Ubah berkas ZIP atau folder direktori proyek lokal menjadi repositori GitHub aktif hanya dengan beberapa detik. Sederhana, aman, tanpa instalasi Git di komputer Anda.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-sm font-semibold rounded-xl transition-all shadow-md hover:translate-y-[-1px]"
            >
              Buka Dasbor
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-sm font-semibold rounded-xl transition-all shadow-md hover:translate-y-[-1px]"
            >
              Mulai Sekarang
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <a
            href="#cara-kerja"
            className="inline-flex items-center justify-center px-6 py-3 border border-slate-200 hover:bg-slate-100/50 dark:border-slate-800 dark:hover:bg-slate-900/50 text-sm font-semibold rounded-xl transition-colors text-slate-700 dark:text-slate-300"
          >
            Pelajari Selengkapnya
          </a>
        </div>
      </section>

      {/* Security Advisory Warning */}
      <section className="bg-amber-50 border border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-900/40 rounded-2xl p-5 max-w-4xl mx-auto flex items-start gap-4">
        <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1 text-left">
          <h3 className="font-bold text-amber-900 dark:text-amber-400 text-sm">Privasi & Keamanan Terjamin</h3>
          <p className="text-xs text-amber-800 dark:text-amber-500/95 leading-relaxed">
            Aplikasi ini dibangun menggunakan arsitektur <strong>full-client</strong>. GitHub Personal Access Token (PAT) Anda ditangani langsung oleh peramban untuk berkomunikasi dengan GitHub API. Kode di dalam berkas ZIP Anda tidak pernah dikirim ke pihak ketiga atau server internal kami.
          </p>
        </div>
      </section>

      {/* Cara Kerja (How it works) */}
      <section id="cara-kerja" className="space-y-10 py-8 scroll-mt-20">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Cara Kerja</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Proses migrasi kode super cepat dalam 4 langkah sederhana
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {steps.map((step, idx) => (
            <div key={idx} className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col space-y-4">
              <span className="absolute top-4 right-4 text-3xl font-black text-slate-100 dark:text-slate-800 font-mono">
                {step.num}
              </span>
              <div className="h-10 w-10 flex items-center justify-center bg-indigo-50 dark:bg-indigo-950 rounded-xl font-bold text-indigo-600 dark:text-indigo-400 text-base">
                {step.num}
              </div>
              <div className="space-y-1 text-left">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                  {step.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="fitur" className="space-y-10 py-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Fitur Utama</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Zip2Git dilengkapi dengan kapabilitas modern untuk mempermudah migrasi proyek
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col space-y-4 text-left hover:border-indigo-500/40 hover:shadow-lg dark:hover:border-indigo-500/30 transition-all"
            >
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl w-fit">
                {feature.icon}
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section id="faq" className="space-y-10 py-8 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Pertanyaan Umum (FAQ)</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Segala informasi yang perlu Anda ketahui tentang Zip2Git
          </p>
        </div>
        <div className="space-y-5 text-left">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5"
            >
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
                {faq.q}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-6.5">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
