import React, { useState, useEffect } from 'react';
import {
  Users,
  Eye,
  MessageSquare,
  Send,
  Star,
  ThumbsUp,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Building2,
  Calendar,
  Trash2,
  Printer,
  Heart,
  TrendingUp,
  Award,
  ShieldCheck,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { KomentarPengunjung, VisitorStats } from '../../types';
import { visitorCommentService } from '../../services/visitorCommentService';
import { showToast } from '../../utils/toast';

interface BukuTamuKomentarProps {
  onBackToDashboard?: () => void;
}

export const BukuTamuKomentar: React.FC<BukuTamuKomentarProps> = ({ onBackToDashboard }) => {
  const [stats, setStats] = useState<VisitorStats>(() => visitorCommentService.getCachedStats());
  const [comments, setComments] = useState<KomentarPengunjung[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'semua' | 'pengawas' | 'guru' | 'kepsek' | 'bintang5'>('semua');

  // New Comment Form states
  const [nama, setNama] = useState('');
  const [instansi, setInstansi] = useState('');
  const [role, setRole] = useState('Guru Mapel / Pendidik');
  const [komentar, setKomentar] = useState('');
  const [rating, setRating] = useState(5);
  const [emoji, setEmoji] = useState('🌟');

  const EMOJI_OPTIONS = ['🌟', '🔥', '❤️', '💡', '👏', '🎯', '🚀', '✨'];

  const ROLE_OPTIONS = [
    'Guru Mapel / Pendidik',
    'Wali Kelas',
    'Kepala Sekolah',
    'Pengawas Sekolah',
    'Wakil Kepala Sekolah (Kurikulum/Kesiswaan)',
    'Guru Bimbingan Konseling (BK)',
    'Mahasiswa PPG / Calon Guru',
    'Orang Tua Siswa / Komite',
    'Pemerhati Pendidikan / Tamu Umum',
  ];

  // Load stats and comments
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedStats, fetchedComments] = await Promise.all([
        visitorCommentService.getStats(),
        visitorCommentService.getComments(),
      ]);
      setStats(fetchedStats);
      setComments(fetchedComments);
    } catch (err) {
      console.warn('Error loading guestbook data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Record visit on mount
    visitorCommentService.recordVisit().then((updated) => {
      setStats(updated);
    });
  }, []);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !komentar.trim()) {
      Swal.fire({
        title: 'Form Belum Lengkap',
        text: 'Mohon isi nama lengkap dan pesan komentar Anda.',
        icon: 'warning',
        confirmButtonColor: '#2563eb',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const newComment = await visitorCommentService.addComment({
        nama: nama.trim(),
        instansi: instansi.trim() || 'Satuan Pendidikan',
        role: role.trim(),
        komentar: komentar.trim(),
        rating,
        emoji,
      });

      setComments((prev) => [newComment, ...prev]);
      setKomentar('');
      showToast('Komentar berhasil dikirim! Terima kasih atas masukan Anda.', 'success');

      Swal.fire({
        title: 'Terima Kasih!',
        text: 'Komentar dan ulasan Anda telah berhasil diterbitkan di Buku Tamu.',
        icon: 'success',
        confirmButtonColor: '#2563eb',
      });
    } catch (err: any) {
      Swal.fire({
        title: 'Gagal Mengirim Komentar',
        text: err?.message || 'Terjadi kesalahan sistem.',
        icon: 'error',
        confirmButtonColor: '#d33',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    const target = comments.find((c) => c.id === commentId);
    if (!target) return;

    if (target.likedByMe) {
      showToast('Anda sudah memberikan apresiasi untuk komentar ini.', 'info');
      return;
    }

    // Optimistic UI update
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, likes: c.likes + 1, likedByMe: true } : c))
    );

    try {
      await visitorCommentService.likeComment(commentId);
      showToast('Apresiasi terkirim! 👍', 'success');
    } catch {
      // Revert if error
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, likes: c.likes - 1, likedByMe: false } : c))
      );
    }
  };

  const handleDelete = async (commentId: string) => {
    const res = await Swal.fire({
      title: 'Hapus Komentar?',
      text: 'Komentar ini akan dihapus dari buku tamu.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });

    if (res.isConfirmed) {
      const ok = await visitorCommentService.deleteComment(commentId);
      if (ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        showToast('Komentar berhasil dihapus.', 'info');
      }
    }
  };

  // Filtered comments
  const filteredComments = comments.filter((c) => {
    const matchesSearch =
      c.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.instansi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.komentar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedRoleFilter === 'pengawas') {
      return c.role.toLowerCase().includes('pengawas');
    }
    if (selectedRoleFilter === 'kepsek') {
      return c.role.toLowerCase().includes('kepala');
    }
    if (selectedRoleFilter === 'guru') {
      return c.role.toLowerCase().includes('guru') || c.role.toLowerCase().includes('wali');
    }
    if (selectedRoleFilter === 'bintang5') {
      return c.rating === 5;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Card with High-Impact Vibrant Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#071d49] via-[#0d2d6b] to-[#142340] text-white p-6 sm:p-8 shadow-2xl border-2 border-blue-500/40">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black tracking-wide shadow-md">
              <Eye className="w-4 h-4 text-slate-950 animate-pulse" />
              LIVE STATISTIK & BUKU TAMU
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Penghitung Pengunjung & Buku Tamu Interaktif
            </h1>

            <p className="text-xs sm:text-sm text-blue-200 leading-relaxed">
              Selamat datang di portal administrasi guru <strong className="text-amber-300">Tongguru Yusak Yokoyama</strong>. 
              Sistem ini mencatat kehadiran pengunjung secara transparan dan menyediakan buku tamu terbuka bagi rekan guru, kepala sekolah, pengawas, dan mitra pendidikan di seluruh Indonesia.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Segarkan Data
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold text-xs shadow-md transition-all no-print"
            >
              <Printer className="w-4 h-4" />
              Cetak Buku Tamu
            </button>
          </div>
        </div>

        {/* Ambient Decorative Blurs */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 top-0 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
      </div>

      {/* METRIC ODOMETER CARDS (4 Highlight Boxes: Biru, Hijau, Orange, Kuning) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Box 1: Total Kunjungan (Biru Samudra) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100/70 dark:from-blue-950/70 dark:via-slate-900 dark:to-blue-900/40 border-2 border-blue-500 dark:border-blue-600 p-5 rounded-2xl shadow-md space-y-2">
          <div className="h-1.5 w-full absolute top-0 left-0 bg-blue-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-blue-900 dark:text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              Total Kunjungan
            </span>
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-3xl font-black font-mono text-blue-950 dark:text-white">
              {stats.totalVisitors.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] font-black text-blue-700 bg-blue-100 dark:bg-blue-900/80 px-2.5 py-0.5 rounded-full">
              Akumulasi
            </span>
          </div>
          <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">
            Total tayangan & sesi aplikasi
          </p>
        </div>

        {/* Box 2: Pengunjung Hari Ini (Hijau Emerald) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-emerald-100/70 dark:from-emerald-950/70 dark:via-slate-900 dark:to-emerald-900/40 border-2 border-emerald-500 dark:border-emerald-600 p-5 rounded-2xl shadow-md space-y-2">
          <div className="h-1.5 w-full absolute top-0 left-0 bg-emerald-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Kunjungan Hari Ini
            </span>
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-3xl font-black font-mono text-emerald-950 dark:text-white">
              {stats.todayVisitors.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 dark:bg-emerald-900/80 px-2.5 py-0.5 rounded-full">
              Hari Ini
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
            Aktivitas guru hari ini
          </p>
        </div>

        {/* Box 3: Pengunjung Unik (Orange Jingga) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-100/70 dark:from-orange-950/70 dark:via-slate-900 dark:to-orange-900/40 border-2 border-orange-500 dark:border-orange-600 p-5 rounded-2xl shadow-md space-y-2">
          <div className="h-1.5 w-full absolute top-0 left-0 bg-orange-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-orange-900 dark:text-orange-200 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              Pengguna Unik
            </span>
            <div className="p-2.5 bg-orange-600 text-white rounded-xl shadow-md">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-3xl font-black font-mono text-orange-950 dark:text-white">
              {stats.uniqueVisitors.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] font-black text-orange-800 bg-orange-100 dark:bg-orange-900/80 px-2.5 py-0.5 rounded-full">
              Pendidik
            </span>
          </div>
          <p className="text-[11px] text-orange-700 dark:text-orange-300 font-medium">
            Perangkat & akun berbeda
          </p>
        </div>

        {/* Box 4: Komentar & Testimoni (Kuning / Amber) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-amber-100/70 dark:from-amber-950/70 dark:via-slate-900 dark:to-amber-900/40 border-2 border-amber-500 dark:border-amber-600 p-5 rounded-2xl shadow-md space-y-2">
          <div className="h-1.5 w-full absolute top-0 left-0 bg-amber-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Total Komentar
            </span>
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl shadow-md">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-3xl font-black font-mono text-amber-950 dark:text-white">
              {comments.length}
            </span>
            <span className="text-[10px] font-black text-amber-900 bg-amber-200 dark:bg-amber-900/80 px-2.5 py-0.5 rounded-full">
              Buku Tamu
            </span>
          </div>
          <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
            Testimoni & ulasan rekan guru
          </p>
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT: FORM TAMBAH KOMENTAR (Kiri) & DAFTAR KOMENTAR (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* KOLOM KIRI: FORMULIR TAMBAH KOMENTAR (5 Kolom) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-blue-400 dark:border-blue-700 shadow-xl space-y-5 sticky top-20">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Tulis Komentar / Ulasan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tinggalkan jejak, apresiasi, atau saran untuk aplikasi ini
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitComment} className="space-y-4">
            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Nama Lengkap & Gelar *
              </label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Drs. Bambang Sutrisno, M.Pd."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Asal Sekolah / Instansi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Asal Sekolah / Instansi *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={instansi}
                  onChange={(e) => setInstansi(e.target.value)}
                  placeholder="Contoh: SMKN 1 Surabaya / Dinas Pendidikan"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Peran / Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Peran / Jabatan
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating Bintang */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Penilaian / Rating Aplikasi
              </label>
              <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/50">
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <button
                    type="button"
                    key={starVal}
                    onClick={() => setRating(starVal)}
                    className="p-1 text-amber-400 hover:scale-125 transition-transform"
                    title={`Beri ${starVal} Bintang`}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        starVal <= rating
                          ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300 ml-2">
                  {rating === 5
                    ? '⭐⭐⭐⭐⭐ Sangat Memuaskan'
                    : rating === 4
                    ? '⭐⭐⭐⭐ Baik'
                    : rating === 3
                    ? '⭐⭐⭐ Cukup'
                    : 'Kritik & Masukan'}
                </span>
              </div>
            </div>

            {/* Pilihan Reaksi Emoji */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Pilih Reaksi Emoji
              </label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((em) => (
                  <button
                    type="button"
                    key={em}
                    onClick={() => setEmoji(em)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border-2 transition-all ${
                      emoji === em
                        ? 'border-blue-600 bg-blue-100 dark:bg-blue-900/50 scale-110 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* Isi Komentar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Isi Pesan Komentar / Testimoni *
                </label>
                <span className="text-[10px] text-slate-400">{komentar.length}/500 karakter</span>
              </div>
              <textarea
                required
                rows={4}
                maxLength={500}
                value={komentar}
                onChange={(e) => setKomentar(e.target.value)}
                placeholder="Bagikan pengalaman Anda menggunakan aplikasi Tongguru Yusak Yokoyama ini..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Mengirim Komentar...' : 'Kirim Komentar Sekarang'}
            </button>
          </form>
        </div>

        {/* KOLOM KANAN: DAFTAR KOMENTAR & ULASAN (7 Kolom) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filter & Search Header Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border-2 border-slate-200 dark:border-slate-800 shadow-md space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari komentar guru, sekolah, atau kata kunci..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                Menampilkan <span className="text-blue-600 dark:text-blue-400 font-black">{filteredComments.length}</span> ulasan
              </div>
            </div>

            {/* Quick Filter Badges */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { id: 'semua', label: 'Semua Ulasan' },
                { id: 'bintang5', label: '⭐ Rating 5 Bintang' },
                { id: 'pengawas', label: 'Pengawas Sekolah' },
                { id: 'guru', label: 'Guru & Pendidik' },
                { id: 'kepsek', label: 'Kepala Sekolah' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedRoleFilter(f.id as any)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    selectedRoleFilter === f.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* List of Comments */}
          {filteredComments.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border-2 border-dashed border-slate-300 dark:border-slate-800 space-y-3">
              <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum ada komentar ditemukan</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? 'Tidak ada komentar yang cocok dengan pencarian Anda. Silakan coba kata kunci lain.'
                  : 'Jadilah orang pertama yang menulis ulasan dan testimoni di buku tamu ini!'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredComments.map((c) => {
                const formattedDate = new Date(c.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={c.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 border-2 border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all space-y-3"
                  >
                    {/* Header Card: Avatar, Name, Role, Rating */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Dynamic Avatar */}
                        <div
                          className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${
                            c.avatarColor || 'from-blue-600 to-indigo-700'
                          } text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md`}
                        >
                          {c.nama.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                              {c.nama}
                            </h3>
                            <span className="text-base">{c.emoji || '✨'}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="font-bold text-blue-600 dark:text-blue-400">{c.role}</span>
                            <span>•</span>
                            <span className="truncate max-w-[200px]">{c.instansi}</span>
                          </div>
                        </div>
                      </div>

                      {/* Rating Stars & Delete */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex items-center bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800/40">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                          <span className="text-xs font-black text-amber-700 dark:text-amber-300">
                            {c.rating}.0
                          </span>
                        </div>

                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
                          title="Hapus Komentar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Comment Content */}
                    <p className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed font-medium bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      "{c.komentar}"
                    </p>

                    {/* Footer: Date & Like Button */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formattedDate}
                      </span>

                      <button
                        onClick={() => handleLike(c.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black transition-all border ${
                          c.likedByMe
                            ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300'
                        }`}
                        title="Beri apresiasi (Suka)"
                      >
                        <Heart className={`w-3.5 h-3.5 ${c.likedByMe ? 'fill-white text-white' : ''}`} />
                        <span>{c.likes} Suka</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
