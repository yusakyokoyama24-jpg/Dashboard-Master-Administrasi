import React, { useState } from 'react';
import { Download, FileText, CheckCircle, ExternalLink, Search, FolderDown, Sparkles } from 'lucide-react';
import Swal from 'sweetalert2';

interface PerangkatTemplate {
  id: string;
  judul: string;
  tingkat: 'SD/MI' | 'SMP/MTs' | 'SMA/SMK' | 'Umum';
  kategori: 'Regulasi Resmi' | 'Panduan Asesmen' | 'Template Modul' | 'Aplikasi Excel' | 'Kokurikuler & Karakter';
  ukuran: string;
  format: 'PDF' | 'DOCX' | 'XLSX';
  deskripsi: string;
}

const TEMPLATES: PerangkatTemplate[] = [
  {
    id: 'p1',
    judul: 'Salinan SK BSKAP No. 032/H/KR/2024 tentang Capaian Pembelajaran (CP)',
    tingkat: 'Umum',
    kategori: 'Regulasi Resmi',
    ukuran: '4.8 MB',
    format: 'PDF',
    deskripsi: 'Regulasi capaian pembelajaran terbaru PAUD, Dikdas, dan Dikmen Kurikulum Merdeka.',
  },
  {
    id: 'p2',
    judul: 'Panduan Pembelajaran dan Asesmen (PPA) Edisi Revisi 2024',
    tingkat: 'Umum',
    kategori: 'Panduan Asesmen',
    ukuran: '3.2 MB',
    format: 'PDF',
    deskripsi: 'Pedoman resmi pelaksanaan asesmen formatif, sumatif, dan penyusunan kriteria ketercapaian.',
  },
  {
    id: 'p3',
    judul: 'Template Dokumen Modul Ajar Deep Learning (Format Word Siap Edit)',
    tingkat: 'SMA/SMK',
    kategori: 'Template Modul',
    ukuran: '850 KB',
    format: 'DOCX',
    deskripsi: 'Format standar modul ajar 3 fase deep learning lengkap dengan rubrik dan lembar LKPD.',
  },
  {
    id: 'p4',
    judul: 'Master Aplikasi Pengolahan Rapor Kurikulum Merdeka (Excel Otomatis)',
    tingkat: 'SMA/SMK',
    kategori: 'Aplikasi Excel',
    ukuran: '2.1 MB',
    format: 'XLSX',
    deskripsi: 'Spreadsheet otomatis untuk konversi skor TP menjadi deskripsi capaian rapor e-Rapor.',
  },
  {
    id: 'p5',
    judul: 'Panduan Pengembangan Kurikulum Operasional Satuan Pendidikan (KOSP)',
    tingkat: 'Umum',
    kategori: 'Regulasi Resmi',
    ukuran: '2.5 MB',
    format: 'PDF',
    deskripsi: 'Panduan penyusunan kurikulum tingkat satuan pendidikan dan pengorganisasian pembelajaran.',
  },
  {
    id: 'p6',
    judul: 'Modul Kokurikuler Interdisipliner & P5 Tema Rekayasa dan Teknologi',
    tingkat: 'SMA/SMK',
    kategori: 'Template Modul',
    ukuran: '1.4 MB',
    format: 'DOCX',
    deskripsi: 'Rancangan modul proyek penguatan profil pelajar 4 tahap alur pembelajaran.',
  },
  {
    id: 'p7',
    judul: 'Panduan & Lembar Pantau 7 Kebiasaan Anak Indonesia Hebat (Kemendikdasmen)',
    tingkat: 'Umum',
    kategori: 'Kokurikuler & Karakter',
    ukuran: '1.8 MB',
    format: 'DOCX',
    deskripsi: 'Format instrumen resmi pembiasaan bangun pagi, beribadah, berolahraga, makan sehat, gemar belajar, bermasyarakat, dan tidur cepat.',
  },
];

export const DownloadPerangkat: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTingkat, setSelectedTingkat] = useState('Semua');

  const filtered = TEMPLATES.filter((t) => {
    const matchTingkat = selectedTingkat === 'Semua' || t.tingkat === selectedTingkat || t.tingkat === 'Umum';
    const matchSearch =
      t.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.deskripsi.toLowerCase().includes(searchTerm.toLowerCase());
    return matchTingkat && matchSearch;
  });

  const handleDownload = (t: PerangkatTemplate) => {
    // Generate text/dummy file download demonstration
    const blob = new Blob(
      [
        `DOKUMEN RESMI KURIKULUM MERDEKA\nJudul: ${t.judul}\nKategori: ${t.kategori}\nTingkat: ${t.tingkat}\nDeskripsi: ${t.deskripsi}\n\nDiunduh melalui Tongguru Aplikasi (EdAdmin Pro) pada ${new Date().toLocaleString('id-ID')}`,
      ],
      { type: 'text/plain;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${t.judul.replace(/[^a-zA-Z0-9_-]/g, '_')}.${t.format.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Swal.fire({
      title: 'Unduhan Berhasil Disiapkan',
      text: `File "${t.judul}" berhasil diunduh.`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1a3a5c] to-blue-900 text-white p-6 rounded-2xl shadow-md space-y-2">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-white/10 rounded-xl">
            <FolderDown className="w-6 h-6 text-amber-300" />
          </span>
          <div>
            <h2 className="text-xl font-bold">Repositori Perangkat Ajar Kurikulum Merdeka</h2>
            <p className="text-xs text-blue-200">
              Koleksi terverifikasi regulasi BSKAP, panduan asesmen, dan template instrumen mengajar siap pakai.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari regulasi, panduan, atau template modul..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['Semua', 'SD/MI', 'SMP/MTs', 'SMA/SMK'].map((jenjang) => (
            <button
              key={jenjang}
              onClick={() => setSelectedTingkat(jenjang)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedTingkat === jenjang
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {jenjang}
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((t) => (
          <div
            key={t.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-blue-400 transition-all space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    t.format === 'PDF'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      : t.format === 'DOCX'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {t.format} • {t.ukuran}
                </span>

                <span className="text-xs text-slate-400 font-medium">{t.kategori}</span>
              </div>

              <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
                {t.judul}
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                {t.deskripsi}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">{t.tingkat}</span>
              <button
                onClick={() => handleDownload(t)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white text-xs font-semibold rounded-lg transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Berkas
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
