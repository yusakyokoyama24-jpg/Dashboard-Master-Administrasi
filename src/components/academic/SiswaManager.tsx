import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { Search, Plus, FileSpreadsheet, Download, Trash2, Edit3, UserCheck, Phone, MapPin, FileDown, CheckCircle, X, AlertCircle, LayoutGrid, List, Users, GraduationCap } from 'lucide-react';
import { Siswa } from '../../types';
import { dbService } from '../../services/db';
import { exportService } from '../../services/export';
import { showToast } from '../../utils/toast';

interface SiswaManagerProps {
  siswaList: Siswa[];
  onOpenCardPrinter: (siswaId?: string) => void;
}

export const SiswaManager: React.FC<SiswaManagerProps> = ({ siswaList, onOpenCardPrinter }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewModeSiswa, setViewModeSiswa] = useState<'grid' | 'table'>('grid');

  // Excel Import Preview state
  const [previewImportList, setPreviewImportList] = useState<Partial<Siswa>[]>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const [formData, setFormData] = useState<Partial<Siswa>>({
    nisn: '',
    nama: '',
    kelas: 'X RPL 1',
    jenisKelamin: 'L',
    noHpOrtu: '',
    alamat: '',
  });

  const kelasList = Array.from(new Set(siswaList.map((s) => s.kelas))).sort();

  const filtered = siswaList.filter((s) => {
    const matchClass = selectedKelas === 'all' || s.kelas === selectedKelas;
    const matchSearch =
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm) ||
      s.alamat.toLowerCase().includes(searchTerm.toLowerCase());
    return matchClass && matchSearch;
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      nisn: '',
      nama: '',
      kelas: selectedKelas !== 'all' ? selectedKelas : 'X RPL 1',
      jenisKelamin: 'L',
      noHpOrtu: '',
      alamat: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (siswa: Siswa) => {
    setEditingId(siswa.id);
    setFormData(siswa);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, nama: string) => {
    Swal.fire({
      title: 'Hapus Data Siswa?',
      text: `Apakah Anda yakin ingin menghapus siswa ${nama}? Data ini tidak dapat dikembalikan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    }).then((result) => {
      if (result.isConfirmed) {
        dbService.deleteSiswa(id);
        showToast('Data Siswa Dihapus', 'success', `Siswa ${nama} berhasil dihapus.`);
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nisn || !formData.nama || !formData.kelas) {
      showToast('Data Belum Lengkap', 'warning', 'NISN, Nama Lengkap, dan Kelas wajib diisi!');
      return;
    }

    const item: Siswa = {
      id: editingId || `s_${Date.now()}`,
      nisn: formData.nisn.trim(),
      nama: formData.nama.trim(),
      kelas: formData.kelas.trim(),
      jenisKelamin: formData.jenisKelamin || 'L',
      noHpOrtu: formData.noHpOrtu?.trim() || '',
      alamat: formData.alamat?.trim() || '',
      foto: formData.foto?.trim() || '',
      statusKartu: 'Aktif',
      userId: 'master_guru_default',
    };

    dbService.saveSiswa(item);
    setIsModalOpen(false);
    showToast(
      editingId ? 'Data Siswa Diperbarui!' : 'Siswa Baru Ditambahkan!',
      'success',
      `${item.nama} (${item.kelas})`
    );
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setIsImporting(true);

    try {
      const defaultKls = selectedKelas !== 'all' ? selectedKelas : 'X RPL 1';
      const parsed = await exportService.parseSiswaExcel(file, defaultKls);

      if (parsed.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Tidak Ada Siswa Ditemukan',
          html: `<p class="text-sm">File <b>${file.name}</b> dibaca, namun tidak ditemukan kolom nama siswa yang valid.</p>
                 <p class="text-xs text-slate-500 mt-2">Pastikan file memiliki header kolom seperti <b>Nama</b>, <b>Nama Lengkap</b>, atau gunakan tombol <b>Unduh Template</b>.</p>`,
        });
        return;
      }

      setPreviewImportList(parsed);
      setIsPreviewModalOpen(true);
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Membaca File Excel',
        html: `<p class="text-sm">Terjadi kesalahan saat memproses file <b>${file.name}</b>.</p>
               <p class="text-xs text-red-500 mt-1">${err?.message || 'Format tidak didukung'}</p>
               <p class="text-xs text-slate-500 mt-2">Format yang didukung: .xlsx, .xls, .csv. Anda bisa mengunduh template resmi di tombol 'Template Excel'.</p>`,
      });
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (previewImportList.length === 0) return;

    const formattedList: Siswa[] = previewImportList.map((p, idx) => ({
      id: `s_import_${Date.now()}_${idx}`,
      nisn: p.nisn || `00${Date.now()}${idx}`,
      nama: p.nama || 'Siswa Baru',
      kelas: p.kelas || (selectedKelas !== 'all' ? selectedKelas : 'X RPL 1'),
      jenisKelamin: p.jenisKelamin || 'L',
      noHpOrtu: p.noHpOrtu || '',
      alamat: p.alamat || '',
      statusKartu: 'Aktif',
      userId: 'master_guru_default',
    }));

    dbService.bulkImportSiswa(formattedList);
    setIsPreviewModalOpen(false);
    setPreviewImportList([]);

    Swal.fire({
      icon: 'success',
      title: 'Impor Berhasil!',
      text: `Sebanyak ${formattedList.length} data siswa berhasil dimasukkan ke database sistem.`,
      timer: 2500,
      showConfirmButton: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Cyan Color Template Notice Banner */}
      <div className="p-4 rounded-2xl border-2 border-cyan-400 dark:border-cyan-800 bg-cyan-50/80 dark:bg-cyan-950/40 text-cyan-950 dark:text-cyan-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-cyan-600 text-white shadow-xs">
            TEMPLATE WARNA: CYAN / BIRU SAMUDERA (PESERTA DIDIK)
          </span>
          <span className="text-xs font-bold">
            Kelola Master Data Siswa, NISN, Excel & Kartu Pelajar
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" title="Peserta Didik (Aktif)"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 opacity-60" title="Materi Pelajaran"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 opacity-60" title="Jadwal KBM"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 opacity-60" title="Kehadiran Siswa"></span>
          <span className="text-slate-500 dark:text-slate-400 ml-1 font-sans text-xs">Template Cyan Aktif</span>
        </div>
      </div>

      {/* Top Banner Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border-2 border-cyan-200 dark:border-cyan-900/50 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Manajemen Data Peserta Didik
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola data induk siswa, impor/ekspor data Excel, dan cetak kartu pelajar otomatis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Unduh Template Excel */}
          <button
            onClick={() => exportService.downloadTemplateSiswaExcel()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs transition-all"
            title="Unduh format tabel Excel resmi untuk pengisian data peserta didik"
          >
            <FileDown className="w-4 h-4 text-emerald-600" />
            Template Excel
          </button>

          {/* File Upload input */}
          <label className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition-all active:scale-95">
            <FileSpreadsheet className="w-4 h-4" />
            {isImporting ? 'Membaca File...' : 'Impor File Excel'}
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleImportExcel} disabled={isImporting} className="hidden" />
          </label>

          <button
            onClick={() => exportService.exportSiswaToExcel(filtered, `Data_Siswa_${selectedKelas}.xlsx`)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all"
          >
            <Download className="w-4 h-4" />
            Ekspor Excel
          </button>

          <button
            onClick={() => onOpenCardPrinter()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
          >
            📇 Cetak Kartu QR
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Siswa
          </button>
        </div>
      </div>

      {/* Summary Kotak Peserta Didik (Cyan Theme) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-50 via-white to-cyan-100/60 dark:from-cyan-950/60 dark:via-slate-900 dark:to-cyan-900/30 border-2 border-cyan-300 dark:border-cyan-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-cyan-800 dark:text-cyan-300 uppercase tracking-wider block">
              Total Siswa
            </span>
            <span className="text-2xl font-black text-cyan-950 dark:text-white font-mono">
              {siswaList.length}
            </span>
          </div>
          <div className="p-2.5 bg-cyan-600 text-white rounded-xl shadow-md shadow-cyan-600/30">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 via-white to-sky-100/60 dark:from-sky-950/60 dark:via-slate-900 dark:to-sky-900/30 border-2 border-sky-300 dark:border-sky-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider block">
              Siswa Laki-laki
            </span>
            <span className="text-2xl font-black text-sky-950 dark:text-white font-mono">
              {siswaList.filter((s) => s.jenisKelamin === 'L').length}
            </span>
          </div>
          <div className="p-2.5 bg-sky-600 text-white rounded-xl shadow-md shadow-sky-600/30 font-black text-xs">
            L
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50 via-white to-teal-100/60 dark:from-teal-950/60 dark:via-slate-900 dark:to-teal-900/30 border-2 border-teal-300 dark:border-teal-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider block">
              Siswi Perempuan
            </span>
            <span className="text-2xl font-black text-teal-950 dark:text-white font-mono">
              {siswaList.filter((s) => s.jenisKelamin === 'P').length}
            </span>
          </div>
          <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-md shadow-teal-600/30 font-black text-xs">
            P
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 via-white to-blue-100/60 dark:from-blue-950/60 dark:via-slate-900 dark:to-blue-900/30 border-2 border-blue-300 dark:border-blue-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider block">
              Total Rombel
            </span>
            <span className="text-2xl font-black text-blue-950 dark:text-white font-mono">
              {kelasList.length} Kelas
            </span>
          </div>
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-600/30">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border-2 border-cyan-200 dark:border-cyan-900/40">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-cyan-600" />
          <input
            type="text"
            placeholder="Cari berdasarkan NISN, Nama Siswa, atau Alamat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2">
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200"
          >
            <option value="all">Semua Rombel/Kelas ({siswaList.length})</option>
            {kelasList.map((k) => (
              <option key={k} value={k}>
                {k} ({siswaList.filter((s) => s.kelas === k).length})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-lg">
            <button
              onClick={() => setViewModeSiswa('grid')}
              className={`p-1.5 rounded-md transition-all ${
                viewModeSiswa === 'grid'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
              title="Tampilan Kotak Kartu"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewModeSiswa('table')}
              className={`p-1.5 rounded-md transition-all ${
                viewModeSiswa === 'table'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
              title="Tampilan Tabel"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* View Mode 1: Kotak Kartu Siswa (Cyan Theme Grid) */}
      {viewModeSiswa === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-cyan-200 dark:border-cyan-900/40">
              Tidak ada data siswa ditemukan.
            </div>
          ) : (
            filtered.map((s) => (
              <div
                key={s.id}
                className="bg-gradient-to-br from-cyan-50/80 via-white to-sky-50/40 dark:from-cyan-950/50 dark:via-slate-900 dark:to-cyan-900/20 border-2 border-cyan-300 dark:border-cyan-800/80 p-5 rounded-2xl shadow-xs hover:shadow-md hover:border-cyan-500 transition-all space-y-3.5 group relative"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                      {s.nama.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug line-clamp-1">
                        {s.nama}
                      </h4>
                      <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-400">
                        NISN: {s.nisn}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                    s.jenisKelamin === 'L' ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300' : 'bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300'
                  }`}>
                    {s.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-cyan-200/60 dark:border-cyan-900/40">
                  <span className="px-2.5 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-extrabold text-xs">
                    {s.kelas}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <Phone className="w-3 h-3 text-cyan-600" />
                    <span>{s.noHpOrtu || '-'}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                  <MapPin className="w-3 h-3 text-cyan-600 shrink-0" />
                  <span className="truncate">{s.alamat || 'Alamat belum diisi'}</span>
                </div>

                <div className="pt-2 border-t border-cyan-200/60 dark:border-cyan-900/40 flex items-center justify-between">
                  <button
                    onClick={() => onOpenCardPrinter(s.id)}
                    className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1"
                  >
                    📇 Cetak Kartu
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="p-1.5 text-cyan-700 hover:text-cyan-900 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-950/50 rounded-lg transition-colors"
                      title="Edit Siswa"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.nama)}
                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                      title="Hapus Siswa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Students Data Table View (Cyan Theme) */
        <div className="bg-white dark:bg-slate-900 border-2 border-cyan-300 dark:border-cyan-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gradient-to-r from-cyan-800 via-sky-800 to-blue-800 text-white">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">NISN</th>
                  <th className="py-3 px-4">Nama Lengkap Siswa</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4 text-center">L/P</th>
                  <th className="py-3 px-4">Kontak Orang Tua</th>
                  <th className="py-3 px-4">Alamat</th>
                  <th className="py-3 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-100 dark:divide-cyan-900/30 text-slate-700 dark:text-slate-300">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Tidak ada data siswa ditemukan.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-cyan-50/50 dark:hover:bg-cyan-950/30 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-xs">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-cyan-700 dark:text-cyan-400">{s.nisn}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-xs font-bold">
                          {s.nama.charAt(0)}
                        </div>
                        {s.nama}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-cyan-50 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                          {s.kelas}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span className={s.jenisKelamin === 'L' ? 'text-sky-600' : 'text-pink-600'}>
                          {s.jenisKelamin}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          <Phone className="w-3.5 h-3.5 text-cyan-600" />
                          {s.noHpOrtu || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {s.alamat || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onOpenCardPrinter(s.id)}
                            className="px-2 py-1 bg-cyan-100 hover:bg-cyan-200 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                            title="Cetak & Lihat Kartu Siswa"
                          >
                            📇 Kartu
                          </button>
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 text-cyan-700 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-lg transition-colors"
                            title="Edit Siswa"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id, s.nama)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Siswa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingId ? 'Edit Data Peserta Didik' : 'Tambah Peserta Didik Baru'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    NISN *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nisn || ''}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                    placeholder="Contoh: 0078129341"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rombel / Kelas *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.kelas || ''}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                    placeholder="Contoh: X RPL 1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap Siswa *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama || ''}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  placeholder="Nama Lengkap sesuai Akta / Ijazah"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={formData.jenisKelamin || 'L'}
                    onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    No. HP Orang Tua / Wali
                  </label>
                  <input
                    type="text"
                    value={formData.noHpOrtu || ''}
                    onChange={(e) => setFormData({ ...formData, noHpOrtu: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                    placeholder="Contoh: 08123456789"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat Tempat Tinggal
                </label>
                <textarea
                  rows={2}
                  value={formData.alamat || ''}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  placeholder="Jalan, RT/RW, Kelurahan, Kecamatan"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Foto Kartu Siswa (URL Gambar)
                </label>
                <input
                  type="url"
                  value={formData.foto || ''}
                  onChange={(e) => setFormData({ ...formData, foto: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                  placeholder="Tempelkan URL foto siswa (https://...)"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow"
                >
                  Simpan Data Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PRATINJAU IMPOR EXCEL SISWA */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Pratinjau Impor Data Siswa
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold">
                      {previewImportList.length} Siswa Ditemukan
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Berkas: <span className="font-semibold text-slate-700 dark:text-slate-300">{importFileName}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info notice */}
            <div className="px-5 py-3 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/50 flex items-center gap-2 text-xs text-blue-800 dark:text-blue-300">
              <CheckCircle className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <span>
                Nama siswa berhasil diekstrak dengan akurat. NISN kosong otomatis dilengkapi secara unik. Klik konfirmasi di bawah untuk menyimpan.
              </span>
            </div>

            {/* Table Preview */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5 text-center w-12">No</th>
                      <th className="p-2.5">NISN</th>
                      <th className="p-2.5">Nama Peserta Didik</th>
                      <th className="p-2.5">Kelas</th>
                      <th className="p-2.5 text-center">L/P</th>
                      <th className="p-2.5">No. HP Ortu</th>
                      <th className="p-2.5">Alamat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {previewImportList.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2.5 font-mono font-medium text-blue-600 dark:text-blue-400">
                          {s.nisn}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                          {s.nama}
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                            {s.kelas}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-md font-bold ${s.jenisKelamin === 'P' ? 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'}`}>
                            {s.jenisKelamin}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400">
                          {s.noHpOrtu || '-'}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {s.alamat || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Total: <b className="text-slate-900 dark:text-white">{previewImportList.length}</b> siswa siap disimpan.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  Konfirmasi & Simpan ke Database ({previewImportList.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
