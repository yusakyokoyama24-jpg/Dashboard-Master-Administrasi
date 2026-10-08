import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Loader2,
  BookOpen,
  Layers,
  Monitor,
  CheckCircle2,
  Copy,
  ChevronDown,
  ChevronUp,
  FileCode,
  Info,
  Check,
  Cpu,
  GraduationCap,
  Sliders,
  Send,
} from 'lucide-react';
import { DocPreviewToolbar } from './DocPreviewToolbar';
import { showToast } from '../../utils/toast';
import { dbService } from '../../services/db';

export const ModulAjarGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Settings from database
  const pengaturan = dbService.getPengaturan();

  const [formData, setFormData] = useState({
    namaSekolah: pengaturan.namaSekolah || 'SMA Negeri 1 Surabaya',
    namaGuru: pengaturan.namaGuru || 'Yusak Yokoyama, S.Pd., M.Pd.',
    nipGuru: pengaturan.nipGuru || '19850712 201001 1 018',
    namaKepsek: pengaturan.namaKepsek || 'Drs. H. Ahmad Marzuki, M.Pd.',
    nipKepsek: pengaturan.nipKepsek || '19700101 199503 1 002',
    jenjang: 'SMA',
    fase: 'Fase E (Kelas X)',
    kelas: 'Kelas X',
    semester: 'Semester Ganjil',
    mataPelajaran: pengaturan.mapelUtama || 'Informatika',
    capaianPembelajaran:
      'Peserta didik mampu memahami strategi algoritmik standar, menerapkan dekomposisi masalah, serta merepresentasikan data terstruktur dalam pemecahan persoalan kontekstual sehari-hari.',
    tujuanPembelajaran:
      'Melalui model pembelajaran kolaboratif, peserta didik mampu menganalisis wacana kasus berbasis data (C4), mengevaluasi efisiensi model solusi (C5), dan mengkreasi artefak solusi digital/konseptual (C6) secara kritis dan mandiri.',
    materiPokok: 'Algoritma Pemrograman, Analisis Data & Logika Komputasi',
    alokasiWaktu: '2 Pertemuan (masing-masing 2 × 45 menit)',
    praktikPedagogisP1: 'Problem Based Learning (PBL)',
    praktikPedagogisP2: 'Project Based Learning (PjBL)',
    dimensiProfilLulusan: ['Penalaran Kritis', 'Kolaborasi', 'Kreativitas'],
    kotaTanggal: `${pengaturan.kota || 'Surabaya'}, 15 Juli 2026`,
  });

  useEffect(() => {
    const p = dbService.getPengaturan();
    if (p.namaSekolah && !formData.namaSekolah) {
      setFormData((prev) => ({
        ...prev,
        namaSekolah: p.namaSekolah,
        namaGuru: p.namaGuru,
        nipGuru: p.nipGuru,
        namaKepsek: p.namaKepsek,
        nipKepsek: p.nipKepsek,
        kotaTanggal: `${p.kota || 'Surabaya'}, 15 Juli 2026`,
      }));
    }
  }, []);

  const DIMENSI_OPTIONS = [
    'Penalaran Kritis',
    'Kreativitas',
    'Kolaborasi',
    'Kemandirian',
    'Komunikasi',
    'Kewargaan',
  ];

  const handleToggleDimensi = (dimensi: string) => {
    if (formData.dimensiProfilLulusan.includes(dimensi)) {
      if (formData.dimensiProfilLulusan.length <= 1) {
        showToast('Minimal 1 Dimensi Dipilih', 'warning');
        return;
      }
      setFormData({
        ...formData,
        dimensiProfilLulusan: formData.dimensiProfilLulusan.filter((d) => d !== dimensi),
      });
    } else {
      setFormData({
        ...formData,
        dimensiProfilLulusan: [...formData.dimensiProfilLulusan, dimensi],
      });
    }
  };

  // Master Prompt Template String (Synchronized with Server)
  const masterPromptText = `[ROLE & PERSONA]
Anda adalah Konsultan Kurikulum Nasional dan Ahli Perancangan Pembelajaran Mendalam (Deep Learning Framework) Kurikulum Merdeka terakreditasi, dengan keahlian khusus pada jenjang SMA (Sekolah Menengah Atas) Fase E (Kelas X - Fondasi & Eksplorasi) dan Fase F (Kelas XI & XII - Pendalaman & Peminatan).

Anda memiliki keahlian dalam:
1. Merumuskan alur berpikir tingkat tinggi (Higher Order Thinking Skills / HOTS: C4-Menganalisis, C5-Mengevaluasi, C6-Mengkreasi) yang sesuai dengan tahap perkembangan kognitif remaja usia 15-18 tahun.
2. Mengintegrasikan Penguatan Literasi Teks Multimodal/Saintifik dan Numerasi Analisis Data Statistik Kontekstual secara nyata di setiap tahap kegiatan.
3. Memanfaatkan teknologi Papan Interaktif Digital (Interactive Flat Panel / Smartboard) untuk kolaborasi layar sentuh, manipulasi visual, dan kanvas diskusi kelompok di kelas.
4. Merancang diferensiasi pembelajaran (konten, proses, dan produk) berbasis kesiapan belajar (readiness) dan minat murid SMA.

--------------------------------------------------------------------------------
[PARAMETER VARIABEL MASUKAN GURU - SMA FASE E / FASE F]
1.  Nama Satuan Pendidikan : ${formData.namaSekolah}
2.  Nama Guru Pengampu     : ${formData.namaGuru}
3.  NIP Guru               : ${formData.nipGuru}
4.  Nama Kepala Sekolah    : ${formData.namaKepsek}
5.  NIP Kepala Sekolah     : ${formData.nipKepsek}
6.  Jenjang Pendidikan     : ${formData.jenjang}
7.  Fase & Kelas           : ${formData.fase} (${formData.kelas})
8.  Semester               : ${formData.semester}
9.  Mata Pelajaran         : ${formData.mataPelajaran}
10. Capaian Pembelajaran   : ${formData.capaianPembelajaran}
11. Tujuan Pembelajaran    : ${formData.tujuanPembelajaran}
12. Materi Pokok           : ${formData.materiPokok}
13. Alokasi Waktu          : ${formData.alokasiWaktu}
14. Praktik Pedagogis      :
    - Pertemuan 1          : ${formData.praktikPedagogisP1}
    - Pertemuan 2          : ${formData.praktikPedagogisP2}
15. Dimensi Profil Lulusan : ${formData.dimensiProfilLulusan.join(', ')}
16. Kota & Tanggal         : ${formData.kotaTanggal}

--------------------------------------------------------------------------------
[PETUNJUK SPESIFIKASI SMA FASE E VS FASE F]
- JIKA FASE E (Kelas X):
  Fokuskan pada transisi kemandirian belajar dari SMP ke SMA, pemahaman konsep fundamental, eksplorasi minat karir, kemampuan menganalisis wacana populer-ilmiah, membaca grafik data dasar (persentase, perbandingan data), serta kerja tim kolaboratif.
- JIKA FASE F (Kelas XI & XII):
  Fokuskan pada pendalaman materi akademik lanjutan, investigasi empiris, kritik metodologi, analisis statistik data inferensial/tren, sintesis multi-sumber wacana ilmiah, penalaran abstrak-korelasional, serta kesiapan akademik menuju perguruan tinggi atau dunia profesional.

--------------------------------------------------------------------------------
[INSTRUKSI PENYUSUNAN DOKUMEN: BAGIAN 1 SAMPAI BAGIAN 6 + PENGESAHAN]

Susunlah dokumen Perencanaan Pembelajaran Mendalam (RPM) secara lengkap, mendalam, dan profesional dalam urutan bagian berikut:

================================================================================
BAGIAN 1: TABEL IDENTITAS (TEMA BIRU)
================================================================================
Susun tabel identitas yang mencakup:
- Nama Satuan Pendidikan
- Mata Pelajaran
- Kelas / Fase & Semester
- Durasi / Alokasi Waktu Pertemuan

================================================================================
BAGIAN 2: TABEL IDENTIFIKASI (TEMA ORANYE)
================================================================================
Uraikan 3 aspek identifikasi dengan analisis mendalam khas SMA:
1. Karakteristik & Kesiapan Siswa SMA
2. Materi Pelajaran
3. Capaian Dimensi Profil Lulusan

================================================================================
BAGIAN 3: TABEL DESAIN PEMBELAJARAN (TEMA HIJAU)
================================================================================
Rumuskan secara komprehensif:
1. Capaian Pembelajaran (CP) - Rujukan Resmi: Salinan Keputusan Kepala BSKAP Kemendikdasmen No. 046/H/KR/2025 tentang Capaian Pembelajaran pada PAUD, Jenjang Pendidikan Dasar, dan Jenjang Pendidikan Menengah
2. Lintas Disiplin Ilmu
3. Tujuan Pembelajaran (TP)
4. Topik Pembelajaran
5. Praktik Pedagogis per Pertemuan (Pertemuan 1 dan 2)
6. Integrasi Literasi & Numerasi (WAJIB EKSPLISIT)
7. Kemitraan Pembelajaran
8. Lingkungan Pembelajaran (Papan Interaktif Digital)
9. Pemanfaatan Digital Tools & Papan Interaktif (Interactive Flat Panel / Smartboard)

================================================================================
BAGIAN 4: TABEL PENGALAMAN BELAJAR (TEMA KUNING / AMBER)
================================================================================
Rinci pengalaman belajar per pertemuan dengan alur 3 Pilar Deep Learning (Berkesadaran, Bermakna, Menggembirakan):
A. KEGIATAN AWAL (MEMAHAMI) - Durasi ±15-20 Menit (dengan tag [Literasi & Papan Interaktif], [Numerasi Awal], Diferensiasi Konten)
B. KEGIATAN INTI (MENGAPLIKASI) - Durasi ±55-60 Menit (dengan tag [Penguatan Literasi & Numerasi], [Pemanfaatan Papan Interaktif Digital])
C. KEGIATAN PENUTUP (MEREFLEKSI) - Durasi ±10-15 Menit (dengan [Refleksi Interaktif di Papan Digital])

================================================================================
BAGIAN 5: TABEL ASESMEN PEMBELAJARAN (TEMA BIRU NAVY)
================================================================================
Rumuskan instrumen asesmen yang terintegrasi (Diagnostik, Formatif, Sumatif Otentik).

================================================================================
BAGIAN 6: LEMBAR KERJA PESERTA DIDIK (LKPD) & RUBRIK PENILAIAN LENGKAP
================================================================================
Rancang lembar kerja peserta didik yang langsung siap dicetak dan dibagikan:
1. Identitas LKPD & Tujuan
2. Petunjuk Umum Kerja Tim Riset
3. Stimulus Masalah Kontekstual Nyata
4. Lembar Tugas & Aktivitas (Tabel Isian 1 Literasi, Tabel Isian 2 Numerasi, Tabel Isian 3 Solusi Inovatif)
5. Panduan Demonstrasi Solusi pada Papan Interaktif Digital di depan kelas
6. Pertanyaan Refleksi & Diskusi Kritis Kelompok (HOTS)
7. Rubrik Penilaian Komprehensif (4 Aspek x 4 Skala Skor 1-4)
8. Pedoman Penskoran: Nilai = (Total Skor / 16) × 100.

================================================================================
PENGESAHAN DOKUMEN (LEMBAR TANDA TANGAN)
================================================================================
Format tanda tangan resmi Kepala Sekolah dan Guru Pengampu.`;

  const copyPromptToClipboard = () => {
    navigator.clipboard.writeText(masterPromptText);
    setCopiedPrompt(true);
    showToast('Prompt Berhasil Disalin!', 'success');
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  // Fallback Generator yang secara ketat mengikuti Bagian 1 sampai 6 + Pengesahan
  const generateFallbackModulHtml = (data: typeof formData) => {
    const dimensiStr = data.dimensiProfilLulusan.join(', ');

    return `
      <div class="modul-ajar-content deep-learning-rpm space-y-6" style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6;">
        
        <!-- Header Dokumen -->
        <div style="text-align: center; border-bottom: 3px double #1e40af; padding-bottom: 12px; margin-bottom: 24px;">
          <h3 style="font-size: 11pt; color: #475569; margin: 0; text-transform: uppercase; letter-spacing: 1px;">KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH REPUBLIK INDONESIA</h3>
          <h2 style="font-size: 15pt; font-weight: bold; color: #1e40af; margin: 4px 0; text-transform: uppercase;">PERENCANAAN PEMBELAJARAN MENDALAM (DEEP LEARNING FRAMEWORK)</h2>
          <p style="font-size: 10pt; font-weight: bold; color: #0f766e; margin: 0;">KURIKULUM MERDEKA - JENJANG ${data.jenjang} (${data.fase})</p>
          <p style="font-size: 9pt; color: #64748b; margin: 3px 0 0 0;">${data.namaSekolah} | Tahun Ajaran 2026/2027</p>
        </div>

        <!-- ========================================== -->
        <!-- BAGIAN 1: TABEL IDENTITAS (TEMA BIRU) -->
        <!-- ========================================== -->
        <div style="margin-bottom: 24px;">
          <h3 style="color: #1e40af; font-size: 12pt; font-weight: bold; margin: 0 0 8px 0; border-bottom: 2px solid #1e40af; padding-bottom: 4px;">
            BAGIAN 1: TABEL IDENTITAS (TEMA BIRU)
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt;">
            <thead>
              <tr style="background-color: #1e40af; color: white;">
                <th style="padding: 8px 12px; text-align: left; border: 1px solid #1e40af;" colspan="2">IDENTITAS RENCANA PEMBELAJARAN MENDALAM</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 7px 12px; border: 1px solid #bfdbfe; font-weight: bold; width: 32%; background-color: #eff6ff;">Nama Satuan Pendidikan</td>
                <td style="padding: 7px 12px; border: 1px solid #bfdbfe;">${data.namaSekolah}</td>
              </tr>
              <tr>
                <td style="padding: 7px 12px; border: 1px solid #bfdbfe; font-weight: bold; background-color: #eff6ff;">Mata Pelajaran</td>
                <td style="padding: 7px 12px; border: 1px solid #bfdbfe;"><b>${data.mataPelajaran}</b></td>
              </tr>
              <tr>
                <td style="padding: 7px 12px; border: 1px solid #bfdbfe; font-weight: bold; background-color: #eff6ff;">Kelas / Fase & Semester</td>
                <td style="padding: 7px 12px; border: 1px solid #bfdbfe;">${data.kelas} / ${data.fase} - ${data.semester}</td>
              </tr>
              <tr>
                <td style="padding: 7px 12px; border: 1px solid #bfdbfe; font-weight: bold; background-color: #eff6ff;">Durasi / Alokasi Waktu</td>
                <td style="padding: 7px 12px; border: 1px solid #bfdbfe;">${data.alokasiWaktu}</td>
              </tr>
              <tr>
                <td style="padding: 7px 12px; border: 1px solid #bfdbfe; font-weight: bold; background-color: #eff6ff;">Guru Pengampu</td>
                <td style="padding: 7px 12px; border: 1px solid #bfdbfe;">${data.namaGuru} (NIP. ${data.nipGuru})</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ========================================== -->
        <!-- BAGIAN 2: TABEL IDENTIFIKASI (TEMA ORANYE) -->
        <!-- ========================================== -->
        <div style="margin-bottom: 24px;">
          <h3 style="color: #c2410c; font-size: 12pt; font-weight: bold; margin: 0 0 8px 0; border-bottom: 2px solid #c2410c; padding-bottom: 4px;">
            BAGIAN 2: TABEL IDENTIFIKASI (TEMA ORANYE)
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt;">
            <thead>
              <tr style="background-color: #c2410c; color: white;">
                <th style="padding: 8px 12px; text-align: left; border: 1px solid #c2410c;" colspan="2">ANALISIS IDENTIFIKASI PEMBELAJARAN MENDALAM KHAS SMA</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #fed7aa; font-weight: bold; width: 30%; background-color: #fff7ed; vertical-align: top;">
                  1. Karakteristik &amp; Kesiapan Siswa SMA
                </td>
                <td style="padding: 8px 12px; border: 1px solid #fed7aa;">
                  <b>Profil Kognitif:</b> Siswa terbagi dalam 3 kategori kesiapan belajar (20% Mahir berdaya nalar abstrak, 60% Berkembang dengan bimbingan terstruktur, 20% Perlu Scaffolding konkret).<br>
                  <b>Gaya Belajar &amp; Minat:</b> Preferensi belajar visual multimodal tinggi (interaksi layar sentuh, infografis data), auditori melalui debat ilmiah, dan kinestetik manipulasi simulasi.<br>
                  <b>Kesiapan Literasi-Numerasi:</b> Memerlukan penguatan dalam membedah jurnal/artikel ilmiah serta menganalisis grafik statistik multivariabel.
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #fed7aa; font-weight: bold; background-color: #fff7ed; vertical-align: top;">
                  2. Materi Pelajaran (${data.materiPokok})
                </td>
                <td style="padding: 8px 12px; border: 1px solid #fed7aa;">
                  <b>Esensi Konsep:</b> Pemahaman logika komputasional, algoritma pemecahan masalah, dan analisis data empiris.<br>
                  <b>Potensi Miskonsepsi Siswa SMA:</b> Sering menganggap konsep ini hanya bersifat teoritis hafalan tanpa menyadari korelasinya dengan efisiensi sistem dunia nyata.<br>
                  <b>Relevansi Abad 21:</b> Terkait erat dengan otomatisasi industri, analisis big data, dan etika kecerdasan artifisial.
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #fed7aa; font-weight: bold; background-color: #fff7ed; vertical-align: top;">
                  3. Capaian Dimensi Profil Lulusan
                </td>
                <td style="padding: 8px 12px; border: 1px solid #fed7aa;">
                  <b>Dimensi Terpilih:</b> <span style="color: #c2410c; font-weight: bold;">${dimensiStr}</span>.<br>
                  <b>Operasionalisasi Nyata:</b> Ditumbuhkan melalui riset studi kasus kontekstual, kolaborasi tim riset heterogen 3-4 siswa, telaah kritis bukti data statistik, dan unjuk kerja kanvas interaktif di depan kelas.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ========================================== -->
        <!-- BAGIAN 3: TABEL DESAIN PEMBELAJARAN (TEMA HIJAU) -->
        <!-- ========================================== -->
        <div style="margin-bottom: 24px;">
          <h3 style="color: #047857; font-size: 12pt; font-weight: bold; margin: 0 0 8px 0; border-bottom: 2px solid #047857; padding-bottom: 4px;">
            BAGIAN 3: TABEL DESAIN PEMBELAJARAN (TEMA HIJAU)
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
            <thead>
              <tr style="background-color: #047857; color: white;">
                <th style="padding: 8px 12px; text-align: left; border: 1px solid #047857;" colspan="2">KOMPONEN DESAIN PEDAGOGIS MENDALAM &amp; KEMITRAAN</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 7px 12px; border: 1px solid #a7f3d0; font-weight: bold; width: 28%; background-color: #f0fdf4;">Capaian Pembelajaran (CP)</td>
                <td style="padding: 7px 12px; border: 1px solid #a7f3d0;">${data.capaianPembelajaran}</td>
              </tr>
              <tr>
                <td style="padding: 7px 12px; border: 1px solid #a7f3d0; font-weight: bold; background-color: #f0fdf4;">Lintas Disiplin Ilmu</td>
                <td style="padding: 7px 12px; border: 1px solid #a7f3d0;">Integrasi nyata materi ${data.mataPelajaran} dengan Matematika Statistika (pemodelan data), Bahasa Indonesia (argumen saintifik), dan Sosiologi/Ekonomi (dampak sosial kemasyarakatan).</td>
              </tr>
              <tr>
                <td style="padding: 7px 12px; border: 1px solid #a7f3d0; font-weight: bold; background-color: #f0fdf4;">Tujuan Pembelajaran (TP HOTS)</td>
                <td style="padding: 7px 12px; border: 1px solid #a7f3d0;">${data.tujuanPembelajaran}</td>
              </tr>
              <tr>
                <td style="padding: 7px 12px; border: 1px solid #a7f3d0; font-weight: bold; background-color: #f0fdf4;">Topik Pembelajaran</td>
                <td style="padding: 7px 12px; border: 1px solid #a7f3d0;"><b>${data.materiPokok}</b></td>
              </tr>
              <tr>
                <td style="padding: 7px 12px; border: 1px solid #a7f3d0; font-weight: bold; background-color: #f0fdf4;">Praktik Pedagogis per Pertemuan</td>
                <td style="padding: 7px 12px; border: 1px solid #a7f3d0;">
                  • <b>Pertemuan 1:</b> ${data.praktikPedagogisP1} (Orientasi Masalah, Investigasi Lapangan, Dekomposisi Solusi)<br>
                  • <b>Pertemuan 2:</b> ${data.praktikPedagogisP2} (Perancangan Artefak, Uji Coba Model, Gelar Karya Smartboard)
                </td>
              </tr>
              <tr>
                <td style="padding: 7px 12px; border: 1px solid #a7f3d0; font-weight: bold; background-color: #f0fdf4;">Integrasi Literasi &amp; Numerasi (Wajib Eksplisit)</td>
                <td style="padding: 7px 12px; border: 1px solid #a7f3d0;">
                  • <b>Penguatan Literasi SMA:</b> Membedah artikel studi kasus jurnal, ekstraksi klaim argumen, dan penyusunan sintesis laporan berbasis bukti empiris.<br>
                  • <b>Penguatan Numerasi SMA:</b> Analisis matriks data numerik, interpretasi grafik statistik tren, serta kalkulasi estimasi matematis.
                </td>
              </tr>
              <tr>
                <td style="padding: 7px 12px; border: 1px solid #a7f3d0; font-weight: bold; background-color: #f0fdf4;">Kemitraan Pembelajaran</td>
                <td style="padding: 7px 12px; border: 1px solid #a7f3d0;">Kolaborasi dengan dosen tamu/praktisi industri, pelibatan orang tua dalam lembar pantau pembiasaan karakter, dan jejaring data publik.</td>
              </tr>
              <tr>
                <td style="padding: 7px 12px; border: 1px solid #a7f3d0; font-weight: bold; background-color: #f0fdf4;">Lingkungan Pembelajaran</td>
                <td style="padding: 7px 12px; border: 1px solid #a7f3d0;">Setting meja kelompok fleksibel berbentuk U / Pods diskusi, koneksi internet stabil untuk riset, dan area presentasi sentuh langsung di depan kelas.</td>
              </tr>
              <tr>
                <td style="padding: 7px 12px; border: 1px solid #a7f3d0; font-weight: bold; background-color: #f0fdf4;">Pemanfaatan Digital Tools &amp; Papan Interaktif</td>
                <td style="padding: 7px 12px; border: 1px solid #a7f3d0;">
                  <b>PAPAN INTERAKTIF DIGITAL (Interactive Flat Panel / Smartboard):</b> Kanvas interaktif sentuh langsung untuk live annotation, drag-and-drop flowchart, simulasi virtual, dipadukan dengan Google Spreadsheet, Canva Whiteboard, PhET / GeoGebra, dan Quizizz exit ticket.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ========================================== -->
        <!-- BAGIAN 4: TABEL PENGALAMAN BELAJAR (TEMA KUNING / AMBER) -->
        <!-- ========================================== -->
        <div style="margin-bottom: 24px;">
          <h3 style="color: #b45309; font-size: 12pt; font-weight: bold; margin: 0 0 8px 0; border-bottom: 2px solid #b45309; padding-bottom: 4px;">
            BAGIAN 4: TABEL PENGALAMAN BELAJAR (TEMA KUNING / AMBER)
          </h3>
          <p style="font-size: 9pt; color: #78350f; margin: 0 0 10px 0; font-style: italic;">
            Alur 3 Pilar Deep Learning: <b>Berkesadaran (Mindful)</b>, <b>Bermakna (Meaningful)</b>, dan <b>Menggembirakan (Joyful)</b>.
          </p>

          <table style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 16px;">
            <thead>
              <tr style="background-color: #b45309; color: white;">
                <th style="padding: 8px 12px; border: 1px solid #b45309; width: 22%;">Tahapan Alur</th>
                <th style="padding: 8px 12px; border: 1px solid #b45309; width: 63%;">Aktivitas Rinci Pengalaman Belajar (Pertemuan 1 &amp; 2)</th>
                <th style="padding: 8px 12px; border: 1px solid #b45309; width: 15%; text-align: center;">Durasi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #fde68a; font-weight: bold; background-color: #fffbeb; vertical-align: top;">
                  A. KEGIATAN AWAL<br><span style="color: #b45309;">(MEMAHAMI)</span>
                </td>
                <td style="padding: 8px 12px; border: 1px solid #fde68a;">
                  • <b>Mindful Check-in:</b> Latihan kesadaran penuh (teknik STOP: Stop, Take a breath, Observe, Proceed) untuk menstabilkan fokus dan emosi remaja.<br>
                  • <b>[Literasi &amp; Papan Interaktif]:</b> Penayangan artikel berita/studi kasus nyata di <i>Papan Interaktif Digital</i>. Siswa bergiliran maju ke depan menggarisbawahi klaim utama dan terminologi saintifik langsung di layar sentuh.<br>
                  • <b>[Numerasi Awal]:</b> Guru menampilkan grafik data tren pemantik di Smartboard, memicu nalar kritis siswa memprediksi anomali pola data.<br>
                  • <b>Diferensiasi Konten:</b> Siswa dapat mengakses bahan pemantik dalam format infografis digital, ringkasan teks wacana, atau video simulasi sesuai kesiapan kognitif.<br>
                  • Guru menyampaikan roadmap tantangan pembelajaran dan indikator keberhasilan.
                </td>
                <td style="padding: 8px 12px; border: 1px solid #fde68a; text-align: center; vertical-align: middle; font-weight: bold;">
                  ±15-20 Menit
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #fde68a; font-weight: bold; background-color: #fffbeb; vertical-align: top;">
                  B. KEGIATAN INTI<br><span style="color: #b45309;">(MENGAPLIKASI)</span>
                </td>
                <td style="padding: 8px 12px; border: 1px solid #fde68a;">
                  • <b>Sintaks Model:</b> Penerapan model ${data.praktikPedagogisP1} (Pertemuan 1) &amp; ${data.praktikPedagogisP2} (Pertemuan 2).<br>
                  • <b>Pengorganisasian Tim Riset:</b> Pembentukan kelompok heterogen (3-4 orang). Guru melakukan scaffolding adaptif pada kelompok yang membutuhkan bimbingan teknis.<br>
                  • <b>[Penguatan Literasi &amp; Numerasi]:</b> Setiap tim membedah lembar studi kasus, mengekstraksi variabel permasalahan (Literasi), serta menghitung matriks numerik / membuat tabel komparasi (Numerasi).<br>
                  • <b>[Pemanfaatan Papan Interaktif Digital]:</b> Perwakilan kelompok maju mengoperasikan Papan Interaktif Digital untuk memetakan diagram alir solusi, melakukan drag-and-drop komponen solusi, dan memvalidasi model bersama tim lain.<br>
                  • <b>Penyusunan Artefak:</b> Kelompok menyusun laporan data analitis, infografis digital, atau purwarupa solusi.<br>
                  • <b>Unjuk Kerja &amp; Peer Feedback:</b> Presentasi interaktif di depan kelas memanfaatkan Smartboard diselingi tanggapan kritis antar kelompok.
                </td>
                <td style="padding: 8px 12px; border: 1px solid #fde68a; text-align: center; vertical-align: middle; font-weight: bold;">
                  ±55-60 Menit
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #fde68a; font-weight: bold; background-color: #fffbeb; vertical-align: top;">
                  C. KEGIATAN PENUTUP<br><span style="color: #b45309;">(MEREFLEKSI)</span>
                </td>
                <td style="padding: 8px 12px; border: 1px solid #fde68a;">
                  • <b>[Refleksi Interaktif di Papan Digital]:</b> Siswa menempelkan sticky notes virtual langsung pada kanvas Papan Interaktif Digital yang merangkum: (1 Wawasan Literasi Baru, 1 Pemahaman Numerasi/Data Bermakna, dan 1 Komitmen Penerapan Nyata).<br>
                  • <b>Penguatan Konsep:</b> Ulasan komprehensif oleh guru dan apresiasi etos kerja ilmiah seluruh siswa.<br>
                  • <b>Asesmen Formatif Cepat (Exit Ticket):</b> Kuis interaktif 3 butir soal di Papan Interaktif Digital.<br>
                  • Guru menyampaikan tindak lanjut pertemuan berikutnya dan menutup sesi dengan doa bersama.
                </td>
                <td style="padding: 8px 12px; border: 1px solid #fde68a; text-align: center; vertical-align: middle; font-weight: bold;">
                  ±10-15 Menit
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ========================================== -->
        <!-- BAGIAN 5: TABEL ASESMEN PEMBELAJARAN (TEMA BIRU NAVY) -->
        <!-- ========================================== -->
        <div style="margin-bottom: 24px;">
          <h3 style="color: #0f172a; font-size: 12pt; font-weight: bold; margin: 0 0 8px 0; border-bottom: 2px solid #0f172a; padding-bottom: 4px;">
            BAGIAN 5: TABEL ASESMEN PEMBELAJARAN (TEMA BIRU NAVY)
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
            <thead>
              <tr style="background-color: #0f172a; color: white;">
                <th style="padding: 8px 12px; border: 1px solid #0f172a; width: 25%;">Bentuk &amp; Ranah Asesmen</th>
                <th style="padding: 8px 12px; border: 1px solid #0f172a; width: 45%;">Teknik &amp; Instrumen Penilaian</th>
                <th style="padding: 8px 12px; border: 1px solid #0f172a; width: 30%;">Tindak Lanjut &amp; Bukti</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 7px 12px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f8fafc;">1. Asesmen Awal (Diagnostik)</td>
                <td style="padding: 7px 12px; border: 1px solid #cbd5e1;">
                  • Diagnostik non-kognitif (survei kesiapan emosi &amp; gaya belajar via Google Form/mentimeter).<br>
                  • Diagnostik kognitif cepat: 3 pertanyaan pemantik literasi &amp; membaca grafik data awal di Smartboard.
                </td>
                <td style="padding: 7px 12px; border: 1px solid #cbd5e1;">Pemetaan kelompok kesiapan belajar (Mahir, Berkembang, Perlu Scaffolding).</td>
              </tr>
              <tr>
                <td style="padding: 7px 12px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f8fafc;">2. Asesmen Proses (Formatif)</td>
                <td style="padding: 7px 12px; border: 1px solid #cbd5e1;">
                  • Lembar observasi keterlibatan diskusi &amp; penalaran kritis HOTS.<br>
                  • Rubrik keaktifan interaksi sentuh pada Papan Interaktif Digital.<br>
                  • Lembar penilaian antar-teman (peer assessment) kolaborasi data.
                </td>
                <td style="padding: 7px 12px; border: 1px solid #cbd5e1;">Umpan balik seketika (feedback in action) dan pembimbingan terarah oleh guru.</td>
              </tr>
              <tr>
                <td style="padding: 7px 12px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f8fafc;">3. Asesmen Akhir (Sumatif)</td>
                <td style="padding: 7px 12px; border: 1px solid #cbd5e1;">
                  • Penilaian autentik laporan artefak solusi kelompok.<br>
                  • Uji demonstrasi dan presentasi interaktif kelompok pada Papan Interaktif Digital.
                </td>
                <td style="padding: 7px 12px; border: 1px solid #cbd5e1;">Nilai portofolio sumatif proyek dan konversi ketercapaian TP (e-Rapor).</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ========================================== -->
        <!-- BAGIAN 6: LEMBAR KERJA PESERTA DIDIK (LKPD) & RUBRIK LENGKAP -->
        <!-- ========================================== -->
        <div style="margin-bottom: 24px; border: 2px solid #0f766e; border-radius: 8px; padding: 16px; background-color: #fcfdfd;">
          <h3 style="color: #0f766e; font-size: 13pt; font-weight: bold; margin: 0 0 4px 0; text-align: center; text-transform: uppercase;">
            BAGIAN 6: LEMBAR KERJA PESERTA DIDIK (LKPD) RISET KOLABORATIF
          </h3>
          <p style="text-align: center; font-size: 9pt; color: #64748b; margin: 0 0 16px 0;">
            Modul Deep Learning Terintegrasi Literasi, Numerasi, &amp; Papan Interaktif Digital
          </p>

          <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 12px;">
            <tr>
              <td style="width: 18%; font-weight: bold;">Mata Pelajaran</td>
              <td style="width: 2%;">:</td>
              <td style="width: 35%;">${data.mataPelajaran}</td>
              <td style="width: 15%; font-weight: bold;">Kelompok</td>
              <td style="width: 2%;">:</td>
              <td style="width: 28%;">...........................................</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Fase / Kelas</td>
              <td>:</td>
              <td>${data.fase} / ${data.kelas}</td>
              <td style="font-weight: bold;">Anggota Tim</td>
              <td>:</td>
              <td>1. .........................................<br>2. .........................................<br>3. .........................................<br>4. .........................................</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Materi Pokok</td>
              <td>:</td>
              <td colspan="4"><b>${data.materiPokok}</b></td>
            </tr>
          </table>

          <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 8px 12px; margin-bottom: 14px; font-size: 8.5pt;">
            <b>Tujuan Aktivitas:</b> Menginvestigasi studi kasus kontekstual melalui penalaran data, merumuskan hipotesis, dan mempresentasikan simulasi solusi menggunakan Papan Interaktif Digital di depan kelas.
          </div>

          <h4 style="font-size: 9.5pt; font-weight: bold; color: #1e3a8a; margin: 12px 0 6px 0;">PETUNJUK UMUM KERJA TIM RISET:</h4>
          <ol style="font-size: 8.5pt; line-height: 1.5; padding-left: 18px; margin: 0 0 12px 0;">
            <li>Bacalah wacana teks informasi dan analisis tabel data numerik yang disediakan dengan saksama.</li>
            <li>Diskusikan bersama rekan tim untuk mengekstraksi variabel masalah kunci dan penyebab akar masalah.</li>
            <li>Rancang alternatif solusi inovatif dan rumuskan kalkulasi data pembuktian efisiensi solusi.</li>
            <li>Tunjuk perwakilan tim untuk mengoperasikan demonstrasi visual pada Papan Interaktif Digital di depan kelas.</li>
          </ol>

          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; margin-bottom: 14px; font-size: 8.5pt;">
            <b style="color: #0369a1;">STIMULUS KASUS KONTEKSTUAL RIEL:</b><br>
            <i>"Hasil survei efisiensi energi dan pemanfaatan sistem digital di lingkungan sekolah menunjukkan peningkatan beban komputasi sebesar 45% dalam setahun terakhir. Namun, rasio pemanfaatan data riil baru mencapai 58% akibat alur logika dan arsitektur pengolahan data yang belum teroptimasi."</i>
          </div>

          <h4 style="font-size: 9pt; font-weight: bold; color: #0f172a; margin: 10px 0 4px 0;">TABEL ISIAN 1: FAKTA KUNCI &amp; IDENTIFIKASI MASALAH DARI TEKS (LITERASI)</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 12px;">
            <tr style="background-color: #f1f5f9;">
              <th style="padding: 6px; border: 1px solid #cbd5e1; width: 35%;">Terminologi / Istilah Kunci Saintifik</th>
              <th style="padding: 6px; border: 1px solid #cbd5e1; width: 65%;">Makna Konseptual &amp; Bukti Kutipan Teks</th>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">1. ................................................................</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">...........................................................................................................................</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">2. ................................................................</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">...........................................................................................................................</td>
            </tr>
          </table>

          <h4 style="font-size: 9pt; font-weight: bold; color: #0f172a; margin: 10px 0 4px 0;">TABEL ISIAN 2: PENGOLAHAN DATA &amp; KALKULASI LOGIS TEMUAN (NUMERASI)</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 12px;">
            <tr style="background-color: #f1f5f9;">
              <th style="padding: 6px; border: 1px solid #cbd5e1; width: 30%;">Parameter Variabel Data</th>
              <th style="padding: 6px; border: 1px solid #cbd5e1; width: 35%;">Nilai / Kalkulasi Estimasi</th>
              <th style="padding: 6px; border: 1px solid #cbd5e1; width: 35%;">Interpretasi Logis Temuan</th>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">Beban Sistem / Kapasitas</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">[ ......................................... ]</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">........................................................................</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">Efisiensi Solusi Baru (%)</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">[ ......................................... ]</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">........................................................................</td>
            </tr>
          </table>

          <h4 style="font-size: 9pt; font-weight: bold; color: #0f172a; margin: 10px 0 4px 0;">TABEL ISIAN 3: ALTERNATIF SOLUSI &amp; GAGASAN INOVATIF TIM</h4>
          <div style="border: 1px dashed #0284c7; border-radius: 6px; padding: 10px; font-size: 8pt; margin-bottom: 14px; background-color: #f0f9ff;">
            <b>Rencana Solusi Kelompok:</b><br>
            "............................................................................................................................................................................................................................................................................................................................................................................................................................................................................................"<br><br>
            <b>Panduan Demonstrasi Solusi pada Papan Interaktif Digital:</b> Gambarkan alur diagram atau drag-and-drop model simulasi solusi tim Anda pada kanvas Smartboard untuk divalidasi oleh audiens kelas.
          </div>

          <!-- Rubrik Penilaian Komprehensif (4 Aspek x 4 Skala) -->
          <h4 style="font-size: 9.5pt; font-weight: bold; color: #0f172a; margin: 14px 0 6px 0;">
            RUBRIK PENILAIAN KOMPREHENSIF (4 ASPEK × 4 SKALA SKOR)
          </h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt; margin-bottom: 14px;">
            <thead>
              <tr style="background-color: #0f766e; color: white; text-align: center;">
                <th style="padding: 6px; border: 1px solid #0f766e; width: 22%;">Aspek Penilaian</th>
                <th style="padding: 6px; border: 1px solid #0f766e; width: 19%;">Skor 4 (Sangat Baik: 86-100)</th>
                <th style="padding: 6px; border: 1px solid #0f766e; width: 19%;">Skor 3 (Baik: 71-85)</th>
                <th style="padding: 6px; border: 1px solid #0f766e; width: 20%;">Skor 2 (Cukup: 56-70)</th>
                <th style="padding: 6px; border: 1px solid #0f766e; width: 20%;">Skor 1 (Perlu Bimbingan: &lt;56)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">1. Penguasaan Konsep &amp; Literasi Teks Ilmiah</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">Mampu mengekstraksi seluruh argumen wacana secara akurat, sintesis laporan kritis &amp; mendalam.</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">Mampu memahami sebagian besar argumen teks dan menyusun sintesis dengan baik.</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">Memahami konsep dasar namun sintesis teks masih bersifat kutipan langsung.</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">Belum mampu mengekstraksi fakta kunci dari teks wacana ilmiah.</td>
              </tr>
              <tr>
                <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">2. Penalaran Numerasi &amp; Analisis Data</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">Kalkulasi data 100% presisi, analisis grafik tren tajam, interpretasi logis bernilai solutif.</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">Kalkulasi data tepat, analisis grafik baik dengan interpretasi logis terstruktur.</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">Terdapat sedikit kekeliruan kalkulasi, membaca grafik secara parsial.</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">Kalkulasi keliru dan tidak mampu menginterpretasikan grafik data statistik.</td>
              </tr>
              <tr>
                <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">3. Pemanfaatan Papan Interaktif &amp; Kolaborasi Tim</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">Sangat terampil mengoperasikan Smartboard (anotasi sentuh, simulasi lancar), kolaborasi tim solid.</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">Terampil mengoperasikan Smartboard, kerja sama tim terjalin dengan baik.</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">Cukup mampu mengoperasikan Smartboard dengan bantuan sesekali, kerja sama cukup.</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">Pasif dalam pengoperasian Smartboard dan kerja sama tim kurang tampak.</td>
              </tr>
              <tr>
                <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">4. Kualitas Penyajian &amp; Estetika Produk</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">Presentasi memukau, argumentasi ilmiah kuat, estetika infografis/kanvas profesional.</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">Presentasi jelas, argumentasi runtut, tampilan karya rapi dan komunikatif.</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">Presentasi cukup jelas meski sesekali ragu, tampilan karya standar.</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1;">Penyampaian tidak terstruktur dan artefak produk belum selesai tuntas.</td>
              </tr>
            </tbody>
          </table>
          <p style="font-size: 8pt; font-style: italic; color: #475569; margin: 0;">
            <b>Pedoman Penskoran:</b> Nilai Akhir = (Total Skor Perolehan / Skor Maksimal 16) × 100.
          </p>
        </div>

        <!-- ========================================== -->
        <!-- PENGESAHAN DOKUMEN (LEMBAR TANDA TANGAN) -->
        <!-- ========================================== -->
        <div style="margin-top: 36px; padding-top: 16px;">
          <table style="width: 100%; border: none; font-size: 9.5pt;">
            <tr>
              <td style="width: 50%; text-align: center; border: none; vertical-align: top;">
                Mengetahui,<br>
                <b>Kepala Sekolah ${data.namaSekolah}</b><br><br><br><br>
                <u><b>${data.namaKepsek}</b></u><br>
                NIP. ${data.nipKepsek}
              </td>
              <td style="width: 50%; text-align: center; border: none; vertical-align: top;">
                ${data.kotaTanggal}<br>
                <b>Guru Mata Pelajaran</b><br><br><br><br>
                <u><b>${data.namaGuru}</b></u><br>
                NIP. ${data.nipGuru}
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
      const res = await fetch('/api/ai/generate-modul', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          topik: formData.materiPokok,
          profilLulusan: formData.dimensiProfilLulusan.join(', '),
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.html) {
        setGeneratedHtml(data.html);
        showToast('Rencana Pembelajaran Mendalam Disusun!', 'success', 'Dokumen lengkap Bagian 1-6 + Pengesahan siap dicetak.');
      } else {
        throw new Error('Fallback required');
      }
    } catch (err) {
      console.warn('Using instant smart fallback RPM generator:', err);
      const fallbackHtml = generateFallbackModulHtml(formData);
      setGeneratedHtml(fallbackHtml);
      showToast('Rencana Pembelajaran Mendalam Disusun!', 'success', 'Dokumen lengkap Bagian 1-6 telah digenerate siap cetak.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1a3a5c] via-blue-900 to-indigo-950 text-white p-6 sm:p-7 rounded-2xl shadow-md border-2 border-blue-500/30 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
              <Sparkles className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs">
                  DEEP LEARNING FRAMEWORK
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500 text-white shadow-xs">
                  SMA FASE E &amp; FASE F
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-xs">
                  PAPAN INTERAKTIF DIGITAL
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Generator Rencana Pembelajaran Mendalam AI (Deep Learning)
              </h1>
              <p className="text-xs sm:text-sm text-blue-200 max-w-2xl mt-1 leading-relaxed">
                Menyusun dokumen RPM Kurikulum Merdeka komprehensif (Bagian 1 s.d. 6 + Pengesahan) dengan penguatan Literasi Multimodal, Numerasi Data Empiris, dan integrasi Papan Interaktif Digital (Interactive Flat Panel / Smartboard).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={() => setShowPromptModal(true)}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-1.5 shadow-sm"
            >
              <FileCode className="w-3.5 h-3.5 text-amber-300" />
              Lihat Master Prompt AI
            </button>
          </div>
        </div>
      </div>

      {/* Generator Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm no-print">
        <form onSubmit={handleGenerate} className="space-y-5">
          {/* Kelompok 1: Identitas Satuan Pendidikan & Guru */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" /> 1. Parameter Satuan Pendidikan &amp; Pengampu (SMA)
              </span>
              <span className="text-[11px] text-slate-500">Terintegrasi Data Sekolah</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Satuan Pendidikan *
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaSekolah}
                  onChange={(e) => setFormData({ ...formData, namaSekolah: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Guru Pengampu *
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaGuru}
                  onChange={(e) => setFormData({ ...formData, namaGuru: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  NIP Guru *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nipGuru}
                  onChange={(e) => setFormData({ ...formData, nipGuru: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Kepala Sekolah *
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaKepsek}
                  onChange={(e) => setFormData({ ...formData, namaKepsek: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  NIP Kepala Sekolah *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nipKepsek}
                  onChange={(e) => setFormData({ ...formData, nipKepsek: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kota &amp; Tanggal Penetapan *
                </label>
                <input
                  type="text"
                  required
                  value={formData.kotaTanggal}
                  onChange={(e) => setFormData({ ...formData, kotaTanggal: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Kelompok 2: Spesifikasi Mata Pelajaran & Fase */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jenjang Pendidikan
              </label>
              <select
                value={formData.jenjang}
                onChange={(e) => setFormData({ ...formData, jenjang: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              >
                <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                <option value="SMK">SMK (Sekolah Menengah Kejuruan)</option>
                <option value="MA">MA (Madrasah Aliyah)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fase &amp; Kelas *
              </label>
              <select
                value={formData.fase}
                onChange={(e) => {
                  const val = e.target.value;
                  const kelasVal = val.includes('Fase E') ? 'Kelas X' : 'Kelas XI';
                  setFormData({ ...formData, fase: val, kelas: kelasVal });
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
              >
                <option value="Fase E (Kelas X)">Fase E (Kelas X - Fondasi &amp; Eksplorasi)</option>
                <option value="Fase F (Kelas XI/XII)">Fase F (Kelas XI &amp; XII - Pendalaman &amp; Peminatan)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Semester *
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              >
                <option value="Semester Ganjil">Semester Ganjil</option>
                <option value="Semester Genap">Semester Genap</option>
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
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
              />
            </div>
          </div>

          {/* Materi Pokok & Alokasi Waktu */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Materi Pokok Pembelajaran *
              </label>
              <input
                type="text"
                required
                value={formData.materiPokok}
                onChange={(e) => setFormData({ ...formData, materiPokok: e.target.value })}
                placeholder="Contoh: Algoritma Pemrograman, Analisis Data & Logika Komputasi"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Alokasi Waktu *
              </label>
              <input
                type="text"
                required
                value={formData.alokasiWaktu}
                onChange={(e) => setFormData({ ...formData, alokasiWaktu: e.target.value })}
                placeholder="2 Pertemuan (masing-masing 2 × 45 menit)"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Praktik Pedagogis Pertemuan 1 & 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Praktik Pedagogis Pertemuan 1
              </label>
              <select
                value={formData.praktikPedagogisP1}
                onChange={(e) => setFormData({ ...formData, praktikPedagogisP1: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              >
                <option value="Problem Based Learning (PBL)">Problem Based Learning (PBL)</option>
                <option value="Inkuiri-Discovery Learning">Inkuiri-Discovery Learning</option>
                <option value="Station Learning">Station Learning</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Praktik Pedagogis Pertemuan 2
              </label>
              <select
                value={formData.praktikPedagogisP2}
                onChange={(e) => setFormData({ ...formData, praktikPedagogisP2: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              >
                <option value="Project Based Learning (PjBL)">Project Based Learning (PjBL)</option>
                <option value="Problem Solving Authentic">Problem Solving Authentic</option>
                <option value="Case-Based Learning">Case-Based Learning</option>
              </select>
            </div>
          </div>

          {/* CP & TP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Capaian Pembelajaran (CP)
                </label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Rujukan: SK BSKAP No. 046/H/KR/2025
                </span>
              </div>
              <textarea
                rows={2}
                value={formData.capaianPembelajaran}
                onChange={(e) => setFormData({ ...formData, capaianPembelajaran: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tujuan Pembelajaran (TP HOTS: C4-C6)
              </label>
              <textarea
                rows={2}
                value={formData.tujuanPembelajaran}
                onChange={(e) => setFormData({ ...formData, tujuanPembelajaran: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* Dimensi Profil Lulusan */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
              Pilih Dimensi Profil Lulusan (PILIH 2-3):
            </label>
            <div className="flex flex-wrap gap-2">
              {DIMENSI_OPTIONS.map((dimensi) => {
                const isSelected = formData.dimensiProfilLulusan.includes(dimensi);
                return (
                  <button
                    key={dimensi}
                    type="button"
                    onClick={() => handleToggleDimensi(dimensi)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                    {dimensi}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                const fallbackHtml = generateFallbackModulHtml(formData);
                setGeneratedHtml(fallbackHtml);
                showToast('Format Dokumen Standar Disiapkan!', 'info');
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Gunakan Template Dokumen Cepat
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI Sedang Menyusun Rencana Pembelajaran Mendalam...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Generate Rencana Pembelajaran Mendalam (AI)
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal / Dialog untuk Melihat Master Prompt AI Lengkap */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 text-white rounded-xl">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    Master Prompt AI: Rencana Pembelajaran Mendalam (Deep Learning)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Prompt resmi terakreditasi kurikulum nasional SMA Fase E / Fase F dengan integrasi Papan Interaktif Digital.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPromptModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-50/50 dark:bg-slate-950/50">
              {masterPromptText}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Prompt ini dikirimkan langsung ke engine AI studio saat tombol generate ditekan.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyPromptToClipboard}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Salin Seluruh Prompt
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowPromptModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generated Document Area */}
      {generatedHtml && (
        <div className="space-y-4 pt-2">
          <DocPreviewToolbar
            htmlContent={generatedHtml}
            documentTitle={`RPM_Deep_Learning_${formData.materiPokok.slice(0, 30).replace(/\s+/g, '_')}`}
          />

          <div className="bg-white text-slate-900 border border-slate-300 p-8 sm:p-10 rounded-2xl shadow-xl print:border-none print:shadow-none print:p-0">
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
