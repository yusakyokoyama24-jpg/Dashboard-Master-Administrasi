import { Siswa, Mapel, Jadwal, Absensi, Nilai, Agenda, Bimbingan, Pengaturan, UserSession, LogAktivitas } from '../types';

const STORAGE_KEYS = {
  SISWA: 'tongguru_siswa_v1',
  MAPEL: 'tongguru_mapel_v1',
  JADWAL: 'tongguru_jadwal_v1',
  ABSENSI: 'tongguru_absensi_v1',
  NILAI: 'tongguru_nilai_v1',
  AGENDA: 'tongguru_agenda_v1',
  BIMBINGAN: 'tongguru_bimbingan_v1',
  PENGATURAN: 'tongguru_pengaturan_v1',
  AUTH: 'tongguru_auth_v1',
  THEME: 'tongguru_theme_v1',
  LOGS: 'tongguru_logs_v1',
};

// Initial Default Settings
export const DEFAULT_PENGATURAN: Pengaturan = {
  namaGuru: 'Yusak Yokoyama, S.Pd., M.Pd.',
  nipGuru: '19850712 201001 1 018',
  mapelUtama: 'Informatika & Rekayasa Perangkat Lunak',
  namaSekolah: 'SMK Negeri 1 Indonesia Merdeka',
  dinasPendidikan: 'Dinas Pendidikan Provinsi DKI Jakarta',
  alamatSekolah: 'Jl. Merdeka Pendidikan No. 45, Jakarta Pusat',
  noTelpSekolah: '(021) 3840192',
  emailSekolah: 'info@smkn1merdeka.sch.id',
  namaKepsek: 'Drs. H. Ahmad Fauzi, M.M.',
  nipKepsek: '19680315 199412 1 002',
  kota: 'Jakarta',
  logoDinasUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=120&auto=format&fit=crop&q=80',
  logoSekolahUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=120&auto=format&fit=crop&q=80',
  fotoProfil: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=250&auto=format&fit=crop&q=80',
  username: 'www.yusakyokoyama.id',
  password: '123456',
  userId: 'master_guru_default',
};

// Initial Seed Data
const SEED_SISWA: Siswa[] = [
  {
    id: 's_001',
    nisn: '0078129341',
    nama: 'Ahmad Faiz Al-Ghifari',
    kelas: 'X RPL 1',
    jenisKelamin: 'L',
    noHpOrtu: '081298765431',
    alamat: 'Jl. Dahlia No. 12, Kebon Jeruk',
    userId: 'master_guru_default',
  },
  {
    id: 's_002',
    nisn: '0078129342',
    nama: 'Anindya Putri Maharani',
    kelas: 'X RPL 1',
    jenisKelamin: 'P',
    noHpOrtu: '081298765432',
    alamat: 'Jl. Melati Indah No. 5, Gambir',
    userId: 'master_guru_default',
  },
  {
    id: 's_003',
    nisn: '0078129343',
    nama: 'Bima Satria Wicaksana',
    kelas: 'X RPL 1',
    jenisKelamin: 'L',
    noHpOrtu: '081298765433',
    alamat: 'Komplek Griya Asri Blok B4',
    userId: 'master_guru_default',
  },
  {
    id: 's_004',
    nisn: '0078129344',
    nama: 'Citra Kirana Dewi',
    kelas: 'X RPL 1',
    jenisKelamin: 'P',
    noHpOrtu: '081298765434',
    alamat: 'Jl. Kenanga Timur No. 19',
    userId: 'master_guru_default',
  },
  {
    id: 's_005',
    nisn: '0078129345',
    nama: 'Daffa Rizky Ramadhan',
    kelas: 'X RPL 2',
    jenisKelamin: 'L',
    noHpOrtu: '081298765435',
    alamat: 'Jl. Cempaka Putih Tengah No. 8',
    userId: 'master_guru_default',
  },
  {
    id: 's_006',
    nisn: '0078129346',
    nama: 'Elsa Febriyanti',
    kelas: 'X RPL 2',
    jenisKelamin: 'P',
    noHpOrtu: '081298765436',
    alamat: 'Jl. Rawamangun Muka No. 3',
    userId: 'master_guru_default',
  },
  {
    id: 's_007',
    nisn: '0078129347',
    nama: 'Fathan Maulana Malik',
    kelas: 'XI RPL 1',
    jenisKelamin: 'L',
    noHpOrtu: '081298765437',
    alamat: 'Jl. Percetakan Negara No. 14',
    userId: 'master_guru_default',
  },
  {
    id: 's_008',
    nisn: '0078129348',
    nama: 'Gita Saraswati',
    kelas: 'XI RPL 1',
    jenisKelamin: 'P',
    noHpOrtu: '081298765438',
    alamat: 'Jl. Pramuka Raya No. 88',
    userId: 'master_guru_default',
  },
];

const SEED_MAPEL: Mapel[] = [
  {
    id: 'm_001',
    kode: 'INF-X',
    nama: 'Informatika Dasar (Algoritma & Pemrograman)',
    tingkat: 'Kelas X',
    jamPerMinggu: 4,
    userId: 'master_guru_default',
  },
  {
    id: 'm_002',
    kode: 'RPL-WEB',
    nama: 'Pengembangan Perangkat Lunak Berbasis Web',
    tingkat: 'Kelas XI',
    jamPerMinggu: 6,
    userId: 'master_guru_default',
  },
  {
    id: 'm_003',
    kode: 'RPL-DB',
    nama: 'Pengelolaan Basis Data Relasional',
    tingkat: 'Kelas XI',
    jamPerMinggu: 4,
    userId: 'master_guru_default',
  },
  {
    id: 'm_004',
    kode: 'PKK-XII',
    nama: 'Proyek Kreatif dan Kewirausahaan Teknologi',
    tingkat: 'Kelas XII',
    jamPerMinggu: 5,
    userId: 'master_guru_default',
  },
];

const SEED_JADWAL: Jadwal[] = [
  {
    id: 'j_001',
    hari: 'Senin',
    jamKe: 'Jam Ke 1-3 (07.00 - 09.15)',
    mapelId: 'm_001',
    namaMapel: 'Informatika Dasar',
    kelas: 'X RPL 1',
    ruang: 'Lab Komputer 1',
    userId: 'master_guru_default',
  },
  {
    id: 'j_002',
    hari: 'Senin',
    jamKe: 'Jam Ke 5-7 (10.00 - 12.15)',
    mapelId: 'm_001',
    namaMapel: 'Informatika Dasar',
    kelas: 'X RPL 2',
    ruang: 'Lab Komputer 2',
    userId: 'master_guru_default',
  },
  {
    id: 'j_003',
    hari: 'Selasa',
    jamKe: 'Jam Ke 1-4 (07.00 - 10.00)',
    mapelId: 'm_002',
    namaMapel: 'Pengembangan Web',
    kelas: 'XI RPL 1',
    ruang: 'Lab Software Eng.',
    userId: 'master_guru_default',
  },
  {
    id: 'j_004',
    hari: 'Rabu',
    jamKe: 'Jam Ke 2-5 (07.45 - 10.45)',
    mapelId: 'm_003',
    namaMapel: 'Basis Data Relasional',
    kelas: 'XI RPL 1',
    ruang: 'Lab Database',
    userId: 'master_guru_default',
  },
  {
    id: 'j_005',
    hari: 'Kamis',
    jamKe: 'Jam Ke 1-3 (07.00 - 09.15)',
    mapelId: 'm_001',
    namaMapel: 'Informatika Dasar',
    kelas: 'X RPL 1',
    ruang: 'Lab Komputer 1',
    userId: 'master_guru_default',
  },
  {
    id: 'j_006',
    hari: 'Jumat',
    jamKe: 'Jam Ke 1-4 (07.00 - 09.45)',
    mapelId: 'm_004',
    namaMapel: 'Proyek Kreatif Digital',
    kelas: 'XII RPL 1',
    ruang: 'Incubator Studio',
    userId: 'master_guru_default',
  },
];

const SEED_NILAI: Nilai[] = [
  {
    id: 'n_001',
    siswaId: 's_001',
    namaSiswa: 'Ahmad Faiz Al-Ghifari',
    kelas: 'X RPL 1',
    mapelId: 'm_001',
    namaMapel: 'Informatika Dasar',
    jenis: 'sumatif',
    sumatifKe: 1,
    materi: 'Sumatif 1: Logika Pemrograman & Flowchart',
    skor: 92,
    semester: 'Ganjil 2026/2027',
    userId: 'master_guru_default',
  },
  {
    id: 'n_001_s2',
    siswaId: 's_001',
    namaSiswa: 'Ahmad Faiz Al-Ghifari',
    kelas: 'X RPL 1',
    mapelId: 'm_001',
    namaMapel: 'Informatika Dasar',
    jenis: 'sumatif',
    sumatifKe: 2,
    materi: 'Sumatif 2: Tipe Data & Variabel',
    skor: 88,
    semester: 'Ganjil 2026/2027',
    userId: 'master_guru_default',
  },
  {
    id: 'n_001_s3',
    siswaId: 's_001',
    namaSiswa: 'Ahmad Faiz Al-Ghifari',
    kelas: 'X RPL 1',
    mapelId: 'm_001',
    namaMapel: 'Informatika Dasar',
    jenis: 'sumatif',
    sumatifKe: 3,
    materi: 'Sumatif 3: Struktur Percabangan (IF-ELSE)',
    skor: 90,
    semester: 'Ganjil 2026/2027',
    userId: 'master_guru_default',
  },
  {
    id: 'n_001_pas',
    siswaId: 's_001',
    namaSiswa: 'Ahmad Faiz Al-Ghifari',
    kelas: 'X RPL 1',
    mapelId: 'm_001',
    namaMapel: 'Informatika Dasar',
    jenis: 'pas',
    materi: 'Sumatif Akhir Semester (SAS)',
    skor: 94,
    semester: 'Ganjil 2026/2027',
    userId: 'master_guru_default',
  },
  {
    id: 'n_002',
    siswaId: 's_002',
    namaSiswa: 'Anindya Putri Maharani',
    kelas: 'X RPL 1',
    mapelId: 'm_001',
    namaMapel: 'Informatika Dasar',
    jenis: 'sumatif',
    sumatifKe: 1,
    materi: 'Sumatif 1: Logika Pemrograman & Flowchart',
    skor: 95,
    semester: 'Ganjil 2026/2027',
    userId: 'master_guru_default',
  },
  {
    id: 'n_002_s2',
    siswaId: 's_002',
    namaSiswa: 'Anindya Putri Maharani',
    kelas: 'X RPL 1',
    mapelId: 'm_001',
    namaMapel: 'Informatika Dasar',
    jenis: 'sumatif',
    sumatifKe: 2,
    materi: 'Sumatif 2: Tipe Data & Variabel',
    skor: 92,
    semester: 'Ganjil 2026/2027',
    userId: 'master_guru_default',
  },
  {
    id: 'n_002_s3',
    siswaId: 's_002',
    namaSiswa: 'Anindya Putri Maharani',
    kelas: 'X RPL 1',
    mapelId: 'm_001',
    namaMapel: 'Informatika Dasar',
    jenis: 'sumatif',
    sumatifKe: 3,
    materi: 'Sumatif 3: Struktur Percabangan (IF-ELSE)',
    skor: 96,
    semester: 'Ganjil 2026/2027',
    userId: 'master_guru_default',
  },
  {
    id: 'n_002_pas',
    siswaId: 's_002',
    namaSiswa: 'Anindya Putri Maharani',
    kelas: 'X RPL 1',
    mapelId: 'm_001',
    namaMapel: 'Informatika Dasar',
    jenis: 'pas',
    materi: 'Sumatif Akhir Semester (SAS)',
    skor: 95,
    semester: 'Ganjil 2026/2027',
    userId: 'master_guru_default',
  },
  {
    id: 'n_003',
    siswaId: 's_003',
    namaSiswa: 'Bima Satria Wicaksana',
    kelas: 'X RPL 1',
    mapelId: 'm_001',
    namaMapel: 'Informatika Dasar',
    jenis: 'sumatif',
    sumatifKe: 1,
    materi: 'Sumatif 1: Logika Pemrograman & Flowchart',
    skor: 85,
    semester: 'Ganjil 2026/2027',
    userId: 'master_guru_default',
  },
  {
    id: 'n_003_s2',
    siswaId: 's_003',
    namaSiswa: 'Bima Satria Wicaksana',
    kelas: 'X RPL 1',
    mapelId: 'm_001',
    namaMapel: 'Informatika Dasar',
    jenis: 'sumatif',
    sumatifKe: 2,
    materi: 'Sumatif 2: Tipe Data & Variabel',
    skor: 88,
    semester: 'Ganjil 2026/2027',
    userId: 'master_guru_default',
  },
  {
    id: 'n_003_pas',
    siswaId: 's_003',
    namaSiswa: 'Bima Satria Wicaksana',
    kelas: 'X RPL 1',
    mapelId: 'm_001',
    namaMapel: 'Informatika Dasar',
    jenis: 'pas',
    materi: 'Sumatif Akhir Semester (SAS)',
    skor: 86,
    semester: 'Ganjil 2026/2027',
    userId: 'master_guru_default',
  },
  {
    id: 'n_004',
    siswaId: 's_004',
    namaSiswa: 'Citra Kirana Dewi',
    kelas: 'X RPL 1',
    mapelId: 'm_001',
    namaMapel: 'Informatika Dasar',
    jenis: 'sumatif',
    sumatifKe: 1,
    materi: 'Sumatif 1: Logika Pemrograman & Flowchart',
    skor: 90,
    semester: 'Ganjil 2026/2027',
    userId: 'master_guru_default',
  },
  {
    id: 'n_004_pas',
    siswaId: 's_004',
    namaSiswa: 'Citra Kirana Dewi',
    kelas: 'X RPL 1',
    mapelId: 'm_001',
    namaMapel: 'Informatika Dasar',
    jenis: 'pas',
    materi: 'Sumatif Akhir Semester (SAS)',
    skor: 90,
    semester: 'Ganjil 2026/2027',
    userId: 'master_guru_default',
  },
];

const SEED_AGENDA: Agenda[] = [
  {
    id: 'ag_001',
    tanggal: new Date().toISOString().split('T')[0],
    jamKe: '1-3',
    kelas: 'X RPL 1',
    mapel: 'Informatika Dasar',
    materi: 'Pengenalan Algoritma Percabangan IF-ELSE',
    kegiatan: 'Apersepsi interaktif studi kasus lampu lalu lintas, demonstrasi coding, praktikum berpasangan.',
    kendala: 'Dua siswa perlu pendampingan tambahan dalam sintaks bahasa pemrograman.',
    refleksi: 'Pembelajaran berjalan kondusif, 90% siswa tuntas mengerjakan tantangan mini-project.',
    userId: 'master_guru_default',
  },
  {
    id: 'ag_002',
    tanggal: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    jamKe: '1-4',
    kelas: 'XI RPL 1',
    mapel: 'Pengembangan Web',
    materi: 'State Management dan React Components',
    kegiatan: 'Diskusi kelompok pembuatan mock up antarmuka dashboard aplikasi sekolah.',
    kendala: 'Koneksi internet lab sempat mengalami fluktuasi selama 10 menit.',
    refleksi: 'Siswa sangat antusias mendesain antarmuka modern dengan Tailwind CSS.',
    userId: 'master_guru_default',
  },
];

const SEED_BIMBINGAN: Bimbingan[] = [
  {
    id: 'b_001',
    tanggal: new Date().toISOString().split('T')[0],
    siswaId: 's_003',
    namaSiswa: 'Bima Satria Wicaksana',
    kelas: 'X RPL 1',
    catatanKasus: 'Sering terlambat masuk jam pelajaran pertama karena kendala transportasi dari rumah.',
    tindakLanjut: 'Konsultasi personal dengan siswa dan konfirmasi ke pihak orang tua wali. Telah disepakati rute perjalanan baru.',
    pihakTerlibat: 'Siswa, Guru Wali Kelas, Orang Tua',
    status: 'Selesai',
    userId: 'master_guru_default',
  },
];

const SEED_LOGS: LogAktivitas[] = [
  {
    id: 'log_001',
    kategori: 'presensi',
    judul: 'Presensi Kamera QR Dilakukan',
    keterangan: 'Ahmad Faiz Al-Ghifari (X RPL 1) terekam HADIR',
    waktu: 'Baru saja',
    timestamp: Date.now() - 2 * 60 * 1000,
  },
  {
    id: 'log_002',
    kategori: 'nilai',
    judul: 'Asesmen Nilai Diinput',
    keterangan: 'Skor 88 tersimpan untuk Informatika Dasar (X RPL 1)',
    waktu: '12 menit lalu',
    timestamp: Date.now() - 12 * 60 * 1000,
  },
  {
    id: 'log_003',
    kategori: 'ai',
    judul: 'Modul AI Dihasilkan',
    keterangan: 'Modul Ajar Deep Learning: Algoritma Pemrograman',
    waktu: '35 menit lalu',
    timestamp: Date.now() - 35 * 60 * 1000,
  },
  {
    id: 'log_004',
    kategori: 'agenda',
    judul: 'Jurnal Mengajar Disimpan',
    keterangan: 'Catatan KBM harian kelas X RPL 1 tersimpan',
    waktu: '1 jam lalu',
    timestamp: Date.now() - 60 * 60 * 1000,
  },
  {
    id: 'log_005',
    kategori: 'siswa',
    judul: 'Kartu Siswa Diaktifkan',
    keterangan: 'Seluruh Kartu Tanda Pelajar digital terverifikasi',
    waktu: '2 jam lalu',
    timestamp: Date.now() - 120 * 60 * 1000,
  },
];

// Event emitter for reactive storage updates
type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error(e);
    }
  });
}

// Storage helpers
export const dbService = {
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  // Initialize seed if empty
  init() {
    const existingPengaturan = localStorage.getItem(STORAGE_KEYS.PENGATURAN);
    if (!existingPengaturan) {
      localStorage.setItem(STORAGE_KEYS.PENGATURAN, JSON.stringify(DEFAULT_PENGATURAN));
    } else {
      try {
        const parsed = JSON.parse(existingPengaturan);
        if (parsed.namaGuru && parsed.namaGuru.includes('Yefri Haryanto')) {
          parsed.namaGuru = 'Yusak Yokoyama, S.Pd., M.Pd.';
          if (parsed.username === 'www.yefriharyanto.id') {
            parsed.username = 'www.yusakyokoyama.id';
          }
          localStorage.setItem(STORAGE_KEYS.PENGATURAN, JSON.stringify(parsed));
        }
      } catch (e) {
        console.error(e);
      }
    }

    const existingAuth = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (existingAuth) {
      try {
        const parsedAuth = JSON.parse(existingAuth);
        if (parsedAuth.nama && parsedAuth.nama.includes('Yefri Haryanto')) {
          parsedAuth.nama = 'Yusak Yokoyama, S.Pd., M.Pd.';
          parsedAuth.username = 'www.yusakyokoyama.id';
          localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(parsedAuth));
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.SISWA)) {
      localStorage.setItem(STORAGE_KEYS.SISWA, JSON.stringify(SEED_SISWA));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MAPEL)) {
      localStorage.setItem(STORAGE_KEYS.MAPEL, JSON.stringify(SEED_MAPEL));
    }
    if (!localStorage.getItem(STORAGE_KEYS.JADWAL)) {
      localStorage.setItem(STORAGE_KEYS.JADWAL, JSON.stringify(SEED_JADWAL));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NILAI)) {
      localStorage.setItem(STORAGE_KEYS.NILAI, JSON.stringify(SEED_NILAI));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AGENDA)) {
      localStorage.setItem(STORAGE_KEYS.AGENDA, JSON.stringify(SEED_AGENDA));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BIMBINGAN)) {
      localStorage.setItem(STORAGE_KEYS.BIMBINGAN, JSON.stringify(SEED_BIMBINGAN));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ABSENSI)) {
      localStorage.setItem(STORAGE_KEYS.ABSENSI, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(SEED_LOGS));
    }
  },

  // Logs Aktivitas System
  getLogs(): LogAktivitas[] {
    this.init();
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    try {
      return raw ? JSON.parse(raw) : SEED_LOGS;
    } catch {
      return SEED_LOGS;
    }
  },

  recordLog(log: Omit<LogAktivitas, 'id' | 'timestamp'>) {
    const list = this.getLogs();
    const newEntry: LogAktivitas = {
      ...log,
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
    };
    const updated = [newEntry, ...list].slice(0, 30);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updated));
    notifyListeners();
  },

  // Auth
  getCurrentUser(): UserSession | null {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setAuthUser(user: UserSession | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
    }
    notifyListeners();
  },

  // Pengaturan
  getPengaturan(): Pengaturan {
    this.init();
    const raw = localStorage.getItem(STORAGE_KEYS.PENGATURAN);
    if (!raw) return DEFAULT_PENGATURAN;
    try {
      return { ...DEFAULT_PENGATURAN, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_PENGATURAN;
    }
  },

  savePengaturan(data: Partial<Pengaturan>) {
    const current = this.getPengaturan();
    const updated = { ...current, ...data };
    localStorage.setItem(STORAGE_KEYS.PENGATURAN, JSON.stringify(updated));
    notifyListeners();
    return updated;
  },

  // Siswa
  getSiswa(): Siswa[] {
    this.init();
    const raw = localStorage.getItem(STORAGE_KEYS.SISWA);
    try {
      const list: Siswa[] = raw ? JSON.parse(raw) : [];
      return list.map((s) => ({
        ...s,
        statusKartu: s.statusKartu || 'Aktif',
      }));
    } catch {
      return [];
    }
  },

  saveSiswa(siswa: Siswa) {
    const list = this.getSiswa();
    const index = list.findIndex((s) => s.id === siswa.id);
    if (index >= 0) {
      list[index] = siswa;
    } else {
      list.unshift(siswa);
    }
    localStorage.setItem(STORAGE_KEYS.SISWA, JSON.stringify(list));
    notifyListeners();
  },

  deleteSiswa(id: string) {
    const list = this.getSiswa().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SISWA, JSON.stringify(list));
    notifyListeners();
  },

  bulkImportSiswa(newList: Siswa[]) {
    const current = this.getSiswa();
    const existingNisns = new Set(current.map((s) => s.nisn));
    const merged = [...current];

    newList.forEach((item) => {
      if (item.nisn && !existingNisns.has(item.nisn)) {
        merged.push(item);
        existingNisns.add(item.nisn);
      }
    });

    localStorage.setItem(STORAGE_KEYS.SISWA, JSON.stringify(merged));
    notifyListeners();
  },

  // Mapel
  getMapel(): Mapel[] {
    this.init();
    const raw = localStorage.getItem(STORAGE_KEYS.MAPEL);
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveMapel(mapel: Mapel) {
    const list = this.getMapel();
    const index = list.findIndex((m) => m.id === mapel.id);
    if (index >= 0) {
      list[index] = mapel;
    } else {
      list.push(mapel);
    }
    localStorage.setItem(STORAGE_KEYS.MAPEL, JSON.stringify(list));
    notifyListeners();
  },

  deleteMapel(id: string) {
    const list = this.getMapel().filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MAPEL, JSON.stringify(list));
    notifyListeners();
  },

  // Jadwal
  getJadwal(): Jadwal[] {
    this.init();
    const raw = localStorage.getItem(STORAGE_KEYS.JADWAL);
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveJadwal(jadwal: Jadwal) {
    const list = this.getJadwal();
    const index = list.findIndex((j) => j.id === jadwal.id);
    if (index >= 0) {
      list[index] = jadwal;
    } else {
      list.push(jadwal);
    }
    localStorage.setItem(STORAGE_KEYS.JADWAL, JSON.stringify(list));
    notifyListeners();
  },

  deleteJadwal(id: string) {
    const list = this.getJadwal().filter((j) => j.id !== id);
    localStorage.setItem(STORAGE_KEYS.JADWAL, JSON.stringify(list));
    notifyListeners();
  },

  // Absensi
  getAbsensi(): Absensi[] {
    this.init();
    const raw = localStorage.getItem(STORAGE_KEYS.ABSENSI);
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  recordAbsensi(item: Absensi) {
    const list = this.getAbsensi();
    // Check if attendance already recorded for this student on same date
    const index = list.findIndex((a) => a.siswaId === item.siswaId && a.tanggal === item.tanggal);
    if (index >= 0) {
      list[index] = item;
    } else {
      list.unshift(item);
    }
    localStorage.setItem(STORAGE_KEYS.ABSENSI, JSON.stringify(list));
    notifyListeners();
  },

  recordBatchAbsensi(items: Absensi[]) {
    const list = this.getAbsensi();
    items.forEach((item) => {
      const index = list.findIndex((a) => a.siswaId === item.siswaId && a.tanggal === item.tanggal);
      if (index >= 0) {
        list[index] = item;
      } else {
        list.unshift(item);
      }
    });
    localStorage.setItem(STORAGE_KEYS.ABSENSI, JSON.stringify(list));
    notifyListeners();
  },

  // Nilai
  getNilai(): Nilai[] {
    this.init();
    const raw = localStorage.getItem(STORAGE_KEYS.NILAI);
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveNilai(nilai: Nilai) {
    const list = this.getNilai();
    const index = list.findIndex((n) => n.id === nilai.id);
    if (index >= 0) {
      list[index] = nilai;
    } else {
      list.unshift(nilai);
    }
    localStorage.setItem(STORAGE_KEYS.NILAI, JSON.stringify(list));
    notifyListeners();
  },

  deleteNilai(id: string) {
    const list = this.getNilai().filter((n) => n.id !== id);
    localStorage.setItem(STORAGE_KEYS.NILAI, JSON.stringify(list));
    notifyListeners();
  },

  // Agenda
  getAgenda(): Agenda[] {
    this.init();
    const raw = localStorage.getItem(STORAGE_KEYS.AGENDA);
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveAgenda(agenda: Agenda) {
    const list = this.getAgenda();
    const index = list.findIndex((a) => a.id === agenda.id);
    if (index >= 0) {
      list[index] = agenda;
    } else {
      list.unshift(agenda);
    }
    localStorage.setItem(STORAGE_KEYS.AGENDA, JSON.stringify(list));
    notifyListeners();
  },

  deleteAgenda(id: string) {
    const list = this.getAgenda().filter((a) => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.AGENDA, JSON.stringify(list));
    notifyListeners();
  },

  // Bimbingan
  getBimbingan(): Bimbingan[] {
    this.init();
    const raw = localStorage.getItem(STORAGE_KEYS.BIMBINGAN);
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveBimbingan(bimbingan: Bimbingan) {
    const list = this.getBimbingan();
    const index = list.findIndex((b) => b.id === bimbingan.id);
    if (index >= 0) {
      list[index] = bimbingan;
    } else {
      list.unshift(bimbingan);
    }
    localStorage.setItem(STORAGE_KEYS.BIMBINGAN, JSON.stringify(list));
    notifyListeners();
  },

  deleteBimbingan(id: string) {
    const list = this.getBimbingan().filter((b) => b.id !== id);
    localStorage.setItem(STORAGE_KEYS.BIMBINGAN, JSON.stringify(list));
    notifyListeners();
  },

  // Backup & Restore
  exportFullDatabase(): string {
    const fullData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      pengaturan: this.getPengaturan(),
      siswa: this.getSiswa(),
      mapel: this.getMapel(),
      jadwal: this.getJadwal(),
      absensi: this.getAbsensi(),
      nilai: this.getNilai(),
      agenda: this.getAgenda(),
      bimbingan: this.getBimbingan(),
    };
    return JSON.stringify(fullData, null, 2);
  },

  importFullDatabase(jsonString: string) {
    try {
      const data = JSON.parse(jsonString);
      if (data.pengaturan) localStorage.setItem(STORAGE_KEYS.PENGATURAN, JSON.stringify(data.pengaturan));
      if (Array.isArray(data.siswa)) localStorage.setItem(STORAGE_KEYS.SISWA, JSON.stringify(data.siswa));
      if (Array.isArray(data.mapel)) localStorage.setItem(STORAGE_KEYS.MAPEL, JSON.stringify(data.mapel));
      if (Array.isArray(data.jadwal)) localStorage.setItem(STORAGE_KEYS.JADWAL, JSON.stringify(data.jadwal));
      if (Array.isArray(data.absensi)) localStorage.setItem(STORAGE_KEYS.ABSENSI, JSON.stringify(data.absensi));
      if (Array.isArray(data.nilai)) localStorage.setItem(STORAGE_KEYS.NILAI, JSON.stringify(data.nilai));
      if (Array.isArray(data.agenda)) localStorage.setItem(STORAGE_KEYS.AGENDA, JSON.stringify(data.agenda));
      if (Array.isArray(data.bimbingan)) localStorage.setItem(STORAGE_KEYS.BIMBINGAN, JSON.stringify(data.bimbingan));
      notifyListeners();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  resetDatabase() {
    localStorage.removeItem(STORAGE_KEYS.SISWA);
    localStorage.removeItem(STORAGE_KEYS.MAPEL);
    localStorage.removeItem(STORAGE_KEYS.JADWAL);
    localStorage.removeItem(STORAGE_KEYS.ABSENSI);
    localStorage.removeItem(STORAGE_KEYS.NILAI);
    localStorage.removeItem(STORAGE_KEYS.AGENDA);
    localStorage.removeItem(STORAGE_KEYS.BIMBINGAN);
    localStorage.removeItem(STORAGE_KEYS.PENGATURAN);
    this.init();
    notifyListeners();
  },
};
