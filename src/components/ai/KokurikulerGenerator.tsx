import React, { useState, useEffect } from 'react';
import {
  Target,
  Sparkles,
  Loader2,
  Users,
  Sun,
  Dumbbell,
  Apple,
  BookOpen,
  Moon,
  CheckCircle2,
  Calendar,
  FileText,
  Printer,
  Download,
  Award,
  ChevronRight,
  ShieldCheck,
  HeartHandshake,
  Heart,
  RefreshCw,
  Clock,
  Check,
} from 'lucide-react';
import { DocPreviewToolbar } from './DocPreviewToolbar';
import { showToast } from '../../utils/toast';
import { dbService as db } from '../../services/db';
import { Pengaturan, Siswa } from '../../types';

// Data Resmi 7 Kebiasaan Anak Indonesia Hebat (Kemendikdasmen RI)
export const TUJUH_KEBIASAAN = [
  {
    id: 'bangun-pagi',
    nomor: 1,
    nama: 'Bangun Pagi',
    tagline: 'Disiplin Waktu & Memulai Hari dengan Energi Positif',
    icon: Sun,
    warna: 'from-amber-500 to-orange-600',
    warnaBorder: 'border-amber-400',
    warnaBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200',
    badgeColor: 'bg-amber-500 text-white',
    makna:
      'Melatih kedisiplinan diri, menghargai waktu, memancarkan kesiapan mental dan fisik menyambut hari sebelum fajar/subuh.',
    aksiSekolah: 'Datang ke sekolah tepat waktu sebelum bel berbunyi, mengikuti apel/hening pagi dengan khidmat dan bugar.',
    aksiRumah: 'Bangun tidur sebelum subuh/jam 05.00 WIB, merapikan kasur sendiri, dan bersiap dengan mandiri tanpa dibangunkan berulang kali.',
    indikator: 'Tepat waktu tiba di sekolah, tidak terburu-buru, fisik bugar, siap belajar di jam pertama.',
  },
  {
    id: 'taat-beribadah',
    nomor: 2,
    nama: 'Taat Beribadah',
    tagline: 'Memperkuat Moralitas, Spiritualitas, & Integritas',
    icon: HeartHandshake,
    warna: 'from-emerald-500 to-teal-700',
    warnaBorder: 'border-emerald-400',
    warnaBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200',
    badgeColor: 'bg-emerald-600 text-white',
    makna:
      'Menanamkan rasa syukur kepada Tuhan Yang Maha Esa, menumbuhkan empati, integritas moral, serta sikap toleransi antar umat beragama.',
    aksiSekolah: 'Berdoa khusyuk sebelum dan sesudah belajar, menjalankan ibadah wajib tepat waktu di tempat ibadah sekolah.',
    aksiRumah: 'Melaksanakan ibadah bersama keluarga di rumah, tadarus/renungan harian, dan bersyukur atas nikmat harian.',
    indikator: 'Menjaga kejujuran dalam perkataan dan tindakan, menghormati keyakinan sesama, tidak mudah mengeluh.',
  },
  {
    id: 'rajin-berolahraga',
    nomor: 3,
    nama: 'Rajin Berolahraga',
    tagline: 'Tubuh Kuat, Mental Tangguh, & Jiwa Sportif',
    icon: Dumbbell,
    warna: 'from-blue-500 to-indigo-700',
    warnaBorder: 'border-blue-400',
    warnaBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200',
    badgeColor: 'bg-blue-600 text-white',
    makna:
      'Membentuk fisik yang bugar, meningkatkan daya tahan tubuh, mengurangi stres belajar, serta melatih daya juang dan sportivitas.',
    aksiSekolah: 'Senam bersama setiap Jumat pagi, aktif dalam permainan tradisional/olahraga saat jam istirahat dan PJOK.',
    aksiRumah: 'Melakukan senam/jalan kaki/peregangan 15-30 menit setiap hari, bersepeda, atau bermain fisik aktif di luar ruangan.',
    indikator: 'Kebugaran fisik prima, jarang absen karena sakit ringan, bersemangat saat beraktivitas jasmani.',
  },
  {
    id: 'makan-sehat',
    nomor: 4,
    nama: 'Makan Sehat & Bergizi',
    tagline: 'Nutrisi Seimbang untuk Tumbuh Kembang & Fokus Belajar',
    icon: Apple,
    warna: 'from-rose-500 to-pink-700',
    warnaBorder: 'border-rose-400',
    warnaBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200',
    badgeColor: 'bg-rose-600 text-white',
    makna:
      'Membiasakan pola makan kaya gizi seimbang (Isi Piringku), menjaga kebersihan pangan, mencukupi cairan tubuh, serta menjauhi makanan instan berlebih.',
    aksiSekolah: 'Membawa bekal sehat dari rumah, program sarapan sehat bersama di kelas, mencuci tangan pakai sabun.',
    aksiRumah: 'Sarapan bergizi sebelum berangkat, rutin makan sayur dan buah segar, minum air putih minimal 8 gelas sehari.',
    indikator: 'Konsentrasi belajar terjaga, tidak lemas di kelas, bijak memilih jajanan sehat di kantin.',
  },
  {
    id: 'gemar-belajar',
    nomor: 5,
    nama: 'Gemar Belajar',
    tagline: 'Menumbuhkan Rasa Ingin Tahu & Karakter Pembelajar Sepanjang Hayat',
    icon: BookOpen,
    warna: 'from-violet-500 to-purple-700',
    warnaBorder: 'border-violet-400',
    warnaBg: 'bg-violet-50 dark:bg-violet-950/40 text-violet-900 dark:text-violet-200',
    badgeColor: 'bg-violet-600 text-white',
    makna:
      'Mengembangkan rasa haus akan ilmu, kemampuan literasi kritis, pemecahan masalah (problem solving), dan kegemaran membaca buku.',
    aksiSekolah: 'Gerakan Literasi Sekolah (GLS) 15 menit membaca sebelum pelajaran dimulai, aktif bertanya dan berdiskusi.',
    aksiRumah: 'Menyediakan waktu khusus belajar dan membaca buku non-pelajaran 30 menit per hari tanpa distraksi gawai.',
    indikator: 'Memiliki catatan literasi/resume bacaan berkala, aktif mengeksplorasi wawasan baru, tugas mandiri tuntas tepat waktu.',
  },
  {
    id: 'bermasyarakat',
    nomor: 6,
    nama: 'Bermasyarakat',
    tagline: 'Peduli Sesama, Gotong Royong, & Cinta Lingkungan',
    icon: Users,
    warna: 'from-teal-500 to-cyan-700',
    warnaBorder: 'border-teal-400',
    warnaBg: 'bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200',
    badgeColor: 'bg-teal-600 text-white',
    makna:
      'Menumbuhkan empati sosial, sopan santun 5S (Senyum, Sapa, Salam, Sopan, Santun), kemampuan berkolaborasi, dan kesadaran menjaga kelestarian lingkungan.',
    aksiSekolah: 'Operasi semut membersihkan kelas/lingkungan sekolah, membantu teman yang kesulitan, bersikap santun kepada guru & staf.',
    aksiRumah: 'Menyapa dan ramah pada tetangga sekitar, aktif kegiatan rukun warga/karang taruna, memilah sampah rumah tangga.',
    indikator: 'Memiliki kepekaan sosial tinggi, disukai teman, tidak melakukan perundungan (anti-bullying), aktif bergotong royong.',
  },
  {
    id: 'tidur-cepat',
    nomor: 7,
    nama: 'Tidur Cepat (Tepat Waktu)',
    tagline: 'Pemulihan Energi & Pola Hidup Seimbang',
    icon: Moon,
    warna: 'from-slate-600 to-indigo-900',
    warnaBorder: 'border-indigo-400',
    warnaBg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200',
    badgeColor: 'bg-indigo-700 text-white',
    makna:
      'Menjaga ritme sirkadian tubuh, regenerasi sel otak dan fisik, serta membatasi durasi tatap layar (screen-free) di malam hari.',
    aksiSekolah: 'Tidak mengantuk saat pelajaran berlangsung, memiliki stamina belajar yang stabil dari pagi hingga sore.',
    aksiRumah: 'Tidur sebelum pukul 21.30 WIB, mematikan notifikasi gawai 30 menit sebelum tidur, ruangan tidur tenang dan nyaman.',
    indikator: 'Tidur cukup 7-8 jam per malam, bangun tidur terasa segar, tidak begadang untuk aktivitas yang kurang produktif.',
  },
];

export const KokurikulerGenerator: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'panduan' | 'jurnal' | 'modul'>('panduan');
  const [loading, setLoading] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);

  // Database settings & students
  const [pengaturan, setPengaturan] = useState<Pengaturan>(db.getPengaturan());
  const [siswaList, setSiswaList] = useState<Siswa[]>(db.getSiswa());

  useEffect(() => {
    setPengaturan(db.getPengaturan());
    setSiswaList(db.getSiswa());
  }, []);

  // Form State for Modul Proyek
  const [selectedKebiasaan, setSelectedKebiasaan] = useState<string[]>([
    'Bangun Pagi',
    'Taat Beribadah',
    'Rajin Berolahraga',
    'Makan Sehat & Bergizi',
    'Gemar Belajar',
    'Bermasyarakat',
    'Tidur Cepat (Tepat Waktu)',
  ]);

  const [formData, setFormData] = useState({
    tema: 'Gaya Hidup Berkelanjutan & Penguatan Karakter Profil Pelajar',
    topik: 'Implementasi 7 Kebiasaan Anak Indonesia Hebat dalam Kehidupan Sekolah dan Keluarga',
    fase: 'Fase E (Kelas X)',
    alokasiWaktu: '36 Jam Pelajaran (JP)',
    mataPelajaranTerlibat: 'Informatika, PJOK, Pendidikan Agama & Budi Pekerti, Bahasa Indonesia, IPAS',
  });

  // Form State for Lembar Pantau / Jurnal
  const [jurnalForm, setJurnalForm] = useState({
    namaSiswa: '',
    kelas: 'Kelas X Informatika 1',
    periode: 'Minggu Ke-1 (Bulan Berjalan)',
    targetFokus: 'Seluruh 7 Kebiasaan Anak Indonesia Hebat',
    catatanGuru: 'Praktikkan 7 kebiasaan ini dengan penuh kesadaran dan bimbingan orang tua setiap hari.',
  });

  // Toggle selected kebiasaan
  const handleToggleKebiasaan = (nama: string) => {
    if (selectedKebiasaan.includes(nama)) {
      if (selectedKebiasaan.length === 1) {
        showToast('Minimal 1 Kebiasaan Dipilih', 'warning');
        return;
      }
      setSelectedKebiasaan(selectedKebiasaan.filter((k) => k !== nama));
    } else {
      setSelectedKebiasaan([...selectedKebiasaan, nama]);
    }
  };

  const handleSelectAllKebiasaan = () => {
    setSelectedKebiasaan(TUJUH_KEBIASAAN.map((k) => k.nama));
  };

  // Preset Template Proyek Kokurikuler 7 Kebiasaan
  const handleApplyPreset = (preset: {
    tema: string;
    topik: string;
    mapel: string;
    fokus: string[];
  }) => {
    setFormData({
      ...formData,
      tema: preset.tema,
      topik: preset.topik,
      mataPelajaranTerlibat: preset.mapel,
    });
    setSelectedKebiasaan(preset.fokus);
    setActiveSubTab('modul');
    showToast('Preset Diterapkan!', 'success', preset.topik);
  };

  // Generate Fallback HTML Modul Kokurikuler
  const generateFallbackKokurikulerHtml = (data: typeof formData, kebiasaan: string[]) => {
    const listKebiasaanHtml = kebiasaan
      .map(
        (k, i) =>
          `<li style="margin-bottom: 4px;"><b>${i + 1}. ${k}</b>: Diintegrasikan melalui pembiasaan harian, riset kontekstual, dan refleksi berkala.</li>`
      )
      .join('');

    return `
      <div class="kokurikuler-doc space-y-6" style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6;">
        <div style="text-align: center; border-bottom: 3px double #0369a1; padding-bottom: 12px; margin-bottom: 20px;">
          <h3 style="font-size: 11pt; color: #64748b; margin: 0; text-transform: uppercase; letter-spacing: 1px;">KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH REPUBLIK INDONESIA</h3>
          <h2 style="font-size: 15pt; font-weight: bold; color: #0369a1; margin: 6px 0; text-transform: uppercase;">MODUL KOKURIKULER PROYEK PENGUATAN KARAKTER</h2>
          <p style="font-size: 10pt; color: #0f766e; font-weight: bold; margin: 0;">PROGRAM 7 KEBIASAAN ANAK INDONESIA HEBAT</p>
          <p style="font-size: 9pt; color: #475569; margin: 4px 0 0 0;">${pengaturan.namaSekolah || 'SMK Negeri'} | Tahun Ajaran 2024/2025</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-bottom: 20px;">
          <tr style="background-color: #0284c7; color: white;">
            <th style="padding: 8px 12px; text-align: left; border: 1px solid #0284c7;" colspan="2">I. IDENTITAS MODUL KOKURIKULER</th>
          </tr>
          <tr>
            <td style="padding: 7px 12px; border: 1px solid #bae6fd; font-weight: bold; width: 32%; background-color: #f0f9ff;">Topik Proyek Utama</td>
            <td style="padding: 7px 12px; border: 1px solid #bae6fd;"><b>${data.topik}</b></td>
          </tr>
          <tr>
            <td style="padding: 7px 12px; border: 1px solid #bae6fd; font-weight: bold; background-color: #f0f9ff;">Tema Kokurikuler</td>
            <td style="padding: 7px 12px; border: 1px solid #bae6fd;">${data.tema}</td>
          </tr>
          <tr>
            <td style="padding: 7px 12px; border: 1px solid #bae6fd; font-weight: bold; background-color: #f0f9ff;">Fase / Kelas Target</td>
            <td style="padding: 7px 12px; border: 1px solid #bae6fd;">${data.fase}</td>
          </tr>
          <tr>
            <td style="padding: 7px 12px; border: 1px solid #bae6fd; font-weight: bold; background-color: #f0f9ff;">Alokasi Waktu Total</td>
            <td style="padding: 7px 12px; border: 1px solid #bae6fd;">${data.alokasiWaktu}</td>
          </tr>
          <tr>
            <td style="padding: 7px 12px; border: 1px solid #bae6fd; font-weight: bold; background-color: #f0f9ff;">Mata Pelajaran Kolaboratif</td>
            <td style="padding: 7px 12px; border: 1px solid #bae6fd;">${data.mataPelajaranTerlibat}</td>
          </tr>
          <tr>
            <td style="padding: 7px 12px; border: 1px solid #bae6fd; font-weight: bold; background-color: #f0f9ff;">Koordinator Proyek</td>
            <td style="padding: 7px 12px; border: 1px solid #bae6fd;">${pengaturan.namaGuru || 'Yusak Yokoyama, S.Pd., M.Pd.'}</td>
          </tr>
        </table>

        <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 12px 16px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 6px 0; color: #0369a1; font-size: 11pt; font-weight: bold;">II. INTEGRASI 7 KEBIASAAN ANAK INDONESIA HEBAT (KEMENDIKDASMEN RI)</h4>
          <p style="font-size: 9.5pt; margin: 0 0 8px 0;">Proyek kokurikuler ini secara khusus menginternalisasi pilar karakter anak Indonesia hebat berikut:</p>
          <ul style="font-size: 9pt; padding-left: 20px; margin: 0;">
            ${listKebiasaanHtml}
          </ul>
        </div>

        <h3 style="color: #0369a1; border-bottom: 2px solid #0369a1; padding-bottom: 4px; font-size: 11pt; font-weight: bold; margin-top: 24px;">III. ALUR AKTIVITAS PROYEK KOKURIKULER (4 TAHAPAN)</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 20px;">
          <tr style="background-color: #0f766e; color: white;">
            <th style="padding: 8px; border: 1px solid #0f766e; width: 22%;">Tahapan Alur</th>
            <th style="padding: 8px; border: 1px solid #0f766e; width: 48%;">Aktivitas Pembelajaran Terintegrasi</th>
            <th style="padding: 8px; border: 1px solid #0f766e; width: 30%;">Output / Bukti Karya</th>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f0fdf4;">1. Pengenalan (Eksplorasi Isu)</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">Sosialisasi pentingnya 7 Kebiasaan Anak Indonesia Hebat, asesmen diagnostik kebiasaan harian, dan menonton video inspiratif.</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">Peta konsep kebiasaan baik & hasil survei mandiri siswa.</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f0fdf4;">2. Kontekstualisasi (Riset Lapangan)</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">Observasi pola hidup di lingkungan sekolah dan rumah, wawancara kantin sehat, pencatatan waktu tidur & jam belajar harian.</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">Laporan analisis data masalah dan tantangan pembiasaan.</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f0fdf4;">3. Aksi Nyata (Implementasi)</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">Pembuatan poster kampanye digital/mading 7 Kebiasaan, perancangan jurnal bekal sehat, senam bugar kreasi, aksi bakti lingkungan sosial.</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">Karya kampanye digital, prototype menu sehat, video senam kreasi.</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f0fdf4;">4. Refleksi & Gelar Karya</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">Pameran gelar karya kokurikuler antarkelas, presentasi jurnal 7 kebiasaan, penilaian antar-teman, dan komitmen pembiasaan jangka panjang.</td>
            <td style="padding: 8px; border: 1px solid #cbd5e1;">Portofolio proyek, sertifikat apresiasi pembiasaan anak hebat.</td>
          </tr>
        </table>

        <h3 style="color: #0369a1; border-bottom: 2px solid #0369a1; padding-bottom: 4px; font-size: 11pt; font-weight: bold; margin-top: 24px;">IV. RUBRIK ASESMEN KOKURIKULER 7 KEBIASAAN</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 24px;">
          <tr style="background-color: #1e3a8a; color: white; text-align: center;">
            <th style="padding: 7px; border: 1px solid #1e3a8a; width: 25%;">Aspek Karakter</th>
            <th style="padding: 7px; border: 1px solid #1e3a8a; width: 18%;">Mulai Berkembang (MB)</th>
            <th style="padding: 7px; border: 1px solid #1e3a8a; width: 18%;">Sedang Berkembang (SB)</th>
            <th style="padding: 7px; border: 1px solid #1e3a8a; width: 19%;">Berkembang Sesuai Harapan (BSH)</th>
            <th style="padding: 7px; border: 1px solid #1e3a8a; width: 20%;">Membudaya (Sangat Baik / MB)</th>
          </tr>
          <tr>
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Kedisiplinan & Waktu (Bangun Pagi & Tidur Cepat)</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">Masih sering terlambat dan begadang tanpa alasan.</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">Mulai mengatur waktu tidur namun belum konsisten.</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">Konsisten bangun pagi dan tidur teratur tepat waktu.</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">Menjadi teladan waktu dan mampu memotivasi rekan sejawat.</td>
          </tr>
          <tr>
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Kebugaran & Gizi (Olahraga & Makan Sehat)</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">Pasif saat olahraga, sering jajan sembarangan.</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">Mengikuti olahraga bila diingatkan, sesekali bawa bekal sehat.</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">Rutin berolahraga aktif, memilih makanan bergizi seimbang.</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">Menerapkan pola hidup sehat bugar sebagai gaya hidup sehari-hari.</td>
          </tr>
          <tr>
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold;">Integritas & Kepedulian (Ibadah, Belajar & Bermasyarakat)</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">Perlu pengawasan ketat saat beribadah dan gotong royong.</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">Melaksanakan ibadah dan belajar bila ada tugas kelompok.</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">Taat beribadah mandiri, gemar literasi, aktif gotong royong.</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">Inisiatif sosial tinggi, empati mendalam, berbudi pekerti luhur.</td>
          </tr>
        </table>

        <div style="margin-top: 36px;">
          <table style="width: 100%; border: none; font-size: 9.5pt;">
            <tr>
              <td style="width: 50%; text-align: center; border: none;">
                Mengetahui,<br><b>Kepala Sekolah ${pengaturan.namaSekolah || ''}</b><br><br><br><br>
                <u><b>${pengaturan.namaKepsek || 'Drs. H. Ahmad Marzuki, M.Pd.'}</b></u><br>
                NIP. ${pengaturan.nipKepsek || '19700101 199503 1 002'}
              </td>
              <td style="width: 50%; text-align: center; border: none;">
                ${pengaturan.kota || 'Kota Manado'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br>
                <b>Koordinator Kokurikuler & Guru Pengampu</b><br><br><br><br>
                <u><b>${pengaturan.namaGuru || 'Yusak Yokoyama, S.Pd., M.Pd.'}</b></u><br>
                NIP. ${pengaturan.nipGuru || '19850712 201001 1 018'}
              </td>
            </tr>
          </table>
        </div>
      </div>
    `;
  };

  // Generate Fallback HTML Lembar Pantau 7 Kebiasaan
  const generateFallbackJurnalHtml = (form: typeof jurnalForm) => {
    return `
      <div class="kokurikuler-jurnal-doc space-y-6" style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.5;">
        <!-- Kop Surat Resmi -->
        <div style="text-align: center; border-bottom: 3px double #0f766e; padding-bottom: 10px; margin-bottom: 16px;">
          <h4 style="font-size: 10pt; font-weight: normal; color: #475569; margin: 0; text-transform: uppercase;">PEMERINTAH DAERAH PROVINSI / KABUPATEN</h4>
          <h3 style="font-size: 12pt; font-weight: bold; color: #0f766e; margin: 3px 0; text-transform: uppercase;">${pengaturan.dinasPendidikan || 'DINAS PENDIDIKAN DAN KEBUDAYAAN'}</h3>
          <h2 style="font-size: 14pt; font-weight: bold; color: #1e293b; margin: 2px 0; text-transform: uppercase;">${pengaturan.namaSekolah || 'SMK NEGERI 1'}</h2>
          <p style="font-size: 8.5pt; color: #64748b; margin: 2px 0 0 0;">${pengaturan.alamatSekolah || 'Jl. Pendidikan No. 1'} | Telp: ${pengaturan.noTelpSekolah || '(0431) 888999'} | Email: ${pengaturan.emailSekolah || 'info@sekolah.sch.id'}</p>
        </div>

        <div style="text-align: center; margin-bottom: 16px;">
          <h3 style="font-size: 13pt; font-weight: bold; color: #0f766e; margin: 0; text-transform: uppercase;">LEMBAR PANTAU & JURNAL PEMBIASAAN KARAKTER KOKURIKULER</h3>
          <p style="font-size: 10.5pt; font-weight: bold; color: #ea580c; margin: 3px 0 0 0;">"7 KEBIASAAN ANAK INDONESIA HEBAT" (KEMENDIKDASMEN RI)</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 14px;">
          <tr>
            <td style="width: 18%; font-weight: bold; padding: 4px 0;">Nama Peserta Didik</td>
            <td style="width: 2%;">:</td>
            <td style="width: 40%; font-weight: bold; color: #0369a1;">${form.namaSiswa || '........................................................................... (Format Blangko Siswa)'}</td>
            <td style="width: 15%; font-weight: bold; padding: 4px 0;">Kelas / Fase</td>
            <td style="width: 2%;">:</td>
            <td style="width: 23%;">${form.kelas}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 4px 0;">Periode Pemantauan</td>
            <td>:</td>
            <td>${form.periode}</td>
            <td style="font-weight: bold; padding: 4px 0;">Guru Pendamping</td>
            <td>:</td>
            <td>${pengaturan.namaGuru || 'Yusak Yokoyama, S.Pd., M.Pd.'}</td>
          </tr>
        </table>

        <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 8px 12px; margin-bottom: 14px; font-size: 8.5pt; color: #166534;">
          <b>Petunjuk Pengisian:</b> Berikan tanda centang (✓) pada hari anak melaksanakan kebiasaan dengan benar dan mandiri. Tulis jam atau durasi pada kolom yang tersedia. Mintalah paraf orang tua setiap malam hari.
        </div>

        <!-- Tabel Checklist 7 Hari x 7 Kebiasaan -->
        <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 16px;">
          <thead>
            <tr style="background-color: #0f766e; color: white; text-align: center;">
              <th style="padding: 7px 4px; border: 1px solid #0f766e; width: 4%;">No</th>
              <th style="padding: 7px 6px; border: 1px solid #0f766e; width: 28%; text-align: left;">7 Kebiasaan Anak Indonesia Hebat</th>
              <th style="padding: 7px 4px; border: 1px solid #0f766e; width: 18%; text-align: left;">Target Pembiasaan</th>
              <th style="padding: 7px 4px; border: 1px solid #0f766e; width: 7%;">Sen</th>
              <th style="padding: 7px 4px; border: 1px solid #0f766e; width: 7%;">Sel</th>
              <th style="padding: 7px 4px; border: 1px solid #0f766e; width: 7%;">Rab</th>
              <th style="padding: 7px 4px; border: 1px solid #0f766e; width: 7%;">Kam</th>
              <th style="padding: 7px 4px; border: 1px solid #0f766e; width: 7%;">Jum</th>
              <th style="padding: 7px 4px; border: 1px solid #0f766e; width: 7%;">Sab</th>
              <th style="padding: 7px 4px; border: 1px solid #0f766e; width: 8%;">Min</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">1</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: #ea580c;">🌅 Bangun Pagi</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; font-size: 8pt; color: #475569;">Bangun &lt; 05.00, merapikan kasur</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">2</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: #059669;">🤲 Taat Beribadah</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; font-size: 8pt; color: #475569;">Ibadah tepat waktu &amp; berdoa</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
            </tr>
            <tr>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">3</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: #2563eb;">🏃 Rajin Berolahraga</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; font-size: 8pt; color: #475569;">Peregangan/senam min 15-30 menit</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">4</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: #e11d48;">🥗 Makan Sehat &amp; Bergizi</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; font-size: 8pt; color: #475569;">Sarapan sehat, sayur/buah &amp; air putih</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
            </tr>
            <tr>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">5</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: #7c3aed;">📚 Gemar Belajar</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; font-size: 8pt; color: #475569;">Membaca buku/literasi min 15-30 menit</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">6</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: #0d9488;">🤝 Bermasyarakat</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; font-size: 8pt; color: #475569;">Budaya 5S, gotong royong &amp; peduli lingkungan</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
            </tr>
            <tr>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">7</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: #4338ca;">🌙 Tidur Cepat</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; font-size: 8pt; color: #475569;">Tidur &lt; 21.30, bebas gawai (screen-off)</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">[ &nbsp; ]</td>
            </tr>
            <tr style="background-color: #e2e8f0; font-weight: bold;">
              <td style="padding: 6px; border: 1px solid #94a3b8; text-align: center;" colspan="3">Paraf / Tanda Tangan Orang Tua Setiap Hari</td>
              <td style="padding: 6px; border: 1px solid #94a3b8; text-align: center;">(.......)</td>
              <td style="padding: 6px; border: 1px solid #94a3b8; text-align: center;">(.......)</td>
              <td style="padding: 6px; border: 1px solid #94a3b8; text-align: center;">(.......)</td>
              <td style="padding: 6px; border: 1px solid #94a3b8; text-align: center;">(.......)</td>
              <td style="padding: 6px; border: 1px solid #94a3b8; text-align: center;">(.......)</td>
              <td style="padding: 6px; border: 1px solid #94a3b8; text-align: center;">(.......)</td>
              <td style="padding: 6px; border: 1px solid #94a3b8; text-align: center;">(.......)</td>
            </tr>
          </tbody>
        </table>

        <!-- Refleksi Singkat Siswa -->
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 6px 0; color: #0f766e; font-size: 9.5pt; font-weight: bold;">REFLEKSI DIRI SISWA (Tulis 1 Kebaikan / Pengalaman Berharga Minggu Ini):</h4>
          <p style="font-size: 8.5pt; color: #64748b; margin: 0; min-height: 40px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px;">
            "...................................................................................................................................................................................................................................................................."
          </p>
        </div>

        <!-- Kolom Catatan Guru & Predikat Pembiasaan -->
        <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 24px;">
          <tr style="background-color: #f1f5f9;">
            <th style="padding: 6px; border: 1px solid #cbd5e1; width: 60%; text-align: left;">Catatan &amp; Masukan Guru Pendamping Kokurikuler</th>
            <th style="padding: 6px; border: 1px solid #cbd5e1; width: 40%; text-align: center;">Predikat Ketercapaian Pembiasaan</th>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #cbd5e1; vertical-align: top;">
              <i>${form.catatanGuru}</i>
            </td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; vertical-align: middle;">
              <span style="display: inline-block; padding: 4px 10px; border: 1px solid #0f766e; background-color: #ccfbf1; color: #0f766e; font-weight: bold; border-radius: 4px;">
                [ &nbsp; ] Membudaya (A) &nbsp;&nbsp; [ &nbsp; ] Berkembang (B) &nbsp;&nbsp; [ &nbsp; ] Mulai Terlihat (C)
              </span>
            </td>
          </tr>
        </table>

        <!-- Tanda Tangan Tiga Pihak -->
        <div style="margin-top: 24px;">
          <table style="width: 100%; border: none; font-size: 9pt;">
            <tr>
              <td style="width: 33%; text-align: center; border: none;">
                Mengetahui,<br>Orang Tua / Wali Siswa<br><br><br><br>
                <u>(......................................................)</u>
              </td>
              <td style="width: 34%; text-align: center; border: none;">
                Siswa Yang Bersangkutan<br><br><br><br><br>
                <u><b>${form.namaSiswa || '(......................................................)'}</b></u>
              </td>
              <td style="width: 33%; text-align: center; border: none;">
                ${pengaturan.kota || 'Kota Manado'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br>
                Guru Pendamping Kokurikuler<br><br><br><br>
                <u><b>${pengaturan.namaGuru || 'Yusak Yokoyama, S.Pd., M.Pd.'}</b></u><br>
                NIP. ${pengaturan.nipGuru || '19850712 201001 1 018'}
              </td>
            </tr>
          </table>
        </div>
      </div>
    `;
  };

  // Handler Generate Modul
  const handleGenerateModul = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGeneratedHtml(null);

    try {
      const res = await fetch('/api/ai/generate-modul-kokurikuler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          kebiasaanFokus: selectedKebiasaan,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.html) {
        setGeneratedHtml(data.html);
        showToast('Modul Kokurikuler Berhasil Dibuat!', 'success', 'Rancangan modul proyek terintegrasi 7 Kebiasaan Anak Indonesia siap.');
      } else {
        throw new Error('Fallback required');
      }
    } catch (err) {
      console.warn('Using fallback kokurikuler generator:', err);
      const fallbackHtml = generateFallbackKokurikulerHtml(formData, selectedKebiasaan);
      setGeneratedHtml(fallbackHtml);
      showToast('Modul Kokurikuler Berhasil Dibuat!', 'success', 'Rancangan modul proyek terintegrasi 7 Kebiasaan siap.');
    } finally {
      setLoading(false);
    }
  };

  // Handler Generate Lembar Jurnal 7 Kebiasaan
  const handleGenerateJurnal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGeneratedHtml(null);

    try {
      const res = await fetch('/api/ai/generate-jurnal-7kebiasaan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jurnalForm),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.html) {
        setGeneratedHtml(data.html);
        showToast('Lembar Pantau 7 Kebiasaan Siap!', 'success', 'Dokumen monitoring pembiasaan karakter siap dicetak.');
      } else {
        throw new Error('Fallback required');
      }
    } catch (err) {
      console.warn('Using fallback jurnal generator:', err);
      const fallbackHtml = generateFallbackJurnalHtml(jurnalForm);
      setGeneratedHtml(fallbackHtml);
      showToast('Lembar Pantau 7 Kebiasaan Siap!', 'success', 'Dokumen monitoring pembiasaan karakter siap dicetak.');
    } finally {
      setLoading(false);
    }
  };

  // Presets Proyek Kokurikuler 7 Kebiasaan
  const PRESETS_PROYEK = [
    {
      judul: 'Duta Sehat & Bugar',
      sub: 'Olahraga & Makan Sehat',
      tema: 'Gaya Hidup Berkelanjutan',
      topik: 'Kampanye Gizi Seimbang & Senam Anak Indonesia Hebat di Sekolah',
      mapel: 'PJOK, Biologi / IPAS, Seni Budaya, Bahasa Indonesia',
      fokus: ['Rajin Berolahraga', 'Makan Sehat & Bergizi', 'Bangun Pagi'],
    },
    {
      judul: 'Sahabat Komunitas & Harmoni',
      sub: 'Bermasyarakat & Ibadah',
      tema: 'Kearifan Lokal & Bhinneka Tunggal Ika',
      topik: 'Aksi Nyata Gotong Royong Lingkungan Bersih & Budaya 5S Antarwarga',
      mapel: 'Pendidikan Agama & Budi Pekerti, PPKn, Bahasa Indonesia, Sosiologi',
      fokus: ['Taat Beribadah', 'Bermasyarakat', 'Gemar Belajar'],
    },
    {
      judul: 'Festival Literasi & Sains',
      sub: 'Gemar Belajar & Eksplorasi',
      tema: 'Rekayasa dan Teknologi',
      topik: 'Gerakan Membaca Kritis & Pameran Inovasi Digital Siswa SMK',
      mapel: 'Informatika, Bahasa Indonesia, Projek Kreatif dan Kewirausahaan (PKK)',
      fokus: ['Gemar Belajar', 'Bangun Pagi', 'Bermasyarakat'],
    },
    {
      judul: 'Manajemen Diri Hebat',
      sub: 'Bangun Pagi & Tidur Cepat',
      tema: 'Bangunlah Jiwa dan Raganya',
      topik: 'Pengendalian Layar (Screen-Time Balance) & Manajemen Jam Biologis',
      mapel: 'Bimbingan Konseling (BK), Informatika, PJOK, Biologi',
      fokus: ['Bangun Pagi', 'Tidur Cepat (Tepat Waktu)', 'Rajin Berolahraga'],
    },
    {
      judul: 'Ekspedisi 7 Kebiasaan Terpadu',
      sub: 'Integrasi Holistik Kemendikdasmen',
      tema: 'Gaya Hidup Berkelanjutan & Karakter Berkelanjutan',
      topik: 'Internalisasi 7 Kebiasaan Anak Indonesia Hebat untuk Generasi Emas 2045',
      mapel: 'Informatika, IPAS, PJOK, Agama, Bahasa Indonesia, Seni',
      fokus: TUJUH_KEBIASAAN.map((k) => k.nama),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner Utama */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-[#1a3a5c] text-white p-6 sm:p-7 rounded-2xl shadow-md border-2 border-emerald-500/30 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
              <Target className="w-8 h-8 text-emerald-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs">
                  KEMENDIKDASMEN RI
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-xs">
                  KOKURIKULER RESMI
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500 text-white shadow-xs">
                  7 KEBIASAAN HEBAT
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Kokurikuler & 7 Kebiasaan Anak Indonesia Hebat
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl mt-1 leading-relaxed">
                Penguatan karakter peserta didik secara terpadu melalui pembiasaan harian, lembar pantau pemantauan berkala, dan rancangan modul proyek kokurikuler kolaboratif lintas mata pelajaran.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={() => {
                setActiveSubTab('jurnal');
                setGeneratedHtml(generateFallbackJurnalHtml(jurnalForm));
                showToast('Lembar Pantau Siap', 'info');
              }}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Blanko Pantau
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl no-print">
        <button
          onClick={() => setActiveSubTab('panduan')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeSubTab === 'panduan'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>1. Panduan 7 Kebiasaan Anak Hebat</span>
          <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px]">7 Pilar</span>
        </button>

        <button
          onClick={() => setActiveSubTab('jurnal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeSubTab === 'jurnal'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>2. Lembar Pantau & Jurnal Karakter</span>
          <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px]">Siap Cetak</span>
        </button>

        <button
          onClick={() => setActiveSubTab('modul')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeSubTab === 'modul'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>3. Generator Modul Proyek Kolaboratif AI</span>
          <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px]">4 Alur Tahap</span>
        </button>
      </div>

      {/* TAB 1: PANDUAN & KARTU EDUKASI 7 KEBIASAAN */}
      {activeSubTab === 'panduan' && (
        <div className="space-y-6">
          {/* Header Info Kebijakan */}
          <div className="bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 border-2 border-emerald-500/20 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400">★</span> 7 Kebiasaan Anak Indonesia Hebat
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Gerakan Strategis Kemendikdasmen RI untuk Pembentukan Insan Cerdas Berkarakter Kuat menuju Indonesia Emas 2045.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveSubTab('jurnal');
                  }}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Buka Lembar Monitoring
                </button>
                <button
                  onClick={() => {
                    setActiveSubTab('modul');
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Buat Modul Proyek
                </button>
              </div>
            </div>

            {/* Grid 7 Kebiasaan */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {TUJUH_KEBIASAAN.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border-2 ${item.warnaBorder} bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between`}
                  >
                    <div className="p-4 space-y-3">
                      {/* Top Bar with Number & Icon */}
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${item.badgeColor}`}>
                          #{item.nomor}
                        </span>
                        <div className={`p-2 rounded-xl bg-gradient-to-r ${item.warna} text-white shadow-sm`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                      </div>

                      {/* Title & Tagline */}
                      <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                          {item.nama}
                        </h3>
                        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {item.tagline}
                        </p>
                      </div>

                      {/* Makna */}
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.makna}
                      </p>

                      {/* Praktik Sekolah & Rumah */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5">
                            🏫 Di Sekolah:
                          </span>
                          <span className="text-slate-600 dark:text-slate-300">
                            {item.aksiSekolah}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                          <span className="font-bold text-amber-700 dark:text-amber-400 block mb-0.5">
                            🏠 Di Rumah:
                          </span>
                          <span className="text-slate-600 dark:text-slate-300">
                            {item.aksiRumah}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Action */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500">
                        Kokurikuler Kemendikdasmen
                      </span>
                      <button
                        onClick={() => {
                          setJurnalForm({
                            ...jurnalForm,
                            targetFokus: `Fokus Khusus: ${item.nama}`,
                          });
                          setActiveSubTab('jurnal');
                        }}
                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1"
                      >
                        Pantau <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preset Inspirasi Proyek Kokurikuler */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Inspirasi Tema Kokurikuler Terpadu 7 Kebiasaan Anak Indonesia
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Pilih paket proyek siap pakai di bawah ini untuk langsung mengisi form dan menghasilkan modul kokurikuler lengkap:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRESETS_PROYEK.map((p, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                        {p.sub}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">36 JP</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {p.judul}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                      {p.topik}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {p.fokus.map((f, fi) => (
                        <span
                          key={fi}
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                        >
                          ✓ {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleApplyPreset(p)}
                    className="mt-4 w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    Terapkan & Buat Modul <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LEMBAR PANTAU & JURNAL KARAKTER */}
      {activeSubTab === 'jurnal' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm no-print">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  Generator Dokumen Lembar Pantau 7 Kebiasaan Anak Indonesia
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Cetak lembar pantau mingguan / bulanan yang dibawa pulang siswa untuk pemantauan pembiasaan bersama orang tua dan wali kelas.
                </p>
              </div>
            </div>

            <form onSubmit={handleGenerateJurnal} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Peserta Didik *
                  </label>
                  <select
                    value={jurnalForm.namaSiswa}
                    onChange={(e) => setJurnalForm({ ...jurnalForm, namaSiswa: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  >
                    <option value="">-- Format Blangko Kelas (Untuk Seluruh Siswa) --</option>
                    {siswaList.map((s) => (
                      <option key={s.id} value={`${s.nama} (NISN: ${s.nisn || '-'})`}>
                        {s.nama} ({s.kelas})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kelas / Rombel *
                  </label>
                  <input
                    type="text"
                    required
                    value={jurnalForm.kelas}
                    onChange={(e) => setJurnalForm({ ...jurnalForm, kelas: e.target.value })}
                    placeholder="Contoh: Kelas X RPL 1"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Periode Pemantauan *
                  </label>
                  <input
                    type="text"
                    required
                    value={jurnalForm.periode}
                    onChange={(e) => setJurnalForm({ ...jurnalForm, periode: e.target.value })}
                    placeholder="Contoh: Minggu Ke-1 (Oktober 2024)"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Pengantar & Motivasi Guru untuk Siswa & Orang Tua
                </label>
                <input
                  type="text"
                  value={jurnalForm.catatanGuru}
                  onChange={(e) => setJurnalForm({ ...jurnalForm, catatanGuru: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const fallbackHtml = generateFallbackJurnalHtml(jurnalForm);
                    setGeneratedHtml(fallbackHtml);
                    showToast('Format Blangko Siap Dicetak!', 'info');
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Pakai Format Standar Resmi Kemendikdasmen (Cepat)
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyusun Jurnal Karakter...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      Generate Jurnal Lengkap dengan AI
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: GENERATOR MODUL PROYEK KOLABORATIF */}
      {activeSubTab === 'modul' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm no-print">
            <form onSubmit={handleGenerateModul} className="space-y-5">
              {/* Integrasi 7 Kebiasaan Selector */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Integrasi Fokus "7 Kebiasaan Anak Indonesia Hebat" dalam Proyek:
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectAllKebiasaan}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Pilih Semua 7 Kebiasaan
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {TUJUH_KEBIASAAN.map((k) => {
                    const isSelected = selectedKebiasaan.includes(k.nama);
                    return (
                      <button
                        type="button"
                        key={k.id}
                        onClick={() => handleToggleKebiasaan(k.nama)}
                        className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">
                          #{k.nomor} {k.nama}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tema Utama Proyek Kokurikuler *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tema}
                    onChange={(e) => setFormData({ ...formData, tema: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Alokasi Waktu (JP)
                  </label>
                  <input
                    type="text"
                    value={formData.alokasiWaktu}
                    onChange={(e) => setFormData({ ...formData, alokasiWaktu: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Topik / Isu Kontekstual Proyek *
                </label>
                <input
                  type="text"
                  required
                  value={formData.topik}
                  onChange={(e) => setFormData({ ...formData, topik: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fase / Kelas Target *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fase}
                    onChange={(e) => setFormData({ ...formData, fase: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mata Pelajaran yang Berkolaborasi *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.mataPelajaranTerlibat}
                    onChange={(e) => setFormData({ ...formData, mataPelajaranTerlibat: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const fallbackHtml = generateFallbackKokurikulerHtml(formData, selectedKebiasaan);
                    setGeneratedHtml(fallbackHtml);
                    showToast('Format Modul Siap Digunakan!', 'info');
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Gunakan Template Cepat Modul 7 Kebiasaan
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      AI Mengembangkan Modul Kokurikuler...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      Generate Modul Kokurikuler Terpadu AI
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Output Document Preview */}
      {generatedHtml && (
        <div className="space-y-4 pt-2">
          <DocPreviewToolbar
            htmlContent={generatedHtml}
            documentTitle={
              activeSubTab === 'jurnal'
                ? `Lembar_Pantau_7_Kebiasaan_${jurnalForm.kelas.replace(/\s+/g, '_')}`
                : `Modul_Kokurikuler_7_Kebiasaan_${formData.topik.slice(0, 30).replace(/\s+/g, '_')}`
            }
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
