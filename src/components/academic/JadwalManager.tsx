import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { Calendar, Plus, BookOpen, Clock, Trash2, Edit2, Layers, MapPin, Sparkles, LayoutGrid, List } from 'lucide-react';
import { Mapel, Jadwal, Siswa } from '../../types';
import { dbService } from '../../services/db';
import { showToast } from '../../utils/toast';

interface JadwalManagerProps {
  mapelList: Mapel[];
  jadwalList: Jadwal[];
  siswaList?: Siswa[];
  initialTab?: 'jadwal' | 'mapel';
}

export const JadwalManager: React.FC<JadwalManagerProps> = ({
  mapelList,
  jadwalList,
  siswaList,
  initialTab = 'jadwal',
}) => {
  const [activeTab, setActiveTab] = useState<'jadwal' | 'mapel'>(initialTab);
  const [viewModeMapel, setViewModeMapel] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Mapel modal state
  const [isMapelModalOpen, setIsMapelModalOpen] = useState(false);
  const [editingMapelId, setEditingMapelId] = useState<string | null>(null);
  const [mapelForm, setMapelForm] = useState<Partial<Mapel>>({
    kode: '',
    nama: '',
    tingkat: 'Kelas X',
    jamPerMinggu: 4,
  });

  // Jadwal modal state
  const [isJadwalModalOpen, setIsJadwalModalOpen] = useState(false);
  const [editingJadwalId, setEditingJadwalId] = useState<string | null>(null);
  const [isCustomKelas, setIsCustomKelas] = useState(false);
  const [jadwalForm, setJadwalForm] = useState<Partial<Jadwal>>({
    hari: 'Senin',
    jamKe: 'Jam Ke 1-3 (07.00 - 09.15)',
    mapelId: '',
    namaMapel: '',
    kelas: 'X RPL 1',
    ruang: 'Lab Komputer 1',
  });

  // Daftar kelas / rombel yang diambil otomatis dari data siswa & jadwal
  const availableKelas = useMemo(() => {
    const listSiswa = siswaList && siswaList.length > 0 ? siswaList : dbService.getSiswa();
    const fromSiswa = listSiswa.map((s) => s.kelas?.trim()).filter(Boolean);
    const fromJadwal = (jadwalList || []).map((j) => j.kelas?.trim()).filter(Boolean);
    const defaultPresets = [
      'X RPL 1',
      'X RPL 2',
      'XI RPL 1',
      'XI RPL 2',
      'XII RPL 1',
      'XII RPL 2',
    ];
    const currentKelas = jadwalForm.kelas?.trim();
    const extra = currentKelas ? [currentKelas] : [];
    const unique = Array.from(new Set([...fromSiswa, ...fromJadwal, ...defaultPresets, ...extra]))
      .filter((k): k is string => Boolean(k))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    return unique;
  }, [siswaList, jadwalList, jadwalForm.kelas]);

  const HARI_LIST: ('Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu')[] = [
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
  ];

  // Mapel Handlers
  const handleOpenAddMapel = () => {
    setEditingMapelId(null);
    setMapelForm({ kode: '', nama: '', tingkat: 'Kelas X', jamPerMinggu: 4 });
    setIsMapelModalOpen(true);
  };

  const handleOpenEditMapel = (m: Mapel) => {
    setEditingMapelId(m.id);
    setMapelForm(m);
    setIsMapelModalOpen(true);
  };

  const handleDeleteMapel = (id: string, nama: string) => {
    Swal.fire({
      title: 'Hapus Mata Pelajaran?',
      text: `Hapus mapel "${nama}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus',
    }).then((res) => {
      if (res.isConfirmed) {
        dbService.deleteMapel(id);
        showToast('Terhapus', 'success', `Mata pelajaran ${nama} berhasil dihapus.`);
      }
    });
  };

  const handleSubmitMapel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapelForm.kode || !mapelForm.nama) {
      showToast('Peringatan', 'warning', 'Kode dan Nama Mapel wajib diisi!');
      return;
    }
    const item: Mapel = {
      id: editingMapelId || `m_${Date.now()}`,
      kode: mapelForm.kode.trim(),
      nama: mapelForm.nama.trim(),
      tingkat: mapelForm.tingkat?.trim() || 'Kelas X',
      jamPerMinggu: Number(mapelForm.jamPerMinggu) || 4,
      userId: 'master_guru_default',
    };
    dbService.saveMapel(item);
    setIsMapelModalOpen(false);
    showToast('Berhasil', 'success', `Mata Pelajaran ${item.nama} disimpan!`);
  };

  // Jadwal Handlers
  const handleOpenAddJadwal = (prefillHari?: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu') => {
    setEditingJadwalId(null);
    setIsCustomKelas(false);
    const firstMapel = mapelList[0];
    const defaultKelas = availableKelas[0] || 'X RPL 1';
    setJadwalForm({
      hari: prefillHari || 'Senin',
      jamKe: 'Jam Ke 1-3 (07.00 - 09.15)',
      mapelId: firstMapel?.id || '',
      namaMapel: firstMapel?.nama || '',
      kelas: defaultKelas,
      ruang: 'Lab Komputer',
    });
    setIsJadwalModalOpen(true);
  };

  const handleOpenEditJadwal = (j: Jadwal) => {
    setEditingJadwalId(j.id);
    setIsCustomKelas(false);
    setJadwalForm(j);
    setIsJadwalModalOpen(true);
  };

  const handleDeleteJadwal = (id: string) => {
    Swal.fire({
      title: 'Hapus Sesi Jadwal?',
      text: 'Hapus sesi jadwal mengajar ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus',
    }).then((res) => {
      if (res.isConfirmed) {
        dbService.deleteJadwal(id);
        showToast('Terhapus', 'success', 'Jadwal mengajar berhasil dihapus.');
      }
    });
  };

  const handleSubmitJadwal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jadwalForm.mapelId || !jadwalForm.kelas || !jadwalForm.jamKe) {
      showToast('Peringatan', 'warning', 'Mapel, Kelas, dan Jam mengajar wajib diisi!');
      return;
    }
    const mapelObj = mapelList.find((m) => m.id === jadwalForm.mapelId);
    const item: Jadwal = {
      id: editingJadwalId || `j_${Date.now()}`,
      hari: jadwalForm.hari || 'Senin',
      jamKe: jadwalForm.jamKe.trim(),
      mapelId: jadwalForm.mapelId,
      namaMapel: mapelObj ? mapelObj.nama : (jadwalForm.namaMapel || 'Mapel'),
      kelas: jadwalForm.kelas.trim(),
      ruang: jadwalForm.ruang?.trim() || 'Kelas',
      userId: 'master_guru_default',
    };
    dbService.saveJadwal(item);
    setIsJadwalModalOpen(false);
    showToast('Berhasil', 'success', `Sesi jadwal ${item.namaMapel} (${item.kelas}) berhasil disimpan!`);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Color Template Notice Banner */}
      <div className={`p-4 rounded-2xl border-2 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        activeTab === 'jadwal'
          ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-400 dark:border-rose-800 text-rose-950 dark:text-rose-100'
          : 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-400 dark:border-purple-800 text-purple-950 dark:text-purple-100'
      }`}>
        <div className="flex items-center gap-2.5">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-white shadow-xs ${
            activeTab === 'jadwal' ? 'bg-rose-600' : 'bg-purple-600'
          }`}>
            {activeTab === 'jadwal' ? 'TEMPLATE WARNA: ROSE (JADWAL)' : 'TEMPLATE WARNA: UNGU (MATERI PELAJARAN)'}
          </span>
          <span className="text-xs font-bold">
            {activeTab === 'jadwal' ? 'Manajemen Sesi Jam KBM & Kelas Harian' : 'Manajemen Materi & Alokasi Jam Pelajaran'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" title="Peserta Didik"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" title="Materi Pelajaran"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" title="Jadwal KBM"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Kehadiran Siswa"></span>
          <span className="text-slate-500 dark:text-slate-400 ml-1 font-sans text-xs">4 Template Warna Akademik</span>
        </div>
      </div>

      {/* Tab Switcher & Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('jadwal')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'jadwal'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            📅 Jadwal Pelajaran (Rose)
          </button>
          <button
            onClick={() => setActiveTab('mapel')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'mapel'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            📚 Materi & Mata Pelajaran (Ungu)
          </button>
        </div>

        <div>
          {activeTab === 'jadwal' ? (
            <button
              onClick={() => handleOpenAddJadwal()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Tambah Sesi Jadwal
            </button>
          ) : (
            <button
              onClick={handleOpenAddMapel}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Tambah Mata Pelajaran
            </button>
          )}
        </div>
      </div>

      {/* View 1: Jadwal Mingguan Visual Grid (Kotak Tema Rose) */}
      {activeTab === 'jadwal' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {HARI_LIST.map((hari) => {
            const sessions = jadwalList.filter((j) => j.hari === hari);
            return (
              <div
                key={hari}
                className="bg-white dark:bg-slate-900 border-2 border-rose-300 dark:border-rose-900/80 rounded-2xl overflow-hidden shadow-sm flex flex-col"
              >
                {/* Header Kotak Hari (Rose) */}
                <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-pink-700 text-white px-4 py-3 flex items-center justify-between border-b-2 border-rose-400 shadow-xs">
                  <h3 className="font-extrabold text-sm tracking-wide flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-white drop-shadow-xs" />
                    {hari}
                  </h3>
                  <span className="text-xs bg-white/20 text-white px-2.5 py-0.5 rounded-full font-mono font-bold shadow-xs">
                    {sessions.length} Kelas
                  </span>
                </div>

                {/* Session Kotak Cards (Rose Themed) */}
                <div className="p-4 space-y-3 flex-1 bg-rose-50/30 dark:bg-slate-900/40">
                  {sessions.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Tidak ada jadwal mengajar pada hari {hari}.
                      <button
                        onClick={() => handleOpenAddJadwal(hari)}
                        className="block mx-auto mt-2 text-rose-600 hover:text-rose-700 hover:underline font-bold"
                      >
                        + Tambah Jam Mengajar
                      </button>
                    </div>
                  ) : (
                    sessions.map((s) => (
                      <div
                        key={s.id}
                        className="bg-gradient-to-br from-rose-50/80 via-white to-pink-50/50 dark:from-rose-950/40 dark:via-slate-800 dark:to-rose-900/20 border-2 border-rose-200 dark:border-rose-800/70 p-3.5 rounded-xl shadow-xs space-y-2 relative group hover:border-rose-500 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-xs font-black px-2.5 py-0.5 bg-rose-600 text-white rounded-md shadow-xs">
                            {s.kelas}
                          </span>
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                            <button
                              onClick={() => handleOpenEditJadwal(s)}
                              className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                              title="Edit Sesi"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteJadwal(s.id)}
                              className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                              title="Hapus Sesi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                            {s.namaMapel}
                          </h4>
                        </div>

                        <div className="flex items-center justify-between text-xs text-rose-800 dark:text-rose-300 pt-1 border-t border-rose-200/60 dark:border-rose-800/40 font-semibold">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-rose-500" />
                            {s.jamKe}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                            <MapPin className="w-3 h-3 text-rose-500" />
                            {s.ruang || 'Ruang Kelas'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View 2: Data Mata Pelajaran (Kotak Tema Ungu) */}
      {activeTab === 'mapel' && (
        <div className="space-y-4">
          {/* Summary Kotak Mapel (Ungu) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 via-white to-purple-100/60 dark:from-purple-950/60 dark:via-slate-900 dark:to-purple-900/30 border-2 border-purple-300 dark:border-purple-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block">
                  Total Mata Pelajaran
                </span>
                <span className="text-2xl font-black text-purple-950 dark:text-white font-mono">
                  {mapelList.length} Mapel
                </span>
              </div>
              <div className="p-3 bg-purple-600 text-white rounded-xl shadow-md shadow-purple-600/30">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-fuchsia-50 via-white to-fuchsia-100/60 dark:from-fuchsia-950/60 dark:via-slate-900 dark:to-fuchsia-900/30 border-2 border-fuchsia-300 dark:border-fuchsia-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-fuchsia-700 dark:text-fuchsia-300 uppercase tracking-wider block">
                  Total Beban Jam
                </span>
                <span className="text-2xl font-black text-fuchsia-950 dark:text-white font-mono">
                  {mapelList.reduce((acc, m) => acc + (m.jamPerMinggu || 0), 0)} JP/Minggu
                </span>
              </div>
              <div className="p-3 bg-fuchsia-600 text-white rounded-xl shadow-md shadow-fuchsia-600/30">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-indigo-100/60 dark:from-indigo-950/60 dark:via-slate-900 dark:to-indigo-900/30 border-2 border-indigo-300 dark:border-indigo-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">
                  Format Tampilan Kotak
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <button
                    onClick={() => setViewModeMapel('grid')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      viewModeMapel === 'grid'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Kotak Grid
                  </button>
                  <button
                    onClick={() => setViewModeMapel('table')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      viewModeMapel === 'table'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Tabel
                  </button>
                </div>
              </div>
              <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/30">
                <LayoutGrid className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Kotak Cards Grid View (Ungu) */}
          {viewModeMapel === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mapelList.map((m) => (
                <div
                  key={m.id}
                  className="bg-gradient-to-br from-purple-50/80 via-white to-fuchsia-50/40 dark:from-purple-950/50 dark:via-slate-900 dark:to-purple-900/20 border-2 border-purple-300 dark:border-purple-800 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-purple-500 transition-all space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-purple-600 text-white text-xs font-mono font-black shadow-xs">
                      {m.kode}
                    </span>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={() => handleOpenEditMapel(m)}
                        className="p-1.5 text-purple-700 hover:text-purple-900 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/50 rounded-lg transition-colors"
                        title="Edit Mapel"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMapel(m.id, m.nama)}
                        className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                        title="Hapus Mapel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">
                      {m.nama}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-purple-200/60 dark:border-purple-800/50">
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold">
                      {m.tingkat}
                    </span>
                    <span className="font-mono font-extrabold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/40 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                      {m.jamPerMinggu} JP/Minggu
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border-2 border-purple-300 dark:border-purple-800 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gradient-to-r from-purple-800 to-indigo-800 text-white">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Kode Mapel</th>
                    <th className="py-3 px-4">Nama Mata Pelajaran</th>
                    <th className="py-3 px-4">Tingkat / Fase</th>
                    <th className="py-3 px-4 text-center">Beban Jam / Minggu</th>
                    <th className="py-3 px-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100 dark:divide-purple-900/30 text-slate-700 dark:text-slate-300">
                  {mapelList.map((m, idx) => (
                    <tr key={m.id} className="hover:bg-purple-50/50 dark:hover:bg-purple-950/30">
                      <td className="py-3 px-4 text-center font-mono text-xs">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-bold text-purple-700 dark:text-purple-400">{m.kode}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-purple-600" />
                        {m.nama}
                      </td>
                      <td className="py-3 px-4">{m.tingkat}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-purple-800 dark:text-purple-200">
                        {m.jamPerMinggu} JP
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditMapel(m)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMapel(m.id, m.nama)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg"
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
      )}

      {/* Modal Add / Edit Mapel */}
      {isMapelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingMapelId ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
            </h3>
            <form onSubmit={handleSubmitMapel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kode Mapel *
                </label>
                <input
                  type="text"
                  required
                  value={mapelForm.kode || ''}
                  onChange={(e) => setMapelForm({ ...mapelForm, kode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  placeholder="Contoh: INF-X"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Mata Pelajaran *
                </label>
                <input
                  type="text"
                  required
                  value={mapelForm.nama || ''}
                  onChange={(e) => setMapelForm({ ...mapelForm, nama: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  placeholder="Contoh: Pemrograman Berorientasi Objek"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tingkat / Fase
                  </label>
                  <input
                    type="text"
                    value={mapelForm.tingkat || 'Kelas X'}
                    onChange={(e) => setMapelForm({ ...mapelForm, tingkat: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jam per Minggu (JP)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={mapelForm.jamPerMinggu || 4}
                    onChange={(e) => setMapelForm({ ...mapelForm, jamPerMinggu: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMapelModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow"
                >
                  Simpan Mapel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Jadwal */}
      {isJadwalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingJadwalId ? 'Edit Sesi Jadwal Mengajar' : 'Tambah Sesi Jadwal Mengajar'}
            </h3>
            <form onSubmit={handleSubmitJadwal} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hari *
                  </label>
                  <select
                    value={jadwalForm.hari}
                    onChange={(e) =>
                      setJadwalForm({
                        ...jadwalForm,
                        hari: e.target.value as 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu',
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  >
                    {HARI_LIST.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Kelas / Rombel *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomKelas(!isCustomKelas)}
                      className="text-[11px] text-rose-600 hover:text-rose-700 dark:text-rose-400 font-semibold hover:underline"
                    >
                      {isCustomKelas ? 'Pilih Dropdown' : '+ Input Manual'}
                    </button>
                  </div>
                  {isCustomKelas ? (
                    <input
                      type="text"
                      required
                      value={jadwalForm.kelas || ''}
                      onChange={(e) => setJadwalForm({ ...jadwalForm, kelas: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                      placeholder="Contoh: X RPL 1"
                      autoFocus
                    />
                  ) : (
                    <select
                      required
                      value={jadwalForm.kelas || ''}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomKelas(true);
                          setJadwalForm({ ...jadwalForm, kelas: '' });
                        } else {
                          setJadwalForm({ ...jadwalForm, kelas: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 font-medium"
                    >
                      <option value="">-- Pilih Kelas / Rombel --</option>
                      {availableKelas.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                      <option value="__custom__" className="text-rose-600 font-semibold">
                        + Tambah Rombel Baru (Ketik Manual)...
                      </option>
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mata Pelajaran *
                </label>
                <select
                  required
                  value={jadwalForm.mapelId || ''}
                  onChange={(e) => setJadwalForm({ ...jadwalForm, mapelId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                >
                  <option value="">-- Pilih Mata Pelajaran --</option>
                  {mapelList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama} ({m.kode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jam Ke / Waktu *
                  </label>
                  <input
                    type="text"
                    required
                    value={jadwalForm.jamKe || ''}
                    onChange={(e) => setJadwalForm({ ...jadwalForm, jamKe: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                    placeholder="Jam 1-3 (07.00 - 09.15)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ruangan / Lab
                  </label>
                  <input
                    type="text"
                    value={jadwalForm.ruang || ''}
                    onChange={(e) => setJadwalForm({ ...jadwalForm, ruang: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                    placeholder="Contoh: Lab Komputer 1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsJadwalModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
