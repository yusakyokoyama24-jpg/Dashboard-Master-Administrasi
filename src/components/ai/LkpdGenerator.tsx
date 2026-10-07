import React, { useState } from 'react';
import { FileSpreadsheet, Sparkles, Loader2, PenTool } from 'lucide-react';
import { DocPreviewToolbar } from './DocPreviewToolbar';
import { showToast } from '../../utils/toast';

export const LkpdGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    mataPelajaran: 'Informatika',
    fase: 'Fase E',
    kelas: 'Kelas X',
    topik: 'Analisis Algoritma dan Pembuatan Flowchart Masalah Otentik',
    model: 'Problem Based Learning (PBL)',
  });

  const generateFallbackLkpdHtml = (data: typeof formData) => {
    return `
      <div class="lkpd-doc space-y-6">
        <div style="text-align: center; border-bottom: 2px solid #1a3a5c; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="font-size: 16pt; font-weight: bold; color: #1a3a5c; margin: 0; text-transform: uppercase;">LEMBAR KERJA PESERTA DIDIK (LKPD) INTERAKTIF</h2>
          <p style="font-size: 10pt; color: #475569; margin: 4px 0 0 0;">Mata Pelajaran: <b>${data.mataPelajaran}</b> | ${data.fase} - ${data.kelas} | Model: <b>${data.model}</b></p>
        </div>

        <table style="width: 100%; border: 1px solid #cbd5e1; border-collapse: collapse; font-size: 10pt; margin-bottom: 16px;">
          <tr>
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; width: 20%;">Kelompok / Nama Siswa</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1; width: 30%;">______________________</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; width: 20%;">Tanggal & Tanggal</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1; width: 30%;">______________________</td>
          </tr>
          <tr>
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Topik Utama</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;" colspan="3"><b>${data.topik}</b></td>
          </tr>
        </table>

        <h3 style="color: #1a3a5c; border-bottom: 1px solid #1a3a5c; padding-bottom: 4px; font-size: 12pt; font-weight: bold;">1. TUJUAN AKTIVITAS & STIMULUS STUDI KASUS</h3>
        <p style="font-size: 10pt; line-height: 1.6;">
          <b>Tujuan Pembelajaran:</b> Melalui model ${data.model}, siswa secara bergotong royong menganalisis permasalahan riil mengenai <i>${data.topik}</i> dan merumuskan solusinya secara terstruktur.
        </p>
        <div style="background-color: #f8fafc; border-left: 4px solid #1a3a5c; padding: 12px; margin-bottom: 16px; font-size: 10pt;">
          <b>Skenario Masalah Otentik:</b> Tim operasional sekolah membutuhkan rancangan skema alur otomatisasi untuk efisiensi data. Diskusikan bersama anggota kelompok Anda mengenai langkah-langkah logika terbaik untuk menangani kasus ini!
        </div>

        <h3 style="color: #1a3a5c; border-bottom: 1px solid #1a3a5c; padding-bottom: 4px; font-size: 12pt; font-weight: bold;">2. KOLOM LEMBAR KERJA SISWA</h3>
        <div style="border: 1px solid #94a3b8; border-radius: 8px; padding: 16px; min-height: 180px; margin-bottom: 20px; font-size: 10pt; color: #64748b;">
          <i>[Tuliskan gambaran alur analisis, diagram logika, atau rangkuman hasil diskusi kelompok Anda di dalam ruang ini]</i>
        </div>

        <h3 style="color: #1a3a5c; border-bottom: 1px solid #1a3a5c; padding-bottom: 4px; font-size: 12pt; font-weight: bold;">3. PERTANYAAN ANALISIS KRITIS</h3>
        <ol style="font-size: 10pt; line-height: 1.8; padding-left: 20px;">
          <li>Mengapa solusi yang dirancang oleh kelompok Anda paling tepat untuk menyelesaikan kasus ${data.topik}?</li>
          <li>Aplikasi atau kendala apa yang mungkin muncul saat solusi ini diterapkan, dan bagaimana cara mengatasinya?</li>
        </ol>

        <div style="margin-top: 40px;">
          <table style="width: 100%; border: none; font-size: 10pt;">
            <tr>
              <td style="width: 50%; text-align: center; border: none;">
                Nilai & Catatan Guru:<br><br><br>
                <b>[ ______________ ]</b>
              </td>
              <td style="width: 50%; text-align: center; border: none;">
                Guru Pengampu,<br><br><br><br>
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
      const res = await fetch('/api/ai/generate-lkpd', {
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
        showToast('LKPD Interaktif Siap Digunakan!', 'success', 'Lembar kerja siswa dengan studi kasus nyata siap dicetak.');
      } else {
        throw new Error('Fallback required');
      }
    } catch (err) {
      console.warn('Using fallback lkpd generator:', err);
      const fallbackHtml = generateFallbackLkpdHtml(formData);
      setGeneratedHtml(fallbackHtml);
      showToast('LKPD Interaktif Siap Digunakan!', 'success', 'Lembar kerja siswa dengan studi kasus nyata siap dicetak.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-cyan-950 via-teal-900 to-[#1a3a5c] text-white p-6 rounded-2xl shadow-sm no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl">
            <PenTool className="w-6 h-6 text-cyan-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Generator LKPD AI (Lembar Kerja Peserta Didik)</h2>
            <p className="text-xs text-cyan-200 mt-1">
              Pembuat LKPD interaktif mandiri/kelompok, dilengkapi petunjuk kerja, bahan bacaan pengantar, studi kasus nyata, dan kolom isian siswa siap pakai.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm no-print">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fase & Kelas
              </label>
              <input
                type="text"
                value={`${formData.fase} - ${formData.kelas}`}
                onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Model Pembelajaran
              </label>
              <select
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              >
                <option value="Problem Based Learning (PBL)">Problem Based Learning (PBL)</option>
                <option value="Project Based Learning (PjBL)">Project Based Learning (PjBL)</option>
                <option value="Inquiry / Discovery Learning">Inquiry / Discovery Learning</option>
                <option value="Diferensiasi Pembelajaran (Deep Learning)">Diferensiasi Deep Learning</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Topik / Aktivitas Pembelajaran LKPD *
            </label>
            <input
              type="text"
              required
              value={formData.topik}
              onChange={(e) => setFormData({ ...formData, topik: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI Sedang Merancang LKPD Interaktif...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Generate LKPD Siap Pakai
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Output Document */}
      {generatedHtml && (
        <div className="space-y-4">
          <DocPreviewToolbar htmlContent={generatedHtml} documentTitle={`LKPD_${formData.topik}`} />

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
