import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import {
  Award,
  Plus,
  FileSpreadsheet,
  Download,
  Trash2,
  Edit2,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Check,
  Printer,
  RefreshCw,
  Activity,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Info,
  SlidersHorizontal,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Siswa, Mapel, Nilai, Pengaturan, Absensi } from '../../types';
import { dbService } from '../../services/db';
import { exportService } from '../../services/export';
import { showToast } from '../../utils/toast';

interface NilaiManagerProps {
  siswaList: Siswa[];
  mapelList: Mapel[];
  nilaiList: Nilai[];
  absensiList?: Absensi[];
  pengaturan: Pengaturan;
}

export const NilaiManager: React.FC<NilaiManagerProps> = ({
  siswaList,
  mapelList,
  nilaiList,
  absensiList,
  pengaturan,
}) => {
  const [selectedKelas, setSelectedKelas] = useState<string>('X RPL 1');
  const [selectedMapelId, setSelectedMapelId] = useState<string>(mapelList[0]?.id || '');

  // 1. SINKRONISASI OTOMATIS DATA PRESENSI
  const [currentAbsensiList, setCurrentAbsensiList] = useState<Absensi[]>(
    () => absensiList || dbService.getAbsensi()
  );
  const [isSyncingPresensi, setIsSyncingPresensi] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() =>
    new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  // Toggle & Filter Tampilan Korelasi
  const [showKorelasiPanel, setShowKorelasiPanel] = useState<boolean>(true);
  const [showPresensiColumn, setShowPresensiColumn] = useState<boolean>(true);
  const [filterKorelasiStatus, setFilterKorelasiStatus] = useState<
    'all' | 'selaras' | 'at-risk' | 'anomali' | 'mandiri'
  >('all');

  // Modal Inspeksi Detail Korelasi Siswa
  const [inspectedSiswaKorelasi, setInspectedSiswaKorelasi] = useState<{
    siswa: Siswa;
    hadirPct: number;
    avgSumatif: number;
    nilaiAkhir: number;
    hCount: number;
    sCount: number;
    iCount: number;
    aCount: number;
    totalPresensi: number;
    statusKorelasi: {
      type: string;
      label: string;
      badgeColor: string;
      desc: string;
      icon: string;
      rekomendasi: string;
    };
  } | null>(null);

  // Input modal rekam nilai state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Nilai>>({
    siswaId: '',
    mapelId: selectedMapelId,
    jenis: 'sumatif',
    sumatifKe: 1,
    materi: 'Sumatif 1: Lingkup Materi 1',
    skor: 85,
    semester: 'Ganjil 2026/2027',
  });

  const kelasList = useMemo(
    () => Array.from(new Set(siswaList.map((s) => s.kelas))).sort(),
    [siswaList]
  );
  const studentsInClass = useMemo(
    () => siswaList.filter((s) => s.kelas === selectedKelas),
    [siswaList, selectedKelas]
  );

  // SINKRONISASI OTOMATIS: Berjalan setiap kali props absensiList atau kelas berubah
  useEffect(() => {
    if (absensiList && absensiList.length > 0) {
      setCurrentAbsensiList(absensiList);
    } else {
      setCurrentAbsensiList(dbService.getAbsensi());
    }
    setLastSyncTime(
      new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
  }, [absensiList, selectedKelas]);

  // Fungsi Pemicu Sinkronisasi Manual (Tarik Data Presensi Segar)
  const handleManualSyncPresensi = () => {
    setIsSyncingPresensi(true);
    setTimeout(() => {
      const freshData = dbService.getAbsensi();
      setCurrentAbsensiList(freshData);
      setLastSyncTime(
        new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setIsSyncingPresensi(false);
      showToast(
        'Sinkronisasi Presensi Berhasil!',
        'success',
        `Data ${freshData.length} rekam presensi berhasil ditarik dan diselaraskan dengan capaian nilai sumatif.`
      );
    }, 350);
  };

  // Helper Menghitung Statistik Presensi per Siswa
  const getStudentAttendanceStats = (siswaId: string) => {
    const records = currentAbsensiList.filter((a) => a.siswaId === siswaId);
    const h = records.filter((a) => a.status === 'H').length;
    const s = records.filter((a) => a.status === 'S').length;
    const i = records.filter((a) => a.status === 'I').length;
    const a = records.filter((a) => a.status === 'A').length;
    const total = h + s + i + a;
    // Jika belum ada rekam presensi spesifik, default 100% atau persentase aktual
    const pct = total > 0 ? Math.round((h / total) * 100) : 100;
    return { h, s, i, a, total, pct };
  };

  // Helper Evaluasi Korelasi Kehadiran vs Nilai Sumatif
  const evaluateKorelasi = (hadirPct: number, avgSumatif: number) => {
    if (hadirPct >= 85 && avgSumatif >= 80) {
      return {
        type: 'selaras',
        label: 'Optimal & Selaras',
        badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
        desc: 'Tingkat kehadiran tinggi berbanding lurus dengan penguasaan capaian sumatif optimal.',
        icon: '🟢',
        rekomendasi: 'Pertahankan ritme belajar. Siswa berpotensi menjadi tutor sebaya dalam kerja tim.',
      };
    } else if (hadirPct < 80 && avgSumatif < 75) {
      return {
        type: 'at-risk',
        label: 'Perlu Perhatian (At-Risk)',
        badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 font-bold',
        desc: 'Penurunan capaian sumatif berkorelasi kuat dengan tingginya ketidakhadiran (S/I/A).',
        icon: '🔴',
        rekomendasi: 'Koordinasi intensif dengan wali kelas & orang tua. Jadwalkan klinik bimbingan remedial.',
      };
    } else if (hadirPct >= 85 && avgSumatif < 75) {
      return {
        type: 'anomali',
        label: 'Butuh Pendampingan Kognitif',
        badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300',
        desc: 'Siswa aktif hadir di kelas, namun mengalami kendala dalam penguasaan konsep sumatif.',
        icon: '🟡',
        rekomendasi: 'Berikan diferensiasi proses & scaffolding visual di Papan Interaktif untuk konsep dasar.',
      };
    } else if (hadirPct < 80 && avgSumatif >= 80) {
      return {
        type: 'mandiri',
        label: 'Mandiri & Berbakat',
        badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300',
        desc: 'Siswa memiliki kemandirian belajar di luar jam tatap muka meski kehadiran minim.',
        icon: '🟣',
        rekomendasi: 'Berikan penguatan kedisiplinan presensi agar karakter kebiasaan positif tetap terpupuk.',
      };
    }
    return {
      type: 'stabil',
      label: 'Cukup Stabil',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300',
      desc: 'Kehadiran dan capaian nilai siswa dalam rentang berkembang normal.',
      icon: '🔵',
      rekomendasi: 'Tingkatkan latihan literasi dan numerasi HOTS untuk mendorong pencapaian nilai A.',
    };
  };

  // Analisis Statistik Korelasi Tingkat Rombel (Pearson r Correlation)
  const classCorrelationStats = useMemo(() => {
    if (studentsInClass.length === 0) {
      return {
        avgKehadiran: 0,
        avgSumatif: 0,
        pearsonR: 0,
        atRiskCount: 0,
        selarasCount: 0,
        anomaliCount: 0,
        mandiriCount: 0,
        korelasiCategory: 'Belum Ada Data Siswa',
      };
    }

    let totalPct = 0;
    let totalSumatifScore = 0;
    let evaluatedStudentsCount = 0;
    let atRisk = 0;
    let selaras = 0;
    let anomali = 0;
    let mandiri = 0;

    const pairs: { x: number; y: number }[] = [];

    studentsInClass.forEach((s) => {
      const { pct } = getStudentAttendanceStats(s.id);
      totalPct += pct;

      const studentGrades = nilaiList.filter(
        (n) => n.siswaId === s.id && (!selectedMapelId || n.mapelId === selectedMapelId)
      );
      const sumatifRecords = studentGrades.filter((n) => n.jenis === 'sumatif');
      const sAvg = sumatifRecords.length
        ? Math.round(sumatifRecords.reduce((sum, item) => sum + item.skor, 0) / sumatifRecords.length)
        : 0;

      if (sAvg > 0) {
        totalSumatifScore += sAvg;
        evaluatedStudentsCount++;
        pairs.push({ x: pct, y: sAvg });
      }

      const evalRes = evaluateKorelasi(pct, sAvg);
      if (evalRes.type === 'at-risk') atRisk++;
      else if (evalRes.type === 'selaras') selaras++;
      else if (evalRes.type === 'anomali') anomali++;
      else if (evalRes.type === 'mandiri') mandiri++;
    });

    const avgKehadiran = Math.round(totalPct / studentsInClass.length);
    const avgSumatif =
      evaluatedStudentsCount > 0 ? Math.round(totalSumatifScore / evaluatedStudentsCount) : 0;

    // Kalkulasi Pearson r Correlation
    let r = 0;
    const n = pairs.length;
    if (n > 1) {
      const sumX = pairs.reduce((sum, p) => sum + p.x, 0);
      const sumY = pairs.reduce((sum, p) => sum + p.y, 0);
      const sumXY = pairs.reduce((sum, p) => sum + p.x * p.y, 0);
      const sumX2 = pairs.reduce((sum, p) => sum + p.x * p.x, 0);
      const sumY2 = pairs.reduce((sum, p) => sum + p.y * p.y, 0);

      const numerator = n * sumXY - sumX * sumY;
      const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
      if (denominator !== 0) {
        r = Math.round((numerator / denominator) * 100) / 100;
      }
    }

    let korelasiCategory = 'Korelasi Positif Sedang';
    if (r >= 0.6) {
      korelasiCategory = `Korelasi Positif Kuat (+${r}): Kehadiran berpengaruh signifikan terhadap capaian nilai sumatif.`;
    } else if (r >= 0.3) {
      korelasiCategory = `Korelasi Positif Sedang (+${r}): Kehadiran mendukung penguasaan materi secara nyata.`;
    } else if (r > 0) {
      korelasiCategory = `Korelasi Positif Lemah (+${r}): Performa nilai lebih bervariasi karena faktor belajar mandiri.`;
    } else {
      korelasiCategory = 'Netral / Pengaruh Belajar Mandiri di Luar Jam Kelas';
    }

    return {
      avgKehadiran,
      avgSumatif,
      pearsonR: r,
      atRiskCount: atRisk,
      selarasCount: selaras,
      anomaliCount: anomali,
      mandiriCount: mandiri,
      korelasiCategory,
    };
  }, [studentsInClass, currentAbsensiList, nilaiList, selectedMapelId]);

  // Filtered Students for the table based on correlation filter
  const displayedStudents = useMemo(() => {
    if (filterKorelasiStatus === 'all') return studentsInClass;

    return studentsInClass.filter((s) => {
      const { pct } = getStudentAttendanceStats(s.id);
      const studentGrades = nilaiList.filter(
        (n) => n.siswaId === s.id && (!selectedMapelId || n.mapelId === selectedMapelId)
      );
      const sumatifRecords = studentGrades.filter((n) => n.jenis === 'sumatif');
      const sAvg = sumatifRecords.length
        ? Math.round(sumatifRecords.reduce((sum, item) => sum + item.skor, 0) / sumatifRecords.length)
        : 0;

      const evalRes = evaluateKorelasi(pct, sAvg);
      return evalRes.type === filterKorelasiStatus;
    });
  }, [studentsInClass, filterKorelasiStatus, currentAbsensiList, nilaiList, selectedMapelId]);

  const handleOpenAdd = (prefillSiswaId?: string, prefillSumatifKe?: number) => {
    const sId = prefillSiswaId || studentsInClass[0]?.id || '';
    const mId = selectedMapelId || mapelList[0]?.id || '';
    const ke = prefillSumatifKe || 1;

    // Check if there is already an existing sumatif record for this student & sumatifKe
    const existing = sId
      ? nilaiList.find(
          (n) =>
            n.siswaId === sId &&
            n.mapelId === mId &&
            n.jenis === 'sumatif' &&
            (n.sumatifKe === ke || n.materi?.toLowerCase().includes(`sumatif ${ke}`))
        )
      : null;

    if (existing) {
      setEditingId(existing.id);
      setFormData(existing);
    } else {
      setEditingId(null);
      setFormData({
        siswaId: sId,
        mapelId: mId,
        jenis: 'sumatif',
        sumatifKe: ke,
        materi: `Sumatif ${ke}: Lingkup Materi ${ke}`,
        skor: 85,
        semester: 'Ganjil 2026/2027',
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (n: Nilai) => {
    setEditingId(n.id);
    setFormData(n);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Swal.fire({
      title: 'Hapus Rekam Nilai?',
      text: 'Nilai ini akan dihapus dari buku rapor.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus',
    }).then((res) => {
      if (res.isConfirmed) {
        dbService.deleteNilai(id);
        showToast('Nilai Terhapus', 'success', 'Nilai siswa berhasil dihapus.');
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.siswaId || !formData.mapelId || formData.skor === undefined) {
      showToast('Peringatan', 'warning', 'Siswa, Mapel, dan Skor wajib diisi!');
      return;
    }

    const studentObj = siswaList.find((s) => s.id === formData.siswaId);
    const mapelObj = mapelList.find((m) => m.id === formData.mapelId);
    const jenisAsesmen = formData.jenis || 'sumatif';
    const sumatifKeNum = jenisAsesmen === 'sumatif' ? Number(formData.sumatifKe || 1) : undefined;

    const item: Nilai = {
      id: editingId || `n_${Date.now()}`,
      siswaId: formData.siswaId,
      namaSiswa: studentObj?.nama || 'Siswa',
      kelas: studentObj?.kelas || selectedKelas,
      mapelId: formData.mapelId,
      namaMapel: mapelObj?.nama || 'Mapel',
      jenis: jenisAsesmen,
      sumatifKe: sumatifKeNum,
      materi:
        formData.materi?.trim() ||
        (jenisAsesmen === 'sumatif'
          ? `Sumatif ${sumatifKeNum}: Lingkup Materi ${sumatifKeNum}`
          : 'Sumatif Akhir Semester (SAS)'),
      skor: Number(formData.skor),
      semester: formData.semester?.trim() || 'Ganjil 2026/2027',
      userId: 'master_guru_default',
    };

    dbService.saveNilai(item);
    setIsModalOpen(false);
    showToast('Berhasil', 'success', `Nilai ${item.namaSiswa} (${item.skor}) berhasil disimpan!`);
  };

  // Automated competency description generator
  const getDeskripsiKompetensi = (na: number, nama: string) => {
    if (na >= 90) {
      return `Menunjukkan penguasaan yang SANGAT BAIK dan konsisten dalam menganalisis konsep serta menyelesaikan proyek mandiri.`;
    } else if (na >= 80) {
      return `Menunjukkan penguasaan yang BAIK dalam memahami tujuan pembelajaran utama dan dapat berkolaborasi optimal.`;
    } else if (na >= 70) {
      return `Menunjukkan penguasaan CUKUP dalam mencapai kriteria ketuntasan minimal; disarankan meningkatkan latihan mandiri.`;
    } else {
      return `Perlu bimbingan dan pendampingan intensif pada materi dasar serta pengulangan asesmen remedial.`;
    }
  };

  const selectedMapelObj = mapelList.find((m) => m.id === selectedMapelId);

  // Print Laporan Nilai - Otomatis terapkan gaya landscape & proporsional
  const handlePrintLaporanNilai = () => {
    const styleId = 'print-laporan-nilai-landscape';
    const existing = document.getElementById(styleId);
    if (existing) existing.remove();

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      @page {
        size: A4 landscape;
        margin: 6mm 6mm 8mm 6mm !important;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #0f172a !important;
          font-size: 7.2pt !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .no-print {
          display: none !important;
        }
        .print-laporan-header {
          display: block !important;
        }
        .print-laporan-footer {
          display: flex !important;
        }
      }
    `;
    document.head.appendChild(style);

    showToast(
      'Menyiapkan Laporan Nilai...',
      'info',
      'Membuka dialog cetak sistem dengan tata letak proporsional dan orientasi landscape.'
    );

    const cleanup = () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);

    setTimeout(() => {
      try {
        window.focus();
        window.print();
      } catch (err) {
        console.warn('Print fallback:', err);
        window.print();
      }
      setTimeout(cleanup, 4000);
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Banner (Hidden in Print) */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-xs">
              KURIKULUM MERDEKA
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
              10 SUMATIF (80%) + SAS (20%)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
              PRESENSI: TERHUBUNG OTOMATIS
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Asesmen Pembelajaran &amp; Leger Nilai Terintegrasi
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sinkronisasi otomatis presensi kehadiran siswa dengan rekapitulasi 10 Nilai Sumatif, korelasi performa, dan nilai akhir rapor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Manual Refresh Presensi */}
          <button
            onClick={handleManualSyncPresensi}
            disabled={isSyncingPresensi}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950 dark:hover:bg-teal-900 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
            title="Tarik dan perbarui data presensi terbaru dari modul presensi"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPresensi ? 'animate-spin text-teal-600' : ''}`} />
            {isSyncingPresensi ? 'Menyinkronkan...' : 'Sinkronkan Presensi'}
          </button>

          {/* TOMBOL 'PRINT LAPORAN NILAI' */}
          <button
            onClick={handlePrintLaporanNilai}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-800 text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-95 ring-2 ring-indigo-400/30"
            title="Cetak langsung laporan rekapitulasi nilai sumatif 1-10 secara proporsional"
          >
            <Printer className="w-4 h-4 animate-bounce" />
            Print Laporan Nilai
          </button>

          <button
            onClick={() => exportService.exportLegerPdf(nilaiList, siswaList, selectedKelas, pengaturan)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-xl shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            Cetak Leger PDF
          </button>

          <button
            onClick={() => exportService.exportLegerNilaiToExcel(nilaiList, siswaList, selectedKelas)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Ekspor Excel
          </button>

          <button
            onClick={() => handleOpenAdd()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Input Nilai Siswa
          </button>
        </div>
      </div>

      {/* Filter Rombel & Mapel + Toggles Korelasi (Hidden in Print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pilih Rombel / Kelas:</label>
            <select
              value={selectedKelas}
              onChange={(e) => {
                setSelectedKelas(e.target.value);
                setFilterKorelasiStatus('all');
              }}
              className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
            >
              {kelasList.map((k) => (
                <option key={k} value={k}>
                  {k} ({siswaList.filter((s) => s.kelas === k).length} Siswa)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mata Pelajaran:</label>
            <select
              value={selectedMapelId}
              onChange={(e) => setSelectedMapelId(e.target.value)}
              className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
            >
              {mapelList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nama}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Toggles Kolom Presensi & Korelasi */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPresensiColumn}
              onChange={(e) => setShowPresensiColumn(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
            />
            <span>Kolom Presensi &amp; Korelasi di Tabel</span>
          </label>

          <button
            onClick={() => setShowKorelasiPanel(!showKorelasiPanel)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              showKorelasiPanel
                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            <span>Panel Analitik Korelasi</span>
            {showKorelasiPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. PANEL ANALITIK KORELASI TINGKAT KEHADIRAN VS NILAI SUMATIF (Hidden in Print) */}
      {/* ============================================================== */}
      {showKorelasiPanel && (
        <div className="no-print bg-gradient-to-br from-indigo-50/70 via-white to-teal-50/60 dark:from-slate-900 dark:via-slate-900/90 dark:to-teal-950/30 p-5 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900/60 shadow-sm space-y-4 animate-fade-in-tab">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-indigo-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                  <Activity className="w-4 h-4" />
                </span>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Analisis Korelasi Presensi Kehadiran &amp; Nilai Sumatif ({selectedKelas})
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sinkronisasi data absensi realtime dengan capaian kompetensi 10 Nilai Sumatif. Terakhir sinkron: <b className="font-mono text-slate-700 dark:text-slate-300">{lastSyncTime}</b>
              </p>
            </div>

            {/* Quick Filter Status Korelasi */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3" /> Filter:
              </span>
              <button
                onClick={() => setFilterKorelasiStatus('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  filterKorelasiStatus === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                Semua ({studentsInClass.length})
              </button>
              <button
                onClick={() => setFilterKorelasiStatus('selaras')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  filterKorelasiStatus === 'selaras'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                }`}
              >
                🟢 Selaras ({classCorrelationStats.selarasCount})
              </button>
              <button
                onClick={() => setFilterKorelasiStatus('at-risk')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  filterKorelasiStatus === 'at-risk'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                }`}
              >
                🔴 At-Risk ({classCorrelationStats.atRiskCount})
              </button>
              <button
                onClick={() => setFilterKorelasiStatus('anomali')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  filterKorelasiStatus === 'anomali'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                }`}
              >
                🟡 Butuh Bimbingan ({classCorrelationStats.anomaliCount})
              </button>
            </div>
          </div>

          {/* 4 Interactive Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Card 1: Rata Kehadiran Rombel */}
            <div className="p-3.5 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-semibold">Rata Kehadiran Rombel</span>
                <UserCheck className="w-4 h-4 text-teal-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {classCorrelationStats.avgKehadiran}%
                </span>
                <span className="text-[11px] text-teal-600 font-bold">
                  {classCorrelationStats.avgKehadiran >= 85 ? 'Kondusif' : 'Perlu Evaluasi'}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-teal-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(classCorrelationStats.avgKehadiran, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Card 2: Rata Nilai Sumatif */}
            <div className="p-3.5 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-semibold">Rata Nilai Sumatif</span>
                <Award className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {classCorrelationStats.avgSumatif || '-'}
                </span>
                <span className="text-[11px] text-indigo-600 font-bold">
                  Target KKTP: 75
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 truncate">
                Rata-rata 10 Lingkup Materi Sumatif
              </p>
            </div>

            {/* Card 3: Indeks Korelasi Pearson (r) */}
            <div className="p-3.5 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-semibold">Koefisien Korelasi (r)</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-blue-700 dark:text-blue-400 font-mono">
                  {classCorrelationStats.pearsonR >= 0 ? `+${classCorrelationStats.pearsonR}` : classCorrelationStats.pearsonR}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold">
                  {classCorrelationStats.pearsonR >= 0.5 ? 'Kuat' : 'Sedang'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1" title={classCorrelationStats.korelasiCategory}>
                {classCorrelationStats.korelasiCategory}
              </p>
            </div>

            {/* Card 4: Deteksi Siswa At-Risk */}
            <div
              onClick={() => setFilterKorelasiStatus('at-risk')}
              className="p-3.5 bg-white dark:bg-slate-800/90 rounded-xl border border-rose-200 dark:border-rose-900/60 shadow-xs cursor-pointer hover:border-rose-400 transition-colors"
              title="Klik untuk menyaring hanya siswa yang memerlukan perhatian khusus"
            >
              <div className="flex items-center justify-between text-xs text-rose-600 mb-1">
                <span className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Butuh Perhatian (At-Risk)
                </span>
                <span className="text-[10px] text-rose-500 underline font-semibold">Filter</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-rose-600 font-mono">
                  {classCorrelationStats.atRiskCount}
                </span>
                <span className="text-xs text-slate-500">Siswa</span>
              </div>
              <p className="text-[10px] text-rose-600/80 mt-1 leading-tight">
                Kehadiran &lt;80% &amp; Nilai &lt;75 (prioritas bimbingan guru)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KOP SURAT RESMI & JUDUL LAPORAN NILAI (HANYA TAMPIL SAAT PRINT) */}
      <div className="hidden print:block mb-4 pb-3 border-b-2 border-slate-800 text-slate-900 avoid-break print-laporan-header">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="w-16 h-16 flex items-center justify-center shrink-0">
            {pengaturan.logoSekolahUrl ? (
              <img src={pengaturan.logoSekolahUrl} alt="Logo Sekolah" className="w-14 h-14 object-contain" />
            ) : (
              <div className="w-12 h-12 rounded-full border-2 border-slate-800 flex items-center justify-center font-bold text-xs">
                SEKOLAH
              </div>
            )}
          </div>
          <div className="text-center flex-1">
            <h3 className="font-bold text-xs uppercase tracking-wider">{pengaturan.dinasPendidikan}</h3>
            <h2 className="font-extrabold text-base uppercase tracking-wider">{pengaturan.namaSekolah}</h2>
            <p className="text-[10px] text-slate-600 font-medium">
              {pengaturan.alamatSekolah} | Telp: {pengaturan.noTelpSekolah} | Email: {pengaturan.emailSekolah || '-'}
            </p>
          </div>
          <div className="w-16 h-16 shrink-0"></div>
        </div>

        <div className="text-center pt-2 border-t border-slate-300">
          <h3 className="font-extrabold text-sm uppercase tracking-wider underline">
            LAPORAN REKAPITULASI NILAI ASESMEN SUMATIF (1 - 10) &amp; SAS
          </h3>
          <div className="flex justify-between items-center text-[10px] text-slate-700 mt-1.5 px-1 font-medium">
            <span>Kelas / Rombel: <b>{selectedKelas}</b></span>
            <span>Mata Pelajaran: <b>{selectedMapelObj?.nama || 'Semua Mata Pelajaran'}</b></span>
            <span>Guru Pengampu: <b>{pengaturan.namaGuru}</b></span>
            <span>Semester: <b>{formData.semester || 'Ganjil 2026/2027'}</b></span>
            <span>Formula: <b>(Rata Sumatif × 80%) + (SAS × 20%)</b></span>
          </div>
        </div>
      </div>

      {/* Leger Table View with 10 Sumatif Columns, Presensi, and Korelasi */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm print:border-none print:shadow-none print:rounded-none">
        {filterKorelasiStatus !== 'all' && (
          <div className="no-print bg-indigo-50 dark:bg-indigo-950/50 px-4 py-2 border-b border-indigo-100 dark:border-indigo-900 flex items-center justify-between text-xs">
            <span className="text-indigo-900 dark:text-indigo-200 font-medium">
              Menampilkan <b>{displayedStudents.length}</b> siswa dengan kriteria korelasi <b>{filterKorelasiStatus.toUpperCase()}</b>.
            </span>
            <button
              onClick={() => setFilterKorelasiStatus('all')}
              className="font-bold text-indigo-700 dark:text-indigo-300 hover:underline"
            >
              Reset Filter
            </button>
          </div>
        )}

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left text-xs sm:text-sm border-collapse tabel-laporan-print">
            <thead className="bg-[#1a3a5c] text-white">
              {/* Row 1: Header Utama */}
              <tr>
                <th rowSpan={2} className="py-2 px-1 w-[2.8%] print:w-[2.8%] text-center border border-slate-600">
                  No
                </th>
                <th rowSpan={2} className="py-2 px-1 w-[7.2%] print:w-[7.2%] text-center border border-slate-600 font-mono">
                  NISN
                </th>
                <th rowSpan={2} className="py-2 px-2 w-[16%] print:w-[16%] border border-slate-600 min-w-[140px]">
                  Nama Siswa
                </th>

                {/* Kolom Sinkronisasi Presensi */}
                {showPresensiColumn && (
                  <th
                    rowSpan={2}
                    className="py-2 px-1 text-center border border-slate-600 bg-teal-900 font-bold text-[11px] print:text-[8pt] w-[6.5%] min-w-[65px]"
                    title="Tingkat kehadiran siswa hasil sinkronisasi otomatis dari modul absensi"
                  >
                    Presensi<br />
                    <span className="text-[9px] text-teal-200 font-normal">(% Hadir)</span>
                  </th>
                )}

                {/* Kolom Indikator Korelasi */}
                {showPresensiColumn && (
                  <th
                    rowSpan={2}
                    className="py-2 px-1 text-center border border-slate-600 bg-indigo-900 font-bold text-[11px] print:text-[8pt] w-[8%] min-w-[85px] no-print"
                    title="Analisis korelasi keterkaitan kehadiran dengan nilai sumatif siswa"
                  >
                    Korelasi<br />
                    <span className="text-[9px] text-indigo-200 font-normal">Hadir vs Nilai</span>
                  </th>
                )}

                {/* 10 Kolom Nilai Sumatif Lingkup Materi */}
                <th
                  colSpan={10}
                  className="py-1.5 px-1 text-center border border-slate-600 bg-sky-900 font-bold uppercase tracking-wider text-[11px] print:text-[9px]"
                >
                  Nilai Asesmen Sumatif Lingkup Materi (S1 - S10)
                </th>

                {/* Rata Sumatif 80% */}
                <th
                  rowSpan={2}
                  className="py-2 px-1 w-[6%] print:w-[6%] text-center border border-slate-600 bg-amber-700 font-bold text-[11px] print:text-[9px]"
                  title="Rata-rata 10 Nilai Sumatif dengan bobot 80%"
                >
                  Rata (80%)
                </th>

                {/* Nilai SAS 20% */}
                <th rowSpan={2} className="py-2 px-1 w-[5%] print:w-[5%] text-center border border-slate-600 text-[11px] print:text-[9px]">
                  SAS (20%)
                </th>

                {/* Nilai Akhir Rapor */}
                <th rowSpan={2} className="py-2 px-1 w-[5.8%] print:w-[5.8%] text-center font-black border border-slate-600 bg-blue-800 text-[11px] print:text-[9px]">
                  Nilai Akhir
                </th>

                <th rowSpan={2} className="py-2 px-1 w-[3.8%] print:w-[3.8%] text-center border border-slate-600 text-[11px] print:text-[9px]">
                  Predikat
                </th>

                <th rowSpan={2} className="py-2 px-2 w-[16%] print:w-[16%] border border-slate-600 text-[11px] print:text-[9px]">
                  Deskripsi Capaian Kompetensi
                </th>

                <th rowSpan={2} className="py-2 px-2 text-center border border-slate-600 w-16 text-xs no-print">
                  Aksi
                </th>
              </tr>

              {/* Row 2: Sub-kolom Nilai Sumatif 1 s/d 10 */}
              <tr className="bg-sky-950 text-[11px] print:text-[8px] text-center">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((idx) => (
                  <th
                    key={idx}
                    className="py-1 px-0.5 border border-slate-600 font-bold min-w-[28px] hover:bg-sky-900 transition-colors"
                    title={`Nilai Sumatif ${idx}`}
                  >
                    S{idx}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={showPresensiColumn ? 20 : 18} className="py-8 text-center text-slate-400">
                    Tidak ada siswa pada rombel {selectedKelas} dengan kriteria filter saat ini.
                  </td>
                </tr>
              ) : (
                displayedStudents.map((s, idx) => {
                  const studentGrades = nilaiList.filter(
                    (n) => n.siswaId === s.id && (!selectedMapelId || n.mapelId === selectedMapelId)
                  );

                  // Filter Sumatif Records
                  const sumatifRecords = studentGrades.filter((n) => n.jenis === 'sumatif');

                  // Map values for Nilai Sumatif 1 s/d 10
                  const sumatifValues: (number | null)[] = [];
                  for (let i = 1; i <= 10; i++) {
                    const found = sumatifRecords.find(
                      (n) =>
                        n.sumatifKe === i ||
                        n.materi?.toLowerCase().includes(`sumatif ${i}`) ||
                        n.materi?.toLowerCase().includes(`sumatif ke-${i}`) ||
                        n.materi?.toLowerCase().includes(`tp ${i}`)
                    );
                    sumatifValues.push(found ? found.skor : null);
                  }

                  // Non-null scores for averaging
                  const filledScores = sumatifValues.filter((v): v is number => v !== null);
                  const allSumatifScores = sumatifRecords.map((n) => n.skor);
                  const activeScores = filledScores.length > 0 ? filledScores : allSumatifScores;

                  const avgSumatif = activeScores.length
                    ? Math.round(activeScores.reduce((a, b) => a + b, 0) / activeScores.length)
                    : 0;

                  const pasScores = studentGrades.filter((n) => n.jenis === 'pas').map((n) => n.skor);
                  const avgPas = pasScores.length
                    ? Math.round(pasScores.reduce((a, b) => a + b, 0) / pasScores.length)
                    : 0;

                  // Nilai Akhir: (Rata Sumatif × 80%) + (Nilai SAS × 20%)
                  const nilaiAkhir =
                    avgSumatif > 0
                      ? avgPas > 0
                        ? Math.round(avgSumatif * 0.8 + avgPas * 0.2)
                        : avgSumatif
                      : avgPas > 0
                      ? avgPas
                      : 0;

                  let predikat = 'D';
                  let predikatColor = 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300';
                  if (nilaiAkhir >= 90) {
                    predikat = 'A';
                    predikatColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
                  } else if (nilaiAkhir >= 80) {
                    predikat = 'B';
                    predikatColor = 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
                  } else if (nilaiAkhir >= 70) {
                    predikat = 'C';
                    predikatColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
                  }

                  const deskripsi = getDeskripsiKompetensi(nilaiAkhir, s.nama);

                  // Data Presensi & Korelasi Siswa
                  const attStats = getStudentAttendanceStats(s.id);
                  const korelasiInfo = evaluateKorelasi(attStats.pct, avgSumatif);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-1.5 px-1 text-center font-mono text-xs print:text-[8pt] border border-slate-200 dark:border-slate-800 print:border-slate-600">
                        {idx + 1}
                      </td>
                      <td className="py-1.5 px-1 text-center font-mono text-xs print:text-[8pt] text-blue-600 dark:text-blue-400 print:text-slate-900 border border-slate-200 dark:border-slate-800 print:border-slate-600">
                        {s.nisn}
                      </td>
                      <td className="py-1.5 px-2 font-semibold text-slate-900 dark:text-white print:text-slate-900 text-xs print:text-[8pt] border border-slate-200 dark:border-slate-800 print:border-slate-600 truncate print:whitespace-normal">
                        {s.nama}
                      </td>

                      {/* KOLOM PRESENSI SINKRON */}
                      {showPresensiColumn && (
                        <td
                          onClick={() => {
                            setInspectedSiswaKorelasi({
                              siswa: s,
                              hadirPct: attStats.pct,
                              avgSumatif,
                              nilaiAkhir,
                              hCount: attStats.h,
                              sCount: attStats.s,
                              iCount: attStats.i,
                              aCount: attStats.a,
                              totalPresensi: attStats.total,
                              statusKorelasi: korelasiInfo,
                            });
                          }}
                          className="py-1.5 px-1 text-center cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200 dark:border-slate-800 print:border-slate-600 transition-colors"
                          title="Klik untuk membuka rincian kehadiran & korelasi siswa"
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <span
                              className={`px-1.5 py-0.2 rounded-full font-mono font-bold text-[11px] print:text-[8pt] ${
                                attStats.pct >= 85
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : attStats.pct >= 75
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-black'
                              }`}
                            >
                              {attStats.pct}%
                            </span>
                            <span className="text-[8px] text-slate-400 font-mono no-print">
                              H:{attStats.h} S:{attStats.s} I:{attStats.i} A:{attStats.a}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* KOLOM STATUS KORELASI */}
                      {showPresensiColumn && (
                        <td
                          onClick={() => {
                            setInspectedSiswaKorelasi({
                              siswa: s,
                              hadirPct: attStats.pct,
                              avgSumatif,
                              nilaiAkhir,
                              hCount: attStats.h,
                              sCount: attStats.s,
                              iCount: attStats.i,
                              aCount: attStats.a,
                              totalPresensi: attStats.total,
                              statusKorelasi: korelasiInfo,
                            });
                          }}
                          className="py-1.5 px-1 text-center cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 print:border-slate-600 transition-colors no-print"
                          title="Klik untuk melihat rekomendasi tindak lanjut"
                        >
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border truncate max-w-[95px] ${korelasiInfo.badgeColor}`}
                          >
                            {korelasiInfo.icon} {korelasiInfo.label}
                          </span>
                        </td>
                      )}

                      {/* 10 Kolom Nilai Sumatif (S1 s/d S10) */}
                      {sumatifValues.map((score, sIdx) => {
                        const sumatifNum = sIdx + 1;
                        return (
                          <td
                            key={sIdx}
                            onClick={() => handleOpenAdd(s.id, sumatifNum)}
                            className="py-1 px-0.5 text-center font-mono text-xs print:text-[8pt] cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-200 dark:border-slate-800 print:border-slate-600 transition-colors"
                            title={`Klik untuk mengedit Nilai Sumatif ${sumatifNum}`}
                          >
                            {score !== null ? (
                              <span className="font-bold text-slate-800 dark:text-slate-200 print:text-slate-900">
                                {score}
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 print:text-slate-400 hover:text-blue-500 font-bold">
                                -
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Rata Sumatif (80%) */}
                      <td className="py-1.5 px-1 text-center font-mono font-bold text-amber-600 dark:text-amber-400 print:text-slate-900 bg-amber-50/40 dark:bg-amber-950/20 print:bg-slate-100 border border-slate-200 dark:border-slate-800 print:border-slate-600 text-xs print:text-[8pt]">
                        {avgSumatif || '-'}
                      </td>

                      {/* Nilai SAS (20%) */}
                      <td className="py-1.5 px-1 text-center font-mono font-medium border border-slate-200 dark:border-slate-800 print:border-slate-600 text-xs print:text-[8pt]">
                        {avgPas || '-'}
                      </td>

                      {/* Nilai Akhir */}
                      <td className="py-1.5 px-1 text-center font-mono font-black text-sm print:text-[8.5pt] text-blue-700 dark:text-blue-400 print:text-slate-900 bg-blue-50/50 dark:bg-blue-950/20 print:bg-slate-100 border border-slate-200 dark:border-slate-800 print:border-slate-600">
                        {nilaiAkhir || '-'}
                      </td>

                      {/* Predikat */}
                      <td className="py-1.5 px-1 text-center border border-slate-200 dark:border-slate-800 print:border-slate-600">
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs print:text-[8pt] font-bold ${predikatColor} print:bg-transparent print:text-slate-900 print:p-0`}
                        >
                          {predikat}
                        </span>
                      </td>

                      {/* Deskripsi Capaian */}
                      <td className="py-1.5 px-2 text-[11px] print:text-[7pt] text-slate-600 dark:text-slate-400 print:text-slate-800 leading-tight border border-slate-200 dark:border-slate-800 print:border-slate-600">
                        {deskripsi}
                      </td>

                      {/* Aksi (Hidden in Print) */}
                      <td className="py-1.5 px-1 text-center no-print border border-slate-200 dark:border-slate-800">
                        <button
                          onClick={() => handleOpenAdd(s.id)}
                          className="px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                        >
                          + Nilai
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LEMBAR PENGESAHAN RESMI (HANYA TAMPIL SAAT PRINT) */}
      <div className="hidden print:flex justify-between items-start pt-6 mt-3 text-xs text-slate-900 avoid-break print-laporan-footer">
        <div className="text-center w-72">
          <p>Mengetahui,</p>
          <p className="font-semibold">Kepala {pengaturan.namaSekolah}</p>
          <div className="h-16"></div>
          <p className="font-bold underline text-[11pt]">{pengaturan.namaKepsek}</p>
          <p className="font-mono text-[9pt]">NIP. {pengaturan.nipKepsek}</p>
        </div>

        <div className="text-center w-72">
          <p>
            {pengaturan.kota},{' '}
            {new Date().toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <p className="font-semibold">Guru Mata Pelajaran</p>
          <div className="h-16"></div>
          <p className="font-bold underline text-[11pt]">{pengaturan.namaGuru}</p>
          <p className="font-mono text-[9pt]">NIP. {pengaturan.nipGuru}</p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL INSPEKSI KORELASI SISWA (PRESENSI VS NILAI SUMATIF) */}
      {/* ============================================================== */}
      {inspectedSiswaKorelasi && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in-tab">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 relative">
            <button
              onClick={() => setInspectedSiswaKorelasi(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300">
                DIAGNOSTIK KORELASI PRESTASI
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {inspectedSiswaKorelasi.siswa.nama}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                NISN: {inspectedSiswaKorelasi.siswa.nisn} | Rombel: {inspectedSiswaKorelasi.siswa.kelas}
              </p>
            </div>

            {/* Visual Perbandingan Presensi vs Nilai */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              {/* Presensi */}
              <div className="text-center p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-teal-200 dark:border-teal-800">
                <span className="text-[10px] text-teal-600 uppercase tracking-wider font-bold block mb-1">
                  Kehadiran Presensi
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {inspectedSiswaKorelasi.hadirPct}%
                </span>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">
                  H:{inspectedSiswaKorelasi.hCount} S:{inspectedSiswaKorelasi.sCount} I:{inspectedSiswaKorelasi.iCount} A:{inspectedSiswaKorelasi.aCount}
                </div>
              </div>

              {/* Nilai Sumatif */}
              <div className="text-center p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <span className="text-[10px] text-indigo-600 uppercase tracking-wider font-bold block mb-1">
                  Rata Nilai Sumatif
                </span>
                <span className="text-2xl font-black text-blue-700 dark:text-blue-400 font-mono">
                  {inspectedSiswaKorelasi.avgSumatif || '-'}
                </span>
                <div className="text-[10px] text-slate-500 mt-1">
                  Nilai Akhir: <b>{inspectedSiswaKorelasi.nilaiAkhir || '-'}</b>
                </div>
              </div>
            </div>

            {/* Status Korelasi & Analisis */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{inspectedSiswaKorelasi.statusKorelasi.icon}</span>
                <h4 className="font-bold text-sm text-indigo-950 dark:text-indigo-200">
                  {inspectedSiswaKorelasi.statusKorelasi.label}
                </h4>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {inspectedSiswaKorelasi.statusKorelasi.desc}
              </p>
            </div>

            {/* Rekomendasi Pedagogis Guru */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Rekomendasi Intervensi Guru:
              </label>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 leading-relaxed">
                {inspectedSiswaKorelasi.statusKorelasi.rekomendasi}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectedSiswaKorelasi(null)}
                className="px-5 py-2 text-xs font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl hover:opacity-90 transition-opacity"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Nilai (Hidden in Print) */}
      {isModalOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingId ? 'Edit Asesmen Nilai' : 'Input Asesmen Nilai Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Peserta Didik *
                </label>
                <select
                  value={formData.siswaId || ''}
                  onChange={(e) => setFormData({ ...formData, siswaId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-medium"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {studentsInClass.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.nisn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mata Pelajaran *
                </label>
                <select
                  value={formData.mapelId || ''}
                  onChange={(e) => setFormData({ ...formData, mapelId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-medium"
                >
                  {mapelList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Jenis Asesmen *
                  </label>
                  <select
                    value={formData.jenis || 'sumatif'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jenis: e.target.value as 'formatif' | 'sumatif' | 'pas',
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-medium"
                  >
                    <option value="sumatif">Sumatif Lingkup Materi</option>
                    <option value="pas">Sumatif Akhir Semester (SAS)</option>
                    <option value="formatif">Formatif (Tugas/TP)</option>
                  </select>
                </div>

                {formData.jenis === 'sumatif' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Pilih Kolom Sumatif *
                    </label>
                    <select
                      value={formData.sumatifKe || 1}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormData({
                          ...formData,
                          sumatifKe: val,
                          materi: `Sumatif ${val}: Lingkup Materi ${val}`,
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white font-bold"
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                          Nilai Sumatif {num} (S{num})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Semester
                    </label>
                    <input
                      type="text"
                      value={formData.semester || 'Ganjil 2026/2027'}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Materi / Lingkup Materi *
                </label>
                <input
                  type="text"
                  value={formData.materi || ''}
                  onChange={(e) => setFormData({ ...formData, materi: e.target.value })}
                  placeholder="Misal: Sumatif 1: Eksplorasi Algoritma Pemrograman"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Skor / Nilai (0 - 100) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.skor !== undefined ? formData.skor : ''}
                  onChange={(e) => setFormData({ ...formData, skor: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-lg font-bold text-blue-600 dark:text-blue-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Simpan Nilai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
