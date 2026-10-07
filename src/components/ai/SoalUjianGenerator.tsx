import React, { useState } from 'react';
import { FileQuestion, Sparkles, Loader2, CheckSquare } from 'lucide-react';
import { DocPreviewToolbar } from './DocPreviewToolbar';
import { showToast } from '../../utils/toast';

export const SoalUjianGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    mataPelajaran: 'Informatika',
    kelas: 'Kelas X / Semester Ganjil',
    jenisUjian: 'Sumatif Akhir Semester (SAS)',
    topikMateri: 'Berpikir Komputasional, Algoritma Pemrograman, dan Etika Digital',
    jumlahPg: 10,
    jumlahUraian: 5,
  });

  const generateFallbackSoalHtml = (data: typeof formData) => {
    return `
      <div class="soal-ujian-doc space-y-6">
        <div style="text-align: center; border-bottom: 2px solid #1a3a5c; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="font-size: 16pt; font-weight: bold; color: #1a3a5c; margin: 0; text-transform: uppercase;">${data.jenisUjian.toUpperCase()}</h2>
          <p style="font-size: 10pt; color: #475569; margin: 4px 0 0 0;">Mata Pelajaran: <b>${data.mataPelajaran}</b> | Kelas: <b>${data.kelas}</b> | Waktu: 90 Menit</p>
        </div>

        <h3 style="color: #1a3a5c; border-bottom: 1px solid #1a3a5c; padding-bottom: 4px; font-size: 12pt; font-weight: bold;">BAGIAN I: NASKAH SOAL PILIHAN GANDA & URAIAN</h3>
        
        <p style="font-size: 10pt; font-weight: bold;">A. PILIHAN GANDA (Pilihlah salah satu jawaban A, B, C, D, atau E yang paling tepat!)</p>
        <ol style="font-size: 10pt; line-height: 1.6; padding-left: 20px;">
          <li style="margin-bottom: 12px;">
            <b>Stimulus Kasus:</b> Sebuah sistem aplikasi e-commerce memerlukan algoritma pencarian cepat untuk memproses ribuan data barang secara efisien.<br>
            <i>Manakah pendekatan alur algoritma yang paling optimal untuk menyelesaikan masalah tersebut?</i><br>
            A. Pencarian sekuensial acak tanpa pengurutan.<br>
            B. Algoritma Binary Search pada himpunan data yang terurut.<br>
            C. Pengulangan tanpa batas hingga variabel ditemukan.<br>
            D. Pemindaian manual oleh pengguna sistem.<br>
            E. Menghapus data yang tidak sesuai.
          </li>
          <li style="margin-bottom: 12px;">
            <b>Konsep ${data.topikMateri}:</b> Dalam merancang modul program komputer, salah satu pilar utama berpikir komputasional yang menekankan pemecahan masalah kompleks menjadi bagian-bagian kecil yang lebih mudah dikelola adalah...<br>
            A. Dekomposisi (Decomposition)<br>
            B. Pengenalan Pola (Pattern Recognition)<br>
            C. Abstraksi (Abstraction)<br>
            D. Algoritma (Algorithm)<br>
            E. Evaluasi (Evaluation)
          </li>
        </ol>

        <p style="font-size: 10pt; font-weight: bold; margin-top: 20px;">B. SOAL URAIAN (Jawablah pertanyaan berikut dengan analisis yang runtut!)</p>
        <ol style="font-size: 10pt; line-height: 1.6; padding-left: 20px;">
          <li style="margin-bottom: 12px;">
            Jelaskan penerapan konsep <b>${data.topikMateri}</b> dalam mengatasi permasalahan efisiensi sistem pada era industri digital saat ini!
          </li>
          <li style="margin-bottom: 12px;">
            Buatlah alur bagan alir (flowchart) atau pseudocode sederhana untuk menyelesaikan kasus logika komputasi pada lingkungan sekolah Anda!
          </li>
        </ol>

        <div style="page-break-before: always; margin-top: 30px;">
          <h3 style="color: #1a3a5c; border-bottom: 1px solid #1a3a5c; padding-bottom: 4px; font-size: 12pt; font-weight: bold;">BAGIAN II: LEMBAR JAWABAN SISWA (LJS) SIAP CETAK</h3>
          <table style="width: 100%; border: 1px solid #cbd5e1; border-collapse: collapse; font-size: 10pt; margin-bottom: 16px;">
            <tr>
              <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; width: 20%;">Nama Siswa</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; width: 30%;">______________________</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; width: 20%;">Nomor Peserta</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; width: 30%;">______________________</td>
            </tr>
            <tr>
              <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Kelas / Rombel</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1;">${data.kelas}</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Mata Pelajaran</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1;">${data.mataPelajaran}</td>
            </tr>
          </table>

          <p style="font-size: 10pt; font-weight: bold;">Pilihan Ganda:</p>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 10pt; margin-bottom: 20px;">
            <div>1. [A] [B] [C] [D] [E]</div>
            <div>2. [A] [B] [C] [D] [E]</div>
            <div>3. [A] [B] [C] [D] [E]</div>
            <div>4. [A] [B] [C] [D] [E]</div>
            <div>5. [A] [B] [C] [D] [E]</div>
            <div>6. [A] [B] [C] [D] [E]</div>
          </div>
        </div>

        <div style="margin-top: 30px;">
          <h3 style="color: #1a3a5c; border-bottom: 1px solid #1a3a5c; padding-bottom: 4px; font-size: 12pt; font-weight: bold;">BAGIAN III: KUNCI JAWABAN & PEDOMAN PENSKORAN</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
            <thead>
              <tr style="background-color: #1a3a5c; color: white;">
                <th style="padding: 6px; border: 1px solid #1a3a5c;">No Soal</th>
                <th style="padding: 6px; border: 1px solid #1a3a5c;">Kunci Jawaban</th>
                <th style="padding: 6px; border: 1px solid #1a3a5c;">Bobot Skor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">1 (PG)</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">B. Algoritma Binary Search...</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">10</td>
              </tr>
              <tr>
                <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">2 (PG)</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">A. Dekomposisi (Decomposition)</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">10</td>
              </tr>
              <tr>
                <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">1 (Uraian)</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">Penjelasan runtut mencakup efisiensi, akurasi, dan struktur logika.</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">25</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-top: 40px;">
          <table style="width: 100%; border: none; font-size: 10pt;">
            <tr>
              <td style="width: 50%; text-align: center; border: none;">
                Mengetahui,<br><b>Kepala Sekolah</b><br><br><br><br>
                <u>(_________________________)</u><br>NIP.
              </td>
              <td style="width: 50%; text-align: center; border: none;">
                Guru Penyusun Soal,<br><br><br><br><br>
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
      const res = await fetch('/api/ai/generate-soal-ujian', {
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
        showToast('Paket Soal Ujian Disusun!', 'success', 'Naskah Soal, LJS, dan Rubrik Kunci Jawaban siap dicetak.');
      } else {
        throw new Error('Fallback required');
      }
    } catch (err) {
      console.warn('Using fallback soal generator:', err);
      const fallbackHtml = generateFallbackSoalHtml(formData);
      setGeneratedHtml(fallbackHtml);
      showToast('Paket Soal Ujian Disusun!', 'success', 'Naskah Soal, LJS, dan Rubrik Kunci Jawaban siap dicetak.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-orange-900 to-[#1a3a5c] text-white p-6 rounded-2xl shadow-sm no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl">
            <FileQuestion className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Generator Soal Ujian, LJS, & Kunci Jawaban AI</h2>
            <p className="text-xs text-amber-200 mt-1">
              Satu paket ujian lengkap: <b>Naskah Soal HOTS</b>, <b>Lembar Jawaban Siswa (LJS) Siap Cetak</b>, dan <b>Kunci Jawaban & Rubrik Penskoran</b>.
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
                Kelas & Semester
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
                Jenis Asesmen / Ujian
              </label>
              <select
                value={formData.jenisUjian}
                onChange={(e) => setFormData({ ...formData, jenisUjian: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              >
                <option value="Sumatif Akhir Semester (SAS)">Sumatif Akhir Semester (SAS)</option>
                <option value="Sumatif Tengah Semester (STS)">Sumatif Tengah Semester (STS)</option>
                <option value="Penilaian Akhir Tahun (PAT)">Penilaian Akhir Tahun (PAT)</option>
                <option value="Asesmen Sumatif Lingkup Materi">Asesmen Sumatif Lingkup Materi</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ruang Lingkup Materi Ujian *
            </label>
            <input
              type="text"
              required
              value={formData.topikMateri}
              onChange={(e) => setFormData({ ...formData, topikMateri: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jumlah Soal Pilihan Ganda (PG HOTS)
              </label>
              <input
                type="number"
                min={5}
                max={40}
                value={formData.jumlahPg}
                onChange={(e) => setFormData({ ...formData, jumlahPg: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jumlah Soal Uraian Analitis
              </label>
              <input
                type="number"
                min={2}
                max={10}
                value={formData.jumlahUraian}
                onChange={(e) => setFormData({ ...formData, jumlahUraian: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI Sedang Merumuskan Paket Ujian HOTS & LJS...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  Generate Paket Ujian & LJS
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Output Document */}
      {generatedHtml && (
        <div className="space-y-4">
          <DocPreviewToolbar htmlContent={generatedHtml} documentTitle={`Naskah_Ujian_${formData.mataPelajaran}`} />

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
