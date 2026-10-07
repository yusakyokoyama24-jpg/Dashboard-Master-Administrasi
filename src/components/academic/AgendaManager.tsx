import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { BookMarked, Plus, Printer, Trash2, Edit3, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { Agenda, Pengaturan } from '../../types';
import { dbService } from '../../services/db';
import { showToast } from '../../utils/toast';

interface AgendaManagerProps {
  agendaList: Agenda[];
  pengaturan: Pengaturan;
}

export const AgendaManager: React.FC<AgendaManagerProps> = ({ agendaList, pengaturan }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Agenda>>({
    tanggal: new Date().toISOString().split('T')[0],
    jamKe: 'Jam Ke 1-3 (07.00 - 09.15)',
    kelas: 'X RPL 1',
    mapel: 'Informatika Dasar',
    materi: '',
    kegiatan: '',
    kendala: '',
    refleksi: '',
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      jamKe: 'Jam Ke 1-3 (07.00 - 09.15)',
      kelas: 'X RPL 1',
      mapel: pengaturan.mapelUtama.split('&')[0].trim(),
      materi: '',
      kegiatan: '',
      kendala: '',
      refleksi: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a: Agenda) => {
    setEditingId(a.id);
    setFormData(a);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Swal.fire({
      title: 'Hapus Jurnal Mengajar?',
      text: 'Catatan kegiatan agenda mengajar ini akan dihapus.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus',
    }).then((res) => {
      if (res.isConfirmed) {
        dbService.deleteAgenda(id);
        showToast('Jurnal Terhapus', 'success', 'Catatan agenda berhasil dihapus.');
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tanggal || !formData.kelas || !formData.materi) {
      showToast('Peringatan', 'warning', 'Tanggal, Kelas, dan Materi pokok wajib diisi!');
      return;
    }

    const item: Agenda = {
      id: editingId || `ag_${Date.now()}`,
      tanggal: formData.tanggal,
      jamKe: formData.jamKe?.trim() || '1-3',
      kelas: formData.kelas.trim(),
      mapel: formData.mapel?.trim() || pengaturan.mapelUtama,
      materi: formData.materi.trim(),
      kegiatan: formData.kegiatan?.trim() || '',
      kendala: formData.kendala?.trim() || '-',
      refleksi: formData.refleksi?.trim() || 'Pembelajaran tuntas sesuai target.',
      userId: 'master_guru_default',
    };

    dbService.saveAgenda(item);
    setIsModalOpen(false);
    showToast('Jurnal Tersimpan', 'success', `Jurnal mengajar kelas ${item.kelas} (${item.tanggal}) tersimpan!`);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-indigo-600" />
            Agenda Mengajar (Jurnal Harian Guru)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Dokumentasi pelaksanaan pembelajaran harian di kelas, kendala, refleksi, dan tindak lanjut.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium rounded-xl shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            Cetak Jurnal (Ctrl+P)
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Tulis Jurnal Baru
          </button>
        </div>
      </div>

      {/* Print Kop Surat (Only Visible in Print) */}
      <div className="hidden print:block text-center border-b-2 border-black pb-3 mb-6">
        <h3 className="font-bold text-base uppercase">{pengaturan.dinasPendidikan}</h3>
        <h2 className="font-extrabold text-lg uppercase tracking-wider">{pengaturan.namaSekolah}</h2>
        <p className="text-xs text-gray-600">{pengaturan.alamatSekolah} | Telp: {pengaturan.noTelpSekolah}</p>
        <div className="mt-3">
          <h4 className="font-bold text-sm uppercase underline">JURNAL AGENDA HARIAN GURU</h4>
          <p className="text-xs">Guru Pengampu: {pengaturan.namaGuru} | NIP: {pengaturan.nipGuru}</p>
        </div>
      </div>

      {/* Agenda List Cards */}
      <div className="space-y-4">
        {agendaList.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            Belum ada catatan jurnal harian guru. Klik "+ Tulis Jurnal Baru" untuk menambahkan.
          </div>
        ) : (
          agendaList.map((a) => (
            <div
              key={a.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3 avoid-break"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-mono text-xs font-semibold rounded-lg border border-blue-200 dark:border-blue-800">
                    <Calendar className="w-3.5 h-3.5" />
                    {a.tanggal}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-mono text-xs font-semibold rounded-lg border border-amber-200 dark:border-amber-800">
                    <Clock className="w-3.5 h-3.5" />
                    {a.jamKe}
                  </span>
                  <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold text-xs rounded-lg border border-emerald-200 dark:border-emerald-800">
                    {a.kelas}
                  </span>
                </div>

                <div className="flex items-center gap-2 no-print">
                  <button
                    onClick={() => handleOpenEdit(a)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                  {a.mapel} — <span className="text-blue-600 dark:text-blue-400">{a.materi}</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    📌 Kegiatan Pembelajaran:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{a.kegiatan || '-'}</p>
                </div>

                <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
                  <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Kendala / Hambatan:
                  </span>
                  <p className="text-amber-900/80 dark:text-amber-200/80 leading-relaxed">{a.kendala || '-'}</p>
                </div>

                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-200/50 dark:border-emerald-900/30">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                    💡 Refleksi & Tindak Lanjut:
                  </span>
                  <p className="text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed">{a.refleksi || '-'}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Add / Edit Agenda */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingId ? 'Edit Jurnal Agenda Mengajar' : 'Tulis Jurnal Mengajar Harian'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Pembelajaran *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal || ''}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jam Ke / Waktu *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.jamKe || ''}
                    onChange={(e) => setFormData({ ...formData, jamKe: e.target.value })}
                    placeholder="Contoh: Jam 1-3"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kelas / Rombel *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.kelas || ''}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mata Pelajaran *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.mapel || ''}
                    onChange={(e) => setFormData({ ...formData, mapel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Materi Pokok / Sub Topik *
                </label>
                <input
                  type="text"
                  required
                  value={formData.materi || ''}
                  onChange={(e) => setFormData({ ...formData, materi: e.target.value })}
                  placeholder="Contoh: Implementasi Percabangan Logika IF-ELSE"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kegiatan Pembelajaran yang Dilaksanakan
                </label>
                <textarea
                  rows={2}
                  value={formData.kegiatan || ''}
                  onChange={(e) => setFormData({ ...formData, kegiatan: e.target.value })}
                  placeholder="Apersepsi, demonstrasi konsep, praktikum kelompok, presentasi..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kendala / Masalah
                  </label>
                  <textarea
                    rows={2}
                    value={formData.kendala || ''}
                    onChange={(e) => setFormData({ ...formData, kendala: e.target.value })}
                    placeholder="Contoh: Koneksi internet lambat..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Refleksi & Tindak Lanjut
                  </label>
                  <textarea
                    rows={2}
                    value={formData.refleksi || ''}
                    onChange={(e) => setFormData({ ...formData, refleksi: e.target.value })}
                    placeholder="Contoh: 90% siswa tuntas praktikum..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow"
                >
                  Simpan Jurnal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
