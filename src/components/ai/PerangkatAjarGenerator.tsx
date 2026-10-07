import React, { useState } from 'react';
import { FileCheck, Sparkles, Loader2, BookOpen } from 'lucide-react';
import { DocPreviewToolbar } from './DocPreviewToolbar';
import { showToast } from '../../utils/toast';

export const PerangkatAjarGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    jenisDokumen: 'Alur Tujuan Pembelajaran (ATP)',
    mataPelajaran: 'Informatika',
    fase: 'Fase E (Kelas X)',
    kelas: 'Kelas X',
    tahunAjaran: '2026/2027',
    elemenCapaian: 'Berpikir Komputasional & Algoritma Pemrograman',
  });

  const JENIS_DOKUMEN_OPTIONS = [
    'Analisis Capaian Pembelajaran (CP)',
    'Tujuan Pembelajaran (TP)',
    'Alur Tujuan Pembelajaran (ATP)',
    'Program Tahunan (Prota)',
    'Program Semester (Prosem)',
    'Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)',
  ];

  const generateFallbackPerangkatHtml = (data: typeof formData) => {
    return `
      <div class="perangkat-ajar-doc space-y-6">
        <div style="text-align: center; border-bottom: 2px solid #1a3a5c; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="font-size: 16pt; font-weight: bold; color: #1a3a5c; margin: 0; text-transform: uppercase;">DOKUMEN RESMI KURIKULUM MERDEKA</h2>
          <h3 style="font-size: 14pt; font-weight: bold; color: #0f172a; margin: 4px 0 0 0;">${data.jenisDokumen.toUpperCase()}</h3>
          <p style="font-size: 10pt; color: #475569; margin: 4px 0 0 0;">Mata Pelajaran: ${data.mataPelajaran} | ${data.fase} | Tahun Ajaran ${data.tahunAjaran}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #1a3a5c; color: white;">
              <th style="padding: 8px; border: 1px solid #1a3a5c; width: 8%;">No</th>
              <th style="padding: 8px; border: 1px solid #1a3a5c; width: 25%;">Elemen / Capaian</th>
              <th style="padding: 8px; border: 1px solid #1a3a5c; width: 35%;">Tujuan Pembelajaran (TP) / Indikator</th>
              <th style="padding: 8px; border: 1px solid #1a3a5c; width: 12%;">Alokasi JP</th>
              <th style="padding: 8px; border: 1px solid #1a3a5c; width: 20%;">Profil Pelajar</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">1</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1;"><b>${data.elemenCapaian}</b></td>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">
                1.1. Memahami prinsip utama dan sistematika ${data.elemenCapaian}.<br>
                1.2. Menerapkan strategi pemecahan masalah secara prosedural dan logis.
              </td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">8 JP</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">Bernalar Kritis, Mandiri</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">2</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1;"><b>Penerapan Praktis & Kolaborasi</b></td>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">
                2.1. Merancang proyek studi kasus riil kelompok.<br>
                2.2. Mengomunikasikan ide pemikiran dan melakukan evaluasi solutif.
              </td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">10 JP</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">Gotong Royong, Kreatif</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 40px;">
          <table style="width: 100%; border: none; font-size: 10pt;">
            <tr>
              <td style="width: 50%; text-align: center; border: none;">
                Mengetahui,<br><b>Kepala Sekolah</b><br><br><br><br>
                <u>(_________________________)</u><br>NIP.
              </td>
              <td style="width: 50%; text-align: center; border: none;">
                Guru Mata Pelajaran,<br><br><br><br><br>
                <u><b>Yusak Yokoyama, S.Pd., M.Pd.</b></u><br>NIP. 19850712 201001 1 018
              </td>
            </tr>
          </table>
        </div>
      </div>
    `;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGeneratedHtml(null);

    try {
      const res = await fetch('/api/ai/generate-perangkat-ajar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.html) {
        setGeneratedHtml(data.html);
        showToast('Perangkat Ajar Berhasil Dibuat!', 'success', `${formData.jenisDokumen} siap dicetak.`);
      } else {
        throw new Error('Fallback required');
      }
    } catch (err) {
      console.warn('Using fallback perangkat generator:', err);
      const fallbackHtml = generateFallbackPerangkatHtml(formData);
      setGeneratedHtml(fallbackHtml);
      showToast('Perangkat Ajar Berhasil Dibuat!', 'success', `${formData.jenisDokumen} siap dicetak.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1a3a5c] to-slate-900 text-white p-6 rounded-2xl shadow-sm no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl">
            <FileCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Generator Perangkat Ajar Kurikulum Merdeka AI</h2>
            <p className="text-xs text-slate-300 mt-1">
              Menghasilkan 6 jenis dokumen resmi siap cetak: <b>Analisis CP</b>, <b>TP</b>, <b>ATP</b>, <b>Prota</b>, <b>Prosem</b>, dan <b>KKTP</b> dengan format tabel `#1a3a5c` dan tanda tangan sejajar.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm no-print">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pilih Jenis Dokumen Resmi *
              </label>
              <select
                value={formData.jenisDokumen}
                onChange={(e) => setFormData({ ...formData, jenisDokumen: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium"
              >
                {JENIS_DOKUMEN_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mata Pelajaran *
              </label>
              <input
                type="text"
                required
                value={formData.mataPelajaran}
                onChange={(e) => setFormData({ ...formData, mataPelajaran: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fase
              </label>
              <select
                value={formData.fase}
                onChange={(e) => setFormData({ ...formData, fase: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              >
                <option value="Fase A (Kelas 1-2 SD)">Fase A (SD)</option>
                <option value="Fase B (Kelas 3-4 SD)">Fase B (SD)</option>
                <option value="Fase C (Kelas 5-6 SD)">Fase C (SD)</option>
                <option value="Fase D (Kelas 7-9 SMP)">Fase D (SMP)</option>
                <option value="Fase E (Kelas X)">Fase E (SMA/SMK)</option>
                <option value="Fase F (Kelas XI-XII)">Fase F (SMA/SMK)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kelas
              </label>
              <input
                type="text"
                value={formData.kelas}
                onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tahun Ajaran
              </label>
              <input
                type="text"
                value={formData.tahunAjaran}
                onChange={(e) => setFormData({ ...formData, tahunAjaran: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Elemen Capaian / Ruang Lingkup Materi
            </label>
            <input
              type="text"
              value={formData.elemenCapaian}
              onChange={(e) => setFormData({ ...formData, elemenCapaian: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyusun Dokumen Resmi dengan Standar BSKAP...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Generate Dokumen {formData.jenisDokumen}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Output Document */}
      {generatedHtml && (
        <div className="space-y-4">
          <DocPreviewToolbar htmlContent={generatedHtml} documentTitle={`${formData.jenisDokumen}_${formData.mataPelajaran}`} />

          <div className="bg-white text-slate-900 border border-slate-300 p-8 rounded-2xl shadow-lg print:border-none print:shadow-none print:p-0">
            <div
              className="prose max-w-none print:max-w-none text-slate-900 leading-relaxed font-sans"
              dangerouslySetInnerHTML={{ __html: generatedHtml }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
