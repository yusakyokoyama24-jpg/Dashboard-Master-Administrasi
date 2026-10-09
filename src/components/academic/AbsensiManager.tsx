import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import Swal from 'sweetalert2';
import {
  Camera,
  CheckCircle2,
  UserCheck,
  Calendar,
  Filter,
  Volume2,
  VolumeX,
  AlertCircle,
  Save,
  QrCode,
  Upload,
  RefreshCw,
  Sparkles,
  Clock,
  Check,
  X,
  Search,
  Zap,
  ZapOff,
  User,
  Users,
  ChevronRight,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { Siswa, Absensi } from '../../types';
import { dbService } from '../../services/db';
import { showToast } from '../../utils/toast';

interface AbsensiManagerProps {
  siswaList: Siswa[];
  absensiList: Absensi[];
}

interface LastScanResult {
  student: Siswa;
  status: 'BERHASIL_HADIR' | 'SUDAH_HADIR';
  time: string;
  catatan: string;
}

export const AbsensiManager: React.FC<AbsensiManagerProps> = ({ siswaList, absensiList }) => {
  const [mode, setMode] = useState<'manual' | 'scanner'>('manual');
  const [selectedTanggal, setSelectedTanggal] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedKelas, setSelectedKelas] = useState<string>('X RPL 1');

  // Manual records state: map siswaId -> { status, catatan }
  const [attendanceDraft, setAttendanceDraft] = useState<
    Record<string, { status: 'H' | 'S' | 'I' | 'A'; catatan: string }>
  >({});

  // Scanner hardware & stream states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isGreenFlash, setIsGreenFlash] = useState(false);

  // Scan detection & history states
  const [lastScan, setLastScan] = useState<LastScanResult | null>(null);
  const [scanFilterKelas, setScanFilterKelas] = useState<string>('all');
  const [manualInputNisn, setManualInputNisn] = useState<string>('');
  const [selectedSimulateStudentId, setSelectedSimulateStudentId] = useState<string>('');

  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastScannedTimeRef = useRef<number>(0);
  const lastScannedCodeRef = useRef<string>('');
  const isProcessingFrameRef = useRef<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const kelasList = useMemo(() => {
    return Array.from(new Set(siswaList.map((s) => s.kelas))).sort();
  }, [siswaList]);

  const studentsInClass = useMemo(() => {
    return siswaList.filter((s) => s.kelas === selectedKelas);
  }, [siswaList, selectedKelas]);

  // Today's attendance list
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayAttendances = useMemo(() => {
    return absensiList
      .filter((a) => a.tanggal === todayStr && a.status === 'H')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [absensiList, todayStr]);

  const filteredTodayAttendances = useMemo(() => {
    if (scanFilterKelas === 'all') return todayAttendances;
    return todayAttendances.filter((a) => a.kelas === scanFilterKelas);
  }, [todayAttendances, scanFilterKelas]);

  // Initialize draft when date or class changes
  useEffect(() => {
    const existingMap: Record<string, { status: 'H' | 'S' | 'I' | 'A'; catatan: string }> = {};
    studentsInClass.forEach((s) => {
      const recorded = absensiList.find((a) => a.siswaId === s.id && a.tanggal === selectedTanggal);
      existingMap[s.id] = {
        status: recorded ? recorded.status : 'H',
        catatan: recorded?.catatan || '',
      };
    });
    setAttendanceDraft(existingMap);
  }, [selectedTanggal, selectedKelas, siswaList, absensiList]);

  // Set default simulation student when siswaList changes
  useEffect(() => {
    if (siswaList.length > 0 && !selectedSimulateStudentId) {
      setSelectedSimulateStudentId(siswaList[0].id);
    }
  }, [siswaList, selectedSimulateStudentId]);

  // Audio Context & Sound Synthesizer
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtxRef.current = new AudioCtxClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  const playSuccessChime = useCallback(() => {
    if (!isSoundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Note 1: 880 Hz (A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Note 2: 1320 Hz (E6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, now + 0.08);
      gain2.gain.setValueAtTime(0.3, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.28);
    } catch (e) {
      console.warn('Audio playback not allowed yet:', e);
    }
  }, [isSoundEnabled, getAudioContext]);

  const playWarningChime = useCallback(() => {
    if (!isSoundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Double gentle beep: 660 Hz
      [0, 0.1].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now + delay);
        gain.gain.setValueAtTime(0.18, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.08);
      });
    } catch (e) {
      console.warn('Audio warning playback issue:', e);
    }
  }, [isSoundEnabled, getAudioContext]);

  const playErrorBuzzer = useCallback(() => {
    if (!isSoundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.25);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn('Audio error playback issue:', e);
    }
  }, [isSoundEnabled, getAudioContext]);

  // Enumerate cameras
  const enumerateCameras = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setAvailableCameras(videoInputs);
      }
    } catch (err) {
      console.warn('Unable to enumerate cameras:', err);
    }
  }, []);

  // Stop camera tracks
  const stopCamera = useCallback(() => {
    setIsScanning(false);
    setIsTorchOn(false);
    setIsTorchSupported(false);

    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Robust Camera Startup with cascading fallbacks
  const startCamera = useCallback(
    async (cameraDeviceOverride?: string, facingOverride?: 'environment' | 'user') => {
      stopCamera();
      setIsScanning(true);
      setScanMessage('Menghubungkan ke kamera...');

      const targetFacing = facingOverride || facingMode;
      const targetDeviceId = cameraDeviceOverride ?? selectedCameraId;

      let stream: MediaStream | null = null;

      // Strategy 1: Specific deviceId if provided
      if (targetDeviceId) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: targetDeviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
        } catch {
          stream = null;
        }
      }

      // Strategy 2: Ideal facingMode
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: targetFacing },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
        } catch {
          stream = null;
        }
      }

      // Strategy 3: Loose facingMode
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: targetFacing },
          });
        } catch {
          stream = null;
        }
      }

      // Strategy 4: Generic video (Works universally on any laptop/webcam/desktop)
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
        } catch (err) {
          console.error('All camera attempts failed:', err);
          setIsScanning(false);
          setScanMessage(null);
          Swal.fire({
            title: 'Kamera Tidak Tersedia',
            text: 'Izin akses kamera diperlukan atau perangkat kamera sedang digunakan oleh aplikasi lain. Anda juga dapat menggunakan opsi Unggah Foto QR atau Input Manual NISN.',
            icon: 'warning',
            confirmButtonColor: '#059669',
          });
          return;
        }
      }

      streamRef.current = stream;

      // Check torch capability
      try {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = (videoTrack.getCapabilities && videoTrack.getCapabilities()) as { torch?: boolean };
          setIsTorchSupported(Boolean(capabilities && capabilities.torch));
        }
      } catch {
        setIsTorchSupported(false);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;

        try {
          await videoRef.current.play();
          setScanMessage('Arahkan kamera ke barcode/QR Code Kartu Siswa');
          enumerateCameras();
          runDetectionLoop();
        } catch (playErr) {
          console.warn('Video play error:', playErr);
        }
      }
    },
    [facingMode, selectedCameraId, stopCamera, enumerateCameras]
  );

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextState = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setIsTorchOn(nextState);
    } catch (e) {
      console.warn('Error toggling torch:', e);
      showToast('Senter Tidak Didukung', 'info', 'Perangkat tidak mengizinkan kontrol senter.');
    }
  };

  // Flip Camera (Front / Back)
  const flipCamera = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    setSelectedCameraId('');
    startCamera(undefined, nextFacing);
  };

  // Parse any QR code payload intelligently
  const findStudentFromCode = useCallback(
    (rawCode: string): Siswa | undefined => {
      if (!rawCode) return undefined;
      let cleaned = rawCode.trim();

      // Check if wrapped in quotes
      if (
        (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
        (cleaned.startsWith("'") && cleaned.endsWith("'"))
      ) {
        cleaned = cleaned.slice(1, -1).trim();
      }

      // Check if JSON payload (e.g. {"nisn":"00123"} or {"id":"s_1"})
      if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
        try {
          const parsed = JSON.parse(cleaned);
          if (parsed.nisn) cleaned = String(parsed.nisn).trim();
          else if (parsed.id) cleaned = String(parsed.id).trim();
        } catch {
          // not valid JSON, ignore
        }
      }

      // Check if URL containing nisn or id
      try {
        if (cleaned.includes('http://') || cleaned.includes('https://') || cleaned.includes('?')) {
          const url = new URL(cleaned.startsWith('http') ? cleaned : `http://localhost/${cleaned}`);
          const urlNisn = url.searchParams.get('nisn') || url.searchParams.get('id');
          if (urlNisn) {
            cleaned = urlNisn.trim();
          } else {
            // Check trailing segment in path
            const parts = url.pathname.split('/').filter(Boolean);
            if (parts.length > 0) {
              const lastPart = parts[parts.length - 1];
              if (lastPart.length >= 4) {
                cleaned = lastPart.trim();
              }
            }
          }
        }
      } catch {
        // not URL, continue
      }

      // Strip prefixes like "NISN:", "NIS:", "SISWA:", "ID:", "CODE:"
      cleaned = cleaned.replace(/^(?:nisn|nis|siswa|id|code)[\s:_=-]+/i, '').trim();

      // 1. Direct match on nisn
      let found = siswaList.find((s) => s.nisn === cleaned);
      if (found) return found;

      // 2. Direct match on id
      found = siswaList.find((s) => s.id === cleaned);
      if (found) return found;

      // 3. Case-insensitive match on nisn or id
      const lowerCleaned = cleaned.toLowerCase();
      found = siswaList.find(
        (s) => s.nisn.toLowerCase() === lowerCleaned || s.id.toLowerCase() === lowerCleaned
      );
      if (found) return found;

      // 4. Digits-only match (if formatted with dashes/dots)
      const digitsOnly = cleaned.replace(/\D/g, '');
      if (digitsOnly.length >= 4) {
        found = siswaList.find((s) => s.nisn.replace(/\D/g, '') === digitsOnly);
        if (found) return found;
      }

      return undefined;
    },
    [siswaList]
  );

  // Process Scanned Student
  const handleProcessCode = useCallback(
    (codeData: string) => {
      const student = findStudentFromCode(codeData);

      if (!student) {
        playErrorBuzzer();
        Swal.fire({
          title: 'QR Tidak Terdaftar',
          html: `<div class="text-sm text-slate-600 dark:text-slate-300">
            Kode terdeteksi: <b class="font-mono text-rose-600">${codeData}</b><br/>
            Tidak ditemukan siswa dengan NISN atau ID tersebut.
          </div>`,
          icon: 'error',
          timer: 2500,
          showConfirmButton: false,
          toast: true,
          position: 'top',
        });
        return;
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      // Visual flash
      setIsGreenFlash(true);
      setTimeout(() => setIsGreenFlash(false), 600);

      // Check if student is already marked HADIR today
      const existingToday = absensiList.find(
        (a) => a.siswaId === student.id && a.tanggal === todayStr && a.status === 'H'
      );

      if (existingToday) {
        playWarningChime();
        if (navigator.vibrate) navigator.vibrate(80);

        setLastScan({
          student,
          status: 'SUDAH_HADIR',
          time: existingToday.catatan?.match(/\d{2}:\d{2}(?::\d{2})?/) ? existingToday.catatan : timeStr,
          catatan: existingToday.catatan || 'Sudah tercatat sebelumnya',
        });

        showToast(
          'Sudah Hadir Hari Ini',
          'info',
          `${student.nama} (${student.kelas}) sudah tercatat HADIR hari ini.`
        );
        return;
      }

      // Record new attendance
      playSuccessChime();
      if (navigator.vibrate) navigator.vibrate([60, 40, 60]);

      const absensiRecord: Absensi = {
        id: `ab_qr_${student.id}_${Date.now()}`,
        tanggal: todayStr,
        siswaId: student.id,
        namaSiswa: student.nama,
        kelas: student.kelas,
        status: 'H',
        catatan: `Hadir via QR Scanner (${timeStr} WIB)`,
        timestamp: now.toISOString(),
        userId: 'master_guru_default',
      };

      dbService.recordAbsensi(absensiRecord);

      // Update attendanceDraft for selected date
      if (selectedTanggal === todayStr) {
        setAttendanceDraft((prev) => ({
          ...prev,
          [student.id]: {
            status: 'H',
            catatan: absensiRecord.catatan || '',
          },
        }));
      }

      setLastScan({
        student,
        status: 'BERHASIL_HADIR',
        time: `${timeStr} WIB`,
        catatan: absensiRecord.catatan || '',
      });

      showToast(
        '✅ Presensi Berhasil!',
        'success',
        `${student.nama} (${student.kelas}) - STATUS: HADIR`
      );
    },
    [
      findStudentFromCode,
      absensiList,
      todayStr,
      playErrorBuzzer,
      playWarningChime,
      playSuccessChime,
      selectedTanggal,
    ]
  );

  // Core Real-Time Detection Loop: Fast, low-latency, throttled
  const runDetectionLoop = useCallback(() => {
    let lastScanTick = 0;

    const tick = (now: number) => {
      if (!isScanning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Throttle scanning to every ~90ms to keep frame processing sub-10ms without CPU overheating
      if (
        video &&
        canvas &&
        video.readyState === video.HAVE_ENOUGH_DATA &&
        now - lastScanTick > 90 &&
        !isProcessingFrameRef.current
      ) {
        lastScanTick = now;
        isProcessingFrameRef.current = true;

        try {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            // Downscale to max 640px width for blazing fast decoding
            const maxDim = 640;
            const scale = Math.min(1, maxDim / Math.max(video.videoWidth, video.videoHeight));
            const targetW = Math.round(video.videoWidth * scale);
            const targetH = Math.round(video.videoHeight * scale);

            if (canvas.width !== targetW || canvas.height !== targetH) {
              canvas.width = targetW;
              canvas.height = targetH;
            }

            ctx.drawImage(video, 0, 0, targetW, targetH);
            const imgData = ctx.getImageData(0, 0, targetW, targetH);

            const code = jsQR(imgData.data, targetW, targetH, {
              inversionAttempts: 'attemptBoth',
            });

            if (code && code.data) {
              const scannedRaw = code.data.trim();
              const currentTime = Date.now();

              // Smart throttle:
              // If the exact same code was scanned, debounce 2.8 seconds to avoid double-triggers.
              // If a DIFFERENT student is scanned, scan immediately with 0 delay!
              const isSameCode = scannedRaw === lastScannedCodeRef.current;
              const hasDebouncePassed = currentTime - lastScannedTimeRef.current > 2800;

              if (!isSameCode || hasDebouncePassed) {
                lastScannedCodeRef.current = scannedRaw;
                lastScannedTimeRef.current = currentTime;
                handleProcessCode(scannedRaw);
              }
            }
          }
        } catch (err) {
          console.warn('Frame processing error:', err);
        } finally {
          isProcessingFrameRef.current = false;
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(tick);
    };

    animationFrameIdRef.current = requestAnimationFrame(tick);
  }, [isScanning, handleProcessCode]);

  // Restart detection loop when isScanning changes
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Handle Image File Upload QR Detection
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const offCanvas = document.createElement('canvas');
        const offCtx = offCanvas.getContext('2d');
        if (!offCtx) return;

        // Downscale large photo
        const maxDim = 1200;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        offCanvas.width = Math.round(img.width * scale);
        offCanvas.height = Math.round(img.height * scale);

        offCtx.drawImage(img, 0, 0, offCanvas.width, offCanvas.height);
        const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);

        const code = jsQR(imgData.data, offCanvas.width, offCanvas.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data) {
          handleProcessCode(code.data.trim());
        } else {
          playErrorBuzzer();
          Swal.fire({
            title: 'QR Code Tidak Terdeteksi',
            text: 'Tidak dapat menemukan barcode/QR Code pada gambar yang diunggah. Pastikan gambar jelas dan tidak terpotong.',
            icon: 'warning',
            confirmButtonColor: '#059669',
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // reset input value so user can upload the same file again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle Manual NISN or Barcode Gun Submission
  const handleManualNisnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInputNisn.trim()) return;
    handleProcessCode(manualInputNisn.trim());
    setManualInputNisn('');
  };

  // Simulate scan test
  const handleSimulateScan = () => {
    const target = siswaList.find((s) => s.id === selectedSimulateStudentId);
    if (target) {
      handleProcessCode(target.nisn);
    } else if (siswaList.length > 0) {
      handleProcessCode(siswaList[0].nisn);
    }
  };

  // Manual Handlers
  const handleSetStatus = (siswaId: string, status: 'H' | 'S' | 'I' | 'A') => {
    setAttendanceDraft((prev) => ({
      ...prev,
      [siswaId]: {
        ...(prev[siswaId] || { catatan: '' }),
        status,
      },
    }));
  };

  const handleSetCatatan = (siswaId: string, catatan: string) => {
    setAttendanceDraft((prev) => ({
      ...prev,
      [siswaId]: {
        ...(prev[siswaId] || { status: 'H' }),
        catatan,
      },
    }));
  };

  const handleMarkAllHadir = () => {
    const updated: Record<string, { status: 'H' | 'S' | 'I' | 'A'; catatan: string }> = {};
    studentsInClass.forEach((s) => {
      updated[s.id] = {
        status: 'H',
        catatan: attendanceDraft[s.id]?.catatan || '',
      };
    });
    setAttendanceDraft(updated);
    showToast('Semua Set Hadir', 'info', `Status seluruh siswa kelas ${selectedKelas} diatur ke Hadir.`);
  };

  const handleSaveManual = () => {
    const batch: Absensi[] = studentsInClass.map((s) => {
      const draft = attendanceDraft[s.id] || { status: 'H', catatan: '' };
      return {
        id: `ab_${s.id}_${selectedTanggal}`,
        tanggal: selectedTanggal,
        siswaId: s.id,
        namaSiswa: s.nama,
        kelas: s.kelas,
        status: draft.status,
        catatan: draft.catatan,
        timestamp: new Date().toISOString(),
        userId: 'master_guru_default',
      };
    });

    dbService.recordBatchAbsensi(batch);
    showToast(
      'Presensi Tersimpan!',
      'success',
      `Presensi kelas ${selectedKelas} (${selectedTanggal}) berhasil disimpan.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Emerald Color Template Notice Banner */}
      <div className="p-4 rounded-2xl border-2 border-emerald-400 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
            TEMPLATE WARNA: HIJAU EMERALD (KEHADIRAN SISWA)
          </span>
          <span className="text-xs font-bold">
            Presensi Digital Siswa: Scanner Kamera QR Optimal & Checklist Manual
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 opacity-60" title="Peserta Didik"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 opacity-60" title="Materi Pelajaran"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 opacity-60" title="Jadwal KBM"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Kehadiran Siswa (Aktif)"></span>
          <span className="text-slate-500 dark:text-slate-400 ml-1 font-sans text-xs">Template Hijau Aktif</span>
        </div>
      </div>

      {/* Mode Selector Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-emerald-900/50 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            Presensi Digital Siswa
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Dukung mode pemindai barcode/QR kamera instan berkecepatan tinggi dan checklist harian manual.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
          <button
            onClick={() => {
              stopCamera();
              setMode('manual');
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              mode === 'manual'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            📋 Mode Manual Checklist
          </button>
          <button
            onClick={() => {
              setMode('scanner');
              startCamera();
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              mode === 'scanner'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            📷 Mode Pemindai QR Kamera
          </button>
        </div>
      </div>

      {/* Hidden file input for QR image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Mode 1: Manual Checklist */}
      {mode === 'manual' && (
        <div className="space-y-4">
          {/* Summary Kotak Kehadiran Siswa */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-teal-50/60 dark:from-emerald-950/60 dark:via-slate-900 dark:to-emerald-900/30 border-2 border-emerald-400 dark:border-emerald-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                  Hadir (H)
                </span>
                <span className="text-2xl font-black text-emerald-950 dark:text-white font-mono">
                  {Object.values(attendanceDraft).filter((a) => a.status === 'H').length} Siswa
                </span>
              </div>
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-600/30 font-black text-sm">
                ✓
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 via-white to-yellow-50/60 dark:from-amber-950/60 dark:via-slate-900 dark:to-amber-900/30 border-2 border-amber-400 dark:border-amber-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                  Sakit (S)
                </span>
                <span className="text-2xl font-black text-amber-950 dark:text-white font-mono">
                  {Object.values(attendanceDraft).filter((a) => a.status === 'S').length} Siswa
                </span>
              </div>
              <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md shadow-amber-500/30 font-black text-sm">
                S
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 via-white to-blue-50/60 dark:from-sky-950/60 dark:via-slate-900 dark:to-sky-900/30 border-2 border-sky-400 dark:border-sky-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider block">
                  Izin (I)
                </span>
                <span className="text-2xl font-black text-sky-950 dark:text-white font-mono">
                  {Object.values(attendanceDraft).filter((a) => a.status === 'I').length} Siswa
                </span>
              </div>
              <div className="p-2.5 bg-sky-600 text-white rounded-xl shadow-md shadow-sky-600/30 font-black text-sm">
                I
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 via-white to-pink-50/60 dark:from-rose-950/60 dark:via-slate-900 dark:to-rose-900/30 border-2 border-rose-400 dark:border-rose-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider block">
                  Alpa (A)
                </span>
                <span className="text-2xl font-black text-rose-950 dark:text-white font-mono">
                  {Object.values(attendanceDraft).filter((a) => a.status === 'A').length} Siswa
                </span>
              </div>
              <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-md shadow-rose-600/30 font-black text-sm">
                A
              </div>
            </div>
          </div>

          {/* Controls Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-900/40">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tanggal:</label>
                <input
                  type="date"
                  value={selectedTanggal}
                  onChange={(e) => setSelectedTanggal(e.target.value)}
                  className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-600" />
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Rombel/Kelas:</label>
                <select
                  value={selectedKelas}
                  onChange={(e) => setSelectedKelas(e.target.value)}
                  className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  {kelasList.map((k) => (
                    <option key={k} value={k}>
                      {k} ({siswaList.filter((s) => s.kelas === k).length} Siswa)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleMarkAllHadir}
                className="px-3.5 py-2 text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors"
              >
                ✓ Tandai Semua Hadir (H)
              </button>

              <button
                onClick={handleSaveManual}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                Simpan Presensi Kelas
              </button>
            </div>
          </div>

          {/* Students Checklist Table */}
          <div className="bg-white dark:bg-slate-900 border-2 border-emerald-300 dark:border-emerald-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4 w-32">NISN</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4 text-center w-60">Status Kehadiran</th>
                    <th className="py-3 px-4">Catatan / Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {studentsInClass.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Tidak ada siswa pada rombel {selectedKelas}.
                      </td>
                    </tr>
                  ) : (
                    studentsInClass.map((s, idx) => {
                      const currentStatus = attendanceDraft[s.id]?.status || 'H';
                      const currentCatatan = attendanceDraft[s.id]?.catatan || '';

                      return (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-4 text-center font-mono text-xs">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                            {s.nisn}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                            {s.nama}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800">
                              {(['H', 'S', 'I', 'A'] as const).map((code) => {
                                const labels: Record<string, string> = {
                                  H: 'Hadir',
                                  S: 'Sakit',
                                  I: 'Izin',
                                  A: 'Alpa',
                                };
                                const colors: Record<string, string> = {
                                  H: 'bg-emerald-600 text-white',
                                  S: 'bg-amber-500 text-white',
                                  I: 'bg-blue-600 text-white',
                                  A: 'bg-rose-600 text-white',
                                };

                                const isSelected = currentStatus === code;
                                return (
                                  <button
                                    key={code}
                                    type="button"
                                    onClick={() => handleSetStatus(s.id, code)}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                                      isSelected
                                        ? colors[code]
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                    title={labels[code]}
                                  >
                                    {code}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={currentCatatan}
                              onChange={(e) => handleSetCatatan(s.id, e.target.value)}
                              placeholder="Keterangan tambahan..."
                              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Real-time Optimized QR Camera Scanner */}
      {mode === 'scanner' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Viewfinder Column */}
            <div className="lg:col-span-7 space-y-4">
              <div
                className={`relative bg-black rounded-3xl overflow-hidden shadow-2xl border-4 transition-all duration-300 min-h-[380px] sm:min-h-[440px] flex flex-col items-center justify-center ${
                  isGreenFlash
                    ? 'border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.7)]'
                    : 'border-slate-800 dark:border-slate-800'
                }`}
              >
                {/* Hidden processing canvas */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Video Stream */}
                <video
                  ref={videoRef}
                  className={`w-full h-auto object-cover max-h-[480px] transition-opacity duration-300 ${
                    isScanning ? 'opacity-100' : 'opacity-20'
                  }`}
                  playsInline
                  muted
                />

                {/* Camera Inactive Placeholder */}
                {!isScanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/90 text-white z-10">
                    <div className="p-4 bg-emerald-500/20 text-emerald-400 rounded-2xl mb-3 border border-emerald-500/30">
                      <Camera className="w-10 h-10 animate-bounce" />
                    </div>
                    <h4 className="text-base font-bold">Kamera Pemindai Sedang Nonaktif</h4>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      Klik tombol &ldquo;Aktifkan Kamera&rdquo; untuk mulai memindai Kartu Pelajar QR secara otomatis.
                    </p>
                    <button
                      onClick={() => startCamera()}
                      className="mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/40 transition-all active:scale-95 flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Aktifkan Kamera Sekarang
                    </button>
                  </div>
                )}

                {/* Active Scanning HUD Overlay */}
                {isScanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
                    {/* Viewfinder Target Frame */}
                    <div
                      className={`w-64 h-64 sm:w-72 sm:h-72 border-2 rounded-3xl relative transition-all duration-300 ${
                        isGreenFlash
                          ? 'border-emerald-300 scale-105 shadow-[0_0_60px_rgba(16,185,129,0.9)] bg-emerald-500/10'
                          : 'border-emerald-400/80 shadow-[0_0_35px_rgba(16,185,129,0.35)]'
                      }`}
                    >
                      {/* Corner Target Reticles */}
                      <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl"></div>
                      <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl"></div>
                      <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl"></div>
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl"></div>

                      {/* Animated Laser Scanning Line */}
                      <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-pulse top-1/2 -translate-y-1/2"></div>
                    </div>

                    {/* HUD Status Pill */}
                    <div className="mt-5 px-4 py-1.5 bg-black/80 backdrop-blur-md rounded-full text-[11px] font-semibold text-emerald-400 border border-emerald-500/40 flex items-center gap-2 shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>{scanMessage || 'Arahkan QR Siswa ke Kotak Pindai'}</span>
                    </div>
                  </div>
                )}

                {/* Bottom Quick Controls Toolbar inside Camera */}
                <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-auto bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-white text-xs z-20">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 uppercase tracking-wider text-slate-300">
                      {facingMode === 'environment' ? 'Belakang' : 'Depan / Webcam'}
                    </span>
                    {availableCameras.length > 1 && (
                      <span className="text-[10px] text-emerald-400 font-semibold hidden sm:inline">
                        • {availableCameras.length} Kamera Terdeteksi
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Torch Button if supported */}
                    {isTorchSupported && (
                      <button
                        onClick={toggleTorch}
                        className={`p-2 rounded-lg transition-all ${
                          isTorchOn
                            ? 'bg-amber-400 text-slate-950 font-bold'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                        title={isTorchOn ? 'Matikan Senter' : 'Nyalakan Senter'}
                      >
                        {isTorchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
                      </button>
                    )}

                    {/* Flip Camera Button */}
                    <button
                      onClick={flipCamera}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all flex items-center gap-1 text-[11px]"
                      title="Ganti Kamera Depan/Belakang"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ganti Kamera</span>
                    </button>

                    {/* Audio Sound Toggle */}
                    <button
                      onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                      className={`p-2 rounded-lg transition-all ${
                        isSoundEnabled ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-400'
                      }`}
                      title={isSoundEnabled ? 'Suara Beep Aktif' : 'Suara Beep Nonaktif'}
                    >
                      {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Hardware Selection & Extra Control Bar */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Pilih Perangkat:</span>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value);
                      startCamera(e.target.value);
                    }}
                    className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 max-w-[200px]"
                  >
                    <option value="">Kamera Otomatis (Default)</option>
                    {availableCameras.map((cam, idx) => (
                      <option key={cam.deviceId || idx} value={cam.deviceId}>
                        {cam.label || `Kamera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold transition-all flex items-center gap-1.5"
                    title="Pindai gambar file kartu yang tersimpan"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    Unggah Foto QR
                  </button>

                  <button
                    onClick={isScanning ? stopCamera : () => startCamera()}
                    className={`px-4 py-1.5 rounded-lg font-bold text-white transition-all ${
                      isScanning
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'
                    }`}
                  >
                    {isScanning ? 'Hentikan Kamera' : 'Mulai Kamera'}
                  </button>
                </div>
              </div>

              {/* Barcode Gun / Manual Input Bar */}
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    Input Barcode Scanner Fisik / Ketik NISN:
                  </span>
                  <span className="text-[11px] text-slate-400">Tekan Enter untuk input</span>
                </div>
                <form onSubmit={handleManualNisnSubmit} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={manualInputNisn}
                    onChange={(e) => setManualInputNisn(e.target.value)}
                    placeholder="Contoh: 0071234567 atau scan pistol barcode..."
                    className="flex-1 px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0"
                  >
                    Proses Hadir
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar Column: Real-time Scan Result & Today's Attendance Feed */}
            <div className="lg:col-span-5 space-y-4">
              {/* Last Scanned Feedback Card */}
              <div className="bg-white dark:bg-slate-900 border-2 border-emerald-300 dark:border-emerald-800 p-5 rounded-3xl shadow-sm space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Hasil Pindai Terakhir
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {lastScan?.time || 'Menunggu pemindaian'}
                  </span>
                </div>

                {lastScan ? (
                  <div className="p-4 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/60 dark:via-slate-900 dark:to-emerald-900/30 rounded-2xl border-2 border-emerald-400 dark:border-emerald-700 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-md">
                        {lastScan.student.foto ? (
                          <img
                            src={lastScan.student.foto}
                            alt={lastScan.student.nama}
                            className="w-full h-full object-cover rounded-2xl"
                          />
                        ) : (
                          lastScan.student.nama.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-slate-900 dark:text-white text-base truncate">
                          {lastScan.student.nama}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-mono">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                            {lastScan.student.kelas}
                          </span>
                          <span>• NISN: {lastScan.student.nisn}</span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between text-xs">
                      <span
                        className={`px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider text-[10px] ${
                          lastScan.status === 'BERHASIL_HADIR'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-amber-500 text-white shadow-xs'
                        }`}
                      >
                        {lastScan.status === 'BERHASIL_HADIR' ? '✓ STATUS: HADIR' : 'ℹ️ SUDAH TERCATAT HADIR'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {lastScan.catatan}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                    <QrCode className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Belum ada siswa yang dipindai pada sesi ini. Arahkan barcode kartu siswa ke kamera.
                    </p>
                  </div>
                )}

                {/* Direct Simulation for Testing */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      ⚡ Uji Coba Cepat (Direct Test):
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (siswaList.length > 0) {
                          const rand = siswaList[Math.floor(Math.random() * siswaList.length)];
                          handleProcessCode(rand.nisn);
                        }
                      }}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                    >
                      Pilih Siswa Acak
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedSimulateStudentId}
                      onChange={(e) => setSelectedSimulateStudentId(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 truncate"
                    >
                      {siswaList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nama} ({s.kelas} - {s.nisn})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleSimulateScan}
                      className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all shrink-0"
                    >
                      Simulasi Scan
                    </button>
                  </div>
                </div>
              </div>

              {/* Today's Attendance Feed */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        Riwayat Presensi Hari Ini
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Total {todayAttendances.length} siswa hadir hari ini ({todayStr})
                      </p>
                    </div>
                  </div>

                  {/* Class Filter for Feed */}
                  <select
                    value={scanFilterKelas}
                    onChange={(e) => setScanFilterKelas(e.target.value)}
                    className="px-2 py-1 text-[11px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  >
                    <option value="all">Semua Kelas</option>
                    {kelasList.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="max-h-[280px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1 space-y-1">
                  {filteredTodayAttendances.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Belum ada siswa yang tercatat hadir hari ini
                      {scanFilterKelas !== 'all' ? ` pada rombel ${scanFilterKelas}` : ''}.
                    </div>
                  ) : (
                    filteredTodayAttendances.map((att) => {
                      return (
                        <div
                          key={att.id}
                          className="py-2.5 px-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {att.namaSiswa}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              {att.kelas} • {att.catatan || 'Hadir'}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] shrink-0">
                            HADIR
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
