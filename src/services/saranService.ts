import { SaranMasukan } from '../types';

const SARAN_CACHE_KEY = 'tongguru_saran_masukan_cache';

const DEFAULT_SARAN: SaranMasukan[] = [
  {
    id: 'saran_001',
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '08:30',
    pengirimNama: 'Ahmad Fauzi',
    pengirimKelas: 'XI RPL 1',
    pengirimNisn: '12345',
    isAnonymous: false,
    kategori: 'Fasilitas Sekolah',
    judul: 'Penambahan Router WiFi di Area Kantin',
    pesan: 'Sinyal WiFi di area kantin dan lapangan basket sering terputus-putus. Mohon dapat diperkuat atau ditambah access point agar siswa bisa mengakses materi pembelajaran dengan lancar saat istirahat.',
    rating: 4,
    status: 'Diproses',
    catatanGuru: 'Sudah dikoordinasikan dengan tim IT sekolah untuk penambahan AP baru minggu depan.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'saran_002',
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '10:15',
    pengirimNama: '',
    pengirimKelas: '',
    pengirimNisn: '',
    isAnonymous: true,
    kategori: 'Kebersihan & Lingkungan',
    judul: 'Perbanyak Kotak Sampah Organik & Non-Organik',
    pesan: 'Di koridor lantai 2 gedung utara kadang masih dijumpai sampah plastik karena jarak tempat sampah terlalu jauh satu sama lain.',
    rating: 5,
    status: 'Baru',
    createdAt: new Date().toISOString()
  }
];

export const saranService = {
  notifyChange() {
    try {
      window.dispatchEvent(new Event('tongguru_saran_data_changed'));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('tongguru_saran_channel');
        bc.postMessage({ type: 'DATA_CHANGED', timestamp: Date.now() });
        bc.close();
      }
    } catch {}
  },

  async fetchSaran(): Promise<SaranMasukan[]> {
    try {
      const res = await fetch('/api/saran');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          localStorage.setItem(SARAN_CACHE_KEY, JSON.stringify(data));
          return data;
        }
      }
    } catch {}

    try {
      const cached = localStorage.getItem(SARAN_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}

    localStorage.setItem(SARAN_CACHE_KEY, JSON.stringify(DEFAULT_SARAN));
    return DEFAULT_SARAN;
  },

  async submitSaran(data: Omit<SaranMasukan, 'id' | 'createdAt' | 'status'>): Promise<SaranMasukan> {
    const newEntry: SaranMasukan = {
      ...data,
      id: 'saran_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      status: 'Baru',
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/saran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      });
      if (res.ok) {
        const json = await res.json();
        const saved = json.record || newEntry;
        const current = await this.fetchSaran();
        const exists = current.some((s) => s.id === saved.id);
        const updated = exists ? current : [saved, ...current];
        localStorage.setItem(SARAN_CACHE_KEY, JSON.stringify(updated));
        this.notifyChange();
        return saved;
      }
    } catch (err) {
      console.warn('API saran offline, fallback localStorage:', err);
    }

    const current = await this.fetchSaran();
    const updated = [newEntry, ...current];
    localStorage.setItem(SARAN_CACHE_KEY, JSON.stringify(updated));
    this.notifyChange();
    return newEntry;
  },

  async updateSaran(id: string, status: SaranMasukan['status'], catatanGuru?: string): Promise<SaranMasukan | null> {
    try {
      const res = await fetch(`/api/saran/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, catatanGuru }),
      });
      if (res.ok) {
        const json = await res.json();
        const saved = json.record;
        const current = await this.fetchSaran();
        const updated = current.map((s) => (s.id === id ? { ...s, ...saved, status, catatanGuru } : s));
        localStorage.setItem(SARAN_CACHE_KEY, JSON.stringify(updated));
        this.notifyChange();
        return saved;
      }
    } catch {}

    const current = await this.fetchSaran();
    let target: SaranMasukan | null = null;
    const updated = current.map((s) => {
      if (s.id === id) {
        target = { ...s, status, catatanGuru: catatanGuru !== undefined ? catatanGuru : s.catatanGuru };
        return target;
      }
      return s;
    });
    localStorage.setItem(SARAN_CACHE_KEY, JSON.stringify(updated));
    this.notifyChange();
    return target;
  },

  async deleteSaran(id: string): Promise<boolean> {
    try {
      await fetch(`/api/saran/${id}`, { method: 'DELETE' });
    } catch {}
    const current = await this.fetchSaran();
    const filtered = current.filter((s) => s.id !== id);
    localStorage.setItem(SARAN_CACHE_KEY, JSON.stringify(filtered));
    this.notifyChange();
    return true;
  },
};

export const getSaranList = (): SaranMasukan[] => {
  // Trigger background sync with server
  if (typeof fetch !== 'undefined') {
    fetch('/api/saran')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          localStorage.setItem(SARAN_CACHE_KEY, JSON.stringify(data));
          saranService.notifyChange();
        }
      })
      .catch(() => {});
  }

  try {
    const stored = localStorage.getItem(SARAN_CACHE_KEY);
    if (!stored) {
      localStorage.setItem(SARAN_CACHE_KEY, JSON.stringify(DEFAULT_SARAN));
      return DEFAULT_SARAN;
    }
    return JSON.parse(stored);
  } catch (e) {
    console.error('Error loading saran list:', e);
    return DEFAULT_SARAN;
  }
};

export const saveSaranList = (list: SaranMasukan[]): void => {
  try {
    localStorage.setItem(SARAN_CACHE_KEY, JSON.stringify(list));
    saranService.notifyChange();
  } catch (e) {
    console.error('Error saving saran list:', e);
  }
};

export const addSaran = (data: Omit<SaranMasukan, 'id' | 'createdAt' | 'status'>): SaranMasukan => {
  const current = getSaranList();
  const newEntry: SaranMasukan = {
    ...data,
    id: 'saran_' + Date.now(),
    status: 'Baru',
    createdAt: new Date().toISOString()
  };
  const updated = [newEntry, ...current];
  saveSaranList(updated);

  // Sync to backend
  if (typeof fetch !== 'undefined') {
    fetch('/api/saran', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry),
    }).catch((err) => console.warn('Offline saran sync:', err));
  }

  return newEntry;
};

export const updateSaranStatus = (id: string, status: SaranMasukan['status'], catatanGuru?: string): void => {
  const current = getSaranList();
  const updated = current.map(item => {
    if (item.id === id) {
      return {
        ...item,
        status,
        catatanGuru: catatanGuru !== undefined ? catatanGuru : item.catatanGuru
      };
    }
    return item;
  });
  saveSaranList(updated);

  if (typeof fetch !== 'undefined') {
    fetch(`/api/saran/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, catatanGuru }),
    }).catch(() => {});
  }
};

export const deleteSaran = (id: string): void => {
  const current = getSaranList();
  const updated = current.filter(item => item.id !== id);
  saveSaranList(updated);

  if (typeof fetch !== 'undefined') {
    fetch(`/api/saran/${id}`, { method: 'DELETE' }).catch(() => {});
  }
};
