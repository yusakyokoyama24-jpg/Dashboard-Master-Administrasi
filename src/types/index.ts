export interface Siswa {
  id: string;
  nisn: string;
  nama: string;
  kelas: string;
  jenisKelamin: 'L' | 'P';
  noHpOrtu: string;
  alamat: string;
  foto?: string;
  statusKartu?: 'Aktif' | 'Nonaktif';
  userId: string;
}

export interface Mapel {
  id: string;
  kode: string;
  nama: string;
  tingkat: string;
  jamPerMinggu: number;
  userId: string;
}

export interface Jadwal {
  id: string;
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  jamKe: string;
  mapelId: string;
  namaMapel: string;
  kelas: string;
  ruang?: string;
  userId: string;
}

export interface Absensi {
  id: string;
  tanggal: string; // YYYY-MM-DD
  siswaId: string;
  namaSiswa: string;
  kelas: string;
  status: 'H' | 'S' | 'I' | 'A';
  catatan?: string;
  timestamp: string;
  userId: string;
}

export interface Nilai {
  id: string;
  siswaId: string;
  namaSiswa: string;
  kelas: string;
  mapelId: string;
  namaMapel?: string;
  jenis: 'formatif' | 'sumatif' | 'pas';
  materi: string;
  skor: number;
  semester: string;
  userId: string;
  sumatifKe?: number; // 1 - 10
}

export interface Agenda {
  id: string;
  tanggal: string;
  jamKe: string;
  kelas: string;
  mapel: string;
  materi: string;
  kegiatan: string;
  kendala?: string;
  refleksi?: string;
  userId: string;
}

export interface Bimbingan {
  id: string;
  tanggal: string;
  siswaId: string;
  namaSiswa: string;
  kelas: string;
  catatanKasus: string;
  tindakLanjut: string;
  pihakTerlibat?: string;
  status: 'Proses' | 'Selesai';
  userId: string;
}

export interface Pengaturan {
  namaGuru: string;
  nipGuru: string;
  mapelUtama: string;
  namaSekolah: string;
  dinasPendidikan: string;
  alamatSekolah: string;
  noTelpSekolah: string;
  emailSekolah?: string;
  namaKepsek: string;
  nipKepsek: string;
  kota: string;
  logoDinasUrl: string;
  logoSekolahUrl: string;
  logoKartuUrl?: string;
  fotoProfil?: string;
  username: string;
  password?: string;
  userId: string;
}

export interface UserSession {
  uid: string;
  nama: string;
  nip: string;
  role: string;
  username: string;
  sekolah: string;
  fotoProfil?: string;
}

export interface PptSlide {
  slideNumber: number;
  title: string;
  subtitle?: string;
  bullets: string[];
  keyTakeaway?: string;
  speakerNotes?: string;
}

export interface PptPresentation {
  presentationTitle: string;
  subject?: string;
  slides: PptSlide[];
}

export interface LogAktivitas {
  id: string;
  kategori: 'presensi' | 'nilai' | 'ai' | 'siswa' | 'jadwal' | 'agenda' | 'pengaturan';
  judul: string;
  keterangan?: string;
  waktu: string;
  timestamp: number;
}
