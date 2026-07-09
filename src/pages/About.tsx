/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  HelpCircle, 
  Code2, 
  Cpu, 
  CheckCircle, 
  FileCheck2, 
  KeyRound, 
  FolderLock,
  GitPullRequest
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const securityPoints = [
    {
      icon: <KeyRound className="h-6 w-6 text-indigo-500" />,
      title: 'Hanya di Sisi Klien (Local Client-Side Only)',
      description: 'Seluruh proses dekompresi berkas ZIP dan pemanggilan API GitHub dilakukan langsung di dalam browser Anda. Token PAT dan kode proyek Anda tidak pernah melewati server perantara mana pun.'
    },
    {
      icon: <FolderLock className="h-6 w-6 text-indigo-500" />,
      title: 'sessionStorage yang Aman',
      description: 'Token akses GitHub Anda disimpan sementara di sessionStorage peramban. Token akan langsung dihancurkan dan dihapus secara otomatis begitu Anda menutup tab browser atau mengklik tombol Keluar.'
    },
    {
      icon: <GitPullRequest className="h-6 w-6 text-indigo-500" />,
      title: 'Transparansi Operasi',
      description: 'Setiap berkas yang didekompresi dikirim ke repositori target secara rekursif via GitHub Contents API. Anda dapat memantau setiap berkas yang sedang diunggah secara real-time.'
    }
  ];

  const excludedFiles = [
    'node_modules/',
    '.git/',
    '.github/',
    '.DS_Store',
    'Thumbs.db',
    '.env',
    '.env.local',
    'dist/',
    'build/',
    '.next/',
    '.cache/'
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-12 text-left max-w-4xl mx-auto"
    >
      {/* Editorial Header */}
      <div className="text-center space-y-4 py-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-full text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          <Cpu className="h-3.5 w-3.5" />
          Tentang Zip2Git
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Solusi Migrasi Kode Tanpa Rumit
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Misi kami adalah menjembatani proyek lokal berformat ZIP langsung ke GitHub dengan pendekatan yang instan, aman, dan tanpa bergantung pada instalasi lokal Git.
        </p>
      </div>

      {/* Bento-like Security Section */}
      <section className="space-y-6">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="h-5.5 w-5.5 text-indigo-500" />
          Arsitektur Keamanan & Privasi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {securityPoints.map((point, idx) => (
            <div 
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col space-y-4"
            >
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl w-fit">
                {point.icon}
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-sm text-slate-950 dark:text-white">
                  {point.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {point.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Smart Exclusion Rules */}
      <section className="bg-slate-900 text-white dark:bg-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit">
            <Code2 className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold tracking-tight">Aturan Pengabaian Berkas Cerdas</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Untuk mengoptimalkan kecepatan unggah dan mencegah repositori dipenuhi oleh berkas sampah atau dependensi eksternal, Zip2Git secara otomatis mengabaikan berkas dan folder berikut selama pemrosesan berkas ZIP:
          </p>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>Meningkatkan efisiensi & menjaga repositori tetap bersih</span>
          </div>
        </div>
        <div className="bg-slate-950/80 border border-slate-850 p-5 rounded-xl font-mono text-xs text-indigo-400">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Berkas di-ignore otomatis:</span>
            <FileCheck2 className="h-4 w-4 text-slate-500" />
          </div>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-left">
            {excludedFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="text-slate-600 select-none">›</span>
                <span className="text-slate-300 hover:text-indigo-300 transition-colors">{file}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Guide */}
      <section className="space-y-6">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="h-5.5 w-5.5 text-indigo-500" />
          Panduan Penggunaan Classic PAT yang Aman
        </h2>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="space-y-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            <p>
              Untuk mengunggah file ZIP Anda ke GitHub, Zip2Git membutuhkan otentikasi melalui <strong>GitHub Personal Access Token (Classic PAT)</strong>. Berikut adalah panduan singkat cara membuatnya dengan aman:
            </p>
            <ol className="list-decimal pl-5 space-y-2 pt-2">
              <li>Buka akun GitHub Anda dan navigasi ke <strong>Settings › Developer settings › Personal access tokens › Tokens (classic)</strong>.</li>
              <li>Klik <strong>Generate new token (classic)</strong>.</li>
              <li>Berikan deskripsi nama token yang jelas, misal: <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-950 rounded text-slate-900 dark:text-white font-mono font-bold">Zip2Git Integrator</code>.</li>
              <li>Atur tanggal kedaluwarsa sesuai preferensi keamanan Anda (direkomendasikan 7 atau 30 hari).</li>
              <li>Centang cakupan ijin (scope) <strong><code className="text-indigo-600 dark:text-indigo-400 font-bold">repo</code></strong> (Full control of private repositories) agar Zip2Git dapat membaca repositori Anda dan menulis berkas baru.</li>
              <li>Klik <strong>Generate token</strong> di bagian bawah dan salin token tersebut. Tempelkan langsung ke kolom masuk Zip2Git.</li>
            </ol>
            <div className="p-3 bg-amber-50 border border-amber-200/50 dark:bg-amber-950/20 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-500/90 rounded-xl mt-4 flex items-start gap-2.5">
              <ShieldAlert className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
              <span><strong>Pemberitahuan Penting:</strong> Jagalah kerahasiaan token PAT Anda seperti menjaga kata sandi utama Anda. Jangan pernah mempublikasikan token tersebut di repositori publik atau membagikannya dengan pihak lain.</span>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};
