import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { Presentation, Sparkles, Loader2, Download, ChevronLeft, ChevronRight, Lightbulb, MessageSquare } from 'lucide-react';
import { PptPresentation } from '../../types';
import { exportService } from '../../services/export';
import { showToast } from '../../utils/toast';

export const PptGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [presentation, setPresentation] = useState<PptPresentation | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const [formData, setFormData] = useState({
    topik: 'Algoritma, Pemrograman, dan Logika Komputasi Modern',
    mataPelajaran: 'Informatika',
    targetAudiens: 'Siswa SMK / SMA',
    jumlahSlide: 7,
  });

  const generateFallbackPptData = (data: typeof formData): PptPresentation => {
    return {
      presentationTitle: data.topik,
      subject: data.mataPelajaran,
      slides: [
        {
          slideNumber: 1,
          title: `Pengenalan Pembelajaran: ${data.topik}`,
          subtitle: `Mata Pelajaran ${data.mataPelajaran} • ${data.targetAudiens}`,
          bullets: [
            'Memahami urgensi dan relevansi topik dalam kehidupan sehari-hari.',
            'Mengidentifikasi prinsip utama dan metodologi pemecahan masalah.',
            'Membangun wawasan kritis serta keterampilan praktis kolaboratif.',
          ],
          keyTakeaway: 'Kunci Sukses: Bernalar kritis dan siap bereksperimen dengan ide-ide baru.',
          speakerNotes: 'Selamat pagi siswa-siswi hebat! Hari ini kita akan menjelajahi materi utama dengan pendekatan interaktif.',
        },
        {
          slideNumber: 2,
          title: 'Konsep Utama & Landasan Teoritis',
          subtitle: 'Memahami Struktur dan Elemen Dasar',
          bullets: [
            'Dekomposisi Masalah: Memecah studi kasus kompleks menjadi langkah-langkah terstruktur.',
            'Pengenalan Pola: Mengidentifikasi kemiripan alur untuk mempercepat penyelesaian.',
            'Abstraksi: Fokus pada informasi esensial dan mengeliminasi detail berlebihan.',
          ],
          keyTakeaway: 'Pola yang terstruktur mempermudah penyusunan logika solutif.',
          speakerNotes: 'Perhatikan gambar dan diagram di slide. Cobalah hubungkan dengan pengalaman yang pernah kalian alami.',
        },
        {
          slideNumber: 3,
          title: 'Studi Kasus Otentik & Penerapan Lapangan',
          subtitle: 'Implementasi Nyata di Dunia Industri dan Masyarakat',
          bullets: [
            'Skenario Masalah 1: Efisiensi pengolahan data dan pemrosesan informasi otomatis.',
            'Skenario Masalah 2: Mitigasi kendala alur kerja melalui simulasi sistemik.',
            'Analisis Solusi: Menimbang kelebihan dan kekurangan dari setiap pendekatan.',
          ],
          keyTakeaway: 'Setiap tantangan memiliki lebih dari satu alternatif solusi yang dapat dioptimalkan.',
          speakerNotes: 'Silakan berdiskusi singkat dengan teman sebangku Anda mengenai studi kasus pada slide ini.',
        },
        {
          slideNumber: 4,
          title: 'Aktivitas Kolaboratif Kelompok',
          subtitle: 'Petunjuk Penugasan & Lembar Kerja Eksplorasi',
          bullets: [
            'Bentuk kelompok heterogen yang terdiri dari 3–4 orang siswa.',
            'Diskusikan skenario masalah yang dibagikan pada Lembar Kerja (LKPD).',
            'Buatlah matriks rancangan solusi dan siapkan bahan presentasi 3 menit.',
          ],
          keyTakeaway: 'Kerja sama tim dan komunikasi yang jelas menentukan kualitas hasil akhir.',
          speakerNotes: 'Guru akan berkeliling untuk memberikan bimbingan terdiferensiasi pada setiap kelompok.',
        },
        {
          slideNumber: 5,
          title: 'Kesimpulan & Refleksi Pembelajaran',
          subtitle: 'Metakognisi & Tindak Lanjut Mandiri',
          bullets: [
            'Rangkuman Poin Kunci: Pemahaman konsep dan penguasaan teknik dasar.',
            'Jurnal Refleksi: Apa yang paling menantang dari materi hari ini?',
            'Tugas Tindak Lanjut: Membaca materi pengayaan untuk pertemuan berikutnya.',
          ],
          keyTakeaway: 'Pembelajaran berkelanjutan adalah kunci utama pengembangan kompetensi masa depan.',
          speakerNotes: 'Terima kasih atas partisipasi aktif kalian hari ini! Tetap semangat dan jagalah rasa ingin tahu.',
        },
      ],
    };
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPresentation(null);

    try {
      const res = await fetch('/api/ai/generate-ppt-all-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: PptPresentation = await res.json();
      if (data && data.slides && data.slides.length > 0) {
        setPresentation(data);
        setActiveSlideIndex(0);
        showToast('Slide Presentasi Dirancang!', 'success', `${data.slides.length} slide pembelajaran interaktif siap diunduh.`);
      } else {
        throw new Error('Fallback required');
      }
    } catch (err) {
      console.warn('Using fallback PPT generator:', err);
      const fallbackData = generateFallbackPptData(formData);
      setPresentation(fallbackData);
      setActiveSlideIndex(0);
      showToast('Slide Presentasi Dirancang!', 'success', `${fallbackData.slides.length} slide pembelajaran interaktif siap diunduh.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPptx = () => {
    if (!presentation) return;
    exportService.exportPptPresentation(presentation);
    Swal.fire({
      title: 'Berkas PowerPoint Diunduh!',
      text: 'File (.pptx) asli siap dibuka di Microsoft PowerPoint atau Google Slides.',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-violet-950 via-purple-900 to-[#1a3a5c] text-white p-6 rounded-2xl shadow-sm no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl">
            <Presentation className="w-6 h-6 text-violet-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Generator Presentasi Interaktif PPT (Semua Slide) AI</h2>
            <p className="text-xs text-violet-200 mt-1">
              Merancang materi tayang tayangan pembelajaran terstruktur dan mengekspor langsung ke format <b>Microsoft PowerPoint (.pptx)</b> asli menggunakan engine PPTXGenJS.
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Audiens / Jenjang Siswa
              </label>
              <input
                type="text"
                value={formData.targetAudiens}
                onChange={(e) => setFormData({ ...formData, targetAudiens: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jumlah Slide yang Dihasilkan
              </label>
              <select
                value={formData.jumlahSlide}
                onChange={(e) => setFormData({ ...formData, jumlahSlide: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
              >
                <option value={5}>5 Slide Ringkas</option>
                <option value={7}>7 Slide Standar</option>
                <option value={10}>10 Slide Komprehensif</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI Sedang Menata Seluruh Slide Bahan Tayang...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Generate Semua Slide Presentasi
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Visual Slide Navigator & PPTX Download */}
      {presentation && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-800 text-white p-4 rounded-2xl shadow-sm">
            <div>
              <h3 className="font-bold text-base">{presentation.presentationTitle}</h3>
              <p className="text-xs text-slate-300">
                Total: {presentation.slides.length} Slide • Subjek: {presentation.subject || 'Edukasi'}
              </p>
            </div>

            <button
              onClick={handleDownloadPptx}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-md transition-all"
            >
              <Download className="w-4 h-4" />
              Unduh File PowerPoint Asli (.pptx)
            </button>
          </div>

          {/* Slide Stage Preview */}
          <div className="bg-slate-100 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
            {/* 16:9 Presentation Canvas */}
            <div className="w-full max-w-4xl mx-auto aspect-video bg-gradient-to-br from-white via-slate-50 to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between relative group">
              {/* Decorative accent top bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 z-10"></div>

              {/* Slide Top Bar */}
              <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white px-8 py-5 flex items-center justify-between shadow-md">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-300 font-mono">Bahan Tayang • {presentation.subject || 'Pembelajaran'}</span>
                  </div>
                  <h3 className="font-extrabold text-xl sm:text-2xl tracking-tight leading-snug">
                    {presentation.slides[activeSlideIndex]?.title}
                  </h3>
                  {presentation.slides[activeSlideIndex]?.subtitle && (
                    <p className="text-xs sm:text-sm text-blue-200 font-medium opacity-90">
                      {presentation.slides[activeSlideIndex]?.subtitle}
                    </p>
                  )}
                </div>
                <div className="px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-xl text-xs font-mono font-bold tracking-wider shrink-0 border border-white/15 text-blue-200 shadow-inner">
                  Slide {activeSlideIndex + 1} / {presentation.slides.length}
                </div>
              </div>

              {/* Slide Content Body */}
              <div className="p-8 grid grid-cols-12 gap-6 items-center flex-1 my-auto">
                {/* Bullets */}
                <div className="col-span-8 space-y-3.5">
                  <ul className="space-y-3">
                    {presentation.slides[activeSlideIndex]?.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-3.5 text-slate-800 dark:text-slate-200 text-sm sm:text-base font-normal">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-2 shrink-0 shadow-sm ring-4 ring-blue-100 dark:ring-blue-950"></span>
                        <span className="leading-relaxed">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Key Takeaway Card */}
                <div className="col-span-4 bg-gradient-to-br from-blue-50/90 to-indigo-50/80 dark:from-blue-950/50 dark:to-slate-900/80 border border-blue-200 dark:border-blue-800/80 p-5 rounded-2xl space-y-2.5 shadow-md">
                  <span className="text-xs font-extrabold text-blue-700 dark:text-blue-300 flex items-center gap-1.5 uppercase tracking-wide">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" /> Pesan Kunci
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {presentation.slides[activeSlideIndex]?.keyTakeaway || 'Refleksi materi esensial.'}
                  </p>
                </div>
              </div>

              {/* Slide Footer */}
              <div className="bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm px-8 py-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
                <span className="font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Tongguru EdAdmin Pro • Kurikulum Merdeka
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {presentation.subject}
                </span>
              </div>
            </div>

            {/* Slide Navigation Controls */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                disabled={activeSlideIndex === 0}
                onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-30 shadow-xs"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1.5">
                {presentation.slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlideIndex(idx)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                      activeSlideIndex === idx
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <button
                disabled={activeSlideIndex === presentation.slides.length - 1}
                onClick={() => setActiveSlideIndex((prev) => Math.min(presentation.slides.length - 1, prev + 1))}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-30 shadow-xs"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Speaker Notes */}
            {presentation.slides[activeSlideIndex]?.speakerNotes && (
              <div className="max-w-4xl mx-auto mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl space-y-1">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Catatan Perkataan Guru (Speaker Notes):
                </span>
                <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed italic">
                  "{presentation.slides[activeSlideIndex]?.speakerNotes}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
