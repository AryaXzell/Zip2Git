/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  HelpCircle, 
  Code2, 
  Cpu, 
  CheckCircle, 
  FileCheck2, 
  KeyRound, 
  FolderLock,
  GitPullRequest,
  ChevronDown,
  ChevronUp,
  Send,
  MessageSquare,
  Sparkles,
  AlertCircle,
  Check,
  Globe,
  Monitor,
  Wrench
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const AboutPage: React.FC = () => {
  const { user } = useApp();
  
  // FAQ state
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(null);
  
  // Custom categories list with beautiful Lucide icons
  const categoriesList = [
    { label: "Bug / Masalah Teknis", value: "Bug / Masalah Teknis", icon: <Wrench className="h-3.5 w-3.5 text-rose-500 shrink-0" /> },
    { label: "Request Fitur Baru", value: "Request Fitur Baru", icon: <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" /> },
    { label: "Pertanyaan / Bantuan", value: "Pertanyaan / Bantuan", icon: <HelpCircle className="h-3.5 w-3.5 text-sky-500 shrink-0" /> },
    { label: "Keamanan / Privasi", value: "Masalah Keamanan / Privasi", icon: <ShieldAlert className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> }
  ];
  
  // Report Form state
  const [formData, setFormData] = React.useState({
    name: '',
    category: 'Bug / Masalah Teknis',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [status, setStatus] = React.useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });
  const [mockLogged, setMockLogged] = React.useState(false);
  const [mockMessage, setMockMessage] = React.useState('');
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

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

  const faqs = [
    {
      q: "Apa itu Zip2Git?",
      a: "Zip2Git adalah alat berbasis web modern yang memungkinkan Anda mengunggah dan memigrasikan seluruh struktur kode dari berkas ZIP langsung ke repositori GitHub tanpa memerlukan instalasi lokal git, terminal, atau dependensi lokal lainnya."
    },
    {
      q: "Apakah data dan token akses GitHub saya aman?",
      a: "Sangat aman. Zip2Git dirancang sepenuhnya dengan prinsip client-side-only. Seluruh proses dekompresi ZIP dan interaksi API dilakukan langsung dari peramban Anda. Token PAT (Personal Access Token) disimpan secara lokal hanya di memori sessionStorage perangkat Anda, dan otomatis terhapus saat Anda keluar atau menutup tab browser."
    },
    {
      q: "Mengapa ada beberapa berkas yang otomatis diabaikan?",
      a: "Untuk menjaga kebersihan repositori dan mengoptimalkan kecepatan unggah, berkas/folder sampah seperti node_modules, .git, .DS_Store, serta berkas besar (>2MB) atau file rahasia (.env) disaring otomatis. Anda juga dapat menyaring dan mengabaikan berkas secara manual melalui panel interaktif File Tree di Dasbor."
    },
    {
      q: "Bagaimana cara mendapatkan Token PAT GitHub?",
      a: "Masuk ke GitHub Anda, klik foto profil › Settings › Developer settings › Personal access tokens › Tokens (classic). Buat token baru dengan hak akses (scope) 'repo' agar aplikasi dapat mengunggah file. Salin token tersebut dan masukkan ke halaman masuk Zip2Git."
    },
    {
      q: "Berapa batas ukuran berkas ZIP yang didukung?",
      a: "Aplikasi ini memproses berkas ZIP sepenuhnya di memori browser Anda, sehingga batasnya tergantung pada kapasitas memori perangkat Anda. Namun, untuk stabilitas API GitHub, kami merekomendasikan berkas ZIP di bawah 100MB atau mengunggahnya secara bertahap menggunakan fitur penyaringan berkas."
    }
  ];

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) {
      setStatus({ type: 'error', text: 'Pesan laporan wajib diisi.' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: null, text: '' });
    setMockLogged(false);
    setMockMessage('');

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          message: formData.message,
          githubUsername: user?.login || '',
          githubName: user?.name || '',
          url: window.location.hash || window.location.pathname || '/',
          version: 'v1.0.0'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat mengirim laporan.');
      }

      if (data.mockLogged) {
        setMockLogged(true);
        setMockMessage(data.formattedMessage);
        setStatus({
          type: 'success',
          text: 'Simulasi Berhasil! (Bot Telegram belum aktif, silakan lihat format output bot di bawah ini).'
        });
      } else {
        setStatus({
          type: 'success',
          text: 'Terima kasih! Laporan Anda sukses dikirim langsung ke Telegram developer secara instan!'
        });
        
        // Reset message only
        setFormData(prev => ({ ...prev, message: '' }));
      }
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message || 'Gagal mengirim laporan. Silakan coba lagi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-12 text-left max-w-4xl mx-auto pb-12"
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

      {/* PAT Token Guide */}
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

      {/* Interactive FAQ Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="h-5.5 w-5.5 text-indigo-500" />
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Pertanyaan Sering Diajukan (FAQ)</h2>
        </div>
        
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div 
                key={index}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left font-bold text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-950 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 pb-4 pt-1 border-t border-slate-100 dark:border-slate-850 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Support / Report Form Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
        {/* Left Side: Editorial Banner */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-2xl w-fit">
            <Sparkles className="h-6 w-6 text-indigo-500" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
            Hubungi Kami & Laporkan Masalah
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Menemukan bug ketika mengunggah ZIP? Memiliki usulan fitur baru yang keren? Kirimkan pesan Anda melalui formulir serverless ini.
          </p>
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
              <Check className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Pengiriman laporan instan via Telegram Bot</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
              <Check className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Informasi IP & User-Agent terlampir otomatis</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
              <Check className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Aman tanpa penyimpanan basis data sekunder</span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Form */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Nama Pengirim
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={user ? `${user.name || user.login} (GitHub)` : "Anonymous"}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Custom Category Selector */}
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                    Kategori Laporan
                  </label>
                  
                  {/* Dropdown Trigger */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white flex items-center justify-between cursor-pointer transition-all hover:bg-slate-100/50 dark:hover:bg-slate-900"
                    >
                      <div className="flex items-center gap-2">
                        {(categoriesList.find(c => c.value === formData.category) || categoriesList[0]).icon}
                        <span>{(categoriesList.find(c => c.value === formData.category) || categoriesList[0]).label}</span>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Animated Dropdown Menu */}
                    <AnimatePresence>
                      {dropdownOpen && (
                        <>
                          {/* Invisible overlay to close dropdown */}
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setDropdownOpen(false)} 
                          />
                          
                          <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 4, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute left-0 right-0 top-full z-20 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden py-1.5"
                          >
                            {categoriesList.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, category: opt.value });
                                  setDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-2.5 text-left text-xs cursor-pointer transition-colors flex items-center justify-between ${
                                  formData.category === opt.value
                                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-semibold'
                                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {opt.icon}
                                  <span>{opt.label}</span>
                                </div>
                                {formData.category === opt.value && (
                                  <Check className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                                )}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Message Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  Pesan Laporan <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Deskripsikan dengan detail laporan Anda di sini (misal: gagal unggah zip di atas 100MB, error token PAT, usul layout tambahan, dsb.)..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white placeholder-slate-450 dark:placeholder-slate-500 leading-relaxed"
                />
              </div>

              {/* Status Alert */}
              {status.text && (
                <div 
                  className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 border ${
                    status.type === 'success' 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400' 
                      : 'bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400'
                  }`}
                >
                  {status.type === 'success' ? (
                    <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <span>{status.text}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.message.trim()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sedang mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Kirim Laporan
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Telegram simulated preview if bot is not configured */}
            {mockLogged && mockMessage && (
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4.5 mt-2 space-y-2 text-left animate-fade-in">
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <Monitor className="h-3.5 w-3.5" />
                  Pratinjau Pesan Terkirim ke Telegram:
                </p>
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl font-mono text-[11px] text-slate-350 dark:text-slate-300 shadow-inner max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                  <div dangerouslySetInnerHTML={{ __html: mockMessage }} />
                </div>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 italic">
                  *Untuk menerima notifikasi secara nyata di Telegram Chat Anda, silakan hubungkan bot dengan mengatur environment variable <strong>TELEGRAM_BOT_TOKEN</strong> dan <strong>TELEGRAM_CHAT_ID</strong> di Vercel Settings.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </motion.div>
  );
};
