import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Share2,
  Copy,
  ExternalLink,
  QrCode,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Printer,
  Download,
  Building2,
  MapPin,
  Eye,
  RefreshCw,
  Phone,
  Calendar,
  X,
  Check,
  MessageSquare,
  MessageCircle,
  FileSpreadsheet,
  Award,
  Trash2,
} from 'lucide-react';
import Swal from 'sweetalert2';
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';
import { pklService } from '../../services/pklService';
import { PresensiPkl, TempatPkl, Siswa, Pengaturan } from '../../types';
import { CameraSelfieCapture } from './CameraSelfieCapture';

interface PklMonitoringDashboardProps {
  siswaList: Siswa[];
  pengaturan: Pengaturan;
  onOpenStudentPortal: () => void;
}

export const PklMonitoringDashboard: React.FC<PklMonitoringDashboardProps> = ({
  siswaList,
  pengaturan,
  onOpenStudentPortal,
}) => {
  const [attendances, setAttendances] = useState<PresensiPkl[]>([]);
  const [places, setPlaces] = useState<TempatPkl[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [filterDate, setFilterDate] = useState<string>(''); // empty = all or specific
  const [filterStatus, setFilterStatus] = useState<string>('semua');
  const [filterDudi, setFilterDudi] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<{
    url: string;
    title: string;
    timestamp: string;
    siswa: string;
    dudi: string;
  } | null>(null);

  const [isAddManualModalOpen, setIsAddManualModalOpen] = useState(false);
  const [isManagePlacesModalOpen, setIsManagePlacesModalOpen] = useState(false);

  // Form Manual Presensi
  const [manualForm, setManualForm] = useState({
    siswaId: '',
    namaSiswa: '',
    nisn: '',
    kelas: 'XI RPL 1',
    namaDudi: '',
    tanggal: new Date().toISOString().split('T')[0],
    waktuDatang: '07:30:00',
    fotoDatang: '',
    lokasiDatang: 'Lokasi Kantor PKL',
    keteranganDatang: '',
    waktuPulang: '',
    fotoPulang: '',
    keteranganPulang: '',
    ringkasanPekerjaan: '',
  });

  // Form New Place
  const [newPlaceForm, setNewPlaceForm] = useState({
    namaDudi: '',
    bidangUsaha: '',
    alamat: '',
    pembimbingDudi: '',
    kontakPembimbing: '',
    guruPembimbing: pengaturan.namaGuru || 'Yusak Yokoyama, S.Pd., M.Pd.',
  });

  // Student shareable link
  const currentHost = typeof window !== 'undefined' ? window.location.origin : '';
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const studentPortalUrl = `${currentHost}${currentPath}?portal=pkl`;

  // Fetch data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [attList, placeList] = await Promise.all([pklService.fetchPresensi(), pklService.fetchPlaces()]);
      setAttendances(attList);
      setPlaces(placeList);
      if (placeList.length > 0 && !manualForm.namaDudi) {
        setManualForm((prev) => ({ ...prev, namaDudi: placeList[0].namaDudi }));
      }
    } catch (err) {
      console.error('Error loading PKL data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Generate QR Code
    QRCode.toDataURL(studentPortalUrl, { width: 320, margin: 2 })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.warn('QR code gen err:', err));
  }, [studentPortalUrl]);

  // Copy link handler
  const handleCopyLink = () => {
    navigator.clipboard.writeText(studentPortalUrl);
    Swal.fire({
      icon: 'success',
      title: 'Tautan Berhasil Disalin!',
      html: `
        <div class="text-xs text-left space-y-2">
          <p>Tautan presensi mandiri telah disalin ke papan klip:</p>
          <div class="p-2.5 bg-slate-100 rounded-lg font-mono text-[11px] break-all border text-blue-700">
            ${studentPortalUrl}
          </div>
          <p class="text-slate-500">Kirimkan tautan ini ke grup WhatsApp siswa PKL atau pasang pada pengumuman sekolah.</p>
        </div>
      `,
      timer: 3500,
      showConfirmButton: false,
    });
  };

  // WhatsApp share handler
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `*PEMBERITAHUAN PRESENSI PKL - ${pengaturan.namaSekolah.toUpperCase()}*\n` +
        `Guru Pembimbing: ${pengaturan.namaGuru}\n\n` +
        `Kepada seluruh murid peserta Praktik Kerja Lapangan (PKL), silakan melakukan pengisian presensi harian datang dan pulang melalui portal resmi:\n\n` +
        `🔗 *Tautan Presensi Siswa:* ${studentPortalUrl}\n\n` +
        `*Petunjuk:*\n` +
        `1. Ambil foto selfie waktu datang saat tiba di tempat PKL (tertera tanggal & jam resmi).\n` +
        `2. Data dapat dikirim langsung tanpa harus mengisi waktu pulang saat pagi hari.\n` +
        `3. Saat jam kerja selesai sore nanti, akses kembali tautan tersebut untuk mengisi foto selfie pulang.\n\n` +
        `Terima kasih dan selamat belajar di industri!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Filtered attendances
  const filteredAttendances = attendances.filter((item) => {
    if (filterDate && item.tanggal !== filterDate) return false;
    if (filterStatus === 'masih_pkl' && item.status !== 'masih_pkl') return false;
    if (filterStatus === 'selesai_pulang' && item.status !== 'selesai_pulang') return false;
    if (filterDudi !== 'semua' && item.namaDudi !== filterDudi) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = item.namaSiswa.toLowerCase().includes(q);
      const matchNisn = item.nisn.toLowerCase().includes(q);
      const matchDudi = item.namaDudi.toLowerCase().includes(q);
      if (!matchName && !matchNisn && !matchDudi) return false;
    }
    return true;
  });

  // Summary Metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendances = attendances.filter((a) => a.tanggal === todayStr);
  const stillAtDudi = todayAttendances.filter((a) => a.status === 'masih_pkl' && !a.waktuPulang);
  const completedToday = todayAttendances.filter((a) => a.status === 'selesai_pulang' || Boolean(a.waktuPulang));
  const studentsNotYetCheckedOut = todayAttendances.filter((a) => !a.waktuPulang);

  // Export to Excel handler
  const handleExportExcel = () => {
    if (filteredAttendances.length === 0) {
      Swal.fire({ icon: 'info', title: 'Data Kosong', text: 'Tidak ada data presensi yang sesuai untuk diekspor.' });
      return;
    }

    const dataToExport = filteredAttendances.map((item, idx) => ({
      No: idx + 1,
      Tanggal: item.tanggal,
      'Nama Siswa': item.namaSiswa,
      NISN: item.nisn,
      Kelas: item.kelas,
      'Tempat PKL / DUDI': item.namaDudi,
      'Waktu Datang': item.waktuDatang || '-',
      'Waktu Pulang': item.waktuPulang || 'Belum Pulang',
      Status: item.status === 'masih_pkl' ? 'Masih di Lokasi PKL' : 'Selesai Pulang',
      'Ringkasan Tugas': item.ringkasanPekerjaan || item.keteranganDatang || '-',
      'Verifikasi Guru': item.verifiedByTeacher ? 'Terverifikasi' : 'Belum',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Presensi_PKL');
    XLSX.writeFile(wb, `Rekap_Presensi_PKL_${todayStr}.xlsx`);
  };

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  // Toggle Verify
  const handleToggleVerify = async (item: PresensiPkl) => {
    const updated = await pklService.updatePresensi(item.id, {
      verifiedByTeacher: !item.verifiedByTeacher,
    });
    if (updated) {
      setAttendances((prev) => prev.map((a) => (a.id === item.id ? updated : a)));
    }
  };

  // Delete Attendance
  const handleDeleteAttendance = async (id: string, name: string) => {
    const confirm = await Swal.fire({
      title: 'Hapus Catatan Presensi?',
      text: `Apakah Anda yakin ingin menghapus catatan presensi untuk siswa ${name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    });

    if (confirm.isConfirmed) {
      const ok = await pklService.deletePresensi(id);
      if (ok) {
        setAttendances((prev) => prev.filter((a) => a.id !== id));
        Swal.fire({ icon: 'success', title: 'Terhapus!', timer: 1500, showConfirmButton: false });
      }
    }
  };

  // Add Manual Presensi Submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.namaSiswa) {
      Swal.fire({ icon: 'warning', title: 'Pilih / Masukkan Nama Siswa!' });
      return;
    }

    try {
      const record = await pklService.submitPresensi({
        tanggal: manualForm.tanggal,
        siswaId: manualForm.siswaId || `s_${Date.now()}`,
        nisn: manualForm.nisn || '-',
        namaSiswa: manualForm.namaSiswa,
        kelas: manualForm.kelas,
        namaDudi: manualForm.namaDudi || 'Tempat PKL',
        waktuDatang: manualForm.waktuDatang,
        timestampDatang: Date.now(),
        fotoDatang: manualForm.fotoDatang || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
        lokasiDatang: manualForm.lokasiDatang,
        keteranganDatang: manualForm.keteranganDatang,
        waktuPulang: manualForm.waktuPulang || undefined,
        fotoPulang: manualForm.fotoPulang || undefined,
        keteranganPulang: manualForm.keteranganPulang || undefined,
        ringkasanPekerjaan: manualForm.ringkasanPekerjaan,
        status: manualForm.waktuPulang ? 'selesai_pulang' : 'masih_pkl',
        verifiedByTeacher: true,
      });

      setAttendances((prev) => [record, ...prev]);
      setIsAddManualModalOpen(false);
      Swal.fire({ icon: 'success', title: 'Presensi Manual Berhasil Ditambahkan!' });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Gagal Menambah Presensi', text: err.message });
    }
  };

  // Add Place Submit
  const handleAddPlaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaceForm.namaDudi.trim()) return;

    try {
      const created = await pklService.addPlace(newPlaceForm);
      setPlaces((prev) => [...prev, created]);
      setNewPlaceForm({
        namaDudi: '',
        bidangUsaha: '',
        alamat: '',
        pembimbingDudi: '',
        kontakPembimbing: '',
        guruPembimbing: pengaturan.namaGuru || 'Yusak Yokoyama, S.Pd., M.Pd.',
      });
      Swal.fire({ icon: 'success', title: 'Tempat PKL Berhasil Ditambahkan!' });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Gagal Menambah DUDI', text: err.message });
    }
  };

  // Delete Place Submit
  const handleDeletePlace = async (id: string, name: string) => {
    const res = await Swal.fire({
      title: 'Hapus Mitra DUDI?',
      text: `Apakah Anda yakin ingin menghapus "${name}" dari daftar mitra perusahaan PKL?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#ef4444',
    });

    if (res.isConfirmed) {
      try {
        await pklService.deletePlace(id);
        setPlaces((prev) => prev.filter((p) => p.id !== id));
        Swal.fire({ icon: 'success', title: 'Berhasil Dihapus!', text: 'Mitra DUDI telah dihapus dari daftar.' });
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Gagal Menghapus', text: err.message });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Printable Header (Visible Only on Print) */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-xl font-bold uppercase">{pengaturan.namaSekolah}</h1>
        <h2 className="text-lg font-bold">REKAPITULASI PRESENSI & MONITORING PRAKTIK KERJA LAPANGAN (PKL)</h2>
        <p className="text-sm">
          Guru Pembimbing: {pengaturan.namaGuru} • NIP: {pengaturan.nipGuru}
        </p>
        <p className="text-xs text-slate-500">Tanggal Rekapitulasi: {new Date().toLocaleDateString('id-ID')}</p>
      </div>

      {/* Main Top Header */}
      <div className="no-print bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border-2 border-blue-400 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-2xl shadow-lg shadow-amber-400/30 shrink-0">
              <Briefcase className="w-7 h-7 text-slate-950" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                  MODUL MONITORING SISWA PKL
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  REAL-TIME
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1 text-white">
                Pemantauan Murid Praktik Kerja Lapangan (PKL)
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 max-w-2xl">
                Pantau kedatangan dan kepulangan siswa magang/PKL secara autentik dengan foto selfie ber-watermark tanggal dan jam resmi. Siswa dapat mengirim waktu datang tanpa harus mengisi waktu pulang saat pagi hari.
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2 active:scale-95"
            >
              <Copy className="w-4 h-4" />
              <span>Salin Tautan Siswa</span>
            </button>
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md border border-white/30 transition-all flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span>Tampilkan QR</span>
            </button>
            <button
              onClick={onOpenStudentPortal}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 active:scale-95"
              title="Buka tampilan yang akan dilihat oleh siswa"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Buka Portal Murid</span>
            </button>
          </div>
        </div>
      </div>

      {/* SHAREABLE LINK BANNER (FEATURE UTAMA YANG DIMINTA USER) */}
      <div className="no-print bg-white dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-500 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                🔗
              </span>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                Tautan Presensi Mandiri Murid PKL
              </h2>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                Siap Dibagikan ke Siswa
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Bagikan tautan ini kepada murid PKL agar mereka dapat membuka portal dari smartphone masing-masing untuk melakukan foto selfie datang & pulang:
            </p>

            {/* URL Display Box */}
            <div className="flex items-center gap-2 pt-1">
              <div className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 font-mono text-xs text-blue-600 dark:text-blue-400 truncate select-all">
                {studentPortalUrl}
              </div>
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 transition-colors"
                title="Salin Tautan"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin</span>
              </button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="flex flex-wrap md:flex-col lg:flex-row items-center gap-2 shrink-0">
            <button
              onClick={handleShareWhatsApp}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Bagikan via WhatsApp</span>
            </button>
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors flex items-center gap-2 border border-slate-700"
            >
              <QrCode className="w-4 h-4" />
              <span>Cetak Kode QR</span>
            </button>
          </div>
        </div>

        {/* Highlight Feature Note */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              <b>Kamera Selfie Auto-Watermark:</b> Foto langsung dicetak stempel tanggal & waktu riil yang tidak dapat dimanipulasi.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <b>Fleksibel:</b> Murid dapat kirim waktu datang saat tiba, lalu isi waktu pulang saat jam kerja berakhir.
            </span>
          </div>
        </div>
      </div>

      {/* NOTIFIKASI OTOMATIS & BADGE PERINGATAN BELUM ABSEN PULANG */}
      {studentsNotYetCheckedOut.length > 0 && (
        <div className="no-print bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600 rounded-3xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 animate-bounce">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                  Peringatan Otomatis: Belum Absen Pulang ({studentsNotYetCheckedOut.length} Murid)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black uppercase">
                  Hari Ini
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                Terdapat {studentsNotYetCheckedOut.length} murid yang telah absen datang hari ini namun belum melakukan foto selfie absen pulang.
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {studentsNotYetCheckedOut.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-[11px] font-bold shadow-xs"
                  >
                    <span>{s.namaSiswa}</span>
                    <span className="text-[9px] text-slate-400">({s.namaDudi})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              onClick={() => {
                const names = studentsNotYetCheckedOut.map((s) => `• ${s.namaSiswa} (${s.namaDudi})`).join('\n');
                const text = encodeURIComponent(
                  `*REMINDER ABSEN PULANG PKL - ${pengaturan.namaSekolah.toUpperCase()}*\n\n` +
                    `Halo anak-anak yang masih di lokasi PKL, diingatkan untuk segera melakukan presensi selfie pulang melalui portal siswa jika jam kerja telah selesai:\n\n${names}\n\n` +
                    `🔗 ${studentPortalUrl}`
                );
                window.open(`https://wa.me/?text=${text}`, '_blank');
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Ingatkan via WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* METRIC SUMMARY CARDS */}
      <div className="no-print grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Today */}
        <div className="bg-white dark:bg-slate-900 border-2 border-blue-400 dark:border-blue-700 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Presensi Hari Ini</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {todayAttendances.length}
            </span>
            <span className="text-xs text-slate-500">murid</span>
          </div>
        </div>

        {/* Masih di Lokasi PKL (Sudah Datang, Belum Pulang) */}
        <div className="bg-white dark:bg-slate-900 border-2 border-emerald-400 dark:border-emerald-700 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Masih di Lokasi PKL</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center animate-pulse">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {stillAtDudi.length}
            </span>
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">sedang aktif</span>
          </div>
        </div>

        {/* Sudah Pulang (Lengkap) */}
        <div className="bg-white dark:bg-slate-900 border-2 border-purple-400 dark:border-purple-700 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Selesai Pulang</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
              {completedToday.length}
            </span>
            <span className="text-xs text-slate-500">lengkap</span>
          </div>
        </div>

        {/* Mitra Industri DUDI */}
        <div className="bg-white dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-700 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Mitra Industri (DUDI)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {places.length}
            </span>
            <span className="text-xs text-slate-500">perusahaan</span>
          </div>
        </div>
      </div>

      {/* FILTER & ACTION TOOLBAR */}
      <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama murid, NISN, atau tempat PKL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAddManualModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Input Presensi Manual</span>
            </button>
            <button
              onClick={() => setIsManagePlacesModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Building2 className="w-4 h-4" />
              <span>Kelola DUDI ({places.length})</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              title="Unduh format file Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
              title="Cetak format cetak resmi sekolah"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rekap</span>
            </button>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Filter Tanggal */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-600 dark:text-slate-400">Tanggal:</span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-[10px] text-blue-600 hover:underline"
              >
                Semua Tanggal
              </button>
            )}
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-600 dark:text-slate-400">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
            >
              <option value="semua">Semua Status</option>
              <option value="masih_pkl">Masih di Lokasi PKL (Belum Pulang)</option>
              <option value="selesai_pulang">Selesai Pulang</option>
            </select>
          </div>

          {/* Filter DUDI */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-600 dark:text-slate-400">Perusahaan:</span>
            <select
              value={filterDudi}
              onChange={(e) => setFilterDudi(e.target.value)}
              className="px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs max-w-xs truncate"
            >
              <option value="semua">Semua Perusahaan</option>
              {places.map((p) => (
                <option key={p.id} value={p.namaDudi}>
                  {p.namaDudi}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={loadData}
            className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang Data</span>
          </button>
        </div>
      </div>

      {/* TABLE DATA PRESENSI PKL */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">
              Daftar Presensi & Foto Selfie Murid PKL
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 font-bold">
              {filteredAttendances.length} Catatan
            </span>
          </div>
        </div>

        {filteredAttendances.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <Users className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Belum ada data presensi PKL yang sesuai
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Silakan bagikan tautan kepada murid untuk mulai mengisi presensi, atau gunakan tombol "+ Input Presensi Manual" untuk memasukkan data langsung.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Murid & Sekolah</th>
                  <th className="py-3 px-3">Tempat PKL (DUDI)</th>
                  <th className="py-3 px-3 text-center">Foto Selfie Datang</th>
                  <th className="py-3 px-3 text-center">Foto Selfie Pulang</th>
                  <th className="py-3 px-3">Jam & Durasi</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Jurnal Tugas / Catatan</th>
                  <th className="no-print py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredAttendances.map((item) => {
                  const isStillAtDudi = item.status === 'masih_pkl' && !item.waktuPulang;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Siswa */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-slate-900 dark:text-white text-sm">
                          {item.namaSiswa}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {item.kelas}
                          </span>
                          <span>•</span>
                          <span>NISN: {item.nisn}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          📅 {item.tanggal}
                        </div>
                      </td>

                      {/* Tempat PKL */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {item.namaDudi}
                        </div>
                        {item.lokasiDatang && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[140px]">{item.lokasiDatang}</span>
                          </div>
                        )}
                        {item.latitudeDatang && item.longitudeDatang && (
                          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                            <a
                              href={`https://www.google.com/maps?q=${item.latitudeDatang},${item.longitudeDatang}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:font-bold"
                              title="Buka lokasi GPS Datang di Google Maps"
                            >
                              GPS Datang: {item.latitudeDatang.toFixed(4)}, {item.longitudeDatang.toFixed(4)}
                              {item.akurasiDatang ? ` (±${item.akurasiDatang}m)` : ''}
                            </a>
                          </div>
                        )}
                        {item.latitudePulang && item.longitudePulang && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                            <a
                              href={`https://www.google.com/maps?q=${item.latitudePulang},${item.longitudePulang}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:font-bold"
                              title="Buka lokasi GPS Pulang di Google Maps"
                            >
                              GPS Pulang: {item.latitudePulang.toFixed(4)}, {item.longitudePulang.toFixed(4)}
                              {item.akurasiPulang ? ` (±${item.akurasiPulang}m)` : ''}
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Foto Datang */}
                      <td className="py-3.5 px-3 text-center">
                        {item.fotoDatang ? (
                          <div
                            onClick={() =>
                              setSelectedPhotoModal({
                                url: item.fotoDatang,
                                title: 'Foto Selfie Datang (Check-In)',
                                timestamp: `${item.tanggal} ${item.waktuDatang} WIB`,
                                siswa: item.namaSiswa,
                                dudi: item.namaDudi,
                              })
                            }
                            className="cursor-pointer group inline-block relative rounded-xl overflow-hidden border-2 border-emerald-400 shadow-sm hover:scale-105 transition-transform"
                            title="Klik untuk memperbesar foto selfie datang"
                          >
                            <img
                              src={item.fotoDatang}
                              alt="Selfie Datang"
                              className="w-14 h-14 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                              <Eye className="w-4 h-4" />
                            </div>
                            <span className="absolute bottom-0 inset-x-0 bg-emerald-600 text-white text-[8px] font-black py-0.5">
                              {item.waktuDatang}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Tidak ada foto</span>
                        )}
                      </td>

                      {/* Foto Pulang */}
                      <td className="py-3.5 px-3 text-center">
                        {item.fotoPulang ? (
                          <div
                            onClick={() =>
                              setSelectedPhotoModal({
                                url: item.fotoPulang!,
                                title: 'Foto Selfie Pulang (Check-Out)',
                                timestamp: `${item.tanggal} ${item.waktuPulang} WIB`,
                                siswa: item.namaSiswa,
                                dudi: item.namaDudi,
                              })
                            }
                            className="cursor-pointer group inline-block relative rounded-xl overflow-hidden border-2 border-amber-400 shadow-sm hover:scale-105 transition-transform"
                            title="Klik untuk memperbesar foto selfie pulang"
                          >
                            <img
                              src={item.fotoPulang}
                              alt="Selfie Pulang"
                              className="w-14 h-14 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                              <Eye className="w-4 h-4" />
                            </div>
                            <span className="absolute bottom-0 inset-x-0 bg-amber-600 text-white text-[8px] font-black py-0.5">
                              {item.waktuPulang}
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-400 text-[10px] font-black flex items-center gap-1 shadow-xs">
                              <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                              Belum Absen Pulang
                            </span>
                            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold mt-0.5 animate-pulse">
                              ⚠️ Perlu Check-Out
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Jam & Durasi */}
                      <td className="py-3.5 px-3">
                        <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                          Masuk: <span className="text-emerald-600">{item.waktuDatang}</span>
                        </div>
                        <div className="font-mono text-xs text-slate-500 mt-0.5">
                          Pulang:{' '}
                          {item.waktuPulang ? (
                            <span className="text-amber-600 font-bold">{item.waktuPulang}</span>
                          ) : (
                            <span className="italic text-slate-400">-</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        {isStillAtDudi ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 font-black text-[10px]">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            Masih di PKL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 font-black text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            Selesai Pulang
                          </span>
                        )}
                      </td>

                      {/* Jurnal Tugas */}
                      <td className="py-3.5 px-3 max-w-xs">
                        {item.ringkasanPekerjaan ? (
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-2">
                            {item.ringkasanPekerjaan}
                          </p>
                        ) : item.keteranganDatang ? (
                          <p className="text-[11px] text-slate-500 italic line-clamp-2">
                            {item.keteranganDatang}
                          </p>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Tidak ada catatan</span>
                        )}

                        {item.catatanGuru && (
                          <div className="mt-1 text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                            <span>💬 Catatan Guru:</span>
                            <span className="italic">{item.catatanGuru}</span>
                          </div>
                        )}
                      </td>

                      {/* Aksi Guru */}
                      <td className="no-print py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleVerify(item)}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                              item.verifiedByTeacher
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-400'
                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                            title={item.verifiedByTeacher ? 'Terverifikasi Guru (Klik untuk batal)' : 'Klik untuk Verifikasi'}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteAttendance(item.id, item.namaSiswa)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors"
                            title="Hapus Catatan Presensi"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: QR CODE DISPLAY & SHARE (UNTUK SISWA SCAN) */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border-2 border-blue-500 rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-scaleIn text-center space-y-4">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Scan QR Code Presensi PKL
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Arahkan kamera smartphone murid ke kode QR ini untuk membuka portal presensi selfie secara instan.
              </p>
            </div>

            {/* QR Code Canvas/Image */}
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 inline-block shadow-inner">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code Presensi PKL" className="w-56 h-56 mx-auto" />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
              )}
            </div>

            {/* Share & Download actions */}
            <div className="space-y-2">
              <button
                onClick={handleCopyLink}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md"
              >
                <Copy className="w-4 h-4" />
                <span>Salin Tautan Portal Siswa</span>
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Kirim Tautan ke WhatsApp Siswa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: FOTO SELFIE WATERMARK PREVIEW */}
      {selectedPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-950 border-2 border-blue-500 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl relative text-white">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-amber-400 flex items-center gap-2">
                  <span>📸</span> {selectedPhotoModal.title}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedPhotoModal.siswa} • {selectedPhotoModal.dudi}
                </p>
              </div>
              <button
                onClick={() => setSelectedPhotoModal(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-black flex items-center justify-center">
              <img
                src={selectedPhotoModal.url}
                alt={selectedPhotoModal.title}
                className="max-h-[500px] w-auto object-contain rounded-xl border border-slate-800"
              />
            </div>

            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>🕒 Waktu: {selectedPhotoModal.timestamp}</span>
              <a
                href={selectedPhotoModal.url}
                download={`Selfie_PKL_${selectedPhotoModal.siswa.replace(/\s+/g, '_')}.jpg`}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Foto</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: INPUT PRESENSI MANUAL OLEH GURU */}
      {isAddManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border-2 border-blue-500 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddManualModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide mb-1">
              + Input Presensi PKL Manual (Guru)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Gunakan jika siswa mengalami kendala perangkat atau lupa membawa smartphone.
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-3.5 text-xs">
              {/* Siswa Picker */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Pilih Murid</label>
                <select
                  value={manualForm.siswaId}
                  onChange={(e) => {
                    const s = siswaList.find((item) => item.id === e.target.value);
                    if (s) {
                      setManualForm((prev) => ({
                        ...prev,
                        siswaId: s.id,
                        namaSiswa: s.nama,
                        nisn: s.nisn,
                        kelas: s.kelas,
                      }));
                    }
                  }}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="">-- Pilih Siswa dari Database --</option>
                  {siswaList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.kelas} - {s.nisn})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={manualForm.namaSiswa}
                    onChange={(e) => setManualForm((p) => ({ ...p, namaSiswa: e.target.value }))}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">NISN</label>
                  <input
                    type="text"
                    value={manualForm.nisn}
                    onChange={(e) => setManualForm((p) => ({ ...p, nisn: e.target.value }))}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Tempat PKL (DUDI)</label>
                  <select
                    value={manualForm.namaDudi}
                    onChange={(e) => setManualForm((p) => ({ ...p, namaDudi: e.target.value }))}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                  >
                    {places.map((p) => (
                      <option key={p.id} value={p.namaDudi}>
                        {p.namaDudi}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Tanggal Presensi</label>
                  <input
                    type="date"
                    value={manualForm.tanggal}
                    onChange={(e) => setManualForm((p) => ({ ...p, tanggal: e.target.value }))}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Waktu Datang *</label>
                  <input
                    type="time"
                    step="1"
                    required
                    value={manualForm.waktuDatang}
                    onChange={(e) => setManualForm((p) => ({ ...p, waktuDatang: e.target.value }))}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-600 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Waktu Pulang (Boleh Kosong)</label>
                  <input
                    type="time"
                    step="1"
                    value={manualForm.waktuPulang}
                    onChange={(e) => setManualForm((p) => ({ ...p, waktuPulang: e.target.value }))}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Catatan / Ringkasan Pekerjaan</label>
                <textarea
                  rows={2}
                  placeholder="Ringkasan tugas atau kegiatan yang dilakukan hari ini..."
                  value={manualForm.ringkasanPekerjaan}
                  onChange={(e) => setManualForm((p) => ({ ...p, ringkasanPekerjaan: e.target.value }))}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black"
                >
                  Simpan Presensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: KELOLA DAFTAR DUDI / PERUSAHAAN MITRA */}
      {isManagePlacesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <button
              onClick={() => setIsManagePlacesModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">
                Kelola Daftar Tempat PKL / DUDI Mitra
              </h3>
              <p className="text-xs text-slate-500">
                Data perusahaan tempat murid ditugaskan melakukan Praktik Kerja Lapangan.
              </p>
            </div>

            {/* List Existing Places */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {places.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {p.namaDudi}
                    </h4>
                    <p className="text-slate-500">{p.bidangUsaha} • {p.alamat}</p>
                    <p className="text-blue-600 dark:text-blue-400 mt-0.5">
                      Pembimbing DUDI: <b>{p.pembimbingDudi}</b> ({p.kontakPembimbing})
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeletePlace(p.id, p.namaDudi)}
                    className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors shrink-0"
                    title="Hapus Mitra DUDI"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Place Form */}
            <form onSubmit={handleAddPlaceSubmit} className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wide">
                + Tambah Mitra Perusahaan DUDI Baru
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold">Nama Perusahaan / DUDI *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PT Telkom Akses"
                    value={newPlaceForm.namaDudi}
                    onChange={(e) => setNewPlaceForm((p) => ({ ...p, namaDudi: e.target.value }))}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold">Bidang Usaha</label>
                  <input
                    type="text"
                    placeholder="IT, Jaringan, Multimedia"
                    value={newPlaceForm.bidangUsaha}
                    onChange={(e) => setNewPlaceForm((p) => ({ ...p, bidangUsaha: e.target.value }))}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold">Alamat Kantor / Industri</label>
                <input
                  type="text"
                  placeholder="Jl. Sudirman Kav. 5, Jakarta"
                  value={newPlaceForm.alamat}
                  onChange={(e) => setNewPlaceForm((p) => ({ ...p, alamat: e.target.value }))}
                  className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold">Nama Pembimbing Lapangan (DUDI)</label>
                  <input
                    type="text"
                    placeholder="Nama Mentor Industri"
                    value={newPlaceForm.pembimbingDudi}
                    onChange={(e) => setNewPlaceForm((p) => ({ ...p, pembimbingDudi: e.target.value }))}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold">No. HP / WhatsApp Pembimbing</label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={newPlaceForm.kontakPembimbing}
                    onChange={(e) => setNewPlaceForm((p) => ({ ...p, kontakPembimbing: e.target.value }))}
                    className="w-full mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black"
                >
                  Simpan Tempat PKL Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
