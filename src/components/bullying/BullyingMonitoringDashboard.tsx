import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  QrCode,
  Copy,
  ExternalLink,
  MessageCircle,
  Eye,
  CheckCircle2,
  Clock,
  Trash2,
  Check,
  X,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Lock,
  UserCheck,
} from 'lucide-react';
import Swal from 'sweetalert2';
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';
import { BullyingReport, Pengaturan } from '../../types';
import { bullyingService } from '../../services/bullyingService';

interface BullyingMonitoringDashboardProps {
  pengaturan: Pengaturan;
}

export const BullyingMonitoringDashboard: React.FC<BullyingMonitoringDashboardProps> = ({ pengaturan }) => {
  const [reports, setReports] = useState<BullyingReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('semua');
  const [filterJenis, setFilterJenis] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [selectedReportModal, setSelectedReportModal] = useState<BullyingReport | null>(null);
  const [teacherNoteInput, setTeacherNoteInput] = useState('');

  const currentHost = typeof window !== 'undefined' ? window.location.origin : '';
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const studentPortalUrl = `${currentHost}${currentPath}?portal=bullying`;

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await bullyingService.fetchReports();
      setReports(data);
    } catch (err) {
      console.error('Error loading bullying reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    QRCode.toDataURL(studentPortalUrl, { width: 320, margin: 2 })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.warn('QR code gen err:', err));
  }, [studentPortalUrl]);

  // Copy link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(studentPortalUrl);
    Swal.fire({
      icon: 'success',
      title: 'Tautan Berhasil Disalin!',
      html: `
        <div class="text-xs text-left space-y-2">
          <p>Tautan portal pengaduan bullying telah disalin:</p>
          <div class="p-2 bg-slate-100 rounded-lg font-mono text-[11px] break-all border text-rose-700">
            ${studentPortalUrl}
          </div>
        </div>
      `,
      timer: 3000,
      showConfirmButton: false,
    });
  };

  // WhatsApp share
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `*LAYANAN PENGADUAN BULLYING (PERUNDUNGAN) - ${pengaturan.namaSekolah.toUpperCase()}*\n\n` +
        `Halo siswa-siswi sekalian, jika kalian mengalami atau melihat tindakan bullying di lingkungan sekolah, jangan takut untuk melaporkannya melalui portal rahasia berikut:\n\n` +
        `🔗 *Tautan Pengaduan Aman:* ${studentPortalUrl}\n\n` +
        `*Catatan:* Laporan dapat dikirim secara anonim (rahasia). Keamanan Anda adalah prioritas kami!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    if (filterStatus !== 'semua' && r.status !== filterStatus) return false;
    if (filterJenis !== 'semua' && r.jenisBullying !== filterJenis) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchDesc = r.deskripsi.toLowerCase().includes(q);
      const matchLoc = r.lokasiKejadian.toLowerCase().includes(q);
      const matchName = (r.pelaporNama || '').toLowerCase().includes(q);
      if (!matchDesc && !matchLoc && !matchName) return false;
    }
    return true;
  });

  // Metrics
  const totalReports = reports.length;
  const pendingReports = reports.filter((r) => r.status === 'Menunggu Penanganan').length;
  const inProgressReports = reports.filter((r) => r.status === 'Sedang Ditindaklanjuti').length;
  const resolvedReports = reports.filter((r) => r.status === 'Selesai Ditangani').length;

  // Update Status & Note
  const handleUpdateStatus = async (id: string, newStatus: BullyingReport['status']) => {
    const updated = await bullyingService.updateReport(id, { status: newStatus });
    if (updated) {
      setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
      if (selectedReportModal?.id === id) {
        setSelectedReportModal(updated);
      }
      Swal.fire({ icon: 'success', title: 'Status Diperbarui', timer: 1500, showConfirmButton: false });
    }
  };

  const handleSaveTeacherNote = async (id: string) => {
    const updated = await bullyingService.updateReport(id, { catatanGuru: teacherNoteInput });
    if (updated) {
      setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setSelectedReportModal(updated);
      Swal.fire({ icon: 'success', title: 'Catatan Penanganan Disimpan!', timer: 1500, showConfirmButton: false });
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: 'Hapus Laporan?',
      text: 'Apakah Anda yakin ingin menghapus catatan pengaduan ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus',
    });
    if (confirm.isConfirmed) {
      await bullyingService.deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      if (selectedReportModal?.id === id) setSelectedReportModal(null);
      Swal.fire({ icon: 'success', title: 'Terhapus', timer: 1200, showConfirmButton: false });
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    if (filteredReports.length === 0) {
      Swal.fire({ icon: 'info', title: 'Data Kosong' });
      return;
    }
    const dataToExport = filteredReports.map((r, i) => ({
      No: i + 1,
      Tanggal: r.tanggal,
      Waktu: r.waktu,
      Pelapor: r.pelaporNama || 'Anonim',
      'Jenis Bullying': r.jenisBullying,
      'Lokasi Kejadian': r.lokasiKejadian,
      'Deskripsi Pengaduan': r.deskripsi,
      'Pihak Terlibat': r.pihakTerlibat || '-',
      Status: r.status,
      'Catatan Guru / BK': r.catatanGuru || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pengaduan_Bullying');
    XLSX.writeFile(wb, `Rekap_Pengaduan_Bullying_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Printable Header */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="text-xl font-bold uppercase">{pengaturan.namaSekolah}</h1>
        <h2 className="text-lg font-bold">REKAPITULASI PENGADUAN BULLYING & PERUNDUNGAN SEKOLAH</h2>
        <p className="text-sm">Guru Pembimbing / BK: {pengaturan.namaGuru}</p>
      </div>

      {/* Main Top Banner */}
      <div className="no-print bg-gradient-to-r from-rose-700 via-rose-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border-2 border-rose-400 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-2xl shadow-lg shrink-0">
              <ShieldAlert className="w-7 h-7 text-slate-950" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                  MODUL ANTI-BULLYING
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  LIVE PORTAL
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1 text-white">
                Pemantauan & Pengaduan Bullying (Perundungan)
              </h1>
              <p className="text-xs sm:text-sm text-rose-100 max-w-2xl">
                Sistem pengaduan dan pemantauan interaktif bagi siswa untuk melaporkan kasus perundungan secara aman dan rahasia. Guru dapat meninjau, menangani, dan mendokumentasikan tindak lanjut.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              <span>Salin Tautan Portal Siswa</span>
            </button>
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md border border-white/30 transition-all flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span>Tampilkan QR</span>
            </button>
            <a
              href={`${currentPath}?portal=bullying`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs shadow-md transition-all flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Buka Portal Siswa</span>
            </a>
          </div>
        </div>
      </div>

      {/* SHAREABLE LINK BANNER */}
      <div className="no-print bg-white dark:bg-slate-900 border-2 border-rose-400 dark:border-rose-600 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                🔗
              </span>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                Tautan QR Code Pengaduan Bullying
              </h2>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                Siap Disebar ke Mading / Kelas
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Bagikan tautan atau cetak QR code ini agar siswa dapat melaporkan perundungan secara mudah dari smartphone mereka:
            </p>

            <div className="flex items-center gap-2 pt-1">
              <div className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 font-mono text-xs text-rose-600 dark:text-rose-400 truncate select-all">
                {studentPortalUrl}
              </div>
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin</span>
              </button>
            </div>
          </div>

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
      </div>

      {/* METRIC SUMMARY CARDS */}
      <div className="no-print grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Pengaduan</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
              📊
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {totalReports}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-700 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Menunggu Penanganan</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {pendingReports}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border-2 border-blue-400 dark:border-blue-700 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Sedang Ditindaklanjuti</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
            {inProgressReports}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border-2 border-emerald-400 dark:border-emerald-700 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Selesai Ditangani</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {resolvedReports}
          </div>
        </div>
      </div>

      {/* FILTER & TOOLBAR */}
      <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari deskripsi, lokasi kejadian, atau nama pelapor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rekap</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-600 dark:text-slate-400">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
            >
              <option value="semua">Semua Status</option>
              <option value="Menunggu Penanganan">Menunggu Penanganan</option>
              <option value="Sedang Ditindaklanjuti">Sedang Ditindaklanjuti</option>
              <option value="Selesai Ditangani">Selesai Ditangani</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Jenis:</span>
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
            >
              <option value="semua">Semua Jenis</option>
              <option value="Verbal">Verbal</option>
              <option value="Fisik">Fisik</option>
              <option value="Siber (Cyberbullying)">Siber</option>
              <option value="Sosial / Pengucilan">Sosial</option>
              <option value="Intimidasi / Ancaman">Intimidasi</option>
            </select>
          </div>

          <button
            onClick={loadData}
            className="ml-auto text-xs text-rose-600 hover:underline flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </button>
        </div>
      </div>

      {/* TABLE REPORTS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">
              Daftar Laporan Pengaduan Masuk
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 font-bold">
              {filteredReports.length} Laporan
            </span>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Belum ada laporan pengaduan bullying yang tercatat
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Siswa dapat melaporkan insiden melalui tautan portal rahasia. Data pengaduan akan masuk secara real-time ke panel guru.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Waktu & Pelapor</th>
                  <th className="py-3 px-3">Jenis Bullying</th>
                  <th className="py-3 px-3">Lokasi Kejadian</th>
                  <th className="py-3 px-3">Deskripsi Pengaduan</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="no-print py-3 px-4 text-right">Aksi & Tindak Lanjut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredReports.map((item) => (
                  <tr key={item.id} className="hover:bg-rose-50/40 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-black text-slate-900 dark:text-white">
                        {item.isAnonymous ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px]">
                            🔒 Anonim (Rahasia)
                          </span>
                        ) : (
                          item.pelaporNama
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        📅 {item.tanggal} • {item.waktu} WIB
                      </div>
                      {!item.isAnonymous && item.pelaporKelas && (
                        <div className="text-[10px] text-blue-600 font-bold">
                          Kelas: {item.pelaporKelas}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-black text-[10px] border border-rose-300">
                        {item.jenisBullying}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      📍 {item.lokasiKejadian}
                    </td>

                    <td className="py-3.5 px-3 max-w-xs">
                      <p className="text-slate-700 dark:text-slate-300 line-clamp-2">
                        {item.deskripsi}
                      </p>
                      {item.catatanGuru && (
                        <div className="mt-1 text-[10px] text-emerald-600 font-bold">
                          ✓ Tindak Lanjut: {item.catatanGuru}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black border ${
                          item.status === 'Menunggu Penanganan'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : item.status === 'Sedang Ditindaklanjuti'
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="no-print py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedReportModal(item);
                            setTeacherNoteInput(item.catatanGuru || '');
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40"
                          title="Hapus Laporan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: QR CODE DISPLAY */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border-2 border-rose-500 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-center space-y-4">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Scan QR Code Pengaduan Bullying
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Siswa dapat melakukan scan QR code ini untuk melaporkan perundungan secara rahasia dan aman.
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 inline-block shadow-inner">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code Bullying" className="w-56 h-56 mx-auto" />
              ) : (
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-400" />
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCopyLink}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                <span>Salin Tautan Portal</span>
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Kirim Tautan ke WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DETAIL LAPORAN & TINDAK LANJUT GURU */}
      {selectedReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-rose-500 rounded-3xl max-w-xl w-full p-6 shadow-2xl text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <h3 className="font-black text-sm uppercase tracking-wide">Detail Pengaduan Bullying</h3>
              </div>
              <button
                onClick={() => setSelectedReportModal(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <div>
                <span className="text-slate-400 block">Pelapor:</span>
                <span className="font-bold text-white">
                  {selectedReportModal.isAnonymous ? '🔒 Anonim (Rahasia)' : selectedReportModal.pelaporNama}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Waktu:</span>
                <span className="font-mono text-white">{selectedReportModal.tanggal} {selectedReportModal.waktu} WIB</span>
              </div>
              <div>
                <span className="text-slate-400 block">Jenis Perundungan:</span>
                <span className="font-bold text-rose-400">{selectedReportModal.jenisBullying}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Lokasi:</span>
                <span className="font-bold text-white">{selectedReportModal.lokasiKejadian}</span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-slate-400 font-bold block">Kronologi / Deskripsi Kejadian:</span>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 leading-relaxed">
                {selectedReportModal.deskripsi}
              </div>
            </div>

            {selectedReportModal.pihakTerlibat && (
              <div className="space-y-1 text-xs">
                <span className="text-slate-400 font-bold block">Pihak Terlibat:</span>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200">
                  {selectedReportModal.pihakTerlibat}
                </div>
              </div>
            )}

            {selectedReportModal.buktiFoto && (
              <div className="space-y-1 text-xs">
                <span className="text-slate-400 font-bold block">Bukti Foto / Bukti Dukung:</span>
                <div className="p-2 bg-black rounded-xl border border-slate-800 inline-block">
                  <img src={selectedReportModal.buktiFoto} alt="Bukti" className="max-h-48 rounded object-contain" />
                </div>
              </div>
            )}

            {/* Status Update Buttons */}
            <div className="space-y-1 text-xs pt-2">
              <span className="text-slate-400 font-bold block">Ubah Status Penanganan:</span>
              <div className="flex flex-wrap gap-2">
                {(['Menunggu Penanganan', 'Sedang Ditindaklanjuti', 'Selesai Ditangani'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(selectedReportModal.id, st)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                      selectedReportModal.status === st
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Teacher Notes */}
            <div className="space-y-1 text-xs pt-2">
              <label className="text-slate-400 font-bold block">Catatan & Tindak Lanjut Guru / BK:</label>
              <textarea
                rows={3}
                placeholder="Tuliskan tindakan yang telah diambil (misal: Pemanggilan konseling, mediasi siswa, pembinaan)..."
                value={teacherNoteInput}
                onChange={(e) => setTeacherNoteInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
              />
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => handleSaveTeacherNote(selectedReportModal.id)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  Simpan Catatan Guru
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
