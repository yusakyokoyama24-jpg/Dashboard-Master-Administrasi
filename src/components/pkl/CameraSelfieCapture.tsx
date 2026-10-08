import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle, Upload, AlertCircle, X, Sparkles } from 'lucide-react';
import { pklService } from '../../services/pklService';

interface CameraSelfieCaptureProps {
  label: string;
  tipe: 'DATANG (CHECK-IN)' | 'PULANG (CHECK-OUT)';
  namaSiswa: string;
  nisn: string;
  namaDudi: string;
  onPhotoCaptured: (photoBase64: string, capturedTime: string) => void;
  existingPhoto?: string;
  required?: boolean;
}

export const CameraSelfieCapture: React.FC<CameraSelfieCaptureProps> = ({
  label,
  tipe,
  namaSiswa,
  nisn,
  namaDudi,
  onPhotoCaptured,
  existingPhoto,
  required = false,
}) => {
  const [photo, setPhoto] = useState<string | null>(existingPhoto || null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [currentTime, setCurrentTime] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Live clock on camera viewfinder
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour12: false }) + ' WIB');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update if existingPhoto changes
  useEffect(() => {
    if (existingPhoto) {
      setPhoto(existingPhoto);
    }
  }, [existingPhoto]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Gagal membuka kamera:', err);
      setCameraError(
        'Kamera tidak dapat diakses (izin ditolak atau perangkat tidak mendukung). Anda dapat menggunakan tombol "Unggah Foto / Kamera HP" di bawah.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const toggleCameraFacing = async () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    if (isCameraActive) {
      stopCamera();
      setTimeout(() => {
        startCamera();
      }, 150);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    setIsProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      // If user facing, mirror image for natural selfie feel
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const rawDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      stopCamera();

      // Process watermark with real date & time
      await processAndSetPhoto(rawDataUrl);
    } catch (err) {
      console.error('Error capturing selfie:', err);
      setCameraError('Gagal mengambil gambar. Silakan coba kembali.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawDataUrl = event.target?.result as string;
      if (rawDataUrl) {
        await processAndSetPhoto(rawDataUrl);
      }
      setIsProcessing(false);
    };
    reader.onerror = () => {
      setIsProcessing(false);
      setCameraError('Gagal membaca berkas gambar.');
    };
    reader.readAsDataURL(file);
  };

  const processAndSetPhoto = async (rawDataUrl: string) => {
    const now = new Date();
    const tanggalFormatted = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const waktuFormatted = now.toLocaleTimeString('id-ID', { hour12: false }) + ' WIB';

    const watermarkedDataUrl = await pklService.burnWatermarkToPhoto(rawDataUrl, {
      namaSiswa: namaSiswa || 'Siswa PKL',
      nisn: nisn || '-',
      tipe: tipe,
      namaDudi: namaDudi || 'Tempat PKL',
      tanggalFormatted,
      waktuFormatted,
    });

    setPhoto(watermarkedDataUrl);
    onPhotoCaptured(watermarkedDataUrl, waktuFormatted);
  };

  const resetPhoto = () => {
    setPhoto(null);
    onPhotoCaptured('', '');
  };

  const isCheckIn = tipe.includes('DATANG');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Camera className={`w-4 h-4 ${isCheckIn ? 'text-emerald-500' : 'text-amber-500'}`} />
          <span>{label}</span>
          {required && <span className="text-rose-500 text-xs font-black">*Wajib</span>}
        </label>
        {photo && (
          <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center gap-1 border border-emerald-300">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Selfie Terverifikasi
          </span>
        )}
      </div>

      {/* Main View Area */}
      {!photo && !isCameraActive && (
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-5 bg-slate-50 dark:bg-slate-900/50 text-center transition-all hover:border-blue-400">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3">
            <Camera className="w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Ambil Foto Selfie {isCheckIn ? 'Waktu Datang' : 'Waktu Pulang'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Foto selfie akan otomatis dibubuhi tanggal, jam real-time, nama siswa, dan identitas tempat PKL secara resmi.
          </p>

          {cameraError && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{cameraError}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={startCamera}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Buka Kamera Langsung
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors flex items-center gap-2 border border-slate-300 dark:border-slate-600"
            >
              <Upload className="w-4 h-4" />
              Pilih / Ambil dari HP
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>
      )}

      {/* Active Camera Viewfinder */}
      {isCameraActive && (
        <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-blue-500 shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full max-h-[380px] object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />

          {/* Viewfinder Overlays */}
          <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-black text-amber-300 border border-amber-500/50 flex items-center gap-1.5 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>LIVE {currentTime}</span>
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleCameraFacing}
              className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-600 text-xs"
              title="Balik Kamera (Depan/Belakang)"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="p-2 rounded-full bg-rose-600/90 hover:bg-rose-700 text-white text-xs"
              title="Tutup Kamera"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Guide Overlay Grid */}
          <div className="absolute inset-0 pointer-events-none border border-white/20 m-6 rounded-2xl flex items-center justify-center">
            <div className="text-center bg-black/40 px-3 py-1 rounded-lg backdrop-blur-xs">
              <span className="text-[11px] font-bold text-white/90">
                Posisikan wajah Anda dengan jelas dalam bingkai
              </span>
            </div>
          </div>

          {/* Bottom Shutter Controls */}
          <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4">
            <button
              type="button"
              disabled={isProcessing}
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white border-4 border-blue-500 shadow-2xl flex items-center justify-center active:scale-90 transition-transform hover:bg-slate-100 disabled:opacity-50"
              title="Ambil Foto Selfie"
            >
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white">
                <Camera className="w-6 h-6" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Captured / Existing Photo Preview with Watermark Stamp */}
      {photo && (
        <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-400 dark:border-emerald-600 shadow-xl bg-slate-950">
          <img
            src={photo}
            alt={`Foto Selfie ${label}`}
            className="w-full max-h-[380px] object-contain bg-slate-950 mx-auto"
          />

          <div className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-extrabold text-white flex items-center gap-1.5 shadow-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Watermark Tanggal & Waktu Aktif</span>
          </div>

          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2">
            <div className="text-xs text-slate-300">
              <span className="font-bold text-emerald-400">Foto Siap Terkirim.</span> Tertera stempel waktu resmi.
            </div>
            <button
              type="button"
              onClick={resetPhoto}
              className="px-3 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Foto Ulang
            </button>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-300 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-center gap-2 animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Sedang membubuhkan watermark tanggal & waktu pada foto selfie...</span>
        </div>
      )}
    </div>
  );
};
