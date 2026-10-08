import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Building2,
  User,
  ArrowRight,
  CheckCircle2,
  Send,
  AlertTriangle,
  History,
  Sparkles,
  MapPin,
  ArrowLeft,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { CameraSelfieCapture } from './CameraSelfieCapture';
import { pklService } from '../../services/pklService';
import { PresensiPkl, TempatPkl, Siswa } from '../../types';

interface PortalPresensiSiswaPklProps {
  siswaList?: Siswa[];
  onBackToDashboard?: () => void;
  isStandalone?: boolean;
}

export const PortalPresensiSiswaPkl: React.FC<PortalPresensiSiswaPklProps> = ({
  siswaList = [],
  onBackToDashboard,
  isStandalone = false,
}) => {
  // Live clock
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');

  // Form states
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>('');
  const [nisn, setNisn] = useState<string>('');
  const [namaSiswa, setNamaSiswa] = useState<string>('');
  const [kelas, setKelas] = useState<string>('XI RPL 1');
  const [selectedDudi, setSelectedDudi] = useState<string>('');
  const [dudiList, setDudiList] = useState<TempatPkl[]>([]);

  // Mode: 'datang' | 'pulang' | 'lengkap'
  const [mode, setMode] = useState<'datang' | 'pulang' | 'lengkap'>('datang');

  // Check-In fields
  const [waktuDatang, setWaktuDatang] = useState<string>('');
  const [fotoDatang, setFotoDatang] = useState<string>('');
  const [lokasiDatang, setLokasiDatang] = useState<string>('Kantor / Lokasi PKL');
  const [keteranganDatang, setKeteranganDatang] = useState<string>('');

  // Check-Out fields (OPTIONAL saat awal kirim!)
  const [waktuPulang, setWaktuPulang] = useState<string>('');
  const [fotoPulang, setFotoPulang] = useState<string>('');
  const [keteranganPulang, setKeteranganPulang] = useState<string>('');
  const [ringkasanPekerjaan, setRingkasanPekerjaan] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todayRecord, setTodayRecord] = useState<PresensiPkl | null>(null);

  // GPS Tracking States
  const [latDatang, setLatDatang] = useState<number | null>(null);
  const [lngDatang, setLngDatang] = useState<number | null>(null);
  const [akurasiDatangVal, setAkurasiDatangVal] = useState<number | null>(null);
  const [gpsStatusDatang, setGpsStatusDatang] = useState<string>('Menunggu deteksi');

  const [latPulang, setLatPulang] = useState<number | null>(null);
  const [lngPulang, setLngPulang] = useState<number | null>(null);
  const [akurasiPulangVal, setAkurasiPulangVal] = useState<number | null>(null);
  const [gpsStatusPulang, setGpsStatusPulang] = useState<string>('Menunggu deteksi');

  const fetchGpsLocation = (targetType: 'datang' | 'pulang') => {
    if (!navigator.geolocation) {
      Swal.fire({
        icon: 'error',
        title: 'GPS Tidak Didukung',
        text: 'Perangkat atau browser Anda tidak mendukung pelacakan GPS.',
      });
      return;
    }

    if (targetType === 'datang') {
      setGpsStatusDatang('Mengambil koordinat...');
    } else {
      setGpsStatusPulang('Mengambil koordinat...');
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy);

        if (targetType === 'datang') {
          setLatDatang(latitude);
          setLngDatang(longitude);
          setAkurasiDatangVal(accuracy);
          setGpsStatusDatang(`Akurat (±${accuracy}m)`);
        } else {
          setLatPulang(latitude);
          setLngPulang(longitude);
          setAkurasiPulangVal(accuracy);
          setGpsStatusPulang(`Akurat (±${accuracy}m)`);
        }

        Swal.fire({
          icon: 'success',
          title: 'Lokasi GPS Berhasil Dilacak!',
          text: `Koordinat: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (Akurasi ±${accuracy} meter)`,
          timer: 2000,
          showConfirmButton: false,
        });
      },
      (error) => {
        console.warn('Geolocation error:', error);
        let errMsg = 'Gagal mendeteksi lokasi GPS.';
        if (error.code === error.PERMISSION_DENIED) {
          errMsg = 'Izin akses lokasi GPS ditolak. Harap izinkan akses lokasi pada browser Anda.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errMsg = 'Informasi lokasi tidak tersedia.';
        } else if (error.code === error.TIMEOUT) {
          errMsg = 'Waktu permintaan GPS habis.';
        }

        if (targetType === 'datang') {
          setGpsStatusDatang('Gagal / Ditolak');
        } else {
          setGpsStatusPulang('Gagal / Ditolak');
        }

        Swal.fire({
          icon: 'warning',
          title: 'GPS Gagal',
          text: errMsg,
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Initialize clock and load DUDI places
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour12: false }) + ' WIB');
      setCurrentDateStr(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    const now = new Date();
    setWaktuDatang(now.toLocaleTimeString('id-ID', { hour12: false }));
    setWaktuPulang(now.toLocaleTimeString('id-ID', { hour12: false }));

    // Load places
    pklService.fetchPlaces().then((places) => {
      setDudiList(places);
      if (places.length > 0 && !selectedDudi) {
        setSelectedDudi(places[0].namaDudi);
      }
    });

    // Auto-fetch GPS on mount
    fetchGpsLocation('datang');

    return () => clearInterval(interval);
  }, []);

  // When a student is selected from dropdown
  const handleStudentSelect = (id: string) => {
    setSelectedSiswaId(id);
    const found = siswaList.find((s) => s.id === id);
    if (found) {
      setNamaSiswa(found.nama);
      setNisn(found.nisn);
      setKelas(found.kelas);
      checkStudentTodayRecord(found.id, found.nisn);
    }
  };

  // Check if this student already checked in today
  const checkStudentTodayRecord = async (sId: string, sNisn: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const records = await pklService.fetchPresensi({ tanggal: todayStr, siswaId: sId || sNisn });
    if (records.length > 0) {
      const rec = records[0];
      setTodayRecord(rec);
      setSelectedDudi(rec.namaDudi);
      if (rec.status === 'masih_pkl' && !rec.waktuPulang) {
        // Suggest switching to Check-Out mode
        setMode('pulang');
      }
    } else {
      setTodayRecord(null);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!namaSiswa.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Nama Murid Wajib Diisi',
        text: 'Silakan pilih nama dari daftar siswa atau ketikkan nama lengkap Anda.',
      });
      return;
    }

    if (!selectedDudi) {
      Swal.fire({
        icon: 'warning',
        title: 'Tempat PKL Belum Dipilih',
        text: 'Silakan pilih nama Instansi / Perusahaan tempat Anda melaksanakan PKL.',
      });
      return;
    }

    // Validation according to mode
    if (mode === 'datang') {
      if (!fotoDatang) {
        Swal.fire({
          icon: 'warning',
          title: 'Foto Selfie Datang Wajib!',
          text: 'Harap ambil foto selfie waktu datang yang memuat watermark tanggal & waktu.',
        });
        return;
      }
    } else if (mode === 'pulang') {
      if (!fotoPulang) {
        Swal.fire({
          icon: 'warning',
          title: 'Foto Selfie Pulang Wajib!',
          text: 'Harap ambil foto selfie waktu pulang yang memuat watermark tanggal & waktu.',
        });
        return;
      }
    } else if (mode === 'lengkap') {
      if (!fotoDatang) {
        Swal.fire({
          icon: 'warning',
          title: 'Foto Datang Wajib!',
          text: 'Harap ambil foto selfie waktu datang.',
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      if (mode === 'datang') {
        // CHECK-IN ONLY: NO PULANG DATA REQUIRED!
        const payload: Partial<PresensiPkl> = {
          tanggal: todayStr,
          siswaId: selectedSiswaId || `s_${Date.now()}`,
          nisn: nisn || '-',
          namaSiswa: namaSiswa.trim(),
          kelas: kelas,
          namaDudi: selectedDudi,
          waktuDatang: waktuDatang || new Date().toLocaleTimeString('id-ID', { hour12: false }),
          timestampDatang: Date.now(),
          fotoDatang: fotoDatang,
          keteranganDatang: keteranganDatang || 'Tiba di lokasi PKL',
          lokasiDatang: lokasiDatang,
          latitudeDatang: latDatang || undefined,
          longitudeDatang: lngDatang || undefined,
          akurasiDatang: akurasiDatangVal || undefined,
          status: 'masih_pkl',
          // Note: waktuPulang, timestampPulang, fotoPulang are left undefined intentionally!
        };

        const result = await pklService.submitPresensi(payload);
        setTodayRecord(result);

        Swal.fire({
          icon: 'success',
          title: 'Presensi Datang Terkirim!',
          html: `
            <div class="text-left text-sm space-y-2">
              <p>Halo <b>${namaSiswa}</b>, presensi datang Anda telah resmi tercatat.</p>
              <div class="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-300 text-emerald-900 dark:text-emerald-200">
                <p>⏰ <b>Jam Datang:</b> ${result.waktuDatang} WIB</p>
                <p>🏢 <b>Tempat PKL:</b> ${result.namaDudi}</p>
                <p>📸 <b>Selfie Ber-Watermark:</b> Tersimpan resmi</p>
                <p class="mt-2 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                  ★ Data sudah berhasil dikirim tanpa harus mengisi waktu pulang sekarang. Anda dapat kembali mengakses tautan ini sore nanti untuk mengisi waktu pulang!
                </p>
              </div>
            </div>
          `,
          confirmButtonColor: '#2563eb',
          confirmButtonText: 'Siap, Terima Kasih!',
        });
      } else if (mode === 'pulang') {
        // CHECK-OUT FOR EXISTING OR DIRECT
        const payload = {
          action: 'checkout' as const,
          tanggal: todayStr,
          siswaId: selectedSiswaId || todayRecord?.siswaId,
          nisn: nisn || todayRecord?.nisn,
          namaSiswa: namaSiswa.trim(),
          waktuPulang: waktuPulang || new Date().toLocaleTimeString('id-ID', { hour12: false }),
          timestampPulang: Date.now(),
          fotoPulang: fotoPulang,
          keteranganPulang: keteranganPulang || 'Selesai jam kerja PKL',
          ringkasanPekerjaan: ringkasanPekerjaan,
          latitudePulang: latPulang || undefined,
          longitudePulang: lngPulang || undefined,
          akurasiPulang: akurasiPulangVal || undefined,
        };

        const result = await pklService.submitPresensi(payload);
        setTodayRecord(result);

        Swal.fire({
          icon: 'success',
          title: 'Presensi Pulang Selesai!',
          html: `
            <div class="text-left text-sm space-y-2">
              <p>Kerja bagus <b>${namaSiswa}</b>! Presensi kepulangan Anda telah diverifikasi.</p>
              <div class="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-300 text-blue-900 dark:text-blue-200">
                <p>⏰ <b>Jam Datang:</b> ${result.waktuDatang || '-'} WIB</p>
                <p>⏰ <b>Jam Pulang:</b> ${result.waktuPulang} WIB</p>
                <p>🏢 <b>Status:</b> Selesai Hari Ini</p>
              </div>
            </div>
          `,
          confirmButtonColor: '#10b981',
          confirmButtonText: 'Selesai',
        });
      } else {
        // LENGKAP: Datang & Pulang
        const payload: Partial<PresensiPkl> = {
          tanggal: todayStr,
          siswaId: selectedSiswaId || `s_${Date.now()}`,
          nisn: nisn || '-',
          namaSiswa: namaSiswa.trim(),
          kelas: kelas,
          namaDudi: selectedDudi,
          waktuDatang: waktuDatang,
          timestampDatang: Date.now() - 3600000 * 8,
          fotoDatang: fotoDatang,
          keteranganDatang: keteranganDatang,
          lokasiDatang: lokasiDatang,
          latitudeDatang: latDatang || undefined,
          longitudeDatang: lngDatang || undefined,
          akurasiDatang: akurasiDatangVal || undefined,
          waktuPulang: waktuPulang,
          timestampPulang: Date.now(),
          fotoPulang: fotoPulang,
          keteranganPulang: keteranganPulang,
          ringkasanPekerjaan: ringkasanPekerjaan,
          latitudePulang: latPulang || undefined,
          longitudePulang: lngPulang || undefined,
          akurasiPulang: akurasiPulangVal || undefined,
          status: fotoPulang ? 'selesai_pulang' : 'masih_pkl',
        };

        const result = await pklService.submitPresensi(payload);
        setTodayRecord(result);

        Swal.fire({
          icon: 'success',
          title: 'Presensi PKL Berhasil Disimpan!',
          text: 'Data waktu datang dan waktu pulang Anda beserta foto selfie telah tercatat lengkap di sistem.',
        });
      }
    } catch (err: any) {
      console.error('Error submitting PKL attendance:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengirim Presensi',
        text: err.message || 'Terjadi gangguan saat menyimpan data presensi. Silakan coba lagi.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-slate-950 text-slate-100 py-6 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-blue-950/90 border-2 border-blue-500/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 font-black flex items-center justify-center text-xl shadow-lg shadow-amber-500/30 shrink-0">
                🏢
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
                    PORTAL MANDIRI SISWA
                  </span>
                  <span className="text-[10px] font-bold text-blue-300 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> RESMI
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                  Presensi Murid PKL
                </h1>
                <p className="text-xs text-blue-200">
                  Praktik Kerja Lapangan • TONGGURU YUSAK YOKOYAMA
                </p>
              </div>
            </div>

            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-blue-800/80 hover:bg-blue-700 border border-blue-400/40 text-xs font-bold text-white flex items-center gap-1.5 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Dashboard
              </button>
            )}
          </div>

          {/* Real-time Clock Banner */}
          <div className="mt-5 pt-4 border-t border-blue-700/50 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>{currentDateStr || 'Memuat tanggal...'}</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-950/80 border border-amber-400/40 px-3 py-1.5 rounded-xl text-amber-300 font-mono font-black shadow-inner">
              <Clock className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="text-sm">{currentTime || '00:00:00 WIB'}</span>
            </div>
          </div>
        </div>

        {/* Status Alert if Already Checked In Today */}
        {todayRecord && (
          <div className="bg-slate-900/90 border-2 border-emerald-500/80 rounded-2xl p-4 shadow-xl flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-emerald-400 text-sm">Status Presensi Hari Ini:</span>
                <span
                  className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                    todayRecord.status === 'selesai_pulang'
                      ? 'bg-blue-600 text-white'
                      : 'bg-emerald-600 text-white animate-pulse'
                  }`}
                >
                  {todayRecord.status === 'selesai_pulang' ? 'Selesai Pulang' : 'Sedang di Tempat PKL'}
                </span>
              </div>
              <p className="text-slate-300 mt-1">
                Siswa <b>{todayRecord.namaSiswa}</b> telah check-in jam <b>{todayRecord.waktuDatang} WIB</b> di{' '}
                <b>{todayRecord.namaDudi}</b>.
              </p>
              {todayRecord.status === 'masih_pkl' && !todayRecord.waktuPulang && (
                <p className="text-amber-300 font-bold mt-1.5">
                  👉 Waktu pulang belum diisi. Anda dapat mengklik tombol "Presensi Pulang (Sore)" di bawah saat selesai jam kerja.
                </p>
              )}
              {todayRecord.waktuPulang && (
                <p className="text-blue-300 mt-1">
                  ⏰ Jam Pulang: <b>{todayRecord.waktuPulang} WIB</b>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="bg-slate-900/90 border-2 border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-6">
          {/* Section 1: Identitas Murid & Tempat PKL */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <User className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                1. Identitas Murid & Lokasi PKL
              </h2>
            </div>

            {/* If siswaList available, show dropdown */}
            {siswaList.length > 0 ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Pilih Nama Murid (Dari Data Sekolah)</span>
                  <span className="text-[10px] text-blue-400 font-normal">atau ketik manual di bawah</span>
                </label>
                <select
                  value={selectedSiswaId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="">-- Pilih Nama Siswa dari Daftar --</option>
                  {siswaList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.kelas} - NISN: {s.nisn})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300">Nama Lengkap Murid *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad Faiz Al-Ghifari"
                  value={namaSiswa}
                  onChange={(e) => setNamaSiswa(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">NISN Siswa</label>
                <input
                  type="text"
                  placeholder="0078129341"
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300">Kelas / Rombel</label>
                <input
                  type="text"
                  placeholder="XI RPL 1"
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tempat PKL / Industri (DUDI) *</span>
                </label>
                <select
                  value={selectedDudi}
                  onChange={(e) => setSelectedDudi(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 mt-1 font-medium"
                >
                  {dudiList.map((d) => (
                    <option key={d.id} value={d.namaDudi}>
                      {d.namaDudi}
                    </option>
                  ))}
                  <option value="Tempat PKL Lainnya">-- Tempat PKL Lainnya --</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Pilihan Mode Presensi */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                2. Pilih Tindakan Presensi
              </span>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                Bisa kirim datang saja!
              </span>
            </div>

            {/* Mode Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-black">
              <button
                type="button"
                onClick={() => setMode('datang')}
                className={`py-3 px-2 rounded-xl text-center transition-all flex flex-col items-center gap-1 ${
                  mode === 'datang'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span className="text-base">☀️</span>
                <span>Datang (Pagi)</span>
                <span className="text-[9px] font-semibold opacity-80">Check-In</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('pulang')}
                className={`py-3 px-2 rounded-xl text-center transition-all flex flex-col items-center gap-1 ${
                  mode === 'pulang'
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 ring-2 ring-amber-300'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span className="text-base">🌙</span>
                <span>Pulang (Sore)</span>
                <span className="text-[9px] font-semibold opacity-80">Check-Out</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('lengkap')}
                className={`py-3 px-2 rounded-xl text-center transition-all flex flex-col items-center gap-1 ${
                  mode === 'lengkap'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span className="text-base">⚡</span>
                <span>Keduanya</span>
                <span className="text-[9px] font-semibold opacity-80">Datang & Pulang</span>
              </button>
            </div>
          </div>

          {/* MODE 1: PRESENSI DATANG (CHECK-IN) */}
          {(mode === 'datang' || mode === 'lengkap') && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/20 border-2 border-emerald-500/40 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-800/40 pb-2">
                <span className="text-sm font-black text-emerald-300 flex items-center gap-2">
                  <span>📸</span> WAKTU DATANG & SELFIE CHECK-IN
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-bold">
                  Wajib Pagi Hari
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">Waktu Datang (Otomatis)</label>
                  <input
                    type="time"
                    step="1"
                    value={waktuDatang}
                    onChange={(e) => setWaktuDatang(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500 mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">Lokasi Presensi Datang</label>
                  <input
                    type="text"
                    placeholder="Contoh: Lobby Gedung / Ruang IT Squad"
                    value={lokasiDatang}
                    onChange={(e) => setLokasiDatang(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 mt-1"
                  />
                </div>
              </div>

              {/* GPS Tracking Widget Datang */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Pelacakan Koordinat GPS Datang</span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-mono">
                        {gpsStatusDatang}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {latDatang && lngDatang ? `${latDatang.toFixed(6)}, ${lngDatang.toFixed(6)}` : 'Menunggu koordinat GPS akurat'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fetchGpsLocation('datang')}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Perbarui GPS Datang</span>
                </button>
              </div>

              {/* Camera Capture for Datang */}
              <CameraSelfieCapture
                label="Foto Selfie Datang (Tertera Tanggal & Waktu Resmi)"
                tipe="DATANG (CHECK-IN)"
                namaSiswa={namaSiswa}
                nisn={nisn}
                namaDudi={selectedDudi}
                onPhotoCaptured={(photo) => setFotoDatang(photo)}
                existingPhoto={fotoDatang}
                required={mode === 'datang' || mode === 'lengkap'}
              />

              <div>
                <label className="text-xs font-bold text-slate-300">Catatan / Keterangan Datang (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Tiba tepat waktu dan langsung briefing pagi"
                  value={keteranganDatang}
                  onChange={(e) => setKeteranganDatang(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 mt-1"
                />
              </div>
            </div>
          )}

          {/* MODE 2: PRESENSI PULANG (CHECK-OUT) */}
          {(mode === 'pulang' || mode === 'lengkap') && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/20 border-2 border-amber-500/40 space-y-4">
              <div className="flex items-center justify-between border-b border-amber-800/40 pb-2">
                <span className="text-sm font-black text-amber-300 flex items-center gap-2">
                  <span>📸</span> WAKTU PULANG & SELFIE CHECK-OUT
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md font-bold">
                  Diisi Saat Jam Kerja Selesai
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">Waktu Pulang (Otomatis)</label>
                  <input
                    type="time"
                    step="1"
                    value={waktuPulang}
                    onChange={(e) => setWaktuPulang(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500 mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">Keterangan Pulang (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Jam kerja selesai, pekerjaan diserahkan ke mentor"
                    value={keteranganPulang}
                    onChange={(e) => setKeteranganPulang(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 mt-1"
                  />
                </div>
              </div>

              {/* GPS Tracking Widget Pulang */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Pelacakan Koordinat GPS Pulang</span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 font-mono">
                        {gpsStatusPulang}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {latPulang && lngPulang ? `${latPulang.toFixed(6)}, ${lngPulang.toFixed(6)}` : 'Klik untuk deteksi GPS pulang'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fetchGpsLocation('pulang')}
                  className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Ambil GPS Pulang</span>
                </button>
              </div>

              {/* Camera Capture for Pulang */}
              <CameraSelfieCapture
                label="Foto Selfie Pulang (Tertera Tanggal & Waktu Resmi)"
                tipe="PULANG (CHECK-OUT)"
                namaSiswa={namaSiswa}
                nisn={nisn}
                namaDudi={selectedDudi}
                onPhotoCaptured={(photo) => setFotoPulang(photo)}
                existingPhoto={fotoPulang}
                required={mode === 'pulang'}
              />

              <div>
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Jurnal Singkat / Ringkasan Pekerjaan Hari Ini</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Tuliskan ringkasan tugas atau kegiatan yang telah Anda kerjakan hari ini di tempat PKL..."
                  value={ringkasanPekerjaan}
                  onChange={(e) => setRingkasanPekerjaan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 mt-1"
                />
              </div>
            </div>
          )}

          {/* Guarantee Info Notice */}
          <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-start gap-3 text-xs text-blue-200">
            <span className="text-lg">💡</span>
            <div>
              <span className="font-extrabold text-white">Ketentuan Presensi PKL: </span>
              {mode === 'datang' && (
                <span>
                  Anda dapat <b>langsung mengirim data presensi datang</b> sekarang tanpa harus mengisi waktu pulang.
                  Sore nanti, silakan buka tautan ini kembali untuk melakukan presensi pulang.
                </span>
              )}
              {mode === 'pulang' && (
                <span>
                  Sistem akan mengaitkan foto dan jam kepulangan Anda dengan catatan kedatangan yang telah tercatat hari ini.
                </span>
              )}
              {mode === 'lengkap' && (
                <span>
                  Mode ini mencatat kedua waktu (datang & pulang) sekaligus ke dalam pangkalan data monitoring guru.
                </span>
              )}
            </div>
          </div>

          {/* Submit Action Buttons */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-2xl font-black text-base shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${
                mode === 'datang'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  : mode === 'pulang'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
              } disabled:opacity-50`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sedang Mengirim Presensi...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>
                    {mode === 'datang' && 'KIRIM PRESENSI DATANG SEKARANG (Check-In)'}
                    {mode === 'pulang' && 'KIRIM PRESENSI PULANG (Check-Out Selesai)'}
                    {mode === 'lengkap' && 'KIRIM PRESENSI LENGKAP (Datang & Pulang)'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Note */}
        <div className="text-center text-xs text-slate-500 pb-6 space-y-1">
          <p>Sistem Presensi & Monitoring Murid PKL • SMK Indonesia Merdeka</p>
          <p className="font-semibold text-slate-400">Guru Pembimbing: Yusak Yokoyama, S.Pd., M.Pd.</p>
        </div>
      </div>
    </div>
  );
};
