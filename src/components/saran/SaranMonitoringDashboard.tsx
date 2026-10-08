import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  Search,
  Filter,
  QrCode,
  Copy,
  ExternalLink,
  Star,
  CheckCircle2,
  Clock,
  Trash2,
  Check,
  X,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Eye,
  MessageSquareQuote,
  Building2,
  User,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import Swal from 'sweetalert2';
import { SaranMasukan, Pengaturan, Siswa } from '../../types';
import { getSaranList, updateSaranStatus, deleteSaran } from '../../services/saranService';

interface SaranMonitoringDashboardProps {
  pengaturan?: Pengaturan;
  siswaList: Siswa[];
  onOpenStudentPortal: () => void;
}

export const SaranMonitoringDashboard: React.FC<SaranMonitoringDashboardProps> = ({
  pengaturan,
  onOpenStudentPortal
}) => {
  const [saranList, setSaranList] = useState<SaranMasukan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<SaranMasukan | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [activeTabStatus, setActiveTabStatus] = useState<string>('all');

  const loadData = () => {
    const list = getSaranList();
    setSaranList(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const studentPortalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?portal=saran`
    : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(studentPortalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Swal.fire({
      icon: 'success',
      title: 'Tautan Disalin!',
      text: 'Tautan portal saran siswa berhasil disalin ke clipboard.',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleDelete = (id: string) => {
    Swal.fire({
      title: 'Hapus Saran Ini?',
      text: 'Data saran yang dihapus tidak dapat dikembalikan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteSaran(id);
        loadData();
        Swal.fire({
          icon: 'success',
          title: 'Terhapus',
          text: 'Data saran berhasil dihapus.',
          timer: 1200,
          showConfirmButton: false
        });
      }
    });
  };

  const handleStatusChange = (id: string, newStatus: SaranMasukan['status']) => {
    const item = saranList.find(s => s.id === id);
    updateSaranStatus(id, newStatus, item?.catatanGuru);
    loadData();
    Swal.fire({
      icon: 'success',
      title: 'Status Diperbarui',
      text: `Status saran diubah menjadi "${newStatus}".`,
      timer: 1200,
      showConfirmButton: false
    });
  };

  const handleSaveNotes = (id: string) => {
    const item = saranList.find(s => s.id === id);
    if (item) {
      updateSaranStatus(id, item.status, actionNotes);
      loadData();
      setShowDetailModal(false);
      Swal.fire({
        icon: 'success',
        title: 'Catatan Tersimpan',
        text: 'Catatan tindak lanjut guru berhasil disimpan.',
        timer: 1200,
        showConfirmButton: false
      });
    }
  };

  // Metrics
  const totalSaran = saranList.length;
  const newSaran = saranList.filter(s => s.status === 'Baru').length;
  const processedSaran = saranList.filter(s => s.status === 'Diproses' || s.status === 'Selesai / Diterapkan').length;
  const avgRating = totalSaran > 0
    ? (saranList.reduce((acc, curr) => acc + (curr.rating || 5), 0) / totalSaran).toFixed(1)
    : '5.0';

  // Filtered list
  const filteredList = saranList.filter(s => {
    const matchesSearch =
      (s.judul && s.judul.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.pesan && s.pesan.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.pengirimNama && s.pengirimNama.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.pengirimKelas && s.pengirimKelas.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || s.kategori === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const exportToCsv = () => {
    const headers = ['ID', 'Tanggal', 'Waktu', 'Pengirim', 'Kelas', 'Kategori', 'Rating', 'Judul', 'Pesan', 'Status', 'Catatan Guru'];
    const rows = filteredList.map(s => [
      s.id,
      s.tanggal,
      s.waktu,
      s.isAnonymous ? 'Anonim' : s.pengirimNama || '-',
      s.pengirimKelas || '-',
      s.kategori,
      s.rating || '-',
      `"${(s.judul || '').replace(/"/g, '""')}"`,
      `"${(s.pesan || '').replace(/"/g, '""')}"`,
      s.status,
      `"${(s.catatanGuru || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_saran_masukan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 rounded-2xl shadow-xl p-6 sm:p-8 text-white relative overflow-hidden no-print">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold mb-3">
              <Lightbulb className="w-3.5 h-3.5" /> Portal Aspirasi & Suara Murid
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Monitoring Saran & Masukan Sekolah
            </h1>
            <p className="text-amber-100 mt-1 max-w-2xl text-sm leading-relaxed">
              Pantau ide, aspirasi, dan kritik membangun dari siswa untuk peningkatan mutu dan fasilitas {pengaturan?.namaSekolah || 'Sekolah'}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowQrModal(true)}
              className="px-4 py-2.5 rounded-xl bg-white text-amber-700 hover:bg-amber-50 font-semibold shadow-md flex items-center gap-2 text-sm transition-all"
            >
              <QrCode className="w-4 h-4" /> QR Code & Tautan
            </button>
            <button
              onClick={onOpenStudentPortal}
              className="px-4 py-2.5 rounded-xl bg-amber-700/50 hover:bg-amber-700/70 text-white font-semibold border border-white/30 shadow-md flex items-center gap-2 text-sm backdrop-blur-md transition-all"
            >
              <ExternalLink className="w-4 h-4" /> Buka Portal Siswa
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Masuk</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalSaran}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Aspirasi terdaftar</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <MessageSquareQuote className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Belum Dibaca / Baru</p>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{newSaran}</h3>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">Perlu ditinjau</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Diproses / Diterapkan</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{processedSaran}</h3>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">Tindak lanjut aktif</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rata-Rata Rating</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
              {avgRating} <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Kepuasan fasilitas sekolah</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
            <Star className="w-6 h-6 fill-current" />
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4 no-print">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan topik, pesan, nama siswa, atau kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="all">Semua Kategori</option>
                <option value="Fasilitas Sekolah">🏢 Fasilitas Sekolah</option>
                <option value="Kurikulum & Pembelajaran">📚 Kurikulum</option>
                <option value="Ekstrakurikuler">🏆 Ekstrakurikuler</option>
                <option value="Kebersihan & Lingkungan">🧹 Kebersihan</option>
                <option value="Kantin & Kantin Kejujuran">🍎 Kantin</option>
                <option value="Lainnya">💡 Lainnya</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="all">Semua Status</option>
                <option value="Baru">Baru</option>
                <option value="Dibaca">Dibaca</option>
                <option value="Diproses">Diproses</option>
                <option value="Selesai / Diterapkan">Selesai / Diterapkan</option>
              </select>
            </div>

            <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-3">
              <button
                onClick={exportToCsv}
                title="Ekspor ke Excel/CSV"
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
              <button
                onClick={handlePrint}
                title="Cetak Laporan"
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={loadData}
                title="Muat Ulang"
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Daftar Saran & Masukan Siswa</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Menampilkan {filteredList.length} dari {saranList.length} total masukan</p>
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Tidak ada saran atau masukan ditemukan</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Belum ada data yang sesuai dengan filter pencarian Anda atau siswa belum mengirimkan saran baru.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Waktu & Pengirim</th>
                  <th className="py-3.5 px-4">Kategori & Rating</th>
                  <th className="py-3.5 px-4">Topik & Isi Pesan</th>
                  <th className="py-3.5 px-4">Status & Tindak Lanjut</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/55 transition-colors">
                    
                    {/* Waktu & Pengirim */}
                    <td className="py-4 px-4 align-top">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {item.isAnonymous ? (
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium">
                            🔒 Anonim (Rahasia)
                          </span>
                        ) : (
                          <>
                            <User className="w-3.5 h-3.5 text-amber-500" />
                            {item.pengirimNama || 'Siswa'}
                          </>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {!item.isAnonymous && item.pengirimKelas && <span className="mr-2 font-medium">{item.pengirimKelas}</span>}
                        <span>{item.tanggal} • {item.waktu}</span>
                      </div>
                    </td>

                    {/* Kategori & Rating */}
                    <td className="py-4 px-4 align-top">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200/50 dark:border-amber-800/50 mb-1.5">
                        {item.kategori}
                      </span>
                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(item.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">{item.rating || 5}/5</span>
                      </div>
                    </td>

                    {/* Topik & Isi Pesan */}
                    <td className="py-4 px-4 align-top max-w-xs">
                      <div className="font-bold text-slate-900 dark:text-white text-sm mb-1 line-clamp-1">{item.judul}</div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{item.pesan}</p>
                    </td>

                    {/* Status & Tindak Lanjut */}
                    <td className="py-4 px-4 align-top">
                      <div className="space-y-1.5">
                        <select
                          value={item.status}
                          onChange={(e: any) => handleStatusChange(item.id, e.target.value)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${
                            item.status === 'Baru'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                              : item.status === 'Dibaca'
                              ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800'
                              : item.status === 'Diproses'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                          }`}
                        >
                          <option value="Baru">Baru</option>
                          <option value="Dibaca">Dibaca</option>
                          <option value="Diproses">Diproses</option>
                          <option value="Selesai / Diterapkan">Selesai / Diterapkan</option>
                        </select>

                        {item.catatanGuru && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-1">
                            💬 Catatan: {item.catatanGuru}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Aksi */}
                    <td className="py-4 px-4 align-top text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setActionNotes(item.catatanGuru || '');
                            setShowDetailModal(true);
                          }}
                          title="Lihat Detail & Catatan Guru"
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          title="Hapus Saran"
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* QR Code & Link Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 sm:p-8 relative text-center">
            
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Scan QR Code Kotak Saran</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Bagikan QR code ini atau salin tautan agar siswa dapat mengirim saran dan masukan langsung dari HP mereka.
            </p>

            {/* QR Code Simulation Box */}
            <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-700 inline-block mb-6 shadow-sm">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(studentPortalUrl)}`}
                alt="QR Code Portal Saran"
                className="w-44 h-44 mx-auto rounded-xl"
              />
              <p className="text-[10px] font-mono text-slate-400 mt-2">Portal Aspirasi Siswa</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={studentPortalUrl}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 outline-none font-mono"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 flex-shrink-0 transition-all"
                >
                  <Copy className="w-3.5 h-3.5" /> {copied ? 'Tersalin!' : 'Salin'}
                </button>
              </div>

              <a
                href={studentPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Buka Tautan di Tab Baru
              </a>
            </div>

          </div>
        </div>
      )}

      {/* Detail & Action Notes Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-xl w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setShowDetailModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                <Lightbulb className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200/50">
                  {selectedItem.kategori}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{selectedItem.judul}</h3>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Pengirim</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedItem.isAnonymous ? '🔒 Anonim (Rahasia)' : selectedItem.pengirimNama}
                  </p>
                  {!selectedItem.isAnonymous && <p className="text-xs text-slate-500">{selectedItem.pengirimKelas}</p>}
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Waktu & Rating</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedItem.tanggal} • {selectedItem.waktu}</p>
                  <div className="flex items-center gap-1 text-amber-400 mt-0.5">
                    {[...Array(selectedItem.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">{selectedItem.rating || 5}/5</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Isi Saran / Aspirasi</span>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
                  {selectedItem.pesan}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Catatan Tindak Lanjut Guru / Manajemen
                </label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan catatan tindak lanjut, koordinasi, atau aksi nyata dari sekolah..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveNotes(selectedItem.id)}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 transition-all"
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
