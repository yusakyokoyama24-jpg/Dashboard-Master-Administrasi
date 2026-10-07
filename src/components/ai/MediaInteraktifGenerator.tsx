import React, { useState } from 'react';
import { PlayCircle, Sparkles, Download, Copy, RefreshCw, Eye, CheckCircle2, Gamepad2, Layers, BookOpen, ExternalLink, Code } from 'lucide-react';
import { showToast } from '../../utils/toast';

export const MediaInteraktifGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'preview' | 'code'>('preview');

  const [formData, setFormData] = useState({
    mataPelajaran: 'Informatika',
    fase: 'Fase E (Kelas X)',
    topik: 'Dasar Pemrograman Web & Algoritma Percabangan',
    jenisMedia: 'Kuis & Game Interaktif Gamifikasi' as 'Kuis & Game Interaktif Gamifikasi' | 'Flashcard Konsep 3D Flip' | 'Studi Kasus Skenario Bercabang' | 'Papan Eksplorasi Konsep Interaktif',
    targetSiswa: 'Siswa SMK / SMA (Berorientasi Praktik)',
    jumlahItem: '5 Pertanyaan / Kartu Tantangan',
    alokasiWaktu: '15 - 20 Menit Interaktif',
  });

  const generateFallbackMediaHtml = (data: typeof formData) => {
    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Media Pembelajaran Interaktif: ${data.topik}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px;
    }
    .container {
      width: 100%;
      max-width: 760px;
      background: #1e293b;
      border: 2px solid #3b82f6;
      border-radius: 24px;
      padding: 28px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #334155;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 4px 14px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    h1 { font-size: 22px; font-weight: 800; color: #60a5fa; margin-bottom: 6px; }
    .meta { font-size: 13px; color: #94a3b8; }
    
    /* Interactive Card */
    .card {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 18px;
      padding: 20px;
      margin-bottom: 16px;
      transition: all 0.2s ease;
    }
    .q-number { font-size: 12px; font-weight: 700; color: #f59e0b; margin-bottom: 8px; }
    .q-text { font-size: 16px; font-weight: 600; color: #ffffff; margin-bottom: 16px; line-height: 1.5; }
    .options { display: grid; gap: 10px; }
    .btn-opt {
      background: #1e293b;
      color: #e2e8f0;
      border: 2px solid #334155;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn-opt:hover { background: #2563eb; color: white; border-color: #60a5fa; transform: translateY(-2px); }
    .btn-opt.correct { background: #059669 !important; color: white !important; border-color: #34d399 !important; }
    .btn-opt.wrong { background: #dc2626 !important; color: white !important; border-color: #f87171 !important; }
    .feedback {
      margin-top: 14px;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 13px;
      display: none;
      line-height: 1.5;
    }
    .feedback.show { display: block; }
    .feedback.ok { background: rgba(5, 150, 105, 0.2); border: 1px solid #10b981; color: #6ee7b7; }
    .feedback.err { background: rgba(220, 38, 38, 0.2); border: 1px solid #ef4444; color: #fca5a5; }

    /* Score Board */
    .scoreboard {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      padding: 14px 20px;
      border-radius: 14px;
      border: 1px solid #334155;
      margin-top: 20px;
    }
    .score-val { font-size: 18px; font-weight: 800; color: #38bdf8; }
    .reset-btn {
      background: #f59e0b;
      color: #0f172a;
      border: none;
      padding: 8px 16px;
      border-radius: 10px;
      font-weight: 800;
      cursor: pointer;
      font-size: 12px;
    }
    .reset-btn:hover { background: #d97706; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">MEDIA AJAR INTERAKTIF</span>
      <h1>${data.topik}</h1>
      <p class="meta">Mata Pelajaran: <b>${data.mataPelajaran}</b> • ${data.fase} • Guru Pengampu: Yusak Yokoyama</p>
    </div>

    <!-- Soal 1 -->
    <div class="card" id="q1">
      <div class="q-number">TANTANGAN 1 DARI 3</div>
      <div class="q-text">Dalam konsep logika pemrograman komputer, struktur apa yang digunakan untuk mengeksekusi blok instruksi tertentu hanya jika kondisi bernilai BENAR (True)?</div>
      <div class="options">
        <button class="btn-opt" onclick="check(1, false, this, 'Perulangan digunakan untuk mengulang kode berkali-kali, bukan percabangan kondisi.')">A. Looping (Perulangan While/For)</button>
        <button class="btn-opt" onclick="check(1, true, this, 'Tepat sekali! Percabangan IF-ELSE mengevaluasi kondisi boolean dan menjalankan instruksi sesuai hasil evaluasi.')">B. Branching (Percabangan IF - ELSE)</button>
        <button class="btn-opt" onclick="check(1, false, this, 'Variabel berfungsi sebagai wadah penyimpanan nilai di memori.')">C. Deklarasi Variabel</button>
        <button class="btn-opt" onclick="check(1, false, this, 'Array merupakan struktur data kumpulan elemen bertipe sama.')">D. Struktur Data Array</button>
      </div>
      <div class="feedback" id="fb1"></div>
    </div>

    <!-- Soal 2 -->
    <div class="card" id="q2">
      <div class="q-number">TANTANGAN 2 DARI 3</div>
      <div class="q-text">Manakah operator logika yang menghasilkan nilai TRUE hanya jika KEDUA operan bernilai benar sekaligus?</div>
      <div class="options">
        <button class="btn-opt" onclick="check(2, true, this, 'Luar biasa! Operator AND (&&) mensyaratkan kedua syarat terpenuhi sekaligus.')">A. Operator Logika AND (&&)</button>
        <button class="btn-opt" onclick="check(2, false, this, 'Operator OR bernilai benar jika salah satu saja bernilai benar.')">B. Operator Logika OR (||)</button>
        <button class="btn-opt" onclick="check(2, false, this, 'Operator NOT membalikkan nilai boolean.')">C. Operator NOT (!)</button>
        <button class="btn-opt" onclick="check(2, false, this, 'Operator XOR bernilai benar jika kedua kondisi berbeda.')">D. Operator XOR (^)</button>
      </div>
      <div class="feedback" id="fb2"></div>
    </div>

    <!-- Soal 3 -->
    <div class="card" id="q3">
      <div class="q-number">TANTANGAN 3 DARI 3</div>
      <div class="q-text">Jika terdapat kasus seleksi menu sistem dengan banyak pilihan diskrit (misal: pilihan 1 sampai 7 untuk nama hari), struktur kontrol apa yang paling efisien dan rapi digunakan?</div>
      <div class="options">
        <button class="btn-opt" onclick="check(3, false, this, 'Nested IF berlebihan akan membuat kode sulit dibaca (spaghetti code).')">A. Nested IF bersarang 10 tingkat</button>
        <button class="btn-opt" onclick="check(3, true, this, 'Sangat tepat! Switch-Case sangat ideal dan terstruktur untuk pengujian nilai konstanta diskrit jamak.')">B. Switch - Case Statement</button>
        <button class="btn-opt" onclick="check(3, false, this, 'Try-Catch digunakan untuk penanganan error/eksepsi runtime.')">C. Try - Catch Block</button>
        <button class="btn-opt" onclick="check(3, false, this, 'Do-While adalah konstruksi perulangan, bukan pemilih kondisi.')">D. Do - While Statement</button>
      </div>
      <div class="feedback" id="fb3"></div>
    </div>

    <!-- Score Footer -->
    <div class="scoreboard">
      <div>Skor Interaktif Anda: <span class="score-val" id="score">0</span> / 300 Poin</div>
      <button class="reset-btn" onclick="resetAll()">Mulai Ulang</button>
    </div>
  </div>

  <script>
    let score = 0;
    const answered = {};

    function check(qId, isCorrect, btn, msg) {
      if (answered[qId]) return;
      answered[qId] = true;

      const card = document.getElementById('q' + qId);
      const fb = document.getElementById('fb' + qId);
      const buttons = card.querySelectorAll('.btn-opt');

      buttons.forEach(b => b.disabled = true);

      if (isCorrect) {
        btn.classList.add('correct');
        score += 100;
        fb.className = 'feedback show ok';
        fb.innerHTML = '<b>Jawaban Benar! (+100 Poin)</b><br>' + msg;
      } else {
        btn.classList.add('wrong');
        fb.className = 'feedback show err';
        fb.innerHTML = '<b>Jawaban Belum Tepat</b><br>' + msg;
      }

      document.getElementById('score').innerText = score;
    }

    function resetAll() {
      score = 0;
      document.getElementById('score').innerText = score;
      for (let i = 1; i <= 3; i++) {
        delete answered[i];
        const card = document.getElementById('q' + i);
        if (card) {
          const buttons = card.querySelectorAll('.btn-opt');
          buttons.forEach(b => {
            b.disabled = false;
            b.classList.remove('correct', 'wrong');
          });
          const fb = document.getElementById('fb' + i);
          if (fb) fb.className = 'feedback';
        }
      }
    }
  </script>
</body>
</html>`;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGeneratedHtml(null);

    try {
      const res = await fetch('/api/ai/generate-media-interaktif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Gagal memproses media pembelajaran AI dari server.');
      }

      const data = await res.json();
      if (data.html) {
        setGeneratedHtml(data.html);
        showToast('Media Interaktif Berhasil Dibuat!', 'success', 'Media ajar interaktif siap dimainkan atau diunduh.');
      } else {
        throw new Error('Respons HTML tidak valid.');
      }
    } catch (err: any) {
      console.warn('Fallback to local interactive generator template:', err);
      // Fallback generator
      const fallback = generateFallbackMediaHtml(formData);
      setGeneratedHtml(fallback);
      showToast('Media Interaktif Siap!', 'success', 'Template media interaktif kurikulum merdeka berhasil dimuat.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadHtml = () => {
    if (!generatedHtml) return;
    const blob = new Blob([generatedHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Media_Interaktif_${formData.topik.replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Berkas HTML Diunduh!', 'success', 'Siswa dapat membuka file ini langsung di browser HP atau laptop secara offline.');
  };

  const handleCopyCode = () => {
    if (!generatedHtml) return;
    navigator.clipboard.writeText(generatedHtml);
    showToast('Kode HTML Disalin!', 'success', 'Kode HTML media interaktif tersimpan di clipboard.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-black tracking-wider uppercase mb-2">
            <Gamepad2 className="w-3.5 h-3.5" />
            Suite AI Kurikulum Merdeka
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-wide">
            Pembuat Media Pembelajaran Interaktif AI
          </h2>
          <p className="text-xs md:text-sm text-orange-100 max-w-2xl mt-1">
            Hasilkan media edukasi interaktif mandiri (Kuis Gamifikasi, Flashcard 3D, Skenario Bercabang) berbasis HTML5 yang dapat langsung dimainkan di browser siswa secara offline tanpa kuota internet!
          </p>
        </div>

        {generatedHtml && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadHtml}
              className="px-4 py-2.5 bg-white text-orange-700 hover:bg-orange-50 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Download className="w-4 h-4" /> Unduh Berkas HTML
            </button>
            <button
              onClick={handleCopyCode}
              className="px-3.5 py-2.5 bg-black/25 hover:bg-black/40 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Copy className="w-4 h-4" /> Salin Kode
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Form Left, Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Configuration (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Parameter Media Interaktif
            </h3>
          </div>

          <form onSubmit={handleGenerate} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Format Media Interaktif
              </label>
              <select
                value={formData.jenisMedia}
                onChange={(e) => setFormData({ ...formData, jenisMedia: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
              >
                <option value="Kuis & Game Interaktif Gamifikasi">🎮 Kuis & Game Gamifikasi (Live Skor & Umpan Balik)</option>
                <option value="Flashcard Konsep 3D Flip">📇 Flashcard Flip 3D (Kartu Konsep Bolak-Balik)</option>
                <option value="Studi Kasus Skenario Bercabang">🌳 Skenario Studi Kasus Bercabang (Branching)</option>
                <option value="Papan Eksplorasi Konsep Interaktif">🔍 Papan Eksplorasi Hotspot Konsep Interaktif</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mata Pelajaran
              </label>
              <input
                type="text"
                value={formData.mataPelajaran}
                onChange={(e) => setFormData({ ...formData, mataPelajaran: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white"
                placeholder="Contoh: Informatika, Matematika, dll."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Jenjang / Fase
                </label>
                <input
                  type="text"
                  value={formData.fase}
                  onChange={(e) => setFormData({ ...formData, fase: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white"
                  placeholder="Fase E (Kelas X)"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Jumlah Item / Soal
                </label>
                <input
                  type="text"
                  value={formData.jumlahItem}
                  onChange={(e) => setFormData({ ...formData, jumlahItem: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white"
                  placeholder="5 Pertanyaan"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Topik / Materi Pokok Pembelajaran
              </label>
              <textarea
                rows={2}
                value={formData.topik}
                onChange={(e) => setFormData({ ...formData, topik: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white"
                placeholder="Tuliskan materi pembelajaran yang ingin dijadikan media interaktif..."
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Profil Target Siswa
              </label>
              <input
                type="text"
                value={formData.targetSiswa}
                onChange={(e) => setFormData({ ...formData, targetSiswa: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white"
                placeholder="Siswa SMK Reguler / Praktik"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Membangun Media Interaktif...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  Buat Media Interaktif Sekarang
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Interactive Player / Code View (8 Cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col min-h-[560px]">
          {/* Header Controls */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Live Interactive Player & Simulator
              </span>
              {generatedHtml && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold">
                  Siap Dimainkan
                </span>
              )}
            </div>

            {generatedHtml && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setActiveView('preview')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    activeView === 'preview'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 inline mr-1" />
                  Mainkan (Preview)
                </button>
                <button
                  onClick={() => setActiveView('code')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    activeView === 'code'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Code className="w-3.5 h-3.5 inline mr-1" />
                  Lihat Kode HTML
                </button>
              </div>
            )}
          </div>

          {/* Body Viewer */}
          <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex flex-col relative">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <div className="w-14 h-14 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-4 animate-bounce">
                  <Gamepad2 className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  Merancang Logika & Elemen Interaktif AI...
                </h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Menyusun antarmuka HTML5, sistem skor otomatis, skenario percabangan, dan tombol interaksi edukatif.
                </p>
              </div>
            ) : generatedHtml ? (
              activeView === 'preview' ? (
                <iframe
                  title="Live Interactive Media"
                  srcDoc={generatedHtml}
                  className="w-full flex-1 border-0 min-h-[500px]"
                  sandbox="allow-scripts allow-same-origin allow-modals"
                />
              ) : (
                <pre className="p-4 text-xs font-mono text-emerald-400 bg-slate-950 overflow-auto flex-1 select-all">
                  {generatedHtml}
                </pre>
              )
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <div className="w-16 h-16 rounded-3xl bg-slate-800 text-slate-400 flex items-center justify-center mb-4">
                  <PlayCircle className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-slate-300 mb-1">
                  Simulator Belum Memuat Media
                </h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  Tentukan materi pokok di samping, lalu klik tombol <b>Buat Media Interaktif Sekarang</b> untuk melihat simulasi dan mengunduh berkas offline.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
