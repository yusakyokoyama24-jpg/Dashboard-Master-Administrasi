import { PresensiPkl, TempatPkl } from '../types';

const PKL_CACHE_KEY = 'tongguru_pkl_attendances_cache';
const PLACES_CACHE_KEY = 'tongguru_pkl_places_cache';

const DEFAULT_PLACES: TempatPkl[] = [
  {
    id: 'dudi_001',
    namaDudi: 'PT Astra Digital Inovasi',
    bidangUsaha: 'Software Development & IT Support',
    alamat: 'Gedung Astra Tower Lt. 12, Jl. Jend. Sudirman Kav. 5, Jakarta Pusat',
    pembimbingDudi: 'Hendra Wijaya, S.Kom.',
    kontakPembimbing: '0813-8899-1234',
    guruPembimbing: 'Yusak Yokoyama, S.Pd., M.Pd.',
  },
  {
    id: 'dudi_002',
    namaDudi: 'PT Telekomunikasi Selular (Telkomsel)',
    bidangUsaha: 'Jaringan Telekomunikasi & Cloud Infrastructure',
    alamat: 'Telkomsel Smart Office, Jl. Gatot Subroto Kav. 52, Jakarta Selatan',
    pembimbingDudi: 'Ir. Bambang Hermanto',
    kontakPembimbing: '0812-3456-7890',
    guruPembimbing: 'Yusak Yokoyama, S.Pd., M.Pd.',
  },
  {
    id: 'dudi_003',
    namaDudi: 'Dinas Komunikasi & Informatika (Diskominfo)',
    bidangUsaha: 'Sistem Informasi Publik & Cyber Security',
    alamat: 'Gedung Balaikota Blok H Lt. 14, Jakarta Pusat',
    pembimbingDudi: 'Rina Agustina, S.T., M.M.',
    kontakPembimbing: '0811-2233-4455',
    guruPembimbing: 'Yusak Yokoyama, S.Pd., M.Pd.',
  },
  {
    id: 'dudi_004',
    namaDudi: 'Studio Animasi & Kreatif Visual Nusantara',
    bidangUsaha: 'Multimedia, UI/UX Design & 3D Modeling',
    alamat: 'Ruko Kebayoran Arcade 2 Blok B No. 8, Bintaro Jaya',
    pembimbingDudi: 'Aditya Pratama, S.Sn.',
    kontakPembimbing: '0852-9988-7766',
    guruPembimbing: 'Yusak Yokoyama, S.Pd., M.Pd.',
  },
];

export const pklService = {
  // Fetch Presensi PKL
  async fetchPresensi(filter?: { tanggal?: string; siswaId?: string; status?: string }): Promise<PresensiPkl[]> {
    try {
      const params = new URLSearchParams();
      if (filter?.tanggal) params.append('tanggal', filter.tanggal);
      if (filter?.siswaId) params.append('siswaId', filter.siswaId);
      if (filter?.status) params.append('status', filter.status);

      const res = await fetch(`/api/pkl/presensi?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          localStorage.setItem(PKL_CACHE_KEY, JSON.stringify(data));
          return data;
        }
      }
    } catch {
      // Fallback to cache if network fails
    }

    try {
      const cached = localStorage.getItem(PKL_CACHE_KEY);
      if (cached) {
        let items: PresensiPkl[] = JSON.parse(cached);
        if (filter?.tanggal) items = items.filter((i) => i.tanggal === filter.tanggal);
        if (filter?.siswaId) items = items.filter((i) => i.siswaId === filter.siswaId || i.nisn === filter.siswaId);
        if (filter?.status) items = items.filter((i) => i.status === filter.status);
        return items;
      }
    } catch (e) {
      console.warn('Gagal membaca cache PKL:', e);
    }

    return [];
  },

  // Submit Presensi (Can be Check-In only, or Check-Out, or Full)
  async submitPresensi(payload: Partial<PresensiPkl> & { action?: 'checkout'; isNewForced?: boolean }): Promise<PresensiPkl> {
    try {
      const res = await fetch('/api/pkl/presensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.record) {
          // update local cache
          const currentList = await this.fetchPresensi();
          const existingIdx = currentList.findIndex((item) => item.id === data.record.id);
          if (existingIdx !== -1) {
            currentList[existingIdx] = data.record;
          } else {
            currentList.unshift(data.record);
          }
          localStorage.setItem(PKL_CACHE_KEY, JSON.stringify(currentList));
          return data.record;
        }
      }
    } catch (err) {
      console.warn('API PKL offline, menggunakan fallback localStorage:', err);
    }

    // Local fallback
    const now = new Date();
    const timeNowStr = now.toLocaleTimeString('id-ID', { hour12: false });
    const targetDate = payload.tanggal || now.toISOString().split('T')[0];

    const currentList: PresensiPkl[] = JSON.parse(localStorage.getItem(PKL_CACHE_KEY) || '[]');
    const existingIdx = currentList.findIndex(
      (item) => item.tanggal === targetDate && (item.siswaId === payload.siswaId || item.nisn === payload.nisn)
    );

    let savedItem: PresensiPkl;

    if (existingIdx !== -1 && (payload.action === 'checkout' || payload.fotoPulang)) {
      const existing = currentList[existingIdx];
      savedItem = {
        ...existing,
        waktuPulang: payload.waktuPulang || timeNowStr,
        timestampPulang: payload.timestampPulang || Date.now(),
        fotoPulang: payload.fotoPulang || existing.fotoPulang,
        keteranganPulang: payload.keteranganPulang || existing.keteranganPulang,
        ringkasanPekerjaan: payload.ringkasanPekerjaan || existing.ringkasanPekerjaan,
        status: 'selesai_pulang',
        updatedAt: new Date().toISOString(),
      };
      currentList[existingIdx] = savedItem;
    } else {
      savedItem = {
        id: payload.id || `pkl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tanggal: targetDate,
        siswaId: payload.siswaId || `s_${Date.now()}`,
        nisn: payload.nisn || '-',
        namaSiswa: payload.namaSiswa || 'Siswa PKL',
        kelas: payload.kelas || 'XI RPL 1',
        namaDudi: payload.namaDudi || 'Tempat Magang PKL',
        alamatDudi: payload.alamatDudi || '',
        guruPembimbing: payload.guruPembimbing || 'Yusak Yokoyama, S.Pd., M.Pd.',
        waktuDatang: payload.waktuDatang || timeNowStr,
        timestampDatang: payload.timestampDatang || Date.now(),
        fotoDatang: payload.fotoDatang || '',
        keteranganDatang: payload.keteranganDatang || '',
        lokasiDatang: payload.lokasiDatang || 'Lokasi Tempat PKL',
        waktuPulang: payload.waktuPulang,
        timestampPulang: payload.timestampPulang,
        fotoPulang: payload.fotoPulang,
        keteranganPulang: payload.keteranganPulang,
        ringkasanPekerjaan: payload.ringkasanPekerjaan || '',
        status: payload.fotoPulang ? 'selesai_pulang' : 'masih_pkl',
        verifiedByTeacher: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      currentList.unshift(savedItem);
    }

    localStorage.setItem(PKL_CACHE_KEY, JSON.stringify(currentList));
    return savedItem;
  },

  // Update Presensi (Teacher verification, notes, etc.)
  async updatePresensi(id: string, updates: Partial<PresensiPkl>): Promise<PresensiPkl | null> {
    try {
      const res = await fetch(`/api/pkl/presensi/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        return data.record;
      }
    } catch {
      // offline fallback
    }

    const currentList: PresensiPkl[] = JSON.parse(localStorage.getItem(PKL_CACHE_KEY) || '[]');
    const idx = currentList.findIndex((i) => i.id === id);
    if (idx !== -1) {
      currentList[idx] = { ...currentList[idx], ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem(PKL_CACHE_KEY, JSON.stringify(currentList));
      return currentList[idx];
    }
    return null;
  },

  // Delete Presensi
  async deletePresensi(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/pkl/presensi/${id}`, { method: 'DELETE' });
      if (res.ok) {
        // remove locally
        const currentList: PresensiPkl[] = JSON.parse(localStorage.getItem(PKL_CACHE_KEY) || '[]');
        const updated = currentList.filter((i) => i.id !== id);
        localStorage.setItem(PKL_CACHE_KEY, JSON.stringify(updated));
        return true;
      }
    } catch {
      // offline fallback
    }

    const currentList: PresensiPkl[] = JSON.parse(localStorage.getItem(PKL_CACHE_KEY) || '[]');
    const updated = currentList.filter((i) => i.id !== id);
    localStorage.setItem(PKL_CACHE_KEY, JSON.stringify(updated));
    return true;
  },

  // Fetch Places (DUDI)
  async fetchPlaces(): Promise<TempatPkl[]> {
    try {
      const res = await fetch('/api/pkl/places');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          localStorage.setItem(PLACES_CACHE_KEY, JSON.stringify(data));
          return data;
        }
      }
    } catch {
      // fallback
    }

    try {
      const cached = localStorage.getItem(PLACES_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }

    return DEFAULT_PLACES;
  },

  // Add Place
  async addPlace(place: Partial<TempatPkl>): Promise<TempatPkl> {
    try {
      const res = await fetch('/api/pkl/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(place),
      });
      if (res.ok) {
        const data = await res.json();
        return data.place;
      }
    } catch {
      // fallback
    }

    const newPlace: TempatPkl = {
      id: place.id || `dudi_${Date.now()}`,
      namaDudi: place.namaDudi || 'Instansi PKL Baru',
      bidangUsaha: place.bidangUsaha || 'Teknologi & Industri',
      alamat: place.alamat || '-',
      pembimbingDudi: place.pembimbingDudi || '-',
      kontakPembimbing: place.kontakPembimbing || '-',
      guruPembimbing: place.guruPembimbing || 'Yusak Yokoyama, S.Pd., M.Pd.',
    };

    const currentPlaces: TempatPkl[] = JSON.parse(localStorage.getItem(PLACES_CACHE_KEY) || JSON.stringify(DEFAULT_PLACES));
    currentPlaces.push(newPlace);
    localStorage.setItem(PLACES_CACHE_KEY, JSON.stringify(currentPlaces));
    return newPlace;
  },

  // Delete Place (DUDI)
  async deletePlace(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/pkl/places/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const currentPlaces: TempatPkl[] = JSON.parse(localStorage.getItem(PLACES_CACHE_KEY) || JSON.stringify(DEFAULT_PLACES));
        const updated = currentPlaces.filter((p) => p.id !== id);
        localStorage.setItem(PLACES_CACHE_KEY, JSON.stringify(updated));
        return true;
      }
    } catch {
      // fallback
    }

    const currentPlaces: TempatPkl[] = JSON.parse(localStorage.getItem(PLACES_CACHE_KEY) || JSON.stringify(DEFAULT_PLACES));
    const updated = currentPlaces.filter((p) => p.id !== id);
    localStorage.setItem(PLACES_CACHE_KEY, JSON.stringify(updated));
    return true;
  },

  // Burn authentic Timestamp & Watermark into Selfie Photo
  async burnWatermarkToPhoto(
    imageSrc: string,
    meta: {
      namaSiswa: string;
      nisn: string;
      tipe: 'DATANG (CHECK-IN)' | 'PULANG (CHECK-OUT)';
      namaDudi: string;
      tanggalFormatted: string; // e.g. "Senin, 13 Oktober 2026"
      waktuFormatted: string; // e.g. "07:35:12 WIB"
      lokasiDetail?: string;
    }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let { width, height } = img;

          // Scale down if too large for performance & storage
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(imageSrc);
            return;
          }

          // Draw the base selfie
          ctx.drawImage(img, 0, 0, width, height);

          // Top Header Watermark Badge
          const topBadgeHeight = Math.max(38, Math.round(height * 0.055));
          ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
          ctx.fillRect(0, 0, width, topBadgeHeight);

          // Top badge text
          ctx.font = `bold ${Math.max(12, Math.round(width * 0.024))}px sans-serif`;
          ctx.fillStyle = meta.tipe.includes('DATANG') ? '#10b981' : '#f59e0b';
          const badgeText = `● ${meta.tipe}`;
          ctx.fillText(badgeText, 16, Math.round(topBadgeHeight * 0.65));

          ctx.textAlign = 'right';
          ctx.fillStyle = '#94a3b8';
          ctx.font = `bold ${Math.max(10, Math.round(width * 0.02))}px sans-serif`;
          ctx.fillText('TONGGURU YUSAK YOKOYAMA • VERIFIKASI RESMI PKL', width - 16, Math.round(topBadgeHeight * 0.65));

          // Bottom Watermark Box (Semi-transparent black overlay)
          const bottomHeight = Math.max(110, Math.round(height * 0.22));
          const bottomY = height - bottomHeight;

          // Gradient backdrop for maximum readability
          const gradient = ctx.createLinearGradient(0, bottomY, 0, height);
          gradient.addColorStop(0, 'rgba(10, 15, 30, 0.88)');
          gradient.addColorStop(1, 'rgba(3, 7, 18, 0.98)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, bottomY, width, bottomHeight);

          // Top border of watermark box
          ctx.strokeStyle = meta.tipe.includes('DATANG') ? '#10b981' : '#f59e0b';
          ctx.lineWidth = Math.max(3, Math.round(width * 0.005));
          ctx.beginPath();
          ctx.moveTo(0, bottomY);
          ctx.lineTo(width, bottomY);
          ctx.stroke();

          // Text metrics & styling
          ctx.textAlign = 'left';

          // 1. Tanggal & Waktu (Big Bold Amber/Green)
          const fontSizeTime = Math.max(16, Math.round(width * 0.038));
          ctx.font = `bold ${fontSizeTime}px monospace, sans-serif`;
          ctx.fillStyle = '#fbbf24'; // amber-400
          const timeString = `⏰ ${meta.waktuFormatted} | 📅 ${meta.tanggalFormatted}`;
          ctx.fillText(timeString, 16, bottomY + fontSizeTime + 12);

          // 2. Nama Siswa & NISN
          const fontSizeName = Math.max(13, Math.round(width * 0.028));
          ctx.font = `bold ${fontSizeName}px sans-serif`;
          ctx.fillStyle = '#ffffff';
          const studentString = `👤 ${meta.namaSiswa} (NISN: ${meta.nisn})`;
          ctx.fillText(studentString, 16, bottomY + fontSizeTime + fontSizeName + 22);

          // 3. Nama Instansi / DUDI Tempat PKL
          const fontSizeDudi = Math.max(11, Math.round(width * 0.024));
          ctx.font = `500 ${fontSizeDudi}px sans-serif`;
          ctx.fillStyle = '#38bdf8'; // light sky blue
          const dudiString = `🏢 ${meta.namaDudi}${meta.lokasiDetail ? ` • ${meta.lokasiDetail}` : ''}`;
          ctx.fillText(dudiString, 16, bottomY + fontSizeTime + fontSizeName + fontSizeDudi + 30);

          // Convert to JPEG data URL with quality 0.82
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve(dataUrl);
        } catch (e) {
          console.error('Error drawing watermark to canvas:', e);
          resolve(imageSrc);
        }
      };
      img.onerror = () => {
        console.warn('Failed to load image for watermarking');
        resolve(imageSrc);
      };
      img.src = imageSrc;
    });
  },
};
