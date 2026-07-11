/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Scale, 
  FileText, 
  AlertTriangle, 
  KeyRound, 
  Database, 
  Lock, 
  UserCheck, 
  Globe, 
  Terminal, 
  Check, 
  ShieldAlert,
  Info,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const LegalPage: React.FC = () => {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<'syarat' | 'privasi'>('syarat');

  const termsPoints = [
    {
      icon: <KeyRound className="h-5 w-5 text-amber-500" />,
      title: 'Tanggung Jawab Token PAT (Personal Access Token)',
      description: 'Seluruh Token Akses Pribadi (PAT) GitHub yang Anda masukkan diproses dan disimpan murni di sisi klien peramban Anda menggunakan sessionStorage. Kami TIDAK BERTANGGUNG JAWAB atas kebocoran, pencurian, atau penyalahgunaan token karena kelalaian pengguna seperti infeksi malware, ekstensi peramban pihak ketiga yang tidak aman, atau kelengahan di perangkat publik.'
    },
    {
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      title: 'Pembatasan Tanggung Jawab Hukum (No-Liability)',
      description: 'Layanan Zip2Git disediakan "sebagaimana adanya" (AS IS) tanpa jaminan kelancaran operasional 100% atau ketiadaan galat. Kami tidak bertanggung jawab secara hukum atas segala bentuk kerugian material atau immaterial, kerusakan kode sumber, hilangnya data repositori, atau penangguhan akun GitHub Anda akibat penggunaan platform ini.'
    },
    {
      icon: <Database className="h-5 w-5 text-indigo-500" />,
      title: 'Kebijakan Unggah Berkas & Konten',
      description: 'Anda bertanggung jawab penuh atas hak cipta dan keaslian kode sumber yang Anda migrasikan. Anda dilarang keras mengunggah berkas ZIP yang mengandung virus, malware, script berbahaya, atau kode ilegal yang melanggar kebijakan penggunaan layanan GitHub.'
    },
    {
      icon: <Scale className="h-5 w-5 text-indigo-500" />,
      title: 'Perubahan Layanan & Ketentuan',
      description: 'Kami berhak memodifikasi, menghentikan sementara, atau mengubah fitur-fitur pada platform Zip2Git serta memperbarui dokumen Syarat & Ketentuan ini kapan pun demi menyesuaikan dengan kepatuhan kebijakan API GitHub.'
    }
  ];

  const privacyPoints = [
    {
      icon: <Lock className="h-5 w-5 text-emerald-500" />,
      title: 'Tidak Ada Penyimpanan Server / Database',
      description: 'Zip2Git dirancang sepenuhnya tanpa database pusat untuk menyimpan kode Anda. Berkas ZIP yang Anda unggah diekstrak langsung di memori browser dan dikirim langsung ke repositori GitHub via API GitHub resmi. Kode sumber Anda tidak pernah singgah di server kami.'
    },
    {
      icon: <Globe className="h-5 w-5 text-emerald-500" />,
      title: 'Laporan Laporan Serverless (Telegram Bot)',
      description: 'Bila Anda secara sukarela mengirimkan feedback atau laporan bug di halaman "Tentang", data dikirimkan secara instan ke bot Telegram kami secara serverless demi memudahkan perbaikan masalah. Data yang terkirim mencakup Nama, Kategori, Pesan, serta Metadata Teknis seperti IP Address, User-Agent (Sistem Operasi, Perangkat, Browser), dan URL asal. Data ini tidak disimpan di database mana pun.'
    },
    {
      icon: <Terminal className="h-5 w-5 text-indigo-500" />,
      title: 'Penyimpanan Sesi Browser Lokal',
      description: 'Token PAT GitHub disimpan sementara di sessionStorage browser Anda yang akan langsung terhapus dan hancur secara permanen ketika Anda mengklik tombol "Keluar Sesi" atau menutup tab browser Anda. Pengaturan tampilan dasar seperti Preferensi Tema disimpan di localStorage.'
    },
    {
      icon: <UserCheck className="h-5 w-5 text-indigo-500" />,
      title: 'Kontrol & Keamanan Akun Anda',
      description: 'Anda memegang kendali penuh atas sesi Anda. Anda dapat kapan saja membatalkan otorisasi token PAT di pengaturan profil pengembang GitHub Anda (Settings > Developer settings > Personal access tokens) untuk memastikan keamanan tambahan.'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-10 text-left max-w-4xl mx-auto pb-12"
    >
      {/* Editorial Header */}
      <div className="text-center space-y-4 py-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-full text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          Ketentuan Hukum & Privasi
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Syarat Ketentuan & Kebijakan Privasi
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Komitmen kami adalah transparansi penuh. Kami meyakinkan Anda bahwa data, token akses, dan kode sumber Anda tetap aman dan sepenuhnya berada di bawah kendali Anda sendiri.
        </p>
      </div>

      {/* Critical Security Warning Card */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 dark:from-amber-950/15 dark:to-orange-950/5 dark:border-amber-900/40 p-6 rounded-2xl flex flex-col md:flex-row items-start gap-4.5 shadow-sm">
        <div className="p-3 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-xl shrink-0">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h3 className="font-extrabold text-sm text-amber-900 dark:text-amber-400">
            Pemberitahuan Keamanan Penting (PAT & sessionStorage)
          </h3>
          <p className="text-xs text-amber-800 dark:text-slate-400 leading-relaxed">
            Zip2Git beroperasi penuh di sisi klien. Kami <strong>tidak mengumpulkan, menyalin, atau menyimpan</strong> Token PAT GitHub Anda ke basis data server. Sifat penyimpanan <code>sessionStorage</code> berarti token Anda hanya hidup selama tab browser terbuka dan akan terhapus otomatis begitu tab ditutup atau Anda klik tombol <strong>Keluar Sesi</strong>. Dengan demikian, tanggung jawab atas kebersihan perangkat, proteksi dari spyware, dan keamanan token PAT sepenuhnya berada di tangan Anda.
          </p>
        </div>
      </div>

      {/* Dynamic Tabs Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('syarat')}
            className={`pb-4 text-xs font-extrabold tracking-wide uppercase transition-all relative cursor-pointer flex items-center gap-2 ${
              activeTab === 'syarat'
                ? 'text-indigo-600 dark:text-indigo-400 font-black'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            Syarat & Ketentuan Penggunaan
            {activeTab === 'syarat' && (
              <motion.div 
                layoutId="legalActiveTabLine" 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" 
              />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('privasi')}
            className={`pb-4 text-xs font-extrabold tracking-wide uppercase transition-all relative cursor-pointer flex items-center gap-2 ${
              activeTab === 'privasi'
                ? 'text-indigo-600 dark:text-indigo-400 font-black'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Lock className="h-4 w-4" />
            Kebijakan Privasi Pengguna
            {activeTab === 'privasi' && (
              <motion.div 
                layoutId="legalActiveTabLine" 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" 
              />
            )}
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {activeTab === 'syarat' ? (
          <motion.div
            key="syarat-tab"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Scale className="h-5 w-5 text-indigo-500" />
                  Syarat & Ketentuan Penggunaan (Terms of Service)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Pembaruan terakhir: 11 Juli 2026. Mohon baca dengan saksama ketentuan di bawah ini.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {termsPoints.map((point, index) => (
                <div 
                  key={index}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-3.5 flex flex-col"
                >
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg w-fit">
                    {point.icon}
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">
                      {point.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="privasi-tab"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Lock className="h-5 w-5 text-emerald-500" />
                  Kebijakan Privasi Pengguna (Privacy Policy)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Pembaruan terakhir: 11 Juli 2026. Kami berkomitmen melindungi integritas hak digital Anda.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {privacyPoints.map((point, index) => (
                <div 
                  key={index}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-3.5 flex flex-col"
                >
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-lg w-fit">
                    {point.icon}
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">
                      {point.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accordion / FAQ Link or Back to Dashboard Banner */}
      <section className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
            Ada pertanyaan lebih lanjut mengenai ketentuan hukum kami?
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hubungi developer secara langsung atau tanyakan melalui formulir laporan di halaman Tentang.
          </p>
        </div>
        <a 
          href="#/tentang" 
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-sm transition-colors cursor-pointer w-fit"
        >
          Kirim Laporan
          <ChevronRight className="h-3.5 w-3.5" />
        </a>
      </section>
    </motion.div>
  );
};
