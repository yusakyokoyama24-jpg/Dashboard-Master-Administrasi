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

export const getSaranList = (): SaranMasukan[] => {
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
};

export const deleteSaran = (id: string): void => {
  const current = getSaranList();
  const updated = current.filter(item => item.id !== id);
  saveSaranList(updated);
};
