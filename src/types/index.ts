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

export interface VisitorStats {
  totalVisitors: number;
  todayVisitors: number;
  uniqueVisitors: number;
  lastUpdated: string;
  weeklyTrend?: { day: string; count: number }[];
}

export interface KomentarPengunjung {
  id: string;
  nama: string;
  instansi: string;
  role: string;
  komentar: string;
  rating: number; // 1 to 5
  emoji?: string;
  likes: number;
  createdAt: string;
  avatarColor?: string;
  likedByMe?: boolean;
}

export interface PresensiPkl {
  id: string;
  tanggal: string; // YYYY-MM-DD
  siswaId: string;
  nisn: string;
  namaSiswa: string;
  kelas: string;
  namaDudi: string; // Nama Instansi / Perusahaan PKL
  alamatDudi?: string;
  guruPembimbing?: string;

  // Waktu Datang (Wajib saat Check-in pertama)
  waktuDatang: string; // HH:mm:ss
  timestampDatang: number;
  fotoDatang: string; // Base64 image with burned watermark (tanggal + waktu)
  keteranganDatang?: string;
  lokasiDatang?: string;
  latitudeDatang?: number;
  longitudeDatang?: number;
  akurasiDatang?: number;

  // Waktu Pulang (Bisa kosong saat awal kirim)
  waktuPulang?: string; // HH:mm:ss
  timestampPulang?: number;
  fotoPulang?: string; // Base64 image with burned watermark (tanggal + waktu)
  keteranganPulang?: string;
  ringkasanPekerjaan?: string; // Jurnal singkat kegiatan PKL hari ini
  latitudePulang?: number;
  longitudePulang?: number;
  akurasiPulang?: number;

  status: 'masih_pkl' | 'selesai_pulang' | 'izin' | 'sakit';
  verifiedByTeacher?: boolean;
  catatanGuru?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TempatPkl {
  id: string;
  namaDudi: string;
  bidangUsaha: string;
  alamat: string;
  pembimbingDudi: string;
  kontakPembimbing: string;
  guruPembimbing: string;
}

export interface BullyingReport {
  id: string;
  tanggal: string; // YYYY-MM-DD
  waktu: string;   // HH:mm
  pelaporNama?: string;
  pelaporKelas?: string;
  pelaporNisn?: string;
  isAnonymous: boolean;
  jenisBullying: 'Fisik' | 'Verbal' | 'Siber (Cyberbullying)' | 'Sosial / Pengucilan' | 'Intimidasi / Ancaman' | 'Lainnya';
  lokasiKejadian: string;
  deskripsi: string;
  pihakTerlibat?: string;
  buktiFoto?: string;
  status: 'Menunggu Penanganan' | 'Sedang Ditindaklanjuti' | 'Selesai Ditangani';
  catatanGuru?: string;
  createdAt: string;
}

export interface SaranMasukan {
  id: string;
  tanggal: string; // YYYY-MM-DD
  waktu: string;   // HH:mm
  pengirimNama?: string;
  pengirimKelas?: string;
  pengirimNisn?: string;
  isAnonymous: boolean;
  kategori: 'Fasilitas Sekolah' | 'Kurikulum & Pembelajaran' | 'Ekstrakurikuler' | 'Kebersihan & Lingkungan' | 'Kantin & Kantin Kejujuran' | 'Lainnya';
  judul: string;
  pesan: string;
  rating?: number; // 1-5
  status: 'Baru' | 'Dibaca' | 'Diproses' | 'Selesai / Diterapkan';
  catatanGuru?: string;
  createdAt: string;
}


