import React, { useState } from 'react';
import { Heart, Sparkles, Loader2, Compass } from 'lucide-react';
import { DocPreviewToolbar } from './DocPreviewToolbar';
import { showToast } from '../../utils/toast';

export const KbcGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    mataPelajaran: 'Informatika & Pendidikan Karakter',
    fase: 'Fase E (Kelas X)',
    kelas: 'Kelas X',
    nilaiKasih: 'Welas Asih, Empati Digital, Gotong Royong Tanpa Syarat, Kejujuran Hati',
    topik: 'Etika Komputasi dan Menciptakan Teknologi yang Penuh Kasih untuk Kemanusiaan',
  });

  const generateFallbackKbcHtml = (data: typeof formData) => {
    return `
      <div class="kbc-doc space-y-6">
        <div style="text-align: center; border-bottom: 2px solid #e11d48; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="font-size: 16pt; font-weight: bold; color: #e11d48; margin: 0; text-transform: uppercase;">PERANGKAT AJAR KURIKULUM BERBASIS CINTA (KBC)</h2>
          <p style="font-size: 10pt; color: #475569; margin: 4px 0 0 0;">Memadukan Keterampilan Akademik dengan Cinta Belajar, Empati, dan Kesadaran Budi Pekerti</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 16px;">
          <tr style="background-color: #be123c; color: white;">
            <th style="padding: 8px; text-align: left; border: 1px solid #be123c;" colspan="2">IDENTITAS PERANGKAT KBC</th>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #fecdd3; font-weight: bold; width: 30%;">Mata Pelajaran</td>
            <td style="padding: 8px; border: 1px solid #fecdd3;">${data.mataPelajaran}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #fecdd3; font-weight: bold;">Fase / Kelas</td>
            <td style="padding: 8px; border: 1px solid #fecdd3;">${data.fase} / ${data.kelas}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #fecdd3; font-weight: bold;">Nilai Karakter & Kasih</td>
            <td style="padding: 8px; border: 1px solid #fecdd3;"><b>${data.nilaiKasih}</b></td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #fecdd3; font-weight: bold;">Topik Utama</td>
            <td style="padding: 8px; border: 1px solid #fecdd3;">${data.topik}</td>
          </tr>
        </table>

        <h3 style="color: #be123c; border-bottom: 1px solid #be123c; padding-bottom: 4px; font-size: 12pt; font-weight: bold;">1. FILOSOFI CINTA DALAM PEMBELAJARAN</h3>
        <p style="font-size: 10pt; line-height: 1.6;">
          Pembelajaran tidak hanya mentransfer pengetahuan, melainkan menyentuh hati nurani peserta didik agar ilmu yang dipelajari menjadi sarana menumbuhkan empati, kebermanfaatan bagi sesama, dan rasa hormat pada kehidupan.
        </p>

        <h3 style="color: #be123c; border-bottom: 1px solid #be123c; padding-bottom: 4px; font-size: 12pt; font-weight: bold;">2. TIGA PILAR PENANAMAN KASIH</h3>
        <ul style="font-size: 10pt; line-height: 1.6; padding-left: 20px;">
          <li><b>Cinta pada Diri (Self-Compassion):</b> Menanamkan rasa percaya diri, kejujuran, dan kebiasaan berpikir positif.</li>
          <li><b>Cinta pada Sesama (Social Empathy):</b> Melatih kepekaan membantu teman yang mengalami kesulitan dan berkolaborasi tanpa diskriminasi.</li>
          <li><b>Cinta pada Kebenaran & Ilmu (Love for Wisdom):</b> Menjadikan kegiatan belajar sebagai pengalaman yang menggembirakan.</li>
        </ul>

        <div style="margin-top: 40px;">
          <table style="width: 100%; border: none; font-size: 10pt;">
            <tr>
              <td style="width: 50%; text-align: center; border: none;">
                Mengetahui,<br><b>Kepala Sekolah</b><br><br><br><br>
                <u>(_________________________)</u><br>NIP.
              </td>
              <td style="width: 50%; text-align: center; border: none;">
                Guru Pengampu KBC,<br><br><br><br>
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
      const res = await fetch('/api/ai/generate-perangkat-ajar-kbc', {
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
        showToast('Perangkat KBC Disusun!', 'success', 'Modul pembelajaran holistik berbasis cinta siap diterapkan.');
      } else {
        throw new Error('Fallback required');
      }
    } catch (err) {
      console.warn('Using fallback KBC generator:', err);
      const fallbackHtml = generateFallbackKbcHtml(formData);
      setGeneratedHtml(fallbackHtml);
      showToast('Perangkat KBC Disusun!', 'success', 'Modul pembelajaran holistik berbasis cinta siap diterapkan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-rose-900 via-pink-900 to-indigo-950 text-white p-6 rounded-2xl shadow-sm no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl">
            <Heart className="w-6 h-6 text-rose-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Perangkat Ajar KBC (Kurikulum Berbasis Cinta)</h2>
            <p className="text-xs text-rose-200 mt-1">
              Modul pembelajaran holistik yang memadukan kecerdasan kognitif dengan nilai-nilai welas asih, empati, cinta belajar, dan karakter profil pelajar luhur.
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
                Fase
              </label>
              <input
                type="text"
                value={formData.fase}
                onChange={(e) => setFormData({ ...formData, fase: e.target.value })}
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nilai Kasih & Karakter yang Diintegrasikan *
            </label>
            <input
              type="text"
              required
              value={formData.nilaiKasih}
              onChange={(e) => setFormData({ ...formData, nilaiKasih: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Topik / Materi Pembelajaran *
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
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI Sedang Merajut Perangkat Berbasis Cinta...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  Generate Perangkat Ajar KBC
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Output Document */}
      {generatedHtml && (
        <div className="space-y-4">
          <DocPreviewToolbar htmlContent={generatedHtml} documentTitle={`Perangkat_KBC_${formData.topik}`} />

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
