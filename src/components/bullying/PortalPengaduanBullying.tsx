import React, { useState } from 'react';
import { ShieldAlert, Send, ArrowLeft, CheckCircle2, AlertTriangle, Lock, Camera, HelpCircle, Building2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { Siswa, Pengaturan } from '../../types';
import { bullyingService } from '../../services/bullyingService';

interface PortalPengaduanBullyingProps {
  siswaList: Siswa[];
  pengaturan: Pengaturan;
}

export const PortalPengaduanBullying: React.FC<PortalPengaduanBullyingProps> = ({ siswaList, pengaturan }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    isAnonymous: true,
    pelaporNama: '',
    pelaporKelas: 'XI RPL 1',
    pelaporNisn: '',
    jenisBullying: 'Verbal' as 'Fisik' | 'Verbal' | 'Siber (Cyberbullying)' | 'Sosial / Pengucilan' | 'Intimidasi / Ancaman' | 'Lainnya',
    lokasiKejadian: '',
    deskripsi: '',
    pihakTerlibat: '',
    buktiFoto: '',
  });

  // Handle Image Upload / Camera
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        Swal.fire({ icon: 'warning', title: 'File Terlalu Besar', text: 'Maksimal ukuran foto adalah 3MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setForm((prev) => ({ ...prev, buktiFoto: uploadEvent.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.lokasiKejadian.trim() || !form.deskripsi.trim()) {
      Swal.fire({ icon: 'warning', title: 'Lengkapi Informasi', text: 'Mohon isi lokasi kejadian dan deskripsi pengaduan.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const tanggal = now.toISOString().split('T')[0];
      const waktu = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });

      await bullyingService.submitReport({
        tanggal,
        waktu,
        isAnonymous: form.isAnonymous,
        pelaporNama: form.isAnonymous ? 'Anonim (Dirahasiakan)' : form.pelaporNama,
        pelaporKelas: form.isAnonymous ? '-' : form.pelaporKelas,
        pelaporNisn: form.isAnonymous ? '-' : form.pelaporNisn,
        jenisBullying: form.jenisBullying,
        lokasiKejadian: form.lokasiKejadian,
        deskripsi: form.deskripsi,
        pihakTerlibat: form.pihakTerlibat,
        buktiFoto: form.buktiFoto || undefined,
      });

      setIsSubmitted(true);
      Swal.fire({
        icon: 'success',
        title: 'Laporan Berhasil Terkirim',
        text: 'Terima kasih telah bersuara. Laporan Anda bersifat rahasia dan akan segera ditindaklanjuti oleh Tim BK & Guru.',
        timer: 4000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Gagal Mengirim Laporan', text: err.message || 'Terjadi kesalahan sistem.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 selection:bg-rose-500 selection:text-white">
      {/* Top Header */}
      <div className="max-w-2xl mx-auto w-full pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <a
            href={window.location.pathname}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-2 border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda Utama</span>
          </a>
          <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            100% RAHASIA & AMAN
          </span>
        </div>

        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 border-2 border-rose-500/50 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-rose-500 text-slate-950 font-black flex items-center justify-center text-3xl shadow-lg shadow-rose-500/30 shrink-0">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs font-black tracking-widest text-rose-400 uppercase">
                {pengaturan.namaSekolah}
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5 text-white">
                Portal Resmi Pengaduan Bullying (Perundungan)
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-lg">
                Jangan takut untuk bersuara. Lindungi diri dan teman Anda. Laporkan segala bentuk perundungan fisik, verbal, siber, maupun intimidasi dengan aman.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Box or Success Card */}
      <div className="max-w-2xl mx-auto w-full flex-1 pb-10">
        {isSubmitted ? (
          <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-8 text-center space-y-5 shadow-2xl animate-scaleIn">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border-2 border-emerald-500">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-white">Laporan Anda Telah Diterima</h2>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Terima kasih atas keberanian Anda melaporkan kejadian ini. Laporan Anda bersifat konfidensial (rahasia) dan akan ditangani secara profesional oleh Tim BK serta Guru Pembimbing sekolah.
              </p>
            </div>
            <div className="pt-4">
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setForm({
                    isAnonymous: true,
                    pelaporNama: '',
                    pelaporKelas: 'XI RPL 1',
                    pelaporNisn: '',
                    jenisBullying: 'Verbal',
                    lokasiKejadian: '',
                    deskripsi: '',
                    pihakTerlibat: '',
                    buktiFoto: '',
                  });
                }}
                className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                Kirim Pengaduan Lain
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-xs">
            {/* Anonymous Toggle Box */}
            <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-start gap-3">
              <input
                type="checkbox"
                id="anonCheck"
                checked={form.isAnonymous}
                onChange={(e) => setForm((p) => ({ ...p, isAnonymous: e.target.checked }))}
                className="mt-0.5 w-4 h-4 accent-rose-500 rounded cursor-pointer"
              />
              <label htmlFor="anonCheck" className="cursor-pointer space-y-0.5">
                <span className="font-bold text-rose-300 block text-xs">
                  Kirim sebagai Pengaduan Anonim (Identitas Dirahasiakan)
                </span>
                <span className="text-[11px] text-slate-400 block leading-snug">
                  Jika dicentang, nama dan kelas Anda tidak akan dicatat atau dibagikan kepada siapapun. Keamanan dan privasi Anda adalah prioritas kami.
                </span>
              </label>
            </div>

            {/* If Not Anonymous, show Identity inputs */}
            {!form.isAnonymous && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <label className="font-bold text-slate-300">Nama Lengkap</label>
                  <input
                    type="text"
                    required={!form.isAnonymous}
                    placeholder="Nama Anda"
                    value={form.pelaporNama}
                    onChange={(e) => setForm((p) => ({ ...p, pelaporNama: e.target.value }))}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300">Kelas</label>
                  <input
                    type="text"
                    required={!form.isAnonymous}
                    placeholder="Contoh: XI RPL 1"
                    value={form.pelaporKelas}
                    onChange={(e) => setForm((p) => ({ ...p, pelaporKelas: e.target.value }))}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300">NISN (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Nomor Induk Siswa"
                    value={form.pelaporNisn}
                    onChange={(e) => setForm((p) => ({ ...p, pelaporNisn: e.target.value }))}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            )}

            {/* Jenis Bullying */}
            <div>
              <label className="font-bold text-slate-200 block mb-1.5">
                Jenis Bullying / Perundungan yang Dialami *
              </label>
              <select
                value={form.jenisBullying}
                onChange={(e) => setForm((p) => ({ ...p, jenisBullying: e.target.value as any }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:border-rose-500"
              >
                <option value="Verbal">Verbal (Ejekan, Panggilan kasar, Cemoohan, Ancaman lisan)</option>
                <option value="Fisik">Fisik (Pemukulan, Penendangan, Dorongan, Perusakan barang)</option>
                <option value="Siber (Cyberbullying)">Siber / Cyberbullying (Pesan teror di Medsos, Komentar jahat, Penyebaran foto aib)</option>
                <option value="Sosial / Pengucilan">Sosial / Pengucilan (Sengaja menjauhkan, Memfitnah, Penyebaran gosip)</option>
                <option value="Intimidasi / Ancaman">Intimidasi / Pemalakan / Pemerasan / Paksaan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            {/* Lokasi & Pihak Terlibat */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-200 block mb-1">Lokasi Kejadian *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kantin, Kelas X TKJ 2, Koridor Lantai 2, WhatsApp"
                  value={form.lokasiKejadian}
                  onChange={(e) => setForm((p) => ({ ...p, lokasiKejadian: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="font-bold text-slate-200 block mb-1">Pihak / Orang yang Terlibat (Jika tahu)</label>
                <input
                  type="text"
                  placeholder="Nama pelaku / saksi / kelas"
                  value={form.pihakTerlibat}
                  onChange={(e) => setForm((p) => ({ ...p, pihakTerlibat: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                />
              </div>
            </div>

            {/* Deskripsi Kejadian */}
            <div>
              <label className="font-bold text-slate-200 block mb-1">
                Ceritakan Kronologi Kejadian Secara Jelas *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Tuliskan bagaimana kejadian berlangsung, kapan saja hal ini terjadi, dan dampak yang Anda rasakan..."
                value={form.deskripsi}
                onChange={(e) => setForm((p) => ({ ...p, deskripsi: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white leading-relaxed focus:border-rose-500"
              />
            </div>

            {/* Bukti Foto / Screenshot */}
            <div>
              <label className="font-bold text-slate-200 block mb-1">
                Unggah Bukti Foto / Screenshot (Opsional)
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center gap-2 transition-colors">
                  <Camera className="w-4 h-4 text-rose-400" />
                  <span>Pilih File Foto / Bukti</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                {form.buktiFoto && (
                  <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Bukti Foto Terunggah
                  </span>
                )}
              </div>
              {form.buktiFoto && (
                <div className="mt-3 relative w-24 h-24 rounded-xl overflow-hidden border border-slate-700">
                  <img src={form.buktiFoto} alt="Bukti" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Mengirim Laporan...' : 'Kirim Laporan Pengaduan'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-2xl mx-auto w-full text-center text-slate-500 text-[11px] py-4 border-t border-slate-900">
        <p>{pengaturan.namaSekolah} • Layanan Bimbingan Konseling & Perlindungan Siswa</p>
      </div>
    </div>
  );
};
