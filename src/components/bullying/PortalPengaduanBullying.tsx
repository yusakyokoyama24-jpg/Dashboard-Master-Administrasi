import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Send,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Camera,
  HelpCircle,
  Building2,
  PhoneCall,
  Clock,
  Radio,
  Wifi,
  WifiOff,
  Sparkles,
  UserCheck
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Siswa, Pengaturan, BullyingReport } from '../../types';
import { bullyingService } from '../../services/bullyingService';

interface PortalPengaduanBullyingProps {
  siswaList: Siswa[];
  pengaturan: Pengaturan;
}

export const PortalPengaduanBullying: React.FC<PortalPengaduanBullyingProps> = ({ siswaList, pengaturan }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<BullyingReport | null>(null);
  const [isServerOnline, setIsServerOnline] = useState<boolean | null>(null);

  const [form, setForm] = useState({
    isAnonymous: true,
    pelaporNama: '',
    pelaporKelas: 'XI RPL 1',
    pelaporNisn: '',
    jenisBullying: 'Verbal' as BullyingReport['jenisBullying'],
    tingkatUrgensi: 'Biasa' as 'Biasa' | 'Penting' | 'Darurat / Butuh Pendampingan Cepat',
    lokasiKejadian: '',
    deskripsi: '',
    pihakTerlibat: '',
    kontakPelapor: '',
    buktiFoto: '',
  });

  // Check connection to backend server on mobile device
  useEffect(() => {
    bullyingService.checkServerConnection().then((online) => {
      setIsServerOnline(online);
    });
  }, []);

  // Compression helper to ensure quick mobile upload even on 3G/4G
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(readerEvent.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Gagal membaca format gambar.'));
        img.src = readerEvent.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Handle Image Upload / Camera with automatic compression
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        Swal.fire({ icon: 'warning', title: 'File Terlalu Besar', text: 'Maksimal ukuran foto adalah 15MB.' });
        return;
      }
      try {
        const compressed = await compressImage(file);
        setForm((prev) => ({ ...prev, buktiFoto: compressed }));
      } catch {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          setForm((prev) => ({ ...prev, buktiFoto: uploadEvent.target?.result as string }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleNameSelect = (name: string) => {
    const found = siswaList.find((s) => s.nama.toLowerCase() === name.toLowerCase());
    if (found) {
      setForm((p) => ({
        ...p,
        pelaporNama: found.nama,
        pelaporKelas: found.kelas || p.pelaporKelas,
        pelaporNisn: found.nisn || p.pelaporNisn,
      }));
    } else {
      setForm((p) => ({ ...p, pelaporNama: name }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.lokasiKejadian.trim() || !form.deskripsi.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Lengkapi Informasi',
        text: 'Mohon isi lokasi kejadian dan uraian deskripsi pengaduan.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const tanggal = now.toISOString().split('T')[0];
      const waktu = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });

      const created = await bullyingService.submitReport({
        tanggal,
        waktu,
        isAnonymous: form.isAnonymous,
        pelaporNama: form.isAnonymous ? 'Anonim (Dirahasiakan)' : form.pelaporNama,
        pelaporKelas: form.isAnonymous ? '-' : form.pelaporKelas,
        pelaporNisn: form.isAnonymous ? '-' : form.pelaporNisn,
        jenisBullying: form.jenisBullying,
        tingkatUrgensi: form.tingkatUrgensi,
        lokasiKejadian: form.lokasiKejadian,
        deskripsi: form.deskripsi,
        pihakTerlibat: form.pihakTerlibat,
        kontakPelapor: form.kontakPelapor,
        buktiFoto: form.buktiFoto || undefined,
      });

      setSubmittedReport(created);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      Swal.fire({
        icon: 'success',
        title: 'Laporan Masuk ke Server!',
        html: `
          <div class="text-left text-xs space-y-1.5">
            <p>Laporan Anda berhasil dikirim ke <b>Server Bimbingan Konseling</b> secara real-time.</p>
            <p class="font-mono text-rose-600 font-bold">Kode Tiket: #${created.id}</p>
            <p class="text-slate-500">Guru BK menerima notifikasi seketika.</p>
          </div>
        `,
        timer: 4000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengirim Laporan',
        text: err.message || 'Terjadi gangguan jaringan ke server. Silakan coba kembali.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 selection:bg-rose-500 selection:text-white">
      {/* Top Header */}
      <div className="max-w-2xl mx-auto w-full pt-2 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <a
            href={window.location.pathname}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-2 border border-slate-800 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda Utama</span>
          </a>

          <div className="flex items-center gap-2">
            {/* Live Server Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-bold">
              {isServerOnline === false ? (
                <>
                  <WifiOff className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-400">Offline Cache</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-emerald-400">Server Real-Time Online</span>
                </>
              )}
            </div>

            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              100% RAHASIA & AMAN
            </span>
          </div>
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
              <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
                Kalian tidak sendirian. Lindungi diri dan sesama teman. Laporkan segala bentuk perundungan fisik, verbal, siber, pengucilan, maupun pemalakan secara aman dan rahasia.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Box or Success Card */}
      <div className="max-w-2xl mx-auto w-full flex-1 pb-10">
        {isSubmitted ? (
          <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl animate-scaleIn">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border-2 border-emerald-500 shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Data Masuk ke Server Guru BK Secara Real-Time
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Laporan Anda Telah Diterima oleh Sekolah
              </h2>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Terima kasih atas keberanian Anda. Laporan ini bersifat rahasia dan langsung muncul di monitor dashboard Guru Bimbingan Konseling (BK) untuk segera ditindaklanjuti.
              </p>
            </div>

            {submittedReport && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 text-left max-w-lg mx-auto space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Kode Bukti Aduan:</span>
                  <span className="font-mono font-black text-amber-400 text-sm">#{submittedReport.id}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Status Penanganan:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px]">
                    {submittedReport.status}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Tingkat Urgensi:</span>
                  <span className={`px-2 py-0.5 rounded-md font-black text-[10px] ${
                    submittedReport.tingkatUrgensi === 'Darurat / Butuh Pendampingan Cepat'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : submittedReport.tingkatUrgensi === 'Penting'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {submittedReport.tingkatUrgensi || 'Biasa'}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Jenis Perundungan:</span>
                  <span className="font-bold text-rose-400">{submittedReport.jenisBullying}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Lokasi Kejadian:</span>
                  <span className="font-semibold text-slate-200">{submittedReport.lokasiKejadian}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Pengirim:</span>
                  <span className="font-semibold text-slate-300">
                    {submittedReport.isAnonymous ? '🔒 Anonim (Dirahasiakan)' : `${submittedReport.pelaporNama} (${submittedReport.pelaporKelas})`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Waktu Kirim:</span>
                  <span className="text-slate-300">{submittedReport.tanggal} • {submittedReport.waktu} WIB</span>
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setSubmittedReport(null);
                  setForm({
                    isAnonymous: true,
                    pelaporNama: '',
                    pelaporKelas: 'XI RPL 1',
                    pelaporNisn: '',
                    jenisBullying: 'Verbal',
                    tingkatUrgensi: 'Biasa',
                    lokasiKejadian: '',
                    deskripsi: '',
                    pihakTerlibat: '',
                    kontakPelapor: '',
                    buktiFoto: '',
                  });
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                Kirim Pengaduan Lain
              </button>
              <a
                href={window.location.pathname}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
              >
                Kembali ke Beranda
              </a>
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
                  Jika dicentang, nama dan kelas Anda tidak akan dicatat atau dibagikan kepada siapapun. Keamanan dan privasi Anda terjamin.
                </span>
              </label>
            </div>

            {/* If Not Anonymous, show Identity inputs */}
            {!form.isAnonymous && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 animate-fadeIn">
                <div>
                  <label className="font-bold text-slate-300">Nama Lengkap *</label>
                  <input
                    type="text"
                    required={!form.isAnonymous}
                    placeholder="Ketik nama Anda"
                    list="daftarSiswaPelapor"
                    value={form.pelaporNama}
                    onChange={(e) => handleNameSelect(e.target.value)}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 outline-none"
                  />
                  {siswaList && siswaList.length > 0 && (
                    <datalist id="daftarSiswaPelapor">
                      {siswaList.map((s) => (
                        <option key={s.id || s.nisn} value={s.nama}>
                          {s.kelas ? `${s.nama} (${s.kelas})` : s.nama}
                        </option>
                      ))}
                    </datalist>
                  )}
                </div>
                <div>
                  <label className="font-bold text-slate-300">Kelas *</label>
                  <input
                    type="text"
                    required={!form.isAnonymous}
                    placeholder="Contoh: XI RPL 1"
                    value={form.pelaporKelas}
                    onChange={(e) => setForm((p) => ({ ...p, pelaporKelas: e.target.value }))}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300">NISN (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Nomor Induk Siswa"
                    value={form.pelaporNisn}
                    onChange={(e) => setForm((p) => ({ ...p, pelaporNisn: e.target.value }))}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-rose-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Tingkat Urgensi */}
            <div>
              <label className="font-bold text-slate-200 block mb-1.5 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-rose-400" />
                <span>Tingkat Urgensi Laporan</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { key: 'Biasa', label: 'Biasa', desc: 'Perlu dicatat & dipantau', color: 'border-slate-700 bg-slate-950 text-slate-300' },
                  { key: 'Penting', label: 'Penting', desc: 'Butuh mediasi / penanganan segera', color: 'border-amber-500/40 bg-amber-950/20 text-amber-300' },
                  { key: 'Darurat / Butuh Pendampingan Cepat', label: 'Darurat', desc: 'Ada ancaman bahaya fisik / pemalakan', color: 'border-rose-500 bg-rose-950/40 text-rose-300' },
                ].map((u) => (
                  <button
                    key={u.key}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, tingkatUrgensi: u.key as any }))}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      form.tingkatUrgensi === u.key
                        ? 'ring-2 ring-rose-500 ' + u.color
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-black text-xs">{u.label}</div>
                    <div className="text-[10px] opacity-80 mt-0.5">{u.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Jenis Bullying */}
            <div>
              <label className="font-bold text-slate-200 block mb-1.5">
                Jenis Bullying / Perundungan yang Dialami *
              </label>
              <select
                value={form.jenisBullying}
                onChange={(e) => setForm((p) => ({ ...p, jenisBullying: e.target.value as any }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:border-rose-500 outline-none"
              >
                <option value="Verbal">Verbal (Ejekan, Panggilan kasar, Cemoohan nama orang tua, Ancaman lisan)</option>
                <option value="Fisik">Fisik (Pemukulan, Tendangan, Dorongan, Perusakan barang milik korban)</option>
                <option value="Siber (Cyberbullying)">Siber / Cyberbullying (Pesan teror di Medsos/WA, Komentar jahat, Sebar foto aib)</option>
                <option value="Sosial / Pengucilan">Sosial / Pengucilan (Sengaja dijauhi teman sekelas, Fitnah, Gosip kejam)</option>
                <option value="Intimidasi / Ancaman">Intimidasi / Pemalakan Uang Saku / Pemerasan / Paksaan</option>
                <option value="Lainnya">Bentuk Lainnya</option>
              </select>
            </div>

            {/* Lokasi & Pihak Terlibat */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-200 block mb-1">Lokasi Kejadian *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kantin, Kelas X TKJ 2, Koridor, Medsos/WhatsApp"
                  value={form.lokasiKejadian}
                  onChange={(e) => setForm((p) => ({ ...p, lokasiKejadian: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-rose-500 outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-200 block mb-1">Pihak yang Terlibat (Jika diketahui)</label>
                <input
                  type="text"
                  placeholder="Nama pelaku / saksi / kelas / kelompok"
                  value={form.pihakTerlibat}
                  onChange={(e) => setForm((p) => ({ ...p, pihakTerlibat: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-rose-500 outline-none"
                />
              </div>
            </div>

            {/* Kontak Pelapor Opsional */}
            <div>
              <label className="font-bold text-slate-200 block mb-1">
                No. WhatsApp / HP Rahasia untuk Dihubungi Guru BK (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: 08123456789 (Hanya digunakan jika Anda ingin konseling rahasia dengan Guru BK)"
                value={form.kontakPelapor}
                onChange={(e) => setForm((p) => ({ ...p, kontakPelapor: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-rose-500 outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Nomor ini hanya akan dilihat oleh tim Guru BK dan tidak akan dibuka ke pihak lain.
              </span>
            </div>

            {/* Deskripsi Kejadian */}
            <div>
              <label className="font-bold text-slate-200 block mb-1">
                Ceritakan Kronologi Kejadian Secara Jelas *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Jelaskan secara runtut bagaimana kejadian berlangsung, siapa yang melakukan, kapan saja hal ini terjadi, dan dampak yang Anda rasakan..."
                value={form.deskripsi}
                onChange={(e) => setForm((p) => ({ ...p, deskripsi: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white leading-relaxed focus:border-rose-500 outline-none"
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
                  <span>Ambil Foto / Pilih File Bukti</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                {form.buktiFoto && (
                  <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Foto Berhasil Diunggah & Dikompres
                  </span>
                )}
              </div>
              {form.buktiFoto && (
                <div className="mt-3 relative w-24 h-24 rounded-xl overflow-hidden border border-slate-700 group">
                  <img src={form.buktiFoto} alt="Bukti" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, buktiFoto: '' }))}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-400 font-bold text-[10px] transition-opacity"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Mengirim Real-Time ke Server...' : 'Kirim Laporan Pengaduan Sekarang'}</span>
              </button>
              <p className="text-center text-[10px] text-slate-400 mt-2">
                Laporan otomatis tersimpan di database sekolah dan diterima langsung oleh Dashboard Guru BK.
              </p>
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-2xl mx-auto w-full text-center text-slate-500 text-[11px] py-4 border-t border-slate-900">
        <p>{pengaturan.namaSekolah} • Layanan Bimbingan Konseling & Perlindungan Siswa Terintegrasi</p>
      </div>
    </div>
  );
};
