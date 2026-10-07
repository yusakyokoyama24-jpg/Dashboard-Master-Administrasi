import React, { useEffect, useMemo, useRef, useState } from 'react';
import jsQR from 'jsqr';
import Swal from 'sweetalert2';
import { Camera, CheckCircle2, UserCheck, Calendar, Filter, Volume2, AlertCircle, Save } from 'lucide-react';
import { Siswa, Absensi } from '../../types';
import { dbService } from '../../services/db';
import { showToast } from '../../utils/toast';

interface AbsensiManagerProps {
  siswaList: Siswa[];
  absensiList: Absensi[];
}

export const AbsensiManager: React.FC<AbsensiManagerProps> = ({ siswaList, absensiList }) => {
  const [mode, setMode] = useState<'manual' | 'scanner'>('manual');
  const [selectedTanggal, setSelectedTanggal] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedKelas, setSelectedKelas] = useState<string>('X RPL 1');

  // Manual records state: map siswaId -> { status, catatan }
  const [attendanceDraft, setAttendanceDraft] = useState<Record<string, { status: 'H' | 'S' | 'I' | 'A'; catatan: string }>>({});

  // Scanner state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedResult, setLastScannedResult] = useState<string | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const lastScannedTimeRef = useRef<number>(0);

  const kelasList = useMemo(() => {
    return Array.from(new Set(siswaList.map((s) => s.kelas))).sort();
  }, [siswaList]);

  const studentsInClass = useMemo(() => {
    return siswaList.filter((s) => s.kelas === selectedKelas);
  }, [siswaList, selectedKelas]);

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

  // Audio Beep generator using Web Audio API
  const playSuccessBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880 Hz
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      console.warn('Audio not allowed yet:', e);
    }
  };

  // Start Scanner
  const startCamera = async () => {
    setIsScanning(true);
    setScanMessage('Menghubungkan ke kamera...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setScanMessage('Arahkan kamera ke QR Code Kartu Siswa');
        processQrStream();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setIsScanning(false);
      setScanMessage(null);
      Swal.fire({
        title: 'Izin Kamera Diperlukan',
        text: 'Aplikasi memerlukan izin akses kamera untuk memindai kartu presensi siswa.',
        icon: 'warning',
      });
    }
  };

  // Stop Scanner
  const stopCamera = () => {
    setIsScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Frame processing loop
  const processQrStream = () => {
    const scan = () => {
      if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
        if (isScanning) requestAnimationFrame(scan);
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        const now = Date.now();
        // Debounce 2.5 seconds
        if (now - lastScannedTimeRef.current > 2500) {
          lastScannedTimeRef.current = now;
          handleQrScanned(code.data.trim());
        }
      }

      if (isScanning) {
        requestAnimationFrame(scan);
      }
    };

    requestAnimationFrame(scan);
  };

  const handleQrScanned = (scannedNisn: string) => {
    const student = siswaList.find((s) => s.nisn === scannedNisn || s.id === scannedNisn);
    if (!student) {
      setLastScannedResult(`QR tidak terdaftar: ${scannedNisn}`);
      Swal.fire({
        title: 'Siswa Tidak Ditemukan',
        text: `Data dengan kode "${scannedNisn}" belum terdaftar di sistem.`,
        icon: 'error',
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    playSuccessBeep();

    const todayStr = new Date().toISOString().split('T')[0];
    const absensiRecord: Absensi = {
      id: `ab_qr_${Date.now()}`,
      tanggal: todayStr,
      siswaId: student.id,
      namaSiswa: student.nama,
      kelas: student.kelas,
      status: 'H',
      catatan: `Hadir via QR Scanner (${new Date().toLocaleTimeString('id-ID')})`,
      timestamp: new Date().toISOString(),
      userId: 'master_guru_default',
    };

    dbService.recordAbsensi(absensiRecord);
    setLastScannedResult(`Berhasil: ${student.nama} (${student.kelas}) - HADIR`);

    Swal.fire({
      title: '✅ Presensi Berhasil!',
      html: `<b>${student.nama}</b><br><span class="text-sm text-gray-500">${student.kelas} • NISN: ${student.nisn}</span><br><span class="text-emerald-600 font-bold">STATUS: HADIR</span>`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
    });
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
            Presensi Digital Real-time: Scanner Kamera QR & Checklist Manual
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
            Dukung mode checklist harian manual dan pemindai kamera QR otomatis real-time.
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

      {/* Mode 1: Manual Checklist */}
      {mode === 'manual' && (
        <div className="space-y-4">
          {/* Summary Kotak Kehadiran Siswa (Emerald & Status Themed) */}
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

          {/* Students Checklist Table (Emerald Themed) */}
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
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-3 px-4 text-center font-mono text-xs">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
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

      {/* Mode 2: Real-time QR Camera Scanner */}
      {mode === 'scanner' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-7 bg-black rounded-2xl overflow-hidden shadow-xl border-4 border-slate-800 relative flex flex-col items-center justify-center min-h-[360px]">
            <video ref={videoRef} className="w-full h-auto object-cover max-h-[480px]" />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning Overlay Box */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-emerald-400 rounded-2xl relative shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>
              </div>
              <p className="mt-4 px-4 py-1.5 bg-black/70 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                {scanMessage || 'Arahkan QR Siswa ke Kotak Pindai'}
              </p>
            </div>
          </div>

          <div className="md:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-600" />
                Status Pemindai Presensi Kamera
              </h3>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <p>• Kamera memindai barcode QR pada Kartu Siswa secara otomatis.</p>
                <p>• Suara notifikasi (beep) otomatis bersuara saat kartu berhasil dikenali.</p>
                <p>• Catatan kehadiran langsung disimpan ke database presensi.</p>
              </div>

              {lastScannedResult && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 block uppercase">
                    Hasil Pindai Terakhir:
                  </span>
                  <p className="font-semibold text-sm text-emerald-950 dark:text-emerald-100 mt-1">
                    {lastScannedResult}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  onClick={isScanning ? stopCamera : startCamera}
                  className={`w-full py-2.5 text-xs font-bold rounded-xl text-white transition-all ${
                    isScanning ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isScanning ? 'Hentikan Kamera' : 'Aktifkan Kamera'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (siswaList.length > 0) {
                      const randomSiswa = siswaList[Math.floor(Math.random() * siswaList.length)];
                      handleQrScanned(randomSiswa.nisn);
                    }
                  }}
                  className="w-full py-2 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-100 transition-all flex items-center justify-center gap-1.5"
                >
                  ⚡ Simulasikan Pindai QR Siswa (Uji Coba Direct)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
