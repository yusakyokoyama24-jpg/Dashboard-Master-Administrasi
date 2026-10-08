import React, { useState } from 'react';
import { Lightbulb, Send, ArrowLeft, CheckCircle2, Lock, HelpCircle, Building2, Star, MessageSquareQuote } from 'lucide-react';
import Swal from 'sweetalert2';
import { Siswa, Pengaturan } from '../../types';
import { addSaran } from '../../services/saranService';

interface PortalSaranSiswaProps {
  siswaList: Siswa[];
  pengaturan?: Pengaturan;
}

export const PortalSaranSiswa: React.FC<PortalSaranSiswaProps> = ({ siswaList, pengaturan }) => {
  const [selectedNisn, setSelectedNisn] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [manualNama, setManualNama] = useState('');
  const [manualKelas, setManualKelas] = useState('');
  const [kategori, setKategori] = useState<'Fasilitas Sekolah' | 'Kurikulum & Pembelajaran' | 'Ekstrakurikuler' | 'Kebersihan & Lingkungan' | 'Kantin & Kantin Kejujuran' | 'Lainnya'>('Fasilitas Sekolah');
  const [judul, setJudul] = useState('');
  const [pesan, setPesan] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // If student is selected from directory
  const handleStudentSelect = (nisn: string) => {
    setSelectedNisn(nisn);
    const found = siswaList.find(s => s.nisn === nisn || s.id === nisn);
    if (found) {
      setManualNama(found.nama);
      setManualKelas(found.kelas);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!judul.trim() || !pesan.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Form Belum Lengkap',
        text: 'Mohon isi judul dan pesan/saran Anda.',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    if (!isAnonymous && !manualNama.trim() && !selectedNisn) {
      Swal.fire({
        icon: 'warning',
        title: 'Identitas Belum Diisi',
        text: 'Mohon pilih nama Anda atau centang opsi Kirim secara Anonim (Rahasia).',
        confirmButtonColor: '#f59e0b'
      });
      return;
    }

    setSubmitting(true);

    try {
      const now = new Date();
      const tanggal = now.toISOString().split('T')[0];
      const waktu = now.toTimeString().slice(0, 5);

      let finalNama = manualNama;
      let finalKelas = manualKelas;
      let finalNisn = selectedNisn;

      if (isAnonymous) {
        finalNama = 'Anonim';
        finalKelas = '-';
        finalNisn = '-';
      }

      addSaran({
        tanggal,
        waktu,
        pengirimNama: finalNama,
        pengirimKelas: finalKelas,
        pengirimNisn: finalNisn,
        isAnonymous,
        kategori,
        judul,
        pesan,
        rating
      });

      setSubmitting(false);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengirim',
        text: 'Terjadi kesalahan saat mengirim saran. Silakan coba lagi.',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setJudul('');
    setPesan('');
    setRating(5);
    setKategori('Fasilitas Sekolah');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-3xl mx-auto">
        
        {/* Header Banner */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 flex-shrink-0">
              <Lightbulb className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-semibold mb-2 border border-amber-200/50 dark:border-amber-800/50">
                <MessageSquareQuote className="w-3.5 h-3.5" /> Portal Aspirasi & Suara Murid
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Kotak Saran & Masukan Sekolah
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
                {pengaturan?.namaSekolah || 'Sekolah Kita'} — Sampaikan ide, kritik membangun, atau saran perbaikan untuk kemajuan sekolah kita bersama!
              </p>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-500" />
              <span>Diterima langsung oleh Tim Manajemen & Kesiswaan</span>
            </div>
            <a
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Beranda Utama
            </a>
          </div>
        </div>

        {/* Success State */}
        {submitted ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center animate-fadeIn">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Terima Kasih, Suara Anda Telah Terkirim!</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8 text-sm">
              Saran dan masukan Anda sangat berharga bagi peningkatan fasilitas dan kualitas pelayanan di sekolah. Setiap masukan akan ditinjau secara berkala.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={resetForm}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 transition-all"
              >
                Kirim Saran Lainnya
              </button>
              <a
                href="/"
                className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-all"
              >
                Kembali ke Beranda
              </a>
            </div>
          </div>
        ) : (
          /* Form Card */
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
            
            {/* Identity Section */}
            <div className="space-y-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm font-bold">1</span>
                  Identitas Pengirim
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => {
                      setIsAnonymous(e.target.checked);
                      if (e.target.checked) {
                        setSelectedNisn('');
                        setManualNama('');
                        setManualKelas('');
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
                  <span className="ml-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-amber-500" /> Kirim sebagai Anonim (Rahasia)
                  </span>
                </label>
              </div>

              {!isAnonymous && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                      Pilih dari Daftar Siswa
                    </label>
                    <select
                      value={selectedNisn}
                      onChange={(e) => handleStudentSelect(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                    >
                      <option value="">-- Ketik / Pilih Nama Anda --</option>
                      {siswaList.map((s) => (
                        <option key={s.id || s.nisn} value={s.nisn}>
                          {s.nama} ({s.kelas})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        placeholder="Nama Anda"
                        value={manualNama}
                        onChange={(e) => setManualNama(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                        Kelas
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: XI RPL 1"
                        value={manualKelas}
                        onChange={(e) => setManualKelas(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {isAnonymous && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 flex-shrink-0 text-amber-600" />
                  <span>Mode Rahasia Aktif. Identitas Anda tidak akan ditampilkan ke publik atau guru. Jangan ragu menyampaikan kritik & saran yang membangun!</span>
                </div>
              )}
            </div>

            {/* Category & Rating */}
            <div className="space-y-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm font-bold">2</span>
                Kategori & Penilaian Sekolah
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Kategori Saran / Masukan
                  </label>
                  <select
                    value={kategori}
                    onChange={(e: any) => setKategori(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all font-medium"
                  >
                    <option value="Fasilitas Sekolah">🏢 Fasilitas Sekolah</option>
                    <option value="Kurikulum & Pembelajaran">📚 Kurikulum & Pembelajaran</option>
                    <option value="Ekstrakurikuler">🏆 Ekstrakurikuler & Organisasi</option>
                    <option value="Kebersihan & Lingkungan">🧹 Kebersihan & Lingkungan</option>
                    <option value="Kantin & Kantin Kejujuran">🍎 Kantin & Area Siswa</option>
                    <option value="Lainnya">💡 Lainnya / Umum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Rating Kepuasan Saat Ini (1 - 5)
                  </label>
                  <div className="flex items-center gap-2 py-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`p-1.5 rounded-lg transition-transform hover:scale-110 ${
                          star <= rating ? 'text-amber-500' : 'text-slate-300 dark:text-slate-700'
                        }`}
                      >
                        <Star className="w-6 h-6 fill-current" />
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                      {rating} / 5
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detail Saran */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm font-bold">3</span>
                Isi Saran & Masukan
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Judul / Topik Singkat <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Perbaikan Proyektor di Kelas XI RPL 1"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                  Uraian Saran / Masukan / Ide <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Jelaskan saran atau masukan Anda secara detail, apa masalahnya, dan bagaimana solusi atau harapan Anda ke depan..."
                  value={pesan}
                  onChange={(e) => setPesan(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all leading-relaxed"
                ></textarea>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p>
                  Pastikan saran disampaikan dengan bahasa yang sopan, objektif, dan membangun. Setiap masukan dibaca langsung oleh tim manajemen sekolah setiap hari kerja.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-50"
              >
                {submitting ? (
                  <>Mengirim...</>
                ) : (
                  <>
                    <Send className="w-5 h-5" /> Kirim Saran & Masukan Sekarang
                  </>
                )}
              </button>
            </div>

          </form>
        )}

        {/* Footer info */}
        <div className="text-center mt-8 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} {pengaturan?.namaSekolah || 'Sekolah Kita'} — Sistem Informasi Layanan Aspirasi Siswa</p>
        </div>

      </div>
    </div>
  );
};
