import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Loader2, Copy, Check, RefreshCw } from 'lucide-react';
import { showToast } from '../../utils/toast';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const ChatAsistenGuru: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: 'Halo Bapak/Ibu Guru Hebat! 👋 Saya **Tongguru AI Consultant**, asisten pedagogik dan Kurikulum Merdeka Anda 24/7. Ada yang bisa saya bantu hari ini? Misalnya ide apersepsi kreatif, catatan narasi e-Rapor, ice breaking kelas, atau solusi penanganan siswa?',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const QUICK_PROMPTS = [
    '💡 3 Ide apersepsi kreatif untuk materi Algoritma Pemrograman',
    '📝 Contoh kalimat catatan e-Rapor siswa nilai cukup tapi rajin',
    '⚡ Ice breaking 5 menit untuk membakar semangat jam terakhir',
    '🎯 Strategi diferensiasi pembelajaran untuk kelas heterogen',
  ];

  const generateFallbackChatAnswer = (query: string) => {
    const qLower = query.toLowerCase();
    if (qLower.includes('apersepsi') || qLower.includes('ide')) {
      return `Berikut adalah 3 ide apersepsi kreatif dan kontekstual untuk kelas Anda:
1. **Analogi Dunia Nyata (Real-World Analogy):** Ajak siswa membayangkan alur pemesanan makanan via aplikasi digital sebelum masuk ke alur algoritma logic.
2. **Tebak Kasus Singkat:** Tampilkan video 30 detik masalah di sekitar sekolah dan tanyakan: "Kira-kira pola apa yang bisa kita selesaikan hari ini?"
3. **Kuis Interaktif Cepat:** Berikan 2 pertanyaan pemantik berhadiah apresiasi pujian di depan kelas untuk membangun antusiasme awal.`;
    } else if (qLower.includes('rapor') || qLower.includes('catatan')) {
      return `Berikut contoh kalimat narasi apresiatif untuk e-Rapor siswa:
* "Ananda menunjukkan kesungguhan dan ketekunan yang tinggi dalam mengikuti pembelajaran. Penguasaan konsep dasar sudah cukup baik dan disarankan untuk terus berlatih mandiri agar pemahaman semakin optimal."`;
    } else if (qLower.includes('ice') || qLower.includes('breaking')) {
      return `Berikut ide **Ice Breaking 5 Menit - Tepuk Logika Konsentrasi**:
- **Aturan:** Ketika Guru mengucap 'Pagi' (Tepuk 1x), 'Siang' (Tepuk 2x), 'Malam' (Tepuk diam / bisik).
- **Tujuan:** Mengembalikan fokus saraf sensorik siswa pada jam pelajaran terakhir dengan cara menyenangkan dan mengundang tawa ramah.`;
    } else {
      return `Terima kasih atas pertanyaannya, Rekan Guru! Berdasarkan prinsip **Kurikulum Merdeka & Pedagogik Modern**:
1. **Pendekatan Terdiferensiasi:** Sesuaikan kedalaman materi dengan kesiapan belajar (Readiness) dan minat peserta didik.
2. **Asesmen Formatif Berkelanjutan:** Gunakan teknik umpan balik langsung (*instant feedback*) agar siswa memahami letak perbaikan secara metakognitif.
3. **Kolaborasi Empatis:** Libatkan siswa dalam diskusi kelompok kecil untuk memperkuat Profil Pelajar Pancasila (Bernalar Kritis & Gotong Royong).`;
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat-asisten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: data.reply || generateFallbackChatAnswer(query),
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.warn('Using fallback AI chat response:', err);
      const fallbackText = generateFallbackChatAnswer(query);
      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Tersalin ke Papan Klip!', 'success', 'Jawaban konsultasi AI telah disalin.');
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#1a3a5c] via-indigo-900 to-purple-950 text-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Bot className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Asisten Konsultan Guru AI 24/7</h2>
            <p className="text-xs text-blue-200">
              Teman diskusi pedagogik, ide apersepsi, ice breaking, asesmen, dan diferensiasi kelas.
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                id: 'm_reset',
                sender: 'ai',
                text: 'Sesi konsultasi baru telah dibuka! Apa yang ingin kita diskusikan selanjutnya?',
                timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
              },
            ])
          }
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs rounded-lg flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Mulai Ulang Chat
        </button>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-xl text-xs text-slate-700 dark:text-slate-300 transition-all text-left"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 h-[480px] overflow-y-auto space-y-4 shadow-sm">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                m.sender === 'user' ? 'bg-blue-600' : 'bg-[#1a3a5c]'
              }`}
            >
              {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-xs relative group ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>

              <div
                className={`flex items-center justify-between mt-2 pt-1 border-t text-[10px] ${
                  m.sender === 'user'
                    ? 'border-blue-500 text-blue-200'
                    : 'border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
              >
                <span>{m.timestamp}</span>
                {m.sender === 'ai' && (
                  <button
                    onClick={() => handleCopy(m.text)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-600 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Salin
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1a3a5c] text-white flex items-center justify-center">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Asisten sedang merumuskan saran pedagogik terbaik...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Tanyakan ide apersepsi, solusi kasus siswa, atau format modul ajar..."
          className="flex-1 px-4 py-2 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition-all shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
