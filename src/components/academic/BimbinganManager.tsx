import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { HeartHandshake, Plus, CheckCircle, Clock, Trash2, Edit3, UserCheck, ShieldAlert } from 'lucide-react';
import { Bimbingan, Siswa } from '../../types';
import { dbService } from '../../services/db';
import { showToast } from '../../utils/toast';

interface BimbinganManagerProps {
  bimbinganList: Bimbingan[];
  siswaList: Siswa[];
}

export const BimbinganManager: React.FC<BimbinganManagerProps> = ({ bimbinganList, siswaList }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'Proses' | 'Selesai'>('all');

  const [formData, setFormData] = useState<Partial<Bimbingan>>({
    tanggal: new Date().toISOString().split('T')[0],
    siswaId: '',
    catatanKasus: '',
    tindakLanjut: '',
    pihakTerlibat: 'Wali Kelas, Siswa, Guru BK',
    status: 'Proses',
  });

  const filtered = bimbinganList.filter((b) => {
    if (statusFilter === 'all') return true;
    return b.status === statusFilter;
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      siswaId: siswaList[0]?.id || '',
      catatanKasus: '',
      tindakLanjut: '',
      pihakTerlibat: 'Wali Kelas, Siswa, Orang Tua',
      status: 'Proses',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Bimbingan) => {
    setEditingId(b.id);
    setFormData(b);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Swal.fire({
      title: 'Hapus Catatan Bimbingan?',
      text: 'Catatan pembinaan ini akan dihapus permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus',
    }).then((res) => {
      if (res.isConfirmed) {
        dbService.deleteBimbingan(id);
        showToast('Terhapus', 'success', 'Catatan bimbingan berhasil dihapus.');
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.siswaId || !formData.catatanKasus) {
      showToast('Peringatan', 'warning', 'Siswa dan Catatan Pembinaan wajib diisi!');
      return;
    }

    const studentObj = siswaList.find((s) => s.id === formData.siswaId);
    const item: Bimbingan = {
      id: editingId || `b_${Date.now()}`,
      tanggal: formData.tanggal || new Date().toISOString().split('T')[0],
      siswaId: formData.siswaId,
      namaSiswa: studentObj?.nama || 'Siswa',
      kelas: studentObj?.kelas || 'X RPL 1',
      catatanKasus: formData.catatanKasus.trim(),
      tindakLanjut: formData.tindakLanjut?.trim() || 'Dalam pemantauan wali kelas.',
      pihakTerlibat: formData.pihakTerlibat?.trim() || 'Wali Kelas',
      status: formData.status || 'Proses',
      userId: 'master_guru_default',
    };

    dbService.saveBimbingan(item);
    setIsModalOpen(false);
    showToast('Bimbingan Tersimpan', 'success', `Catatan bimbingan untuk ${item.namaSiswa} berhasil disimpan.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-rose-500" />
            Bimbingan Konseling & Pembinaan Siswa (Wali Kelas / BK)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Catatan pembinaan karakter, penyelesaian masalah peserta didik, dan koordinasi dengan orang tua.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
          >
            <option value="all">Semua Status ({bimbinganList.length})</option>
            <option value="Proses">Sedang Berjalan (Proses)</option>
            <option value="Selesai">Tuntas (Selesai)</option>
          </select>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah Pembinaan
          </button>
        </div>
      </div>

      {/* Counseling Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            Tidak ada rekam bimbingan konseling pada kategori ini.
          </div>
        ) : (
          filtered.map((b) => (
            <div
              key={b.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3 relative flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {b.namaSiswa}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                      {b.kelas}
                    </span>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                      b.status === 'Selesai'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                    }`}
                  >
                    {b.status === 'Selesai' ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    {b.status}
                  </span>
                </div>

                <div className="text-xs text-slate-500 font-mono">Tanggal: {b.tanggal}</div>

                <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300 block mb-1">
                    ⚠️ Catatan Masalah / Perilaku:
                  </span>
                  <p className="text-xs text-rose-900/90 dark:text-rose-200/90 leading-relaxed">
                    {b.catatanKasus}
                  </p>
                </div>

                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                  <span className="text-xs font-bold text-blue-800 dark:text-blue-300 block mb-1">
                    🌱 Solusi & Tindak Lanjut:
                  </span>
                  <p className="text-xs text-blue-900/90 dark:text-blue-200/90 leading-relaxed">
                    {b.tindakLanjut}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span>Pihak: {b.pihakTerlibat || 'Wali Kelas'}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Add / Edit Bimbingan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingId ? 'Edit Catatan Pembinaan' : 'Tambah Rekam Bimbingan Siswa'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal *
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
                    Status Kasus
                  </label>
                  <select
                    value={formData.status || 'Proses'}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as 'Proses' | 'Selesai' })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  >
                    <option value="Proses">Sedang Berjalan (Proses)</option>
                    <option value="Selesai">Tuntas (Selesai)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Peserta Didik *
                </label>
                <select
                  required
                  value={formData.siswaId || ''}
                  onChange={(e) => setFormData({ ...formData, siswaId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {siswaList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.kelas})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Permasalahan / Perilaku yang Dibina *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.catatanKasus || ''}
                  onChange={(e) => setFormData({ ...formData, catatanKasus: e.target.value })}
                  placeholder="Deskripsikan masalah, kendala akademik, atau pelanggaran tata tertib..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tindakan Pembinaan & Kesepakatan
                </label>
                <textarea
                  rows={2}
                  value={formData.tindakLanjut || ''}
                  onChange={(e) => setFormData({ ...formData, tindakLanjut: e.target.value })}
                  placeholder="Langkah konseling, komitmen perbaikan, jadwal pemanggilan wali murid..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pihak yang Terlibat
                </label>
                <input
                  type="text"
                  value={formData.pihakTerlibat || ''}
                  onChange={(e) => setFormData({ ...formData, pihakTerlibat: e.target.value })}
                  placeholder="Contoh: Wali Kelas, Siswa, Guru BK, Orang Tua"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                />
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
                  Simpan Bimbingan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
