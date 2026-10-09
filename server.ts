import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize Google Gen AI SDK
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || '';
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Retry helper with exponential backoff & model fallbacks
async function generateAiContentWithFallback(prompt: string, systemInstruction?: string): Promise<string> {
  const models = ['gemini-3.8-flash', 'gemini-2.5-pro'];
  const maxRetries = 2;
  const ai = getAiClient();

  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction: systemInstruction || 'Anda adalah Konsultan Ahli Kurikulum Merdeka Pendidikan Nasional Indonesia, Perancang Modul Ajar Deep Learning, dan Pakar Pedagogik Senior.',
            temperature: 0.7,
          },
        });

        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[AI Engine] Attempt ${attempt + 1} with model ${model} failed:`, err?.message || err);
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }
  }

  throw new Error(`Gagal menghasilkan konten AI setelah mencoba beberapa model: ${lastError?.message || 'Unknown error'}`);
}

// Master Teacher Credentials
const DEFAULT_USER = process.env.DEFAULT_TEACHER_USER || 'www.yusakyokoyama.id';
const DEFAULT_PASS = process.env.DEFAULT_TEACHER_PASS || '123456';

// Health / Status endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'Tongguru Aplikasi (EdAdmin Pro)',
    timestamp: new Date().toISOString(),
    aiReady: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Authentication endpoint for Master Teacher
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan Password wajib diisi!' });
  }

  const trimmedUser = username.trim();
  if (
    (trimmedUser === DEFAULT_USER || trimmedUser === 'www.yusakyokoyama.id' || trimmedUser === 'www.yefriharyanto.id') &&
    password === DEFAULT_PASS
  ) {
    return res.json({
      success: true,
      user: {
        uid: 'master_guru_default',
        nama: 'Yusak Yokoyama, S.Pd., M.Pd.',
        nip: '19850712 201001 1 018',
        role: 'Master Administrator Guru',
        username: trimmedUser,
        sekolah: 'SMK Negeri 1 Indonesia Merdeka',
      },
      token: 'session_master_' + Date.now(),
    });
  }

  // Also support custom user credentials passed from client if saved locally
  return res.status(401).json({ error: 'Kredensial tidak valid! Silakan periksa kembali username dan password Anda.' });
});

// ==========================================
// VISITOR COUNTER & COMMENT DATA STORAGE
// ==========================================
const DATA_DIR = path.resolve(process.cwd(), 'data');
const GUESTBOOK_FILE = path.join(DATA_DIR, 'guestbook_stats.json');

interface VisitorData {
  totalVisitors: number;
  todayVisitors: number;
  uniqueVisitors: number;
  lastDate: string;
  weeklyTrend: { day: string; count: number }[];
}

interface CommentData {
  id: string;
  nama: string;
  instansi: string;
  role: string;
  komentar: string;
  rating: number;
  emoji?: string;
  likes: number;
  createdAt: string;
  avatarColor?: string;
}

interface GuestbookStorage {
  visitors: VisitorData;
  comments: CommentData[];
}

const DEFAULT_GUESTBOOK: GuestbookStorage = {
  visitors: {
    totalVisitors: 1548,
    todayVisitors: 164,
    uniqueVisitors: 992,
    lastDate: new Date().toISOString().split('T')[0],
    weeklyTrend: [
      { day: 'Sen', count: 210 },
      { day: 'Sel', count: 245 },
      { day: 'Rab', count: 280 },
      { day: 'Kam', count: 195 },
      { day: 'Jum', count: 230 },
      { day: 'Sab', count: 224 },
      { day: 'Min', count: 164 },
    ],
  },
  comments: [
    {
      id: 'c_001',
      nama: 'Dra. Hj. Sri Endang Wahyuni, M.Pd.',
      instansi: 'Dinas Pendidikan & Pengawas SMK',
      role: 'Pengawas Sekolah',
      komentar: 'Aplikasi dashboard administrasi Tongguru Yusak Yokoyama ini sangat luar biasa dan visioner! Struktur Rencana Pembelajaran Mendalam (RPM) sesuai SK Kepala BSKAP No. 046/H/KR/2025 tersaji dengan sangat komprehensif, mulai dari apersepsi bermakna, diferensiasi konten/proses, hingga rubrik asesmen autentik. Sangat membantu supervisi guru binaan.',
      rating: 5,
      emoji: '🌟',
      likes: 38,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      avatarColor: 'from-emerald-500 to-teal-700',
    },
    {
      id: 'c_002',
      nama: 'Budi Santoso, S.Kom., Gr.',
      instansi: 'SMK Negeri 2 Surabaya',
      role: 'Guru Kejuruan RPL & Informatika',
      komentar: 'Fitur Presensi Siswa Kamera QR terintegrasi langsung dengan Leger Rapor dan rekapitulasi bulanan otomatis. Terlebih generator LKPD dan media pembelajaran interaktifnya sangat memangkas beban administratif guru. Sangat menginspirasi!',
      rating: 5,
      emoji: '🔥',
      likes: 29,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      avatarColor: 'from-blue-600 to-indigo-800',
    },
    {
      id: 'c_003',
      nama: 'Nurul Hidayati, S.Pd.',
      instansi: 'SMA Negeri 1 Semarang',
      role: 'Wali Kelas & Guru Mapel',
      komentar: 'Tampilan antarmuka sangat rapi dengan menu warna blok tajam (Biru, Hijau, Orange, Kuning) yang memudahkan navigasi. Cetak kartu siswa dengan barcode dan catatan jurnal agenda harian sangat praktis digunakan.',
      rating: 5,
      emoji: '❤️',
      likes: 22,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      avatarColor: 'from-purple-600 to-pink-700',
    },
    {
      id: 'c_004',
      nama: 'Drs. H. Mulyadi, M.M.',
      instansi: 'SMK Swasta Teladan Mandiri',
      role: 'Kepala Sekolah',
      komentar: 'Inovasi tata kelola administrasi guru yang sangat membanggakan dari Pak Yusak Yokoyama. Kami rekomendasikan untuk diimplementasikan oleh seluruh dewan guru.',
      rating: 5,
      emoji: '👏',
      likes: 17,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      avatarColor: 'from-amber-500 to-orange-700',
    },
  ],
};

function readGuestbookData(): GuestbookStorage {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(GUESTBOOK_FILE)) {
      fs.writeFileSync(GUESTBOOK_FILE, JSON.stringify(DEFAULT_GUESTBOOK, null, 2), 'utf-8');
      return DEFAULT_GUESTBOOK;
    }
    const raw = fs.readFileSync(GUESTBOOK_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      visitors: { ...DEFAULT_GUESTBOOK.visitors, ...(parsed.visitors || {}) },
      comments: Array.isArray(parsed.comments) ? parsed.comments : DEFAULT_GUESTBOOK.comments,
    };
  } catch (err) {
    console.error('[Guestbook] Error reading guestbook file, using in-memory defaults:', err);
    return DEFAULT_GUESTBOOK;
  }
}

function writeGuestbookData(data: GuestbookStorage): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(GUESTBOOK_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Guestbook] Error writing to guestbook file:', err);
  }
}

// 1. GET Visitor Stats
app.get('/api/visitors/stats', (_req: Request, res: Response) => {
  const data = readGuestbookData();
  const currentDate = new Date().toISOString().split('T')[0];

  // Auto-rollover if day changed
  if (data.visitors.lastDate !== currentDate) {
    data.visitors.todayVisitors = Math.floor(Math.random() * 20) + 15;
    data.visitors.lastDate = currentDate;
    writeGuestbookData(data);
  }

  res.json({
    totalVisitors: data.visitors.totalVisitors,
    todayVisitors: data.visitors.todayVisitors,
    uniqueVisitors: data.visitors.uniqueVisitors,
    lastUpdated: new Date().toISOString(),
    weeklyTrend: data.visitors.weeklyTrend,
  });
});

// 2. POST Record Visit
app.post('/api/visitors/record', (req: Request, res: Response) => {
  const { isNewSession } = req.body || {};
  const data = readGuestbookData();
  const currentDate = new Date().toISOString().split('T')[0];

  if (data.visitors.lastDate !== currentDate) {
    data.visitors.todayVisitors = 1;
    data.visitors.lastDate = currentDate;
  } else {
    data.visitors.todayVisitors += 1;
  }

  data.visitors.totalVisitors += 1;

  if (isNewSession) {
    data.visitors.uniqueVisitors += 1;
  }

  writeGuestbookData(data);

  res.json({
    success: true,
    totalVisitors: data.visitors.totalVisitors,
    todayVisitors: data.visitors.todayVisitors,
    uniqueVisitors: data.visitors.uniqueVisitors,
    lastUpdated: new Date().toISOString(),
  });
});

// 3. GET Comments List
app.get('/api/comments', (_req: Request, res: Response) => {
  const data = readGuestbookData();
  res.json(data.comments);
});

// 4. POST Add Comment
app.post('/api/comments', (req: Request, res: Response) => {
  const { nama, instansi, role, komentar, rating, emoji } = req.body || {};

  if (!nama || !komentar) {
    return res.status(400).json({ error: 'Nama dan komentar wajib diisi!' });
  }

  const data = readGuestbookData();

  const colors = [
    'from-blue-600 to-indigo-800',
    'from-emerald-500 to-teal-700',
    'from-purple-600 to-pink-700',
    'from-amber-500 to-orange-700',
    'from-rose-500 to-red-700',
    'from-cyan-500 to-blue-700',
  ];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const newComment: CommentData = {
    id: 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    nama: String(nama).trim(),
    instansi: String(instansi || 'Satuan Pendidikan').trim(),
    role: String(role || 'Guru').trim(),
    komentar: String(komentar).trim(),
    rating: Number(rating) >= 1 && Number(rating) <= 5 ? Number(rating) : 5,
    emoji: emoji || '✨',
    likes: 1,
    createdAt: new Date().toISOString(),
    avatarColor: randomColor,
  };

  data.comments.unshift(newComment);
  writeGuestbookData(data);

  res.status(201).json({
    success: true,
    comment: newComment,
  });
});

// 5. POST Like Comment
app.post('/api/comments/:id/like', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = readGuestbookData();

  const comment = data.comments.find((c) => c.id === id);
  if (!comment) {
    return res.status(404).json({ error: 'Komentar tidak ditemukan' });
  }

  comment.likes += 1;
  writeGuestbookData(data);

  res.json({
    success: true,
    likes: comment.likes,
  });
});

// 6. DELETE Comment
app.delete('/api/comments/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = readGuestbookData();

  const index = data.comments.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Komentar tidak ditemukan' });
  }

  data.comments.splice(index, 1);
  writeGuestbookData(data);

  res.json({ success: true, message: 'Komentar berhasil dihapus' });
});

// ==========================================
// 7. PKL (PRAKTIK KERJA LAPANGAN) MONITORING & PRESENSI API
// ==========================================
const PKL_DATA_FILE = path.join(process.cwd(), 'data', 'pkl_data.json');

interface PresensiPklItem {
  id: string;
  tanggal: string;
  siswaId: string;
  nisn: string;
  namaSiswa: string;
  kelas: string;
  namaDudi: string;
  alamatDudi?: string;
  guruPembimbing?: string;
  waktuDatang: string;
  timestampDatang: number;
  fotoDatang: string;
  keteranganDatang?: string;
  lokasiDatang?: string;
  waktuPulang?: string;
  timestampPulang?: number;
  fotoPulang?: string;
  keteranganPulang?: string;
  ringkasanPekerjaan?: string;
  status: 'masih_pkl' | 'selesai_pulang' | 'izin' | 'sakit';
  verifiedByTeacher?: boolean;
  catatanGuru?: string;
  createdAt: string;
  updatedAt: string;
}

interface TempatPklItem {
  id: string;
  namaDudi: string;
  bidangUsaha: string;
  alamat: string;
  pembimbingDudi: string;
  kontakPembimbing: string;
  guruPembimbing: string;
}

interface PklStorage {
  places: TempatPklItem[];
  attendances: PresensiPklItem[];
}

const DEFAULT_PKL_DATA: PklStorage = {
  places: [
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
  ],
  attendances: [
    {
      id: 'pkl_att_001',
      tanggal: new Date().toISOString().split('T')[0],
      siswaId: 's_001',
      nisn: '0078129341',
      namaSiswa: 'Ahmad Faiz Al-Ghifari',
      kelas: 'XI RPL 1',
      namaDudi: 'PT Astra Digital Inovasi',
      alamatDudi: 'Gedung Astra Tower Lt. 12, Jakarta Pusat',
      guruPembimbing: 'Yusak Yokoyama, S.Pd., M.Pd.',
      waktuDatang: '07:28:15',
      timestampDatang: Date.now() - 3600000 * 5,
      fotoDatang: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
      keteranganDatang: 'Tiba tepat waktu di lobby kantor bersama tim IT development.',
      lokasiDatang: 'Lobby Utama Astra Tower',
      waktuPulang: undefined,
      timestampPulang: undefined,
      fotoPulang: undefined,
      keteranganPulang: undefined,
      ringkasanPekerjaan: 'Mengikuti standup meeting pagi dan mulai slicing modul frontend.',
      status: 'masih_pkl',
      verifiedByTeacher: true,
      catatanGuru: 'Bagus, teruskan kedisiplinannya Faiz!',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'pkl_att_002',
      tanggal: new Date().toISOString().split('T')[0],
      siswaId: 's_002',
      nisn: '0078129342',
      namaSiswa: 'Anindya Putri Maharani',
      kelas: 'XI RPL 1',
      namaDudi: 'PT Telekomunikasi Selular (Telkomsel)',
      alamatDudi: 'Telkomsel Smart Office Lt. 8, Jakarta Selatan',
      guruPembimbing: 'Yusak Yokoyama, S.Pd., M.Pd.',
      waktuDatang: '07:18:40',
      timestampDatang: Date.now() - 3600000 * 6,
      fotoDatang: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
      keteranganDatang: 'Sudah berseragam rapi dan tapping ID Card Telkomsel.',
      lokasiDatang: 'Ruang NOC Lt. 8',
      waktuPulang: undefined,
      timestampPulang: undefined,
      fotoPulang: undefined,
      ringkasanPekerjaan: 'Observasi monitoring trafik server jaringan fiber optic.',
      status: 'masih_pkl',
      verifiedByTeacher: true,
      catatanGuru: 'Catat log gangguan dengan teliti ya Anindya.',
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
    {
      id: 'pkl_att_003',
      tanggal: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      siswaId: 's_001',
      nisn: '0078129341',
      namaSiswa: 'Ahmad Faiz Al-Ghifari',
      kelas: 'XI RPL 1',
      namaDudi: 'PT Astra Digital Inovasi',
      alamatDudi: 'Gedung Astra Tower Lt. 12, Jakarta Pusat',
      guruPembimbing: 'Yusak Yokoyama, S.Pd., M.Pd.',
      waktuDatang: '07:22:10',
      timestampDatang: Date.now() - 86400000 - 3600000 * 9,
      fotoDatang: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
      keteranganDatang: 'Datang pagi hari sebelum jam operasional kantor.',
      lokasiDatang: 'Ruang IT Dev Squad',
      waktuPulang: '16:35:20',
      timestampPulang: Date.now() - 86400000,
      fotoPulang: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      keteranganPulang: 'Pekerjaan merapikan dokumentasi API telah selesai dan di-commit ke Git.',
      ringkasanPekerjaan: 'Menyelesaikan testing komponen form dan membuat user guide singkat.',
      status: 'selesai_pulang',
      verifiedByTeacher: true,
      catatanGuru: 'Mantap, rekap waktu kerja 9 jam 13 menit tercatat lengkap.',
      createdAt: new Date(Date.now() - 86400000 - 3600000 * 9).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
};

function readPklData(): PklStorage {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(PKL_DATA_FILE)) {
      const content = fs.readFileSync(PKL_DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.attendances)) {
        return parsed;
      }
    }
    fs.writeFileSync(PKL_DATA_FILE, JSON.stringify(DEFAULT_PKL_DATA, null, 2), 'utf-8');
    return DEFAULT_PKL_DATA;
  } catch (err) {
    console.warn('Gagal membaca pkl_data.json, memakai default:', err);
    return DEFAULT_PKL_DATA;
  }
}

function writePklData(data: PklStorage): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PKL_DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Gagal menulis pkl_data.json:', err);
    return false;
  }
}

// GET all PKL Presensi records
app.get('/api/pkl/presensi', (req: Request, res: Response) => {
  const data = readPklData();
  const { tanggal, siswaId, status } = req.query;

  let results = [...data.attendances];

  if (tanggal && typeof tanggal === 'string') {
    results = results.filter((item) => item.tanggal === tanggal);
  }
  if (siswaId && typeof siswaId === 'string') {
    results = results.filter((item) => item.siswaId === siswaId || item.nisn === siswaId);
  }
  if (status && typeof status === 'string') {
    results = results.filter((item) => item.status === status);
  }

  // Sort latest first
  results.sort((a, b) => b.timestampDatang - a.timestampDatang);

  res.json(results);
});

// POST PKL Presensi (Check-in or Check-out or direct full entry)
app.post('/api/pkl/presensi', (req: Request, res: Response) => {
  const data = readPklData();
  const body = req.body || {};

  const todayStr = new Date().toISOString().split('T')[0];
  const targetDate = body.tanggal || todayStr;

  // Check if an existing attendance for this student exists today
  const existingIndex = data.attendances.findIndex(
    (item) =>
      item.tanggal === targetDate &&
      ((body.siswaId && item.siswaId === body.siswaId) ||
        (body.nisn && item.nisn === body.nisn) ||
        (body.namaSiswa && item.namaSiswa.toLowerCase() === body.namaSiswa.toLowerCase()))
  );

  // If this is a Check-Out action on an existing entry
  if (body.action === 'checkout' && existingIndex !== -1) {
    const existing = data.attendances[existingIndex];
    existing.waktuPulang = body.waktuPulang || new Date().toLocaleTimeString('id-ID', { hour12: false });
    existing.timestampPulang = body.timestampPulang || Date.now();
    existing.fotoPulang = body.fotoPulang || existing.fotoPulang;
    existing.keteranganPulang = body.keteranganPulang || existing.keteranganPulang || '';
    existing.ringkasanPekerjaan = body.ringkasanPekerjaan || existing.ringkasanPekerjaan || '';
    existing.status = 'selesai_pulang';
    existing.updatedAt = new Date().toISOString();

    writePklData(data);
    return res.json({
      success: true,
      message: 'Presensi waktu pulang PKL berhasil disimpan!',
      record: existing,
    });
  }

  // If an existing entry already has Check-In and we are supplying Check-Out info
  if (existingIndex !== -1 && body.fotoPulang && !body.isNewForced) {
    const existing = data.attendances[existingIndex];
    existing.waktuPulang = body.waktuPulang || new Date().toLocaleTimeString('id-ID', { hour12: false });
    existing.timestampPulang = body.timestampPulang || Date.now();
    existing.fotoPulang = body.fotoPulang;
    if (body.keteranganPulang) existing.keteranganPulang = body.keteranganPulang;
    if (body.ringkasanPekerjaan) existing.ringkasanPekerjaan = body.ringkasanPekerjaan;
    existing.status = 'selesai_pulang';
    existing.updatedAt = new Date().toISOString();

    writePklData(data);
    return res.json({
      success: true,
      message: 'Presensi pulang berhasil diperbarui!',
      record: existing,
    });
  }

  // Create New Presensi Item (Check-In or Full)
  const now = new Date();
  const timeNowStr = now.toLocaleTimeString('id-ID', { hour12: false });

  const newItem: PresensiPklItem = {
    id: body.id || `pkl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tanggal: targetDate,
    siswaId: body.siswaId || `s_${Date.now()}`,
    nisn: body.nisn || '-',
    namaSiswa: body.namaSiswa || 'Siswa PKL',
    kelas: body.kelas || 'XI RPL',
    namaDudi: body.namaDudi || 'Instansi / Perusahaan DUDI',
    alamatDudi: body.alamatDudi || '',
    guruPembimbing: body.guruPembimbing || 'Yusak Yokoyama, S.Pd., M.Pd.',
    waktuDatang: body.waktuDatang || timeNowStr,
    timestampDatang: body.timestampDatang || Date.now(),
    fotoDatang: body.fotoDatang || '',
    keteranganDatang: body.keteranganDatang || '',
    lokasiDatang: body.lokasiDatang || 'Lokasi Tempat PKL',
    // Check-out fields CAN BE EMPTY / UNDEFINED!
    waktuPulang: body.waktuPulang || undefined,
    timestampPulang: body.timestampPulang || (body.fotoPulang ? Date.now() : undefined),
    fotoPulang: body.fotoPulang || undefined,
    keteranganPulang: body.keteranganPulang || undefined,
    ringkasanPekerjaan: body.ringkasanPekerjaan || '',
    status: body.fotoPulang ? 'selesai_pulang' : (body.status || 'masih_pkl'),
    verifiedByTeacher: body.verifiedByTeacher ?? false,
    catatanGuru: body.catatanGuru || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.attendances.unshift(newItem);
  writePklData(data);

  res.status(201).json({
    success: true,
    message: newItem.waktuPulang
      ? 'Presensi lengkap datang & pulang berhasil dikirim!'
      : 'Presensi waktu datang berhasil dikirim! Anda dapat mengisi waktu pulang nanti saat selesai jam kerja.',
    record: newItem,
  });
});

// PUT /api/pkl/presensi/:id (Update check-out, teacher verification, or notes)
app.put('/api/pkl/presensi/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = readPklData();

  const index = data.attendances.findIndex((item) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Data presensi PKL tidak ditemukan' });
  }

  const current = data.attendances[index];
  const body = req.body || {};

  data.attendances[index] = {
    ...current,
    ...body,
    updatedAt: new Date().toISOString(),
  };

  writePklData(data);
  res.json({ success: true, message: 'Presensi PKL berhasil diperbarui', record: data.attendances[index] });
});

// DELETE /api/pkl/presensi/:id
app.delete('/api/pkl/presensi/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const data = readPklData();

  const index = data.attendances.findIndex((item) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Data presensi PKL tidak ditemukan' });
  }

  data.attendances.splice(index, 1);
  writePklData(data);
  res.json({ success: true, message: 'Data presensi PKL berhasil dihapus' });
});

// GET & POST /api/pkl/places
app.get('/api/pkl/places', (_req: Request, res: Response) => {
  const data = readPklData();
  res.json(data.places || []);
});

app.post('/api/pkl/places', (req: Request, res: Response) => {
  const data = readPklData();
  const body = req.body || {};

  if (!body.namaDudi) {
    return res.status(400).json({ error: 'Nama instansi / DUDI wajib diisi' });
  }

  const newPlace: TempatPklItem = {
    id: body.id || `dudi_${Date.now()}`,
    namaDudi: body.namaDudi,
    bidangUsaha: body.bidangUsaha || 'Industri & Teknologi',
    alamat: body.alamat || '',
    pembimbingDudi: body.pembimbingDudi || '-',
    kontakPembimbing: body.kontakPembimbing || '-',
    guruPembimbing: body.guruPembimbing || 'Yusak Yokoyama, S.Pd., M.Pd.',
  };

  data.places.push(newPlace);
  writePklData(data);
  res.status(201).json({ success: true, place: newPlace });
});

// ==========================================
// 8. PENGADUAN BULLYING (PERUNDUNGAN) API
// ==========================================
const BULLYING_DATA_FILE = path.join(process.cwd(), 'data', 'bullying_data.json');

interface BullyingItem {
  id: string;
  tanggal: string;
  waktu: string;
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

const DEFAULT_BULLYING_DATA: BullyingItem[] = [
  {
    id: 'bully_001',
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '10:15',
    isAnonymous: true,
    pelaporNama: 'Anonim (Dirahasiakan)',
    pelaporKelas: '-',
    pelaporNisn: '-',
    jenisBullying: 'Verbal',
    lokasiKejadian: 'Kantin Sekolah',
    deskripsi: 'Diejek dan dipanggil dengan nama orang tua di depan teman-teman lain saat jam istirahat.',
    pihakTerlibat: 'Siswa kelas X (dirahasiakan)',
    status: 'Menunggu Penanganan',
    createdAt: new Date().toISOString(),
  },
];

function readBullyingData(): BullyingItem[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(BULLYING_DATA_FILE)) {
      const content = fs.readFileSync(BULLYING_DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    fs.writeFileSync(BULLYING_DATA_FILE, JSON.stringify(DEFAULT_BULLYING_DATA, null, 2), 'utf-8');
    return DEFAULT_BULLYING_DATA;
  } catch (err) {
    console.warn('Gagal membaca bullying_data.json, memakai default:', err);
    return DEFAULT_BULLYING_DATA;
  }
}

function writeBullyingData(data: BullyingItem[]): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(BULLYING_DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Gagal menulis bullying_data.json:', err);
    return false;
  }
}

// GET /api/bullying
app.get('/api/bullying', (_req: Request, res: Response) => {
  const reports = readBullyingData();
  reports.sort((a, b) => new Date(b.createdAt || b.tanggal).getTime() - new Date(a.createdAt || a.tanggal).getTime());
  res.json(reports);
});

// POST /api/bullying
app.post('/api/bullying', (req: Request, res: Response) => {
  const body = req.body || {};
  if (!body.deskripsi || !body.lokasiKejadian) {
    return res.status(400).json({ error: 'Lokasi kejadian dan deskripsi pengaduan wajib diisi!' });
  }

  const reports = readBullyingData();
  const now = new Date();
  const tanggal = body.tanggal || now.toISOString().split('T')[0];
  const waktu = body.waktu || now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });

  const newReport: BullyingItem = {
    id: body.id || `bully_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tanggal,
    waktu,
    isAnonymous: Boolean(body.isAnonymous),
    pelaporNama: body.isAnonymous ? 'Anonim (Dirahasiakan)' : (body.pelaporNama || 'Anonim'),
    pelaporKelas: body.isAnonymous ? '-' : (body.pelaporKelas || '-'),
    pelaporNisn: body.isAnonymous ? '-' : (body.pelaporNisn || '-'),
    jenisBullying: body.jenisBullying || 'Verbal',
    lokasiKejadian: body.lokasiKejadian.trim(),
    deskripsi: body.deskripsi.trim(),
    pihakTerlibat: body.pihakTerlibat || '',
    buktiFoto: body.buktiFoto || undefined,
    status: (body.status as any) || 'Menunggu Penanganan',
    catatanGuru: body.catatanGuru || '',
    createdAt: body.createdAt || now.toISOString(),
  };

  reports.unshift(newReport);
  writeBullyingData(reports);
  res.status(201).json({ success: true, record: newReport, message: 'Laporan pengaduan berhasil tersimpan di sistem' });
});

// PUT /api/bullying/:id
app.put('/api/bullying/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body || {};
  const reports = readBullyingData();

  const index = reports.findIndex((r) => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Laporan pengaduan tidak ditemukan' });
  }

  reports[index] = {
    ...reports[index],
    ...updates,
    id,
  };

  writeBullyingData(reports);
  res.json({ success: true, record: reports[index], message: 'Status laporan berhasil diperbarui' });
});

// DELETE /api/bullying/:id
app.delete('/api/bullying/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const reports = readBullyingData();

  const index = reports.findIndex((r) => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Laporan pengaduan tidak ditemukan' });
  }

  reports.splice(index, 1);
  writeBullyingData(reports);
  res.json({ success: true, message: 'Laporan pengaduan berhasil dihapus' });
});

// ==========================================
// 9. KOTAK SARAN & MASUKAN SISWA API
// ==========================================
const SARAN_DATA_FILE = path.join(process.cwd(), 'data', 'saran_data.json');

interface SaranItem {
  id: string;
  tanggal: string;
  waktu: string;
  pengirimNama?: string;
  pengirimKelas?: string;
  pengirimNisn?: string;
  isAnonymous: boolean;
  kategori: string;
  judul: string;
  pesan: string;
  rating?: number;
  status: 'Baru' | 'Dibaca' | 'Diproses' | 'Selesai / Diterapkan';
  catatanGuru?: string;
  createdAt: string;
}

function readSaranData(): SaranItem[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(SARAN_DATA_FILE)) {
      const content = fs.readFileSync(SARAN_DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    return [];
  } catch (err) {
    console.warn('Gagal membaca saran_data.json:', err);
    return [];
  }
}

function writeSaranData(data: SaranItem[]): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SARAN_DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Gagal menulis saran_data.json:', err);
    return false;
  }
}

// GET /api/saran
app.get('/api/saran', (_req: Request, res: Response) => {
  const list = readSaranData();
  list.sort((a, b) => new Date(b.createdAt || b.tanggal).getTime() - new Date(a.createdAt || a.tanggal).getTime());
  res.json(list);
});

// POST /api/saran
app.post('/api/saran', (req: Request, res: Response) => {
  const body = req.body || {};
  if (!body.pesan || !body.judul) {
    return res.status(400).json({ error: 'Judul dan pesan saran wajib diisi!' });
  }

  const list = readSaranData();
  const now = new Date();
  const newSaran: SaranItem = {
    id: body.id || `saran_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    tanggal: body.tanggal || now.toISOString().split('T')[0],
    waktu: body.waktu || now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
    pengirimNama: body.pengirimNama || '',
    pengirimKelas: body.pengirimKelas || '',
    pengirimNisn: body.pengirimNisn || '',
    isAnonymous: Boolean(body.isAnonymous),
    kategori: body.kategori || 'Fasilitas Sekolah',
    judul: body.judul.trim(),
    pesan: body.pesan.trim(),
    rating: Number(body.rating) || 5,
    status: body.status || 'Baru',
    catatanGuru: body.catatanGuru || '',
    createdAt: body.createdAt || now.toISOString(),
  };

  list.unshift(newSaran);
  writeSaranData(list);
  res.status(201).json({ success: true, record: newSaran });
});

// PUT /api/saran/:id
app.put('/api/saran/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body || {};
  const list = readSaranData();

  const index = list.findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Data saran tidak ditemukan' });
  }

  list[index] = { ...list[index], ...updates, id };
  writeSaranData(list);
  res.json({ success: true, record: list[index] });
});

// DELETE /api/saran/:id
app.delete('/api/saran/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const list = readSaranData();

  const index = list.findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Data saran tidak ditemukan' });
  }

  list.splice(index, 1);
  writeSaranData(list);
  res.json({ success: true, message: 'Data saran berhasil dihapus' });
});

// Clean HTML response helper
function cleanHtmlOutput(raw: string): string {
  let cleaned = raw.trim();
  // Remove markdown code fences if wrapped in ```html ... ```
  if (cleaned.startsWith('```html')) {
    cleaned = cleaned.replace(/^```html\s*/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/i, '');
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/\s*```$/i, '');
  }
  return cleaned.trim();
}

// ==========================================
// AI SUITE ENDPOINTS
// ==========================================

// 1. Modul Ajar AI (Deep Learning Framework Kurikulum Merdeka - SMA Fase E & Fase F)
app.post('/api/ai/generate-modul', async (req: Request, res: Response) => {
  try {
    const {
      namaSekolah = 'SMA Negeri 1 Surabaya',
      namaGuru = 'Yusak Yokoyama, S.Pd., M.Pd.',
      nipGuru = '19850712 201001 1 018',
      namaKepsek = 'Drs. H. Ahmad Marzuki, M.Pd.',
      nipKepsek = '19700101 199503 1 002',
      jenjang = 'SMA',
      fase = 'Fase E (Kelas X)',
      kelas = 'Kelas X',
      semester = 'Semester Ganjil',
      mataPelajaran = 'Informatika',
      capaianPembelajaran = '',
      tujuanPembelajaran = '',
      materiPokok = '',
      topik = '',
      alokasiWaktu = '2 Pertemuan (masing-masing 2 × 45 menit)',
      praktikPedagogisP1 = 'Problem Based Learning (PBL)',
      praktikPedagogisP2 = 'Project Based Learning (PjBL)',
      dimensiProfilLulusan = 'Penalaran Kritis, Kolaborasi, Kreativitas',
      profilLulusan = '',
      kotaTanggal = 'Surabaya, 15 Juli 2026',
    } = req.body;

    const topikFinal = materiPokok || topik || 'Algoritma Pemrograman & Logika Komputasi';
    const profilFinal = dimensiProfilLulusan || profilLulusan || 'Penalaran Kritis, Kolaborasi, Kreativitas';

    const prompt = `
[ROLE & PERSONA]
Anda adalah Konsultan Kurikulum Nasional dan Ahli Perancangan Pembelajaran Mendalam (Deep Learning Framework) Kurikulum Merdeka terakreditasi berdasarkan regulasi terbaru Salinan Keputusan Kepala BSKAP Kemendikdasmen No. 046/H/KR/2025 tentang Capaian Pembelajaran, dengan keahlian khusus pada jenjang SMA (Sekolah Menengah Atas) Fase E (Kelas X - Fondasi & Eksplorasi) dan Fase F (Kelas XI & XII - Pendalaman & Peminatan).

Anda memiliki keahlian dalam:
1. Merumuskan alur berpikir tingkat tinggi (Higher Order Thinking Skills / HOTS: C4-Menganalisis, C5-Mengevaluasi, C6-Mengkreasi) yang sesuai dengan tahap perkembangan kognitif remaja usia 15-18 tahun.
2. Mengintegrasikan Penguatan Literasi Teks Multimodal/Saintifik dan Numerasi Analisis Data Statistik Kontekstual secara nyata di setiap tahap kegiatan.
3. Memanfaatkan teknologi Papan Interaktif Digital (Interactive Flat Panel / Smartboard) untuk kolaborasi layar sentuh, manipulasi visual, dan kanvas diskusi kelompok di kelas.
4. Merancang diferensiasi pembelajaran (konten, proses, dan produk) berbasis kesiapan belajar (readiness) dan minat murid SMA.

--------------------------------------------------------------------------------
[PARAMETER VARIABEL MASUKAN GURU - SMA FASE E / FASE F]
1.  Nama Satuan Pendidikan : ${namaSekolah}
2.  Nama Guru Pengampu     : ${namaGuru}
3.  NIP Guru               : ${nipGuru}
4.  Nama Kepala Sekolah    : ${namaKepsek}
5.  NIP Kepala Sekolah     : ${nipKepsek}
6.  Jenjang Pendidikan     : ${jenjang}
7.  Fase & Kelas           : ${fase} (${kelas})
8.  Semester               : ${semester}
9.  Mata Pelajaran         : ${mataPelajaran}
10. Capaian Pembelajaran   : ${capaianPembelajaran || 'Peserta didik mampu memahami dan menerapkan alur penalaran analitis, dekomposisi masalah, serta representasi data terstruktur dalam pemecahan persoalan kontekstual sehari-hari.'}
11. Tujuan Pembelajaran    : ${tujuanPembelajaran || 'Melalui model pembelajaran kolaboratif, peserta didik mampu menganalisis wacana kasus berbasis data, mengevaluasi efisiensi algoritma/solusi, dan mengkreasi artefak solusi digital/konseptual secara kritis dan mandiri.'}
12. Materi Pokok           : ${topikFinal}
13. Alokasi Waktu          : ${alokasiWaktu}
14. Praktik Pedagogis      :
    - Pertemuan 1          : ${praktikPedagogisP1}
    - Pertemuan 2          : ${praktikPedagogisP2}
15. Dimensi Profil Lulusan : ${profilFinal}
16. Kota & Tanggal         : ${kotaTanggal}

--------------------------------------------------------------------------------
[PETUNJUK SPESIFIKASI SMA FASE E VS FASE F]
- JIKA FASE E (Kelas X):
  Fokuskan pada transisi kemandirian belajar dari SMP ke SMA, pemahaman konsep fundamental, eksplorasi minat karir, kemampuan menganalisis wacana populer-ilmiah, membaca grafik data dasar (persentase, perbandingan data), serta kerja tim kolaboratif.
- JIKA FASE F (Kelas XI & XII):
  Fokuskan pada pendalaman materi akademik lanjutan, investigasi empiris, kritik metodologi, analisis statistik data inferensial/tren, sintesis multi-sumber wacana ilmiah, penalaran abstrak-korelasional, serta kesiapan akademik menuju perguruan tinggi atau dunia profesional.

--------------------------------------------------------------------------------
[INSTRUKSI PENYUSUNAN DOKUMEN: BAGIAN 1 SAMPAI BAGIAN 6 + PENGESAHAN]

Susunlah dokumen Perencanaan Pembelajaran Mendalam (RPM) secara lengkap, mendalam, dan profesional dalam urutan bagian berikut:

================================================================================
BAGIAN 1: TABEL IDENTITAS (TEMA BIRU: header #1e40af / #1d4ed8 teks putih)
================================================================================
Susun tabel identitas yang mencakup:
- Nama Satuan Pendidikan: ${namaSekolah}
- Mata Pelajaran: ${mataPelajaran}
- Kelas / Fase & Semester: ${kelas} / ${fase} - ${semester}
- Durasi / Alokasi Waktu Pertemuan: ${alokasiWaktu}

================================================================================
BAGIAN 2: TABEL IDENTIFIKASI (TEMA ORANYE: header #c2410c / #ea580c teks putih)
================================================================================
Uraikan 3 aspek identifikasi dengan analisis mendalam khas SMA:
1. Karakteristik & Kesiapan Siswa SMA:
   Analisis profil kesiapan kognitif siswa SMA (kelompok mahir, berkembang, dan perlu bimbingan), gaya belajar (visual, auditori, kinestetik), minat vokasional/akademik, serta kesiapan literasi-numerasi murid.
2. Materi Pelajaran:
   Analisis esensi konsep materi, peta konsep keilmuan, potensi miskonsepsi umum yang sering dialami siswa SMA pada materi ini, serta relevansi kontekstualnya dengan isu global/kehidupan nyata era abad 21.
3. Capaian Dimensi Profil Lulusan:
   Uraian operasional konkret bagaimana dimensi terpilih (${profilFinal}) ditumbuhkan melalui aktivitas riset, telaah data, dan interaksi sosial di kelas.

================================================================================
BAGIAN 3: TABEL DESAIN PEMBELAJARAN (TEMA HIJAU: header #047857 / #059669 teks putih)
================================================================================
Rumuskan secara komprehensif:
1. Capaian Pembelajaran (CP): Sesuai standar fase kurikulum.
2. Lintas Disiplin Ilmu: Keterpaduan nyata materi ini dengan mata pelajaran SMA lainnya.
3. Tujuan Pembelajaran (TP): KKO operasional berbasis HOTS (C4-C6).
4. Topik Pembelajaran: Formulasi judul topik yang menantang intelektual siswa SMA.
5. Praktik Pedagogis per Pertemuan: Sintaks model per pertemuan (Pertemuan 1: ${praktikPedagogisP1} dan Pertemuan 2: ${praktikPedagogisP2}) secara operasional dan runtut.
6. Integrasi Literasi & Numerasi (WAJIB EKSPLISIT):
   - Penguatan Literasi SMA: Membaca analitis wacana teks informasi/jurnal/studi kasus nyata, membedah terminologi akademik esensial, mengekstraksi argumen kunci, dan menyusun sintesis laporan tertulis berbasis bukti.
   - Penguatan Numerasi SMA: Menganalisis tabel data kuantitatif, membaca grafik tren, melakukan estimasi kalkulasi matematis/logis, dan memformulasikan kesimpulan berbasis angka/data empiris.
7. Kemitraan Pembelajaran: Kolaborasi guru dengan orang tua, mitra Dunia Usaha/Dunia Industri (DUDI), praktisi profesional, atau dosen/universitas.
8. Lingkungan Pembelajaran: Penataan ruang kelas SMA yang fleksibel, tata letak meja diskusi tim, koneksi internet untuk riset, serta pemanfaatan PAPAN INTERAKTIF DIGITAL (Interactive Flat Panel / Smartboard) di depan kelas.
9. Pemanfaatan Digital Tools & Papan Interaktif:
   Uraikan peran utama PAPAN INTERAKTIF DIGITAL (Interactive Flat Panel / Smartboard) untuk interaksi sentuh langsung (anotasi langsung, drag-and-drop konsep, demonstrasi simulasi interaktif) yang dikombinasikan dengan platform pendukung (Canva Whiteboard, Miro/Jamboard, GeoGebra, PhET Simulations, Quizizz, Google Spreadsheet, dll).

================================================================================
BAGIAN 4: TABEL PENGALAMAN BELAJAR (TEMA KUNING / AMBER: header #b45309 / #d97706 teks putih)
================================================================================
Rinci pengalaman belajar per pertemuan dengan alur 3 Pilar Deep Learning (Berkesadaran, Bermakna, Menggembirakan).
Setiap pertemuan WAJIB mencantumkan penanda/tag eksplisit:

A. KEGIATAN AWAL (MEMAHAMI) - Durasi ±15-20 Menit:
   - Mindful Check-in: Latihan kesadaran penuh (mindfulness/STOP technique) untuk kesiapan emosional remaja.
   - [Literasi & Papan Interaktif]: Penayangan wacana berita/studi kasus kontekstual pada Papan Interaktif Digital. Perwakilan siswa maju ke depan untuk menggarisbawahi gagasan utama dan istilah kunci langsung pada layar sentuh.
   - [Numerasi Awal]: Guru menayangkan grafik/tabel data pemantik di Papan Interaktif Digital, menantang murid bernalar kritis memprediksi pola tren angka.
   - Diferensiasi Konten: Pilihan sumber belajar awal (infografis visual, artikel ringkas, atau video simulasi) sesuai profil kesiapan belajar siswa SMA.
   - Guru menyampaikan alur tantangan belajar dan indikator keberhasilan secara memotivasi.

B. KEGIATAN INTI (MENGAPLIKASI) - Durasi ±55-60 Menit:
   - Sintaks Model Pedagogis Terpilih (Langkah 1 s.d. Langkah Selesai).
   - Pengorganisasian Tim Riset: Murid membentuk kelompok heterogen (3-4 orang). Guru memberikan scaffolding berjenjang bagi kelompok yang membutuhkan bimbingan teknis.
   - [Penguatan Literasi & Numerasi]: Setiap tim membedah lembar studi kasus, mengekstraksi variabel permasalahan (Literasi), serta menghitung data numerik/membuat tabel perbandingan (Numerasi) pada lembar kerja.
   - [Pemanfaatan Papan Interaktif Digital]: Setiap perwakilan kelompok bergiliran maju mengoperasikan Papan Interaktif Digital untuk memetakan diagram alir solusi, memanipulasi elemen visual simulasi secara langsung di layar sentuh, dan memvalidasi model solusi bersama kelompok lain.
   - Mengembangkan & Menyajikan Hasil Karya: Kelompok menyusun artefak solusi (laporan analisis data, infografis digital, atau kanvas solusi visual).
   - Unjuk Kerja & Peer Feedback: Presentasi interaktif di depan kelas memanfaatkan Papan Interaktif Digital diselingi tanggapan kritis antar kelompok.

C. KEGIATAN PENUTUP (MEREFLEKSI) - Durasi ±10-15 Menit:
   - [Refleksi Interaktif di Papan Digital]: Siswa menempelkan sticky notes virtual langsung pada kanvas Papan Interaktif Digital yang merangkum: (1 Wawasan Literasi Baru, 1 Pemahaman Numerasi/Data Bermakna, dan 1 Komitmen Penerapan Nyata).
   - Ulasan penguatan konsep kunci oleh guru dan apresiasi atas etos kerja ilmiah seluruh siswa.
   - Asesmen formatif cepat: Kuis interaktif 3 butir soal di Papan Interaktif Digital (exit ticket).
   - Guru menyampaikan rencana tindak lanjut pertemuan berikutnya dan menutup sesi dengan doa bersama.

================================================================================
BAGIAN 5: TABEL ASESMEN PEMBELAJARAN (TEMA BIRU NAVY: header #0f172a / #1e293b teks putih)
================================================================================
Rumuskan instrumen asesmen yang terintegrasi:
1. Asesmen Awal (Diagnostik):
   - Diagnostik non-kognitif (survei kesiapan emosi & gaya belajar).
   - Diagnostik kognitif singkat berupa 3 butir pertanyaan pemantik konsep dasar & literasi data awal.
2. Asesmen Proses (Formatif):
   - Lembar observasi keaktifan diskusi & bernalar kritis.
   - Rubrik partisipasi interaksi siswa pada Papan Interaktif Digital.
   - Lembar penilaian antarteman (peer-assessment) dalam kolaborasi data numerik.
3. Asesmen Akhir (Sumatif):
   - Asesmen sumatif autentik berupa penilaian laporan karya terapan/analisis data yang dipresentasikan di depan kelas menggunakan Papan Interaktif Digital.

================================================================================
BAGIAN 6: LEMBAR KERJA PESERTA DIDIK (LKPD) & RUBRIK PENILAIAN LENGKAP
================================================================================
Rancang lembar kerja peserta didik yang langsung siap dicetak dan dibagikan:
1. Identitas LKPD: Judul LKPD bernuansa ilmiah, Mata Pelajaran, Kelas/Fase, Alokasi Waktu, Nama Anggota Kelompok.
2. Tujuan Aktivitas Pembelajaran.
3. Petunjuk Umum Kerja Tim Riset (4 poin terstruktur).
4. Stimulus Masalah Kontekstual Nyata:
   Sajikan wacana masalah kontekstual yang kaya data, dilengkapi tabel data statistik/angka atau diagram fakta riil yang menantang murid membedah akar masalah secara ilmiah.
5. Lembar Tugas & Aktivitas per Pertemuan:
   - Langkah kerja terstruktur (Langkah 1-4) mencakup aktivitas literasi membaca wacana dan aktivitas numerasi kalkulasi/analisis data.
   - Format tabel isian analisis siap isi:
     * Tabel Isian 1: Fakta Kunci & Identifikasi Masalah dari Teks (Literasi).
     * Tabel Isian 2: Pengolahan Data & Kalkulasi Logis Temuan (Numerasi).
     * Tabel Isian 3: Alternatif Solusi & Gagasan Inovatif Tim.
     * Panduan Demonstrasi Solusi pada Papan Interaktif Digital di depan kelas.
6. Pertanyaan Refleksi & Diskusi Kritis Kelompok:
   3 pertanyaan HOTS pemantik nalar (analisis hubungan data, kendala kolaborasi tim, dan relevansi solusi bagi masyarakat).
7. Rubrik Penilaian Komprehensif (4 Aspek dengan 4 Skala Skor):
   Susun tabel rubrik dengan aspek:
   - Aspek 1: Penguasaan Konsep & Literasi Membaca Teks Ilmiah
   - Aspek 2: Penalaran Numerasi & Keterampilan Analisis Data
   - Aspek 3: Pemanfaatan Papan Interaktif & Kolaborasi Digital Tim
   - Aspek 4: Kualitas Penyajian, Argumentasi & Estetika Produk Akhir
   Setiap aspek WAJIB memiliki deskriptor kriteria jelas untuk:
   - Skor 4 : Sangat Baik (86 - 100)
   - Skor 3 : Baik (71 - 85)
   - Skor 2 : Cukup (56 - 70)
   - Skor 1 : Perlu Bimbingan (< 56)
8. Pedoman Penskoran: Rumus perhitungan nilai akhir = (Total Skor Perolehan / Skor Maksimal 16) × 100.

================================================================================
PENGESAHAN DOKUMEN (LEMBAR TANDA TANGAN)
================================================================================
Cantumkan format pengesahan resmi:
- Tempat dan tanggal penetapan dokumen: ${kotaTanggal}
- Kolom tanda tangan Kepala Sekolah: ${namaKepsek} (NIP. ${nipKepsek})
- Kolom tanda tangan Guru Mata Pelajaran: ${namaGuru} (NIP. ${nipGuru})

--------------------------------------------------------------------------------
[STANDAR KUALITAS OUTPUT]
- Gunakan Bahasa Indonesia baku sesuai Pedoman Umum Ejaan Bahasa Indonesia (EYD V).
- Teks deskripsi disajikan mendalam, operasional (bukan sekadar poin umum), bernada ilmiah-profesional, dan siap pakai untuk guru SMA.
- Gunakan styling inline CSS tabel yang rapi, modern, dan profesional sesuai tema warna masing-masing bagian (Biru, Oranye, Hijau, Kuning/Amber, Biru Navy) dengan border collapse dan margin yang proporsional.
- Keluarkan HANYA kode HTML murni di dalam tag <div class="modul-ajar-content deep-learning-rpm">...</div> tanpa pembungkus markdown codeblock (\`\`\`html).
`;

    const raw = await generateAiContentWithFallback(prompt);
    res.json({ html: cleanHtmlOutput(raw) });
  } catch (error: any) {
    console.error('Error generating Modul Ajar Deep Learning:', error);
    res.status(500).json({ error: error.message || 'Gagal menghasilkan Rencana Pembelajaran Mendalam' });
  }
});

// 2. Generator Perangkat Ajar Kurikulum Merdeka (CP, TP, ATP, Prota, Prosem, KKTP)
app.post('/api/ai/generate-perangkat-ajar', async (req: Request, res: Response) => {
  try {
    const { jenisDokumen, mataPelajaran, fase, kelas, tahunAjaran = '2026/2027', elemenCapaian } = req.body;

    const prompt = `
Buatlah Dokumen Resmi Perangkat Ajar Kurikulum Merdeka:
Jenis Dokumen: ${jenisDokumen || 'Alur Tujuan Pembelajaran (ATP)'}
Mata Pelajaran: ${mataPelajaran || 'Dasar-dasar Keahlian'}
Fase: ${fase || 'Fase E'}
Kelas: ${kelas || 'Kelas X'}
Tahun Ajaran: ${tahunAjaran}
Fokus Elemen/Capaian: ${elemenCapaian || 'Mengacu pada SK Kepala BSKAP Kemendikdasmen No. 046/H/KR/2025'}

RUJUKAN YURIDIS UTAMA WAJIB:
- Dokumen ini WAJIB merujuk secara penuh pada SALINAN KEPUTUSAN KEPALA BADAN STANDAR, KURIKULUM, DAN ASESMEN PENDIDIKAN KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH NOMOR 046/H/KR/2025 TENTANG CAPAIAN PEMBELAJARAN PADA PENDIDIKAN ANAK USIA DINI, JENJANG PENDIDIKAN DASAR, DAN JENJANG PENDIDIKAN MENENGAH.
- Cantumkan rujukan regulasi SK Kepala BSKAP No. 046/H/KR/2025 tersebut pada bagian subjudul dokumen resmi.

KETENTUAN DOKUMEN CETAK RESMI:
1. Format tabel: Header tabel WAJIB warna latar '#1a3a5c' teks putih (#ffffff), border 1px solid #334155, teks sel rapi.
2. Komponen dokumen sesuai standar resmi Kemendikdasmen (SK BSKAP No. 046/H/KR/2025):
   - Jika Analisis CP: Pemetaan Elemen CP sesuai SK BSKAP No. 046/H/KR/2025, Capaian Pembelajaran Fase, Kompetensi, Materi Esensial, dan Tujuan Pembelajaran.
   - Jika TP & ATP: Kode TP, Rumusan TP, Alokasi Jam Pelajaran (JP), Profil Pelajar Pancasila, Glosarium/Kata Kunci.
   - Jika Prota/Prosem: Distribusi alokasi waktu per bab/elemen per bulan dan semester ganjil/genap secara sistematis.
   - Jika KKTP: Interval nilai, kriteria deskripsi ketercapaian (0-60%: Belum Tuntas, 61-75%: Cukup, 76-88%: Baik, 89-100%: Sangat Baik), serta tindak lanjut.
3. Di akhir dokumen, sertakan format TANDA TANGAN SEJAJAR Kepala Sekolah (kiri) dan Guru Pengampu (kanan) dalam tabel tanpa border (border: none).

Keluarkan HANYA HTML murni di dalam tag <div class="perangkat-ajar-doc">...</div>.
`;

    const raw = await generateAiContentWithFallback(prompt);
    res.json({ html: cleanHtmlOutput(raw) });
  } catch (error: any) {
    console.error('Error generating Perangkat Ajar:', error);
    res.status(500).json({ error: error.message || 'Gagal menghasilkan Perangkat Ajar' });
  }
});

// 3. Perangkat Ajar KBC (Kurikulum Berbasis Cinta)
app.post('/api/ai/generate-perangkat-ajar-kbc', async (req: Request, res: Response) => {
  try {
    const { mataPelajaran, fase, kelas, nilaiKasih, topik } = req.body;

    const prompt = `
Susunlah PERANGKAT AJAR KURIKULUM BERBASIS CINTA (KBC) yang holistik dan menginspirasi.
Kurikulum Berbasis Cinta memadukan kecakapan akademik/keterampilan abad ke-21 dengan nilai-nilai welas asih, empati, cinta belajar, kepedulian lingkungan, dan kesadaran spiritual/budi pekerti luhur.

Parameter:
- Mata Pelajaran: ${mataPelajaran || 'Pendidikan Pancasila / Karakter'}
- Fase/Kelas: ${fase || 'Fase E'} - ${kelas || 'X'}
- Nilai Kasih & Karakter yang ditanamkan: ${nilaiKasih || 'Empati Sosial, Gotong Royong Tanpa Syarat, Kejujuran Hati, Welas Asih'}
- Topik Pembelajaran: ${topik || 'Membangun Harmoni dan Kolaborasi Empatis'}

STRUKTUR DOKUMEN HTML:
1. Kop & Judul Perangkat KBC.
2. Filosofi Cinta dalam Pembelajaran: Mengapa materi ini diajarkan melalui sudut pandang cinta & welas asih.
3. Dimensi KBC: Cinta pada Diri (Self-Love & Efikasi), Cinta pada Sesama (Empati & Toleransi), Cinta pada Lingkungan/Alam, Cinta pada Kebenaran/Ilmu.
4. Skenario Pembelajaran Berkesadaran Penuh (Mindful Learning & Heart-Centered Learning).
5. Asesmen Berbasis Karakter & Jurnal Refleksi Hati Nurani Siswa.
6. Header tabel warna #1a3a5c teks putih.
7. Format tanda tangan sejajar Kepala Sekolah & Guru Mata Pelajaran.

Keluarkan HANYA HTML murni di dalam tag <div class="kbc-doc">...</div>.
`;

    const raw = await generateAiContentWithFallback(prompt);
    res.json({ html: cleanHtmlOutput(raw) });
  } catch (error: any) {
    console.error('Error generating KBC:', error);
    res.status(500).json({ error: error.message || 'Gagal menghasilkan Perangkat KBC' });
  }
});

// 4. Generator Modul Kokurikuler AI (Mengintegrasikan 7 Kebiasaan Anak Indonesia Hebat)
app.post('/api/ai/generate-modul-kokurikuler', async (req: Request, res: Response) => {
  try {
    const { tema, topik, fase, alokasiWaktu, mataPelajaranTerlibat, kebiasaanFokus } = req.body;

    const listKebiasaan = Array.isArray(kebiasaanFokus) && kebiasaanFokus.length > 0
      ? kebiasaanFokus.join(', ')
      : 'Bangun Pagi, Taat Beribadah, Rajin Berolahraga, Makan Sehat dan Bergizi, Gemar Belajar, Bermasyarakat, Tidur Cepat';

    const prompt = `
Buatlah MODUL KOKURIKULER KOLABORATIF TERINTEGRASI 7 KEBIASAAN ANAK INDONESIA HEBAT (KEMENDIKDASMEN RI):
- Tema Proyek: ${tema || 'Kearifan Lokal / Rekayasa dan Teknologi / Gaya Hidup Berkelanjutan'}
- Topik Proyek: ${topik || 'Penguatan Karakter Melalui Gerakan 7 Kebiasaan Anak Indonesia Hebat'}
- Integrasi 7 Kebiasaan Anak Indonesia: ${listKebiasaan}
- Fase/Kelas: ${fase || 'Fase E (Kelas X)'}
- Alokasi Waktu: ${alokasiWaktu || '36 JP'}
- Kolaborasi Mata Pelajaran: ${mataPelajaranTerlibat || 'Informatika, IPAS, PJOK, Pendidikan Agama & Budi Pekerti, Bahasa Indonesia'}

Sistematika Dokumen Resmi:
1. IDENTITAS MODUL KOKURIKULER (Tabel rapi)
2. INTEGRASI 7 KEBIASAAN ANAK INDONESIA HEBAT (KEMENDIKDASMEN RI):
   - Deskripsi integrasi kebiasaan terpilih: ${listKebiasaan}
   - Dimensi Karakter & Profil Lulusan yang disasar
3. ALUR AKTIVITAS PROYEK 4 TAHAPAN:
   - Tahap 1: Pengenalan (Eksplorasi Makna & Kesadaran Kebiasaan Positif)
   - Tahap 2: Kontekstualisasi (Observasi Lapangan, Pemetaan Tantangan di Sekolah & Rumah)
   - Tahap 3: Aksi Nyata (Kampanye Kreatif, Praktik Pembiasaan Terpadu, Karya Kolaboratif)
   - Tahap 4: Refleksi & Evaluasi (Gelar Karya / Pameran & Refleksi Diri)
4. LEMBAR KERJA PESERTA DIDIK (LKPD) KOKURIKULER
5. JURNAL & RUBRIK ASESMEN PEMBIASAAN 7 KEBIASAAN (Tabel kriteria: Mulai Berkembang, Berkembang, Cakap, Mahir/Membudaya)
6. LEMBAR PENGESAHAN KEPALA SEKOLAH DAN KOORDINATOR KOKURIKULER.

Format Penulisan:
- Gunakan styling inline CSS yang rapi, modern, dan bernuansa edukasi profesional (warna aksen utama #0f766e / #0369a1).
- Pastikan tabel terstruktur dengan border collapse.
- Keluarkan HANYA HTML murni di dalam tag <div class="kokurikuler-doc">...</div> tanpa pembungkus markdown codeblock.
`;

    const raw = await generateAiContentWithFallback(prompt);
    res.json({ html: cleanHtmlOutput(raw) });
  } catch (error: any) {
    console.error('Error generating Modul Kokurikuler:', error);
    res.status(500).json({ error: error.message || 'Gagal menghasilkan Modul Kokurikuler' });
  }
});

// 4b. Generator Lembar Pantau & Jurnal 7 Kebiasaan Anak Indonesia Kokurikuler
app.post('/api/ai/generate-jurnal-7kebiasaan', async (req: Request, res: Response) => {
  try {
    const { namaSiswa, kelas, periode, targetFokus, catatanGuru } = req.body;

    const prompt = `
Buatlah DOKUMEN RESMI LEMBAR PANTAU & JURNAL REFLEKSI 7 KEBIASAAN ANAK INDONESIA HEBAT (PROGRAM KOKURIKULER KEMENDIKDASMEN):
- Identitas Siswa: ${namaSiswa || 'Seluruh Peserta Didik (Format Blanko Kelas)'}
- Kelas / Fase: ${kelas || 'Fase E (Kelas X)'}
- Periode Pemantauan: ${periode || '1 Minggu'}
- Fokus Kebiasaan Khusus: ${targetFokus || 'Semua 7 Kebiasaan (Bangun Pagi, Taat Beribadah, Rajin Berolahraga, Makan Sehat dan Bergizi, Gemar Belajar, Bermasyarakat, Tidur Cepat)'}
- Arahan / Catatan Guru: ${catatanGuru || 'Lakukan pembiasaan setiap hari secara konsisten dengan bimbingan orang tua dan guru pendamping'}

Sistematika Dokumen:
1. KOP RESMI LEMBAR PANTAU PEMBIASAAN KARAKTER KOKURIKULER
2. PANDUAN PENGISIAN BAGI SISWA & ORANG TUA
3. TABEL MATRIKS CHECKLIST 7 HARI (Senin s.d. Minggu) untuk 7 Kebiasaan:
   - 1. Bangun Pagi (Subuh / Sebelum 05.00)
   - 2. Taat Beribadah (Tepat waktu & Berdoa)
   - 3. Rajin Berolahraga (Peregangan / Senam 15-30 Menit)
   - 4. Makan Sehat & Bergizi (Sarapan Sehat, Sayur & Buah, Air Putih Cukup)
   - 5. Gemar Belajar (Membaca Buku / Literasi Mandiri min 15 Menit)
   - 6. Bermasyarakat (5S, Tolong Menolong, Kebersihan Bersama)
   - 7. Tidur Cepat (Sebelum Pukul 21.30, Bebas Gawai)
4. LEMBAR REFLEKSI HARIAN SISWA ("Satu Kebaikan & Hal Baru yang Kupelajari Hari Ini")
5. LEMBAR CATATAN, PARAF ORANG TUA, DAN EVALUASI WALI KELAS/GURU KOKURIKULER
6. RUBRIK PENILAIAN MEMBUDAYANYA KARAKTER (MB, SB, BSH, SAB).

Keluarkan HANYA HTML murni di dalam tag <div class="kokurikuler-jurnal-doc">...</div> tanpa tanda markdown.
`;

    const raw = await generateAiContentWithFallback(prompt);
    res.json({ html: cleanHtmlOutput(raw) });
  } catch (error: any) {
    console.error('Error generating Jurnal 7 Kebiasaan:', error);
    res.status(500).json({ error: error.message || 'Gagal menghasilkan Lembar Pantau 7 Kebiasaan' });
  }
});

// 5. Generator Soal Ujian, LJS, dan Kunci Jawaban
app.post('/api/ai/generate-soal-ujian', async (req: Request, res: Response) => {
  try {
    const {
      mataPelajaran,
      kelas,
      jenisUjian = 'Sumatif Akhir Semester (SAS)',
      topikMateri,
      jumlahPg = 10,
      jumlahUraian = 5,
    } = req.body;

    const prompt = `
Rancanglah SATU PAKET DOKUMEN UJIAN RESMI SEKOLAH LENGKAP:
- Mata Pelajaran: ${mataPelajaran || 'Informatika'}
- Kelas / Semester: ${kelas || 'X / Semester Ganjil'}
- Jenis Ujian: ${jenisUjian}
- Ruang Lingkup Materi: ${topikMateri || 'Algoritma, Pemrograman, dan Etika Digital'}
- Jumlah Soal Pilihan Ganda: ${jumlahPg} Soal (HOTS kontekstual dengan stimulus kasus/bacaan/tabel, pilihan A, B, C, D, E)
- Jumlah Soal Uraian: ${jumlahUraian} Soal Analitis dan Pemecahan Masalah

STRUKTUR DOKUMEN HTML (WAJIB MEMUAT 3 BAGIAN LENGKAP):
1. BAGIAN I: NASKAH SOAL UJIAN SISWA
   - Kop Ujian Sekolah Lengkap (Petunjuk Umum & Petunjuk Khusus).
   - Soal Pilihan Ganda nomor 1 s.d. ${jumlahPg} dengan stimulus berkualitas dan pilihan jawaban A, B, C, D, E.
   - Soal Uraian nomor 1 s.d. ${jumlahUraian}.
2. BAGIAN II: LEMBAR JAWABAN SISWA (LJS) SIAP CETAK (Diberi pembatas halaman / page-break)
   - Format Identitas Siswa (Nama, NISN, Kelas, Ruang, No. Peserta, Tanda Tangan Siswa).
   - Kisi-kisi Kotak Pilihan Ganda nomor 1 s.d. ${jumlahPg} dengan bulatan/kotak pilihan [A] [B] [C] [D] [E] yang rapi dan sejajar.
   - Kolom Jawaban Soal Uraian dengan garis-garis berjarak lega untuk menulis jawaban.
3. BAGIAN III: KUNCI JAWABAN, RUBRIK PENSKORAN & PEDOMAN PENILAIAN
   - Tabel Kunci Jawaban PG (Nomor, Kunci, Pembahasan Singkat).
   - Tabel Rubrik Penskoran Soal Uraian (Kriteria jawaban dan skor maksimal per nomor).
   - Rumus Perhitungan Nilai Akhir: Nilai = ((Skor PG + Skor Uraian) / Skor Maksimal) x 100.
   - Tabel tanda tangan sejajar Kepala Sekolah & Guru Mata Pelajaran.

Semua header tabel wajib warna '#1a3a5c' teks putih.
Keluarkan HANYA HTML murni di dalam tag <div class="soal-ujian-doc">...</div>.
`;

    const raw = await generateAiContentWithFallback(prompt);
    res.json({ html: cleanHtmlOutput(raw) });
  } catch (error: any) {
    console.error('Error generating Soal Ujian:', error);
    res.status(500).json({ error: error.message || 'Gagal menghasilkan Paket Ujian' });
  }
});

// 6. Generator Kartu Soal & Kisi-Kisi Ujian
app.post('/api/ai/generate-kartu-soal', async (req: Request, res: Response) => {
  try {
    const { mataPelajaran, kelas, jenisUjian = 'Asesmen Sumatif', materi } = req.body;

    const prompt = `
Buatlah KISI-KISI DAN KARTU SOAL RESMI STANDAR BNSP / KEMENDIKBUDRISTEK:
- Mata Pelajaran: ${mataPelajaran || 'Teknologi Informasi'}
- Kelas: ${kelas || 'Kelas X'}
- Ujian: ${jenisUjian}
- Materi Pokok: ${materi || 'Analisis Data dan Logika Komputasi'}

DOKUMEN HTML MEMUAT:
1. MATRIKS KISI-KISI PENULISAN SOAL:
   Tabel dengan kolom: No, Capaian Pembelajaran, Materi, Indikator Soal, Level Kognitif (L1/L2/L3), Bentuk Soal, No Soal. Header warna '#1a3a5c' teks putih.
2. KARTU SOAL RESMI (3-5 Kartu Soal):
   Format bingkai resmi per kartu soal:
   - Nama Satuan Pendidikan, Mata Pelajaran, Kelas, Tahun Ajaran
   - Kompetensi Dasar / Capaian Pembelajaran
   - Indikator Soal
   - Buku Sumber / Referensi
   - Level Kognitif
   - Rumusan Butir Soal (lengkap dengan teks stimulus dan opsi jawaban)
   - Kunci Jawaban & Bobot Skor
3. Format tanda tangan sejajar Kepala Sekolah dan Guru Penyusun Soal.

Keluarkan HANYA HTML murni di dalam tag <div class="kartu-soal-doc">...</div>.
`;

    const raw = await generateAiContentWithFallback(prompt);
    res.json({ html: cleanHtmlOutput(raw) });
  } catch (error: any) {
    console.error('Error generating Kartu Soal:', error);
    res.status(500).json({ error: error.message || 'Gagal menghasilkan Kartu Soal' });
  }
});

// 7. Generator LKPD AI (Lembar Kerja Peserta Didik)
app.post('/api/ai/generate-lkpd', async (req: Request, res: Response) => {
  try {
    const { mataPelajaran, fase, kelas, topik, model = 'Problem Based Learning' } = req.body;

    const prompt = `
Buatlah LEMBAR KERJA PESERTA DIDIK (LKPD) INTERAKTIF SIAP PAKAI:
- Mata Pelajaran: ${mataPelajaran || 'Informatika'}
- Fase / Kelas: ${fase || 'Fase E'} / ${kelas || 'Kelas X'}
- Topik / Materi: ${topik || 'Perancangan Logika Algoritma'}
- Model Pembelajaran: ${model}

STRUKTUR LKPD HTML:
1. Header & Identitas Kelompok / Siswa (Nama Siswa/Anggota, Kelas, Tanggal, Nilai/Paraf Guru).
2. Tujuan Aktivitas & Alur Kerja.
3. Stimulus / Teks Bacaan / Studi Kasus Kontekstual di Dunia Nyata.
4. Alat dan Bahan / Sumber Belajar.
5. Langkah-langkah Eksplorasi & Eksperimen.
6. Lembar Kerja / Kolom Isian Siswa (Diberi kotak bergaris/border rapi untuk menulis jawaban, diagram, atau kesimpulan).
7. Pertanyaan Pengarah Analisis Kritis.
8. Lembar Penilaian Mandiri & Refleksi Belajar.
9. Header tabel warna '#1a3a5c' teks putih.

Keluarkan HANYA HTML murni di dalam tag <div class="lkpd-doc">...</div>.
`;

    const raw = await generateAiContentWithFallback(prompt);
    res.json({ html: cleanHtmlOutput(raw) });
  } catch (error: any) {
    console.error('Error generating LKPD:', error);
    res.status(500).json({ error: error.message || 'Gagal menghasilkan LKPD' });
  }
});

// 8. Generator Presentasi Interaktif PPT (Semua Slide)
app.post('/api/ai/generate-ppt-all-slides', async (req: Request, res: Response) => {
  try {
    const { topik, targetAudiens = 'Siswa SMK/SMA', jumlahSlide = 7, mataPelajaran } = req.body;

    const prompt = `
Rancanglah Materi Presentasi Pembelajaran Interaktif Berkualitas Tinggi:
- Topik Pembelajaran: ${topik || 'Pengenalan Algoritma dan Pemrograman Modern'}
- Mata Pelajaran: ${mataPelajaran || 'Informatika'}
- Target Audiens: ${targetAudiens}
- Jumlah Slide: ${jumlahSlide} slide

Keluarkan data dalam format JSON murni:
{
  "presentationTitle": "Judul Utama Presentasi",
  "subject": "Mata Pelajaran",
  "slides": [
    {
      "slideNumber": 1,
      "title": "Judul Slide",
      "subtitle": "Subjudul atau Pengantar Singkat",
      "bullets": ["Poin esensial 1", "Poin esensial 2", "Poin esensial 3"],
      "keyTakeaway": "Pesan kunci untuk siswa",
      "speakerNotes": "Catatan penjelasan perkataan guru saat menayangkan slide ini"
    }
  ]
}
Pastikan konten kaya wawasan, terstruktur, dan inspiratif.
`;

    const raw = await generateAiContentWithFallback(prompt, 'Anda adalah konsultan presentasi visual edukasi. Berikan output HANYA format JSON valid.');
    let jsonStr = raw.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\s*/i, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\s*/i, '');
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.replace(/\s*```$/i, '');
    }

    try {
      const parsed = JSON.parse(jsonStr);
      res.json(parsed);
    } catch {
      res.json({
        presentationTitle: topik,
        subject: mataPelajaran,
        slides: [
          {
            slideNumber: 1,
            title: `Pendahuluan: ${topik}`,
            subtitle: 'Membangun Pemahaman Esensial',
            bullets: ['Tujuan pembelajaran hari ini', 'Mengapa topik ini penting di masa depan', 'Peta alur pembelajaran interaktif'],
            keyTakeaway: 'Belajar dengan antusias dan bernalar kritis.',
            speakerNotes: 'Selamat pagi siswa-siswi hebat, mari kita mulai petualangan belajar kita!',
          },
        ],
      });
    }
  } catch (error: any) {
    console.error('Error generating PPT:', error);
    res.status(500).json({ error: error.message || 'Gagal menghasilkan materi PPT' });
  }
});

// 8b. Generator Media Pembelajaran Interaktif AI (Standalone HTML5 Interactive Game/Simulation)
app.post('/api/ai/generate-media-interaktif', async (req: Request, res: Response) => {
  try {
    const {
      mataPelajaran,
      fase,
      topik,
      jenisMedia = 'Kuis & Game Interaktif Gamifikasi',
      targetSiswa,
      jumlahItem = '5 Pertanyaan / Tantangan',
    } = req.body;

    const prompt = `
Hasilkan SATU FILE HTML5 MANDIRI LENGKAP (STANDALONE HTML) yang merupakan MEDIA PEMBELAJARAN INTERAKTIF Kurikulum Merdeka.
Jenis Media yang diminta: ${jenisMedia}
Mata Pelajaran: ${mataPelajaran}
Jenjang / Fase: ${fase}
Topik Pembelajaran: ${topik}
Target Peserta Didik: ${targetSiswa}
Jumlah Tantangan/Item: ${jumlahItem}

KETENTUAN WAJIB TEKNIS & INTERAKTIVITAS:
1. File HTML harus BERDIRI SENDIRI (Standalone) lengkap dengan tag <!DOCTYPE html>, <html>, <head>, <style>, <body>, dan <script>.
2. Desain Elegan Modern: Gunakan font modern ('Plus Jakarta Sans'), tema warna kontras tinggi, tata letak responsif HP dan laptop.
3. Fungsi Interaktif WAJIB Berjalan Tanpa Eksternal Backend:
   - Ada sistem skor otomatis / indikator kemajuan (progress bar).
   - Setiap pilihan yang diklik memberikan umpan balik langsung (warna hijau jika benar + penjelasan edukatif, merah jika salah + alasan).
   - Tombol reset/mulai ulang untuk memainkan kembali.
   - Tanpa error JavaScript console.
4. Jangan gunakan markdown pembungkus di luar berkas HTML (berikan kode HTML murni).

Hasilkan kode HTML interaktif lengkap sekarang:
`;

    const raw = await generateAiContentWithFallback(
      prompt,
      'Anda adalah Ahli Gamifikasi Pendidikan Digital & Senior Instructional Interactive Designer. Anda menghasilkan kode HTML/CSS/JS interaktif yang siap pakai dan bebas error.'
    );

    const cleanHtml = cleanHtmlOutput(raw);
    res.json({ html: cleanHtml });
  } catch (error: any) {
    console.error('Error generating interactive media:', error);
    res.status(500).json({ error: error.message || 'Gagal menghasilkan media pembelajaran interaktif' });
  }
});

// 9. Asisten Chatbot Guru AI
app.post('/api/ai/chat-asisten', async (req: Request, res: Response) => {
  try {
    const { messages, message } = req.body;
    const userMsg = message || (Array.isArray(messages) && messages[messages.length - 1]?.text) || 'Halo Guru';

    const systemInstruction = `
Anda adalah "Tongguru AI Consultant", Asisten Ahli Pedagogik dan Kurikulum Merdeka Guru Indonesia 24/7.
Karakter Anda:
- Ramah, empatik, bijaksana, solutif, dan menguasai regulasi terbaru Kemendikdasmen (Salinan SK Kepala BSKAP No. 046/H/KR/2025 tentang Capaian Pembelajaran PAUD, Dikdas, dan Dikmen, PBD, asesmen formatif-sumatif, penulisan narasi rapor).
- Siap membantu merumuskan ide apersepsi kreatif, ice breaking cerdas, diferensiasi pembelajaran, penanganan kasus siswa, dan format administrasi guru.
- Berikan jawaban terstruktur dengan bullet point, praktis, dan langsung dapat dieksekusi di ruang kelas.
`;

    const prompt = `Pertanyaan dari Rekan Guru:\n"${userMsg}"\n\nBerikan saran pedagogik terbaik:`;
    const responseText = await generateAiContentWithFallback(prompt, systemInstruction);

    res.json({ reply: responseText });
  } catch (error: any) {
    console.error('Error in Chat Asisten:', error);
    res.status(500).json({ error: error.message || 'Gagal merespons pesan asisten AI' });
  }
});

// Serve code.txt for Google Apps Script
app.get('/code.txt', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.sendFile(path.resolve(process.cwd(), 'code.txt'));
});

// Mount Vite or serve static assets in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // In development mode, mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Tongguru EdAdmin Pro] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Tongguru] Failed to start server:', err);
});
