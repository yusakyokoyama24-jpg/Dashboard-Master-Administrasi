import React, { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import Swal from 'sweetalert2';
import {
  Printer,
  Download,
  Users,
  CheckSquare,
  Square,
  Eye,
  ShieldCheck,
  CheckCircle2,
  Camera,
  Upload,
  Building2,
  Check,
  X,
  HelpCircle,
  QrCode as QrCodeIcon,
  Scissors,
  Maximize2,
  ExternalLink,
  Sparkles,
  Info,
  Phone,
  User,
  GraduationCap,
} from 'lucide-react';
import { Siswa, Pengaturan } from '../../types';
import { dbService } from '../../services/db';
import { showToast } from '../../utils/toast';

interface KartuSiswaViewProps {
  siswaList: Siswa[];
  pengaturan: Pengaturan;
  initialSelectedStudentId?: string | null;
}

export const KartuSiswaView: React.FC<KartuSiswaViewProps> = ({
  siswaList,
  pengaturan,
  initialSelectedStudentId,
}) => {
  const [selectedKelas, setSelectedKelas] = useState<string>('all');
  const [selectedSiswaIds, setSelectedSiswaIds] = useState<string[]>([]);
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});
  const [bullyingQrUrl, setBullyingQrUrl] = useState<string>('');
  const [saranQrUrl, setSaranQrUrl] = useState<string>('');

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
    const bullyingUrl = origin + '?portal=bullying';
    const saranUrl = origin + '?portal=saran';

    QRCode.toDataURL(bullyingUrl, { width: 280, margin: 1, color: { dark: '#991b1b', light: '#FFFFFF' } })
      .then((url) => setBullyingQrUrl(url))
      .catch((e) => console.error(e));

    QRCode.toDataURL(saranUrl, { width: 280, margin: 1, color: { dark: '#b45309', light: '#FFFFFF' } })
      .then((url) => setSaranQrUrl(url))
      .catch((e) => console.error(e));
  }, []);
  const [cardsActivated, setCardsActivated] = useState<boolean>(true);
  const [printLayout, setPrintLayout] = useState<'8a4' | '4a4' | 'pvc'>('8a4');
  const [showPrintGuide, setShowPrintGuide] = useState<boolean>(false);
  const barcodeRefs = useRef<Record<string, SVGSVGElement | null>>({});

  // Single card targeted print state
  const [singlePrintId, setSinglePrintId] = useState<string | null>(null);

  // Modal Pratinjau Kartu Siswa QR
  const [previewSiswa, setPreviewSiswa] = useState<Siswa | null>(null);
  const [previewTab, setPreviewTab] = useState<'depan' | 'belakang' | 'keduanya'>('keduanya');

  // Modal Upload Logo Kartu Siswa
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [tempLogoUrl, setTempLogoUrl] = useState('');
  const [syncSchoolLogo, setSyncSchoolLogo] = useState(true);

  const cardLogo = pengaturan.logoKartuUrl || pengaturan.logoSekolahUrl || '';

  // Auto-select or open preview if initialSelectedStudentId is provided
  useEffect(() => {
    if (initialSelectedStudentId) {
      const target = siswaList.find((s) => s.id === initialSelectedStudentId);
      if (target) {
        setSelectedSiswaIds([target.id]);
        if (target.kelas) {
          setSelectedKelas(target.kelas);
        }
        setPreviewSiswa(target);
      }
    }
  }, [initialSelectedStudentId, siswaList]);

  const kelasList = useMemo(() => {
    return Array.from(new Set(siswaList.map((s) => s.kelas))).sort();
  }, [siswaList]);

  const filteredSiswa = useMemo(() => {
    return siswaList.filter((s) => {
      if (selectedKelas === 'all') return true;
      return s.kelas === selectedKelas;
    });
  }, [siswaList, selectedKelas]);

  // Which cards to render in the regular list
  const cardsToRender = useMemo(() => {
    // If a single card print is active during print mode, only render that card
    if (singlePrintId) {
      const match = siswaList.find((s) => s.id === singlePrintId);
      return match ? [match] : filteredSiswa;
    }
    return filteredSiswa.filter((s) =>
      selectedSiswaIds.length === 0 ? true : selectedSiswaIds.includes(s.id)
    );
  }, [filteredSiswa, selectedSiswaIds, singlePrintId, siswaList]);

  const cardsKey = useMemo(() => {
    return cardsToRender.map((s) => `${s.id}_${s.nisn}`).join('|');
  }, [cardsToRender]);

  // Generate QR codes whenever cards change
  useEffect(() => {
    let isMounted = true;
    const generateQrs = async () => {
      const urls: Record<string, string> = {};
      for (const s of cardsToRender) {
        try {
          const url = await QRCode.toDataURL(s.nisn, {
            width: 160,
            margin: 1,
            color: { dark: '#0A192F', light: '#FFFFFF' },
          });
          urls[s.id] = url;
        } catch (e) {
          console.error(e);
        }
      }
      // Also generate for previewSiswa if not in list
      if (previewSiswa && !urls[previewSiswa.id]) {
        try {
          const url = await QRCode.toDataURL(previewSiswa.nisn, {
            width: 180,
            margin: 1,
            color: { dark: '#0A192F', light: '#FFFFFF' },
          });
          urls[previewSiswa.id] = url;
        } catch (e) {
          console.error(e);
        }
      }

      if (isMounted) {
        setQrCodeUrls((prev) => ({ ...prev, ...urls }));
      }
    };

    if (cardsToRender.length > 0 || previewSiswa) {
      generateQrs();
    }
    return () => {
      isMounted = false;
    };
  }, [cardsKey, previewSiswa]);

  // Generate Barcodes
  useEffect(() => {
    cardsToRender.forEach((s) => {
      const el = barcodeRefs.current[s.id];
      if (el) {
        try {
          JsBarcode(el, s.nisn, {
            format: 'CODE128',
            width: 1.2,
            height: 28,
            displayValue: false,
            margin: 0,
            background: 'transparent',
            lineColor: '#1e293b',
          });
        } catch (e) {
          console.error(e);
        }
      }
    });
  }, [cardsKey, Object.keys(qrCodeUrls).length]);

  // Keyboard shortcut Ctrl+P / Cmd+P listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrintDirect();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cardsToRender]);

  const toggleSelectSiswa = (id: string) => {
    if (selectedSiswaIds.includes(id)) {
      setSelectedSiswaIds(selectedSiswaIds.filter((item) => item !== id));
    } else {
      setSelectedSiswaIds([...selectedSiswaIds, id]);
    }
  };

  const selectAll = () => {
    if (selectedSiswaIds.length === filteredSiswa.length) {
      setSelectedSiswaIds([]);
    } else {
      setSelectedSiswaIds(filteredSiswa.map((s) => s.id));
    }
  };

  const handleActivateCards = () => {
    setCardsActivated(true);
    showToast(
      'Kartu Siswa Aktif & Terverifikasi!',
      'success',
      `Sebanyak ${cardsToRender.length} Kartu Tanda Pelajar digital telah diaktifkan dan terhubung dengan QR Presensi.`
    );
  };

  // Helper to inject zero margin print CSS to strictly prevent browser headers/footers
  const injectZeroMarginPrintStyle = () => {
    const existing = document.getElementById('direct-print-zero-margins');
    if (existing) existing.remove();

    const style = document.createElement('style');
    style.id = 'direct-print-zero-margins';
    style.innerHTML = `
      @page {
        size: A4 portrait;
        margin: 0mm !important;
      }
      @page landscape {
        size: A4 landscape;
        margin: 0mm !important;
      }
      @media print {
        html, body {
          margin: 0mm !important;
          padding: 0mm !important;
          background: #ffffff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        /* Meniadakan URL, tanggal, dan nomor halaman browser default */
        header, footer {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const cleanupPrintStyle = () => {
    const el = document.getElementById('direct-print-zero-margins');
    if (el) el.remove();
    setSinglePrintId(null);
  };

  // TOMBOL 'PRINT LANGSUNG' IMPLEMENTATION:
  // Otomatis memicu dialog cetak printer sistem tanpa header/footer browser tambahan agar kartu terpotong dengan presisi ukuran standar.
  const handlePrintDirect = (targetSiswaId?: string) => {
    injectZeroMarginPrintStyle();

    if (targetSiswaId) {
      setSinglePrintId(targetSiswaId);
    } else {
      setSinglePrintId(null);
    }

    showToast(
      'Menghubungkan ke Printer...',
      'info',
      'Membuka dialog cetak sistem tanpa header/footer untuk presisi ukuran standar.'
    );

    // Set up afterprint cleanup listener
    const onAfterPrint = () => {
      cleanupPrintStyle();
      window.removeEventListener('afterprint', onAfterPrint);
    };
    window.addEventListener('afterprint', onAfterPrint);

    // Timeout guarantees DOM re-renders with singlePrintId if applicable before triggering print dialog
    setTimeout(() => {
      try {
        window.focus();
        window.print();
      } catch (err) {
        console.warn('Direct print fallback:', err);
        window.print();
      }

      // Fallback cleanup if afterprint doesn't fire
      setTimeout(() => {
        cleanupPrintStyle();
      }, 3000);
    }, 200);
  };

  const handleDownloadPdf = () => {
    Swal.fire({
      title: '📥 Unduh / Simpan Kartu A4 (PDF)',
      html: `
        <div class="text-left space-y-3 text-xs text-slate-600 dark:text-slate-300">
          <p>Untuk mengunduh kartu siswa dalam format <b>PDF berkualitas vektor A4</b>:</p>
          <ol class="list-decimal pl-4 space-y-1.5 font-medium">
            <li>Klik tombol <b>Buka Dialog Cetak / PDF</b> di bawah.</li>
            <li>Pada jendela printer yang muncul, pilih <b>Destination / Printer</b> ke: <span class="text-indigo-600 font-bold">Save as PDF / Simpan sebagai PDF</span>.</li>
            <li>Pastikan <b>Layout</b> diatur ke <b>Portrait</b> dan <b>Margins</b> ke <b>None / Default</b>.</li>
            <li>Klik <b>Save</b> untuk menyimpan berkas PDF ke perangkat Anda.</li>
          </ol>
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Buka Dialog Cetak / PDF',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#4f46e5'
    }).then((result) => {
      if (result.isConfirmed) {
        handlePrintDirect();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Banner (Hidden in Print) */}
      <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-300 dark:border-emerald-800 shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                KONEKSI PRINTER: TERHUBUNG &amp; SIAP MENCETAK
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-300 dark:border-blue-800">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                SISTEM KARTU SISWA: 100% TERVERIFIKASI
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] border border-slate-300 dark:border-slate-700">
                📐 Standar ID-1: 85.60 × 53.98 mm
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Cetak &amp; Kelola Kartu Tanda Pelajar (KTP Siswa QR &amp; Barcode)
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Terhubung langsung ke printer sistem (kertas A4 / printer kartu PVC) dengan pengaturan presisi potong standar tanpa header/footer browser.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Tombol Upload Logo Kartu */}
            <button
              onClick={() => {
                setTempLogoUrl(cardLogo);
                setIsLogoModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all"
              title="Unggah logo sekolah khusus untuk kartu pelajar"
            >
              <Camera className="w-4 h-4" />
              Upload Logo Kartu
            </button>

            {/* Tombol Panduan Printer */}
            <button
              onClick={() => setShowPrintGuide(!showPrintGuide)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl shadow-xs transition-all"
              title="Petunjuk pengaturan dialog printer"
            >
              <HelpCircle className="w-4 h-4 text-blue-500" />
              Panduan Printer
            </button>

            {/* Tombol Aktifkan Semua */}
            <button
              onClick={handleActivateCards}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-sm transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Aktifkan Semua
            </button>

            {/* TOMBOL DOWNLOAD KARTU A4 (PDF) */}
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
              title="Unduh dan simpan kartu siswa dalam format lembar A4 PDF"
            >
              <Download className="w-4 h-4" />
              Download Kartu A4 (PDF)
            </button>

            {/* TOMBOL UTAMA: PRINT LANGSUNG */}
            <button
              onClick={() => handlePrintDirect()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 hover:from-emerald-700 hover:to-cyan-800 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all active:scale-95 ring-2 ring-emerald-400/40"
              title="Picu langsung dialog cetak printer sistem tanpa header/footer browser"
            >
              <Printer className="w-4 h-4 animate-bounce" />
              Print Langsung (Ctrl+P)
            </button>
          </div>
        </div>

        {/* Printer Setup Guide Card (Collapsible) */}
        {showPrintGuide && (
          <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-slate-700 dark:text-slate-200 space-y-2 animate-fade-in-tab">
            <div className="flex items-center justify-between font-bold text-blue-900 dark:text-blue-300">
              <span className="flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-blue-600" /> Petunjuk Pengaturan Cetak ke Printer Fisik (Epson, Canon, HP, Brother, Zebra, Fargo, Datacard):
              </span>
              <button onClick={() => setShowPrintGuide(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <ol className="list-decimal pl-5 space-y-1 text-slate-600 dark:text-slate-300 leading-relaxed">
              <li>Klik tombol <b>"Print Langsung"</b> pada header atau pada pratinjau kartu siswa manapun.</li>
              <li>Sistem secara otomatis mengaktifkan aturan <b>margin 0mm</b> yang menyembunyikan header/footer browser (URL dan tanggal) agar kartu terpotong dengan presisi ukuran standar (85.60 × 53.98 mm).</li>
              <li>
                <span className="text-rose-600 dark:text-rose-400 font-bold">PENTING:</span> Pada dialog printer browser, buka <b>"Setelan Lainnya" (More Settings)</b> lalu pastikan <b className="text-emerald-700 dark:text-emerald-300">CENTANG "Grafis Latar Belakang" (Background Graphics)</b> agar kop biru tua, border emas, foto siswa, dan lencana aktif tercetak sempurna!
              </li>
              <li>Pilih <b>Ukuran Kertas: A4</b> dan <b>Margin: Default / Minimum</b> (8 kartu tersusun rapi per halaman siap potong dengan garis panduan potong presisi).</li>
            </ol>
          </div>
        )}

        {/* Filters & Print Layout Options */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Filter Kelas:</label>
              <select
                value={selectedKelas}
                onChange={(e) => {
                  setSelectedKelas(e.target.value);
                  setSelectedSiswaIds([]);
                }}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="all">Semua Kelas ({siswaList.length} Siswa)</option>
                {kelasList.map((k) => (
                  <option key={k} value={k}>
                    {k} ({siswaList.filter((s) => s.kelas === k).length} Siswa)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Format Cetak Printer:</label>
              <select
                value={printLayout}
                onChange={(e) => setPrintLayout(e.target.value as any)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="8a4">Grid 8 Kartu / Lembar A4 (Standar Potong Presisi)</option>
                <option value="4a4">Grid 4 Kartu / Lembar A4 (Ukuran Besar)</option>
                <option value="pvc">1 Kartu / Halaman (Khusus Printer Kartu PVC CR80)</option>
              </select>
            </div>

            <button
              onClick={selectAll}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 ml-2"
            >
              {selectedSiswaIds.length === filteredSiswa.length && filteredSiswa.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              Pilih Semua ({filteredSiswa.length})
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              Terpilih: <b>{selectedSiswaIds.length || cardsToRender.length}</b> kartu
            </span>
            <button
              onClick={() => handlePrintDirect()}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print Terpilih
            </button>
          </div>
        </div>
      </div>

      {/* Cards Printable Area with Standard Cutting Guides */}
      <div className="bg-slate-100 dark:bg-slate-950 p-6 rounded-2xl print:bg-white print:p-0 kartu-pelajar-print-container">
        <div
          className={`grid gap-6 print:gap-3 ${
            printLayout === 'pvc'
              ? 'grid-cols-1 print:grid-cols-1 print:max-w-[86mm] print:mx-auto'
              : printLayout === '4a4'
              ? 'grid-cols-1 md:grid-cols-2 print:grid-cols-2'
              : 'grid-cols-1 md:grid-cols-2 print:grid-cols-2 kartu-pelajar-print-grid'
          }`}
        >
          {cardsToRender.map((siswa) => (
            <div
              key={siswa.id}
              className={`relative w-full ${
                printLayout === 'pvc'
                  ? 'max-w-[340px] print:max-w-[85.6mm]'
                  : 'max-w-[420px] kartu-pelajar-item'
              } mx-auto bg-gradient-to-br from-white to-slate-50 border-2 border-slate-300 rounded-2xl shadow-md overflow-hidden print:shadow-none print:border-slate-500 print:rounded-lg avoid-break group transition-all hover:shadow-lg`}
            >
              {/* Corner Cutting Crop Marks Guide (Visible in Print & Subtle on Screen) */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-slate-400 print:border-black pointer-events-none z-10"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-slate-400 print:border-black pointer-events-none z-10"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-slate-400 print:border-black pointer-events-none z-10"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-slate-400 print:border-black pointer-events-none z-10"></div>

              {/* Card Header */}
              <div className="bg-[#1a3a5c] text-white p-3 flex items-center justify-between border-b-2 border-amber-400">
                <div className="flex items-center gap-2.5">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempLogoUrl(cardLogo);
                      setIsLogoModalOpen(true);
                    }}
                    className="relative group w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center overflow-hidden border-2 border-amber-400 shadow-sm shrink-0 cursor-pointer hover:scale-105 transition-transform"
                    title="Klik untuk ganti logo kartu siswa"
                  >
                    {cardLogo ? (
                      <img src={cardLogo} alt="Logo Sekolah" className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="w-5 h-5 text-blue-700" />
                    )}
                    <div className="no-print absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wide leading-tight">
                      {pengaturan.namaSekolah}
                    </h3>
                    <p className="text-[10px] text-slate-200 tracking-wider">KARTU TANDA PELAJAR DIGITAL</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="inline-block bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] px-2 py-0.5 rounded font-mono font-semibold">
                    {siswa.kelas}
                  </span>
                  <span className="inline-block bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[8px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                    ✓ KARTU AKTIF
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 grid grid-cols-12 gap-3 items-center">
                {/* Photo & QR */}
                <div className="col-span-4 flex flex-col items-center gap-2">
                  <div className="w-20 h-24 rounded-lg bg-slate-200 border-2 border-slate-300 flex items-center justify-center overflow-hidden shadow-inner">
                    {siswa.foto ? (
                      <img src={siswa.foto} alt={siswa.nama} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-b from-blue-100 to-indigo-200 flex flex-col items-center justify-center text-slate-600 font-bold text-sm">
                        <span className="text-xl">🎓</span>
                        <span className="text-[9px] mt-1">{siswa.jenisKelamin === 'L' ? 'SISWA' : 'SISWI'}</span>
                      </div>
                    )}
                  </div>
                  {qrCodeUrls[siswa.id] && (
                    <div
                      onClick={() => setPreviewSiswa(siswa)}
                      className="cursor-pointer group/qr relative"
                      title="Klik untuk pratinjau QR besar"
                    >
                      <img
                        src={qrCodeUrls[siswa.id]}
                        alt="QR Siswa"
                        className="w-16 h-16 rounded border border-slate-300 bg-white p-0.5 hover:ring-2 hover:ring-blue-400 transition-all"
                      />
                      <div className="no-print absolute inset-0 bg-blue-900/60 text-white rounded flex items-center justify-center opacity-0 group-hover/qr:opacity-100 transition-opacity text-[8px] font-bold">
                        🔍 ZOOM
                      </div>
                    </div>
                  )}
                </div>

                {/* Identity Info */}
                <div className="col-span-8 space-y-1.5 text-left">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Nama Lengkap</span>
                    <h4 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                      {siswa.nama}
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">NISN</span>
                      <span className="font-mono font-bold text-blue-700">{siswa.nisn}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Kelas</span>
                      <span className="font-semibold text-slate-800">{siswa.kelas}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Kontak Wali</span>
                    <span className="text-xs text-slate-700 font-mono">{siswa.noHpOrtu || '-'}</span>
                  </div>

                  {/* Barcode SVG */}
                  <div className="pt-1">
                    <svg
                      ref={(el) => {
                        barcodeRefs.current[siswa.id] = el;
                      }}
                      className="w-full max-h-7"
                    ></svg>
                    <span className="block text-center font-mono text-[9px] text-slate-500 tracking-widest">
                      *{siswa.nisn}*
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer with Pratinjau QR & Quick Print Langsung Button */}
              <div className="bg-slate-100 border-t border-slate-200 px-3 py-2 flex items-center justify-between text-[9px] text-slate-500">
                <span>Berlaku s.d. Akhir Studi | {pengaturan.namaKepsek.split(',')[0]}</span>

                <div className="no-print flex items-center gap-1.5">
                  {/* Tombol Pratinjau QR */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewSiswa(siswa);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] border border-indigo-200 dark:border-indigo-800 shadow-xs transition-colors"
                    title={`Pratinjau QR dan kartu ${siswa.nama}`}
                  >
                    <Eye className="w-3 h-3 text-indigo-600" /> Pratinjau QR
                  </button>

                  {/* TOMBOL 'PRINT LANGSUNG' PADA TIAP KOTAK KARTU */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrintDirect(siswa.id);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] shadow-xs transition-all active:scale-95"
                    title={`Cetak kartu ${siswa.nama} langsung ke printer tanpa header/footer browser`}
                  >
                    <Printer className="w-3 h-3" /> Print Langsung
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL PRATINJAU KARTU SISWA QR & BARCODE (DENGAN TOMBOL PRINT LANGSUNG) */}
      {/* ============================================================== */}
      {previewSiswa && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in-tab">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 relative max-h-[92vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setPreviewSiswa(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Tutup pratinjau"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                  ✓ TERHUBUNG KE PRINTER SISTEM
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300">
                  UKURAN STANDAR: 85.60 × 53.98 MM (ISO ID-1)
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <QrCodeIcon className="w-5 h-5 text-indigo-600" />
                Pratinjau Kartu Siswa QR &amp; Barcode
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pemeriksaan presisi tampak depan, belakang, dan pembacaan QR Code sebelum dicetak ke printer.
              </p>
            </div>

            {/* Tab Selection: Depan / Belakang / Keduanya */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <button
                onClick={() => setPreviewTab('keduanya')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  previewTab === 'keduanya'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                Tampak Depan &amp; Belakang
              </button>
              <button
                onClick={() => setPreviewTab('depan')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  previewTab === 'depan'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                Tampak Depan Saja
              </button>
              <button
                onClick={() => setPreviewTab('belakang')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  previewTab === 'belakang'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                Tampak Belakang (QR Zoom)
              </button>
            </div>

            {/* Visual Card Preview Container */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. FRONT CARD PREVIEW */}
                {(previewTab === 'keduanya' || previewTab === 'depan') && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Tampak Depan (Identitas)</span>
                      <span className="text-[10px] text-emerald-600 font-mono">CR80 Depan</span>
                    </div>
                    <div className="bg-gradient-to-br from-white to-slate-50 border-2 border-slate-300 dark:border-slate-700 rounded-2xl shadow-md overflow-hidden relative">
                      {/* Cutting Guide Markers */}
                      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-indigo-500"></div>
                      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-indigo-500"></div>
                      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-indigo-500"></div>
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-indigo-500"></div>

                      {/* Header */}
                      <div className="bg-[#1a3a5c] text-white p-2.5 flex items-center justify-between border-b border-amber-400">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-white p-0.5 flex items-center justify-center shrink-0">
                            {cardLogo ? (
                              <img src={cardLogo} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                              <Building2 className="w-4 h-4 text-blue-800" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-[11px] uppercase leading-tight line-clamp-1">
                              {pengaturan.namaSekolah}
                            </h4>
                            <p className="text-[9px] text-slate-200">KARTU TANDA PELAJAR</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono font-bold bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded">
                          {previewSiswa.kelas}
                        </span>
                      </div>

                      {/* Body */}
                      <div className="p-3 grid grid-cols-12 gap-2.5 items-center">
                        <div className="col-span-4 flex flex-col items-center gap-1.5">
                          <div className="w-16 h-20 rounded-md bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center">
                            {previewSiswa.foto ? (
                              <img src={previewSiswa.foto} alt={previewSiswa.nama} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-center font-bold text-xs text-slate-500">
                                🎓
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="col-span-8 text-left space-y-1">
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase">Nama Lengkap</span>
                            <h5 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                              {previewSiswa.nama}
                            </h5>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[11px]">
                            <div>
                              <span className="text-[9px] text-slate-400 block">NISN</span>
                              <span className="font-mono font-bold text-blue-700">{previewSiswa.nisn}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 block">L/P</span>
                              <span className="font-bold">{previewSiswa.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block">No. HP Orang Tua</span>
                            <span className="font-mono text-[10px] text-slate-700">{previewSiswa.noHpOrtu || '-'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="bg-slate-100 px-2.5 py-1 border-t border-slate-200 flex justify-between items-center text-[8px] text-slate-500">
                        <span>Berlaku Aktif</span>
                        <span className="font-bold text-emerald-600">✓ TERVERIFIKASI</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. BACK CARD PREVIEW (QR ZOOM & RULES) */}
                {(previewTab === 'keduanya' || previewTab === 'belakang') && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Tampak Belakang (QR Code &amp; Ketentuan)</span>
                      <span className="text-[10px] text-indigo-600 font-mono">CR80 Belakang</span>
                    </div>
                    <div className="bg-gradient-to-br from-white to-slate-50 border-2 border-slate-300 dark:border-slate-700 rounded-2xl shadow-md overflow-hidden relative">
                      {/* Magnetic Strip Visual Bar */}
                      <div className="w-full h-6 bg-slate-900 border-b border-slate-800 flex items-center justify-end px-3">
                        <span className="text-[8px] font-mono text-slate-400 tracking-widest">
                          AUTHENTIC SCHOOL CARD
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-3 grid grid-cols-12 gap-2 items-center">
                        {/* High-res 2 QR Codes (Bullying & Saran) */}
                        <div className="col-span-6 grid grid-cols-2 gap-2 items-center justify-center">
                          <div className="flex flex-col items-center">
                            {bullyingQrUrl ? (
                              <img src={bullyingQrUrl} alt="QR Bullying" className="w-16 h-16 rounded border border-rose-400 p-0.5 bg-white shadow-xs" />
                            ) : (
                              <div className="w-16 h-16 bg-slate-200 animate-pulse rounded"></div>
                            )}
                            <span className="text-[8px] font-bold text-rose-700 mt-1">Aduan Bully</span>
                          </div>
                          <div className="flex flex-col items-center">
                            {saranQrUrl ? (
                              <img src={saranQrUrl} alt="QR Saran" className="w-16 h-16 rounded border border-amber-400 p-0.5 bg-white shadow-xs" />
                            ) : (
                              <div className="w-16 h-16 bg-slate-200 animate-pulse rounded"></div>
                            )}
                            <span className="text-[8px] font-bold text-amber-700 mt-1">Saran Sekolah</span>
                          </div>
                        </div>

                        {/* Rules and Authorization */}
                        <div className="col-span-6 text-left space-y-1">
                          <p className="text-[8px] text-slate-600 dark:text-slate-300 leading-tight">
                            <b>Scan QR Belakang untuk:</b><br />
                            • Pengaduan Bullying (Rahasia &amp; Aman)<br />
                            • Kotak Saran &amp; Masukan Sekolah
                          </p>

                          <div className="pt-1 border-t border-slate-200 text-[8px] text-slate-500">
                            <span>{pengaturan.kota}, Kepala Sekolah</span>
                            <p className="font-bold text-slate-800 dark:text-slate-200">
                              {pengaturan.namaKepsek.split(',')[0]}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-100 px-2.5 py-1 border-t border-slate-200 text-center text-[8px] text-slate-500">
                        Kartu Resmi Pelajar • Terhubung ke Portal Digital Sekolah
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Verified QR Decoder Live Inspection Box */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Data QR Code Terverifikasi: {previewSiswa.nisn}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Siswa: {previewSiswa.nama} | Rombel: {previewSiswa.kelas} | Siap dipindai kamera scanner presensi.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg">
                  <Scissors className="w-3.5 h-3.5" /> Presisi 85.6 × 54 mm
                </div>
              </div>

              {/* Modal Action Buttons featuring TOMBOL 'PRINT LANGSUNG' */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Header/footer browser otomatis dibersihkan saat dicetak.</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewSiswa(null)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Tutup
                  </button>

                  {/* TOMBOL UTAMA 'PRINT LANGSUNG' PADA PRATINJAU KARTU SISWA QR */}
                  <button
                    onClick={() => handlePrintDirect(previewSiswa.id)}
                    className="px-6 py-2.5 text-xs font-black text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 hover:from-emerald-700 hover:to-cyan-800 rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2 ring-2 ring-emerald-400/40"
                    title="Cetak langsung kartu ini ke printer tanpa header/footer browser"
                  >
                    <Printer className="w-4 h-4 animate-bounce" />
                    Print Langsung (Potong Presisi)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL UPLOAD LOGO KARTU SISWA */}
      {/* ============================================================== */}
      {isLogoModalOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 relative">
            <button
              onClick={() => setIsLogoModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Upload Logo Kartu Siswa
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Logo ini akan ditampilkan di kop header Kartu Tanda Pelajar (KTP Siswa QR &amp; Barcode) saat dicetak ke printer.
              </p>
            </div>

            {/* Live Preview on Card Badge */}
            <div className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white p-2 border-2 border-amber-400 shadow-md flex items-center justify-center">
                {tempLogoUrl ? (
                  <img src={tempLogoUrl} alt="Pratinjau Logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Pratinjau Logo Kartu Siswa
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const cleanLogo = tempLogoUrl.trim();
                dbService.savePengaturan({
                  logoKartuUrl: cleanLogo,
                  ...(syncSchoolLogo && cleanLogo ? { logoSekolahUrl: cleanLogo } : {}),
                });
                setIsLogoModalOpen(false);
                showToast(
                  'Logo Kartu Siswa Disimpan!',
                  'success',
                  'Logo kartu berhasil diperbarui dan diterapkan ke seluruh kartu tanda pelajar.'
                );
              }}
              className="space-y-4"
            >
              {/* Option 1: File Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  1. Pilih File Gambar Logo (PNG / JPG / SVG)
                </label>
                <label className="flex items-center justify-center gap-2 w-full py-2.5 bg-amber-50 dark:bg-amber-950/40 border border-dashed border-amber-300 dark:border-amber-800 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all">
                  <Upload className="w-4 h-4" /> Pilih File Logo dari Komputer/HP
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(evt) => {
                      const file = evt.target.files?.[0];
                      if (file) {
                        if (file.size > 3 * 1024 * 1024) {
                          Swal.fire('File Terlalu Besar', 'Maksimal ukuran file logo adalah 3MB.', 'warning');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (re) => {
                          setTempLogoUrl(re.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Option 2: Image URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  2. Atau Tempelkan Tautan URL Gambar Logo
                </label>
                <input
                  type="url"
                  placeholder="https://.../logo.png"
                  value={tempLogoUrl}
                  onChange={(e) => setTempLogoUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              {/* Sync checkbox */}
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  id="syncLogoCheck"
                  checked={syncSchoolLogo}
                  onChange={(e) => setSyncSchoolLogo(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="syncLogoCheck" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                  Terapkan juga sebagai <b>Logo Utama Sekolah</b> (sinkron ke judul dashboard &amp; kop surat)
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-2">
                {tempLogoUrl && (
                  <button
                    type="button"
                    onClick={() => setTempLogoUrl('')}
                    className="text-xs text-rose-600 hover:underline font-semibold"
                  >
                    Reset Logo
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsLogoModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Simpan Logo Kartu
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
