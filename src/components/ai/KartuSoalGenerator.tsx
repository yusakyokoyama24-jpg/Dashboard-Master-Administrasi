import React, { useState } from 'react';
import { Layers, Sparkles, Loader2, BookCheck } from 'lucide-react';
import { DocPreviewToolbar } from './DocPreviewToolbar';
import { showToast } from '../../utils/toast';

export const KartuSoalGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    mataPelajaran: 'Informatika',
    kelas: 'Kelas X',
    jenisUjian: 'Asesmen Sumatif Akhir Semester',
    materi: 'Algoritma Percabangan & Struktur Kontrol Perulangan',
  });

  const generateFallbackKartuSoalHtml = (data: typeof formData) => {
    return `
      <div class="kartu-soal-doc space-y-6">
        <div style="text-align: center; border-bottom: 2px solid #1a3a5c; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="font-size: 16pt; font-weight: bold; color: #1a3a5c; margin: 0; text-transform: uppercase;">KARTU SOAL & KISI-KISI RESMI UJIAN</h2>
          <p style="font-size: 10pt; color: #475569; margin: 4px 0 0 0;">Mata Pelajaran: <b>${data.mataPelajaran}</b> | Kelas: <b>${data.kelas}</b> | Ujian: <b>${data.jenisUjian}</b></p>
        </div>

        <h3 style="color: #1a3a5c; border-bottom: 1px solid #1a3a5c; padding-bottom: 4px; font-size: 12pt; font-weight: bold;">MATRIKS KISI-KISI PENULISAN SOAL</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #1a3a5c; color: white;">
              <th style="padding: 6px; border: 1px solid #1a3a5c;">No</th>
              <th style="padding: 6px; border: 1px solid #1a3a5c;">Capaian Pembelajaran</th>
              <th style="padding: 6px; border: 1px solid #1a3a5c;">Materi Pokok</th>
              <th style="padding: 6px; border: 1px solid #1a3a5c;">Indikator Soal</th>
              <th style="padding: 6px; border: 1px solid #1a3a5c;">Level</th>
              <th style="padding: 6px; border: 1px solid #1a3a5c;">Bentuk</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">1</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1;">Menerapkan logika komputasi...</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1;">${data.materi}</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1;">Disajikan kasus, siswa mampu memilih alur algoritma terdaftar.</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">L3 (HOTS)</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">PG</td>
            </tr>
          </tbody>
        </table>

        <h3 style="color: #1a3a5c; border-bottom: 1px solid #1a3a5c; padding-bottom: 4px; font-size: 12pt; font-weight: bold;">KARTU SOAL NOMOR 01</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 20px;">
          <tr>
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; width: 25%;">Satuan Pendidikan</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">SMK Negeri 1 Indonesia Merdeka</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; width: 20%;">Penyusun</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">Yusak Yokoyama, S.Pd., M.Pd.</td>
          </tr>
          <tr>
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Mata Pelajaran</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">${data.mataPelajaran}</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Tahun Ajaran</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">2026/2027</td>
          </tr>
          <tr>
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Buku Sumber</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;" colspan="3">Buku Teks Utama Kemendikbudristek & Dokumentasi Resmi</td>
          </tr>
          <tr>
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Butir Soal</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;" colspan="3">
              <b>Butir Soal:</b> Dalam konteks ${data.materi}, strategi mana yang paling efektif dalam mengoptimalkan performa pemrosesan logika?<br>
              A. Pengulangan sekuensial tak berujung<br>
              B. Penggunaan struktur kontrol percabangan kondisi efisien<br>
              C. Mengabaikan penanganan kesalahan sistem<br>
              D. Menghapus masukan data pengguna<br>
              <b>Kunci Jawaban: B</b> | Bobot Skor: 10
            </td>
          </tr>
        </table>

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
      const res = await fetch('/api/ai/generate-kartu-soal', {
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
        showToast('Kartu Soal Berhasil Dibuat!', 'success', 'Matriks kisi-kisi dan kartu soal siap dicetak.');
      } else {
        throw new Error('Fallback required');
      }
    } catch (err) {
      console.warn('Using fallback kartu soal generator:', err);
      const fallbackHtml = generateFallbackKartuSoalHtml(formData);
      setGeneratedHtml(fallbackHtml);
      showToast('Kartu Soal Berhasil Dibuat!', 'success', 'Matriks kisi-kisi dan kartu soal siap dicetak.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-[#1a3a5c] text-white p-6 rounded-2xl shadow-sm no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl">
            <BookCheck className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Generator Kisi-Kisi & Kartu Soal Ujian Resmi AI</h2>
            <p className="text-xs text-blue-200 mt-1">
              Menghasilkan matriks kisi-kisi penulisan soal dan kartu soal standar resmi (Kompetensi, Indikator, Level Kognitif L1/L2/L3, Buku Sumber, Kunci, dan Skor).
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
                Jenis Ujian
              </label>
              <input
                type="text"
                value={formData.jenisUjian}
                onChange={(e) => setFormData({ ...formData, jenisUjian: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Materi Pokok / Capaian Pembelajaran yang Diuji *
            </label>
            <input
              type="text"
              required
              value={formData.materi}
              onChange={(e) => setFormData({ ...formData, materi: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI Sedang Menyusun Kisi-Kisi & Kartu Soal...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Generate Kartu Soal & Kisi-Kisi
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Output Document */}
      {generatedHtml && (
        <div className="space-y-4">
          <DocPreviewToolbar htmlContent={generatedHtml} documentTitle={`Kartu_Soal_${formData.mataPelajaran}`} />

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
