import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';
import Swal from 'sweetalert2';
import {
  Camera,
  CheckCircle2,
  UserCheck,
  Calendar,
  Clock,
  ArrowLeft,
  Sparkles,
  Smartphone,
  Laptop,
  RefreshCw,
  Zap,
  ZapOff,
  Upload,
  ShieldCheck,
  Building2,
  Search,
  Check,
  Send,
  AlertCircle,
} from 'lucide-react';
import { Siswa, Pengaturan } from '../../types';
import { absensiService } from '../../services/absensiService';

interface PortalPresensiSiswaProps {
  siswaList: Siswa[];
  pengaturan: Pengaturan;
}

const isMobileDevice =
  typeof navigator !== 'undefined' &&
  /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export const PortalPresensiSiswa: React.FC<PortalPresensiSiswaProps> = ({
  siswaList,
  pengaturan,
}) => {
  const [activeTab, setActiveTab] = useState<'scanner' | 'manual'>('scanner');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');
  const [isServerOnline, setIsServerOnline] = useState<boolean>(true);

  // Manual input form states
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>('');
  const [inputNama, setInputNama] = useState<string>('');
  const [inputNisn, setInputNisn] = useState<string>('');
  const [inputKelas, setInputKelas] = useState<string>('X RPL 1');
  const [catatan, setCatatan] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Success receipt state
  const [submittedReceipt, setSubmittedReceipt] = useState<any | null>(null);

  // Camera states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const barcodeDetectorRef = useRef<any>(null);

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(
    isMobileDevice ? 'environment' : 'user'
  );
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [activeCameraLabel, setActiveCameraLabel] = useState<string>('');
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [isGreenFlash, setIsGreenFlash] = useState<boolean>(false);
  const [isTorchSupported, setIsTorchSupported] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);

  const lastScannedCodeRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);
  const isProcessingFrameRef = useRef<boolean>(false);

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour12: false }) + ' WIB');
      setCurrentDateStr(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Health check to server
  useEffect(() => {
    fetch('/api/health')
      .then((res) => setIsServerOnline(res.ok))
      .catch(() => setIsServerOnline(false));
  }, []);

  // Initialize Barcode Decoders
  useEffect(() => {
    try {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.QR_CODE,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      zxingReaderRef.current = new BrowserMultiFormatReader(hints);
    } catch {}

    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        barcodeDetectorRef.current = new (window as any).BarcodeDetector({
          formats: ['code_128', 'code_39', 'ean_13', 'qr_code'],
        });
      } catch {}
    }
  }, []);

  const enumerateCameras = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setAvailableCameras(videoInputs);
      }
    } catch {}
  }, []);

  const stopCamera = useCallback(() => {
    setIsScanning(false);
    setIsTorchOn(false);
    setIsTorchSupported(false);

    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const runDetectionLoopRef = useRef<() => void>(() => {});

  const startCamera = useCallback(
    async (cameraDeviceOverride?: string, facingOverride?: 'environment' | 'user') => {
      stopCamera();
      setIsScanning(true);
      setScanMessage('Menghubungkan ke kamera...');

      const targetFacing = facingOverride || facingMode;
      const targetDeviceId = cameraDeviceOverride ?? selectedCameraId;

      let stream: MediaStream | null = null;

      // Strategy 1: exact/ideal deviceId
      if (targetDeviceId) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { ideal: targetDeviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch {
          stream = null;
        }
      }

      // Strategy 2: ideal facingMode
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: targetFacing },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch {
          stream = null;
        }
      }

      // Strategy 3: basic video
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (err: any) {
          console.error('Kamera gagal dibuka:', err);
          setIsScanning(false);
          setScanMessage(null);
          Swal.fire({
            title: 'Kamera Tidak Tersedia',
            text: 'Akses kamera diblokir atau sedang digunakan aplikasi lain. Izinkan izin kamera pada browser Anda.',
            icon: 'warning',
            confirmButtonColor: '#059669',
          });
          return;
        }
      }

      streamRef.current = stream;

      try {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          setActiveCameraLabel(
            videoTrack.label || (targetFacing === 'environment' ? 'Kamera Belakang (HP)' : 'Webcam Depan (Laptop)')
          );
          const caps = (videoTrack.getCapabilities && videoTrack.getCapabilities()) as { torch?: boolean };
          setIsTorchSupported(Boolean(caps && caps.torch));
        }
      } catch {}

      let retries = 0;
      while (!videoRef.current && retries < 12) {
        await new Promise((r) => setTimeout(r, 50));
        retries++;
      }

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        video.muted = true;

        video.onloadedmetadata = () => {
          video.play().catch(console.warn);
          if (runDetectionLoopRef.current) {
            runDetectionLoopRef.current();
          }
        };

        try {
          await video.play();
          setScanMessage('Arahkan Barcode atau QR Code Kartu Pelajar ke kamera');
          enumerateCameras();
          if (runDetectionLoopRef.current) {
            runDetectionLoopRef.current();
          }
        } catch (playErr) {
          console.warn('Video play error:', playErr);
        }
      }
    },
    [facingMode, selectedCameraId, stopCamera, enumerateCameras]
  );

  const flipCamera = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    setSelectedCameraId('');
    startCamera(undefined, nextFacing);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextState = !isTorchOn;
      await (track as any).applyConstraints({ advanced: [{ torch: nextState }] });
      setIsTorchOn(nextState);
    } catch {}
  };

  // Find student by code
  const findStudent = useCallback(
    (rawCode: string): Siswa | undefined => {
      if (!rawCode) return undefined;
      let cleaned = rawCode.trim();
      cleaned = cleaned.replace(/^(?:nisn|nis|siswa|id|code)[\s:_=-]+/i, '').trim();

      let match = siswaList.find((s) => s.nisn === cleaned || s.id === cleaned);
      if (match) return match;

      const lower = cleaned.toLowerCase();
      match = siswaList.find((s) => s.nisn.toLowerCase() === lower || s.id.toLowerCase() === lower);
      if (match) return match;

      const digits = cleaned.replace(/\D/g, '');
      if (digits.length >= 4) {
        match = siswaList.find((s) => s.nisn.replace(/\D/g, '') === digits);
        if (match) return match;
      }
      return undefined;
    },
    [siswaList]
  );

  // Send attendance to server
  const submitAttendance = async (student: Siswa, src: 'scanner_kamera' | 'mandiri_hp', note?: string) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });

    setIsSubmitting(true);
    try {
      const record = await absensiService.recordAbsensi({
        id: `ab_${student.id}_${Date.now()}`,
        tanggal: todayStr,
        siswaId: student.id,
        namaSiswa: student.nama,
        kelas: student.kelas,
        status: 'H',
        catatan: note || `Hadir via ${src === 'scanner_kamera' ? 'Kamera HP Murid' : 'Portal Siswa'} (${timeStr} WIB)`,
        timestamp: now.toISOString(),
        userId: 'portal_murid_self',
      });

      setSubmittedReceipt({
        record,
        student,
        timeStr,
        dateStr: currentDateStr,
      });

      setIsGreenFlash(true);
      setTimeout(() => setIsGreenFlash(false), 800);

      Swal.fire({
        icon: 'success',
        title: 'Presensi Terkirim Real-Time!',
        html: `
          <div class="text-left text-xs space-y-1.5">
            <p>Halo <b>${student.nama}</b> (${student.kelas})</p>
            <p class="text-emerald-600 font-bold">Data kehadiran Anda langsung masuk ke Dashboard Guru secara seketika.</p>
            <p class="font-mono text-slate-500">Waktu: ${timeStr} WIB</p>
          </div>
        `,
        timer: 3500,
        showConfirmButton: false,
      });

      stopCamera();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengirim Presensi',
        text: err.message || 'Terjadi gangguan jaringan ke server. Silakan coba kembali.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Process Scanned Code
  const handleProcessCode = useCallback(
    (codeData: string) => {
      const student = findStudent(codeData);
      if (!student) {
        Swal.fire({
          icon: 'error',
          title: 'Kartu Tidak Dikenali',
          text: `Kode [${codeData}] tidak terdaftar dalam database siswa.`,
          timer: 2000,
          toast: true,
          position: 'top',
          showConfirmButton: false,
        });
        return;
      }

      submitAttendance(student, 'scanner_kamera');
    },
    [findStudent]
  );

  // Detection loop
  const runDetectionLoop = useCallback(() => {
    let lastScanTick = 0;
    const tick = async () => {
      if (!isScanning) return;
      const now = Date.now();
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (
        video &&
        canvas &&
        video.readyState >= video.HAVE_CURRENT_DATA &&
        video.videoWidth > 0 &&
        video.videoHeight > 0 &&
        now - lastScanTick > 85 &&
        !isProcessingFrameRef.current
      ) {
        lastScanTick = now;
        isProcessingFrameRef.current = true;

        try {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            const maxDim = 640;
            const scale = Math.min(1, maxDim / Math.max(video.videoWidth, video.videoHeight));
            const targetW = Math.round(video.videoWidth * scale);
            const targetH = Math.round(video.videoHeight * scale);

            if (canvas.width !== targetW || canvas.height !== targetH) {
              canvas.width = targetW;
              canvas.height = targetH;
            }

            ctx.drawImage(video, 0, 0, targetW, targetH);
            let detectedText: string | null = null;

            // Strategy 1: BarcodeDetector
            if (barcodeDetectorRef.current) {
              try {
                const barcodes = await barcodeDetectorRef.current.detect(canvas);
                if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                  detectedText = barcodes[0].rawValue.trim();
                }
              } catch {}
            }

            // Strategy 2: jsQR
            if (!detectedText) {
              const imgData = ctx.getImageData(0, 0, targetW, targetH);
              const qr = jsQR(imgData.data, targetW, targetH, { inversionAttempts: 'attemptBoth' });
              if (qr && qr.data) {
                detectedText = qr.data.trim();
              }
            }

            // Strategy 3: ZXing MultiFormat
            if (!detectedText && zxingReaderRef.current) {
              try {
                const zx = zxingReaderRef.current.decode(canvas as any);
                if (zx && zx.getText()) {
                  detectedText = zx.getText().trim();
                }
              } catch {}
            }

            if (detectedText) {
              const cur = Date.now();
              const isSame = detectedText === lastScannedCodeRef.current;
              const hasDebouncePassed = cur - lastScannedTimeRef.current > 3000;
              if (!isSame || hasDebouncePassed) {
                lastScannedCodeRef.current = detectedText;
                lastScannedTimeRef.current = cur;
                handleProcessCode(detectedText);
              }
            }
          }
        } catch (e) {
          console.warn('Frame detection err:', e);
        } finally {
          isProcessingFrameRef.current = false;
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(tick);
    };

    animationFrameIdRef.current = requestAnimationFrame(tick);
  }, [isScanning, handleProcessCode]);

  useEffect(() => {
    runDetectionLoopRef.current = runDetectionLoop;
  }, [runDetectionLoop]);

  useEffect(() => {
    if (isScanning) {
      runDetectionLoop();
    }
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isScanning, runDetectionLoop]);

  // Handle image upload from gallery / camera snapshot
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, c.width, c.height);
          const qr = jsQR(imgData.data, c.width, c.height);
          if (qr && qr.data) {
            handleProcessCode(qr.data);
            return;
          }
        }
        Swal.fire({
          icon: 'warning',
          title: 'Tidak Ada Barcode/QR',
          text: 'Tidak ditemukan QR code yang jelas pada foto tersebut.',
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputNama.trim()) {
      Swal.fire({ icon: 'warning', title: 'Nama Wajib Diisi' });
      return;
    }

    let student = siswaList.find((s) => s.id === selectedSiswaId);
    if (!student && inputNisn) {
      student = siswaList.find((s) => s.nisn === inputNisn.trim());
    }
    const finalStudent: Siswa = student || {
      id: `s_guest_${Date.now()}`,
      nama: inputNama.trim(),
      nisn: inputNisn.trim() || '0000000000',
      kelas: inputKelas,
      jenisKelamin: 'L',
      userId: 'guest_student',
      noHpOrtu: '',
      alamat: '',
    };

    submitAttendance(finalStudent, 'mandiri_hp', catatan);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <div className="max-w-2xl mx-auto w-full pt-2 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <a
            href={window.location.pathname}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-2 border border-slate-800 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Halaman Guru</span>
          </a>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-bold">
              <span className={`w-2 h-2 rounded-full ${isServerOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className={isServerOnline ? 'text-emerald-400' : 'text-rose-400'}>
                {isServerOnline ? 'SERVER REALTIME ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
              {currentTime}
            </div>
          </div>
        </div>

        {/* Portal Hero Card */}
        <div className="bg-gradient-to-br from-emerald-900/60 via-slate-900 to-teal-950/80 p-5 sm:p-6 rounded-3xl border-2 border-emerald-500/40 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-3.5 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-lg shadow-emerald-500/30">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  PORTAL RESMI MURID
                </span>
                <span className="text-[10px] text-slate-400 font-mono">• {currentDateStr}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Presensi Digital Siswa Real-Time
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed">
            Pindai Barcode (garis) atau QR Code Kartu Pelajar langsung melalui kamera HP atau laptop Anda. Data kehadiran akan otomatis terkirim seketika ke Dashboard Guru sebagai server kelas.
          </p>

          <div className="mt-4 pt-3 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              {pengaturan.namaSekolah}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Kompatibel Kamera HP &amp; Webcam Laptop
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-2xl mx-auto w-full flex-1">
        {/* Receipt Voucher if Submitted */}
        {submittedReceipt ? (
          <div className="bg-slate-900 rounded-3xl border-2 border-emerald-500 p-6 sm:p-8 shadow-2xl text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold font-mono">
                ✓ PRESENSI BERHASIL DICATAT
              </span>
              <h2 className="text-2xl font-black text-white mt-2">
                Terima Kasih, {submittedReceipt.student.nama}!
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Laporan kehadiran Anda sudah resmi masuk dan tercatat di server bimbingan &amp; administrasi kelas.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-left space-y-2 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Nama Siswa:</span>
                <span className="font-bold text-white">{submittedReceipt.student.nama}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Kelas / Rombel:</span>
                <span className="text-emerald-400 font-bold">{submittedReceipt.student.kelas}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">NISN:</span>
                <span className="text-amber-300">{submittedReceipt.student.nisn}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Waktu Scan:</span>
                <span className="text-slate-300">{submittedReceipt.timeStr} WIB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status Kehadiran:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">
                  HADIR (H)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSubmittedReceipt(null);
                  startCamera();
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-900/40"
              >
                Pindai Kartu Siswa Lain
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tab Navigation: Scanner vs Manual */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-2xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('scanner');
                  if (!isScanning) startCamera();
                }}
                className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'scanner'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Pemindai Barcode / QR Kamera</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('manual');
                  stopCamera();
                }}
                className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'manual'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Input Mandiri / Tanpa Kartu</span>
              </button>
            </div>

            {/* TAB 1: SCANNER KAMERA */}
            {activeTab === 'scanner' && (
              <div className="space-y-4">
                <div
                  className={`relative bg-black rounded-3xl overflow-hidden shadow-2xl border-4 transition-all duration-300 min-h-[360px] sm:min-h-[420px] flex flex-col items-center justify-center ${
                    isGreenFlash
                      ? 'border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.7)]'
                      : 'border-slate-800'
                  }`}
                >
                  <canvas ref={canvasRef} className="hidden" />

                  <video
                    ref={videoRef}
                    className={`w-full h-auto object-cover max-h-[440px] transition-opacity duration-300 ${
                      isScanning ? 'opacity-100' : 'opacity-20'
                    }`}
                    playsInline
                    autoPlay
                    muted
                  />

                  {/* Top Overlay */}
                  {isScanning && (
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-20">
                      <span className="px-3 py-1 bg-black/75 backdrop-blur-md rounded-full text-[10px] font-semibold text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-md">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="truncate max-w-[180px]">
                          {activeCameraLabel || (facingMode === 'environment' ? 'Kamera Belakang (HP)' : 'Webcam Depan')}
                        </span>
                      </span>
                      <span className="px-2.5 py-1 bg-black/75 backdrop-blur-md rounded-full text-[10px] font-mono text-amber-300 border border-amber-400/30 font-bold shadow-md">
                        Barcode 1D + QR 2D
                      </span>
                    </div>
                  )}

                  {/* Inactive Placeholder */}
                  {!isScanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/95 z-10">
                      <div className="p-4 bg-emerald-500/20 text-emerald-400 rounded-2xl mb-3 border border-emerald-500/30">
                        <Camera className="w-10 h-10 animate-bounce" />
                      </div>
                      <h4 className="text-base font-bold text-white">Kamera Belum Aktif</h4>
                      <p className="text-xs text-slate-400 max-w-sm mt-1">
                        Klik tombol di bawah untuk mengizinkan dan mengaktifkan kamera pemindai kartu pelajar Anda.
                      </p>
                      <button
                        onClick={() => startCamera()}
                        className="mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
                      >
                        Buka Kamera Sekarang
                      </button>
                    </div>
                  )}

                  {/* Reticle HUD */}
                  {isScanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
                      <div
                        className={`w-72 sm:w-80 h-52 sm:h-56 border-2 rounded-3xl relative transition-all duration-300 ${
                          isGreenFlash
                            ? 'border-emerald-300 scale-105 shadow-[0_0_60px_rgba(16,185,129,0.9)] bg-emerald-500/10'
                            : 'border-emerald-400/80 shadow-[0_0_35px_rgba(16,185,129,0.35)]'
                        }`}
                      >
                        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                        <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
                        <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-pulse top-1/2 -translate-y-1/2" />
                      </div>

                      <div className="mt-4 px-4 py-1.5 bg-black/80 backdrop-blur-md rounded-full text-[11px] font-semibold text-emerald-400 border border-emerald-500/40 flex items-center gap-2 shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>{scanMessage || 'Posisikan Barcode atau QR Kartu Siswa di dalam bingkai'}</span>
                      </div>
                    </div>
                  )}

                  {/* Bottom Quick Controls Toolbar */}
                  <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-auto bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-white text-xs z-20">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 uppercase text-slate-300">
                        {facingMode === 'environment' ? 'Kamera Belakang' : 'Webcam Depan'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isTorchSupported && (
                        <button
                          onClick={toggleTorch}
                          className={`p-2 rounded-lg transition-all ${
                            isTorchOn ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-white/10 text-white'
                          }`}
                          title="Senter"
                        >
                          {isTorchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
                        </button>
                      )}

                      <button
                        onClick={flipCamera}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all flex items-center gap-1 text-[11px]"
                        title="Putar Kamera"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Putar Kamera</span>
                      </button>

                      <button
                        onClick={isScanning ? stopCamera : () => startCamera()}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs ${
                          isScanning ? 'bg-rose-600' : 'bg-emerald-600'
                        }`}
                      >
                        {isScanning ? 'Stop' : 'Mulai'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Device Selector & Gallery Upload */}
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setFacingMode('environment');
                        startCamera(undefined, 'environment');
                      }}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                        facingMode === 'environment' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Kamera Belakang (HP)</span>
                    </button>
                    <button
                      onClick={() => {
                        setFacingMode('user');
                        startCamera(undefined, 'user');
                      }}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${
                        facingMode === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      <Laptop className="w-3.5 h-3.5" />
                      <span>Webcam Depan (Laptop)</span>
                    </button>
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Unggah Foto Kartu</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: MANUAL SUBMISSION */}
            {activeTab === 'manual' && (
              <form
                onSubmit={handleManualSubmit}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Pilih Nama Anda dari Database Siswa</label>
                  <select
                    value={selectedSiswaId}
                    onChange={(e) => {
                      setSelectedSiswaId(e.target.value);
                      const found = siswaList.find((s) => s.id === e.target.value);
                      if (found) {
                        setInputNama(found.nama);
                        setInputNisn(found.nisn);
                        setInputKelas(found.kelas);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  >
                    <option value="">-- Cari / Pilih Nama Siswa --</option>
                    {siswaList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama} ({s.kelas} - {s.nisn})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Nama Lengkap Siswa *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Ahmad Faiz Al-Ghifari"
                      value={inputNama}
                      onChange={(e) => setInputNama(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">NISN (Nomor Induk Siswa Nasional)</label>
                    <input
                      type="text"
                      placeholder="0078129341"
                      value={inputNisn}
                      onChange={(e) => setInputNisn(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Rombongan Belajar / Kelas</label>
                    <input
                      type="text"
                      value={inputKelas}
                      onChange={(e) => setInputKelas(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Keterangan Tambahan (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: Hadir tepat waktu KBM"
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Mengirim ke Server...' : 'Kirim Presensi Hadir ke Server Sekarang'}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <footer className="max-w-2xl mx-auto w-full pt-6 pb-2 text-center text-[10px] text-slate-500">
        <p>
          Sistem Presensi &amp; Administrasi Digital Terpadu • {pengaturan.namaSekolah} • Real-time Server Sync
        </p>
      </footer>
    </div>
  );
};
