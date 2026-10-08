import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Phone,
  User,
  Calendar,
  Building2,
  CheckCircle2,
  Sparkles,
  Copy,
  ExternalLink,
  Filter,
  Check,
  Briefcase,
  Clock,
  MapPin
} from 'lucide-react';
import { Siswa, PresensiPkl, Pengaturan } from '../../types';
import { pklService } from '../../services/pklService';
import { showToast } from '../../utils/toast';
import Swal from 'sweetalert2';

interface PklWhatsappParentReportProps {
  siswaList: Siswa[];
  pengaturan: Pengaturan;
}

export const PklWhatsappParentReport: React.FC<PklWhatsappParentReportProps> = ({
  siswaList,
  pengaturan,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [parentPhone, setParentPhone] = useState<string>('');
  const [reportType, setReportType] = useState<'harian' | 'mingguan' | 'evaluasi'>('harian');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customNotes, setCustomNotes] = useState<string>('Anak Bapak/Ibu menunjukkan kedisiplinan dan semangat kerja yang sangat baik di tempat PKL.');

  const [presensiRecords, setPresensiRecords] = useState<PresensiPkl[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [places, setPlaces] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [records, dudiList] = await Promise.all([
        pklService.fetchPresensi(),
        pklService.fetchPlaces()
      ]);
      setPresensiRecords(records);
      setPlaces(dudiList);
      if (siswaList.length > 0 && !selectedStudentId) {
        setSelectedStudentId(siswaList[0].id);
        if (siswaList[0].noHpOrtu) {
          setParentPhone(siswaList[0].noHpOrtu);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = siswaList.find((s) => s.id === selectedStudentId || s.nisn === selectedStudentId);

  // Find latest or specific date attendance record for this student
  const studentRecords = presensiRecords.filter(
    (p) => p.siswaId === selectedStudentId || p.nisn === selectedStudent?.nisn || p.namaSiswa === selectedStudent?.nama
  );

  const targetRecord = reportType === 'harian'
    ? studentRecords.find((p) => p.tanggal === selectedDate) || studentRecords[0]
    : studentRecords[0];

  // Generate WhatsApp Message text
  const generateMessage = () => {
    if (!selectedStudent) return 'Pilih siswa terlebih dahulu.';

    const studentName = selectedStudent.nama;
    const studentClass = selectedStudent.kelas || 'XI/XII';
    const dudiName = targetRecord?.namaDudi || 'Tempat PKL / DUDI';
    const guruName = pengaturan.namaGuru || 'Guru Pembimbing';
    const schoolName = pengaturan.namaSekolah || 'SMK Negeri';

    if (reportType === 'harian') {
      const hariTanggal = targetRecord?.tanggal || selectedDate;
      const datang = targetRecord?.waktuDatang || '-';
      const pulang = targetRecord?.waktuPulang || 'Masih aktif / Belum absen pulang';
      const kegiatan = targetRecord?.ringkasanPekerjaan || targetRecord?.keteranganDatang || 'Melaksanakan tugas harian di industri.';
      const statusAbsen = targetRecord?.status === 'selesai_pulang' ? '✅ Hadir & Selesai PKL Hari Ini' : '🟢 Sedang Berlangsung di Lokasi PKL';

      return `Yth. Bapak/Ibu Orang Tua/Wali dari *${studentName}* (${studentClass}),

Berikut adalah Laporan Perkembangan & Kehadiran Praktik Kerja Lapangan (PKL) harian siswa pada *${hariTanggal}*:

🏢 *Tempat PKL:* ${dudiName}
📌 *Status:* ${statusAbsen}
⏰ *Jam Datang:* ${datang} WIB
⏰ *Jam Pulang:* ${pulang} WIB

📝 *Jurnal & Kegiatan Hari Ini:*
"${kegiatan}"

💬 *Catatan Guru Pembimbing (${guruName}):*
"${customNotes}"

Terima kasih atas dukungan dan kerja sama Bapak/Ibu dalam mendampingi putra/putri kita selama program PKL di ${schoolName}.

_Pesan otomatis dikirim melalui Sistem Monitoring PKL ${schoolName}_`;
    } else if (reportType === 'mingguan') {
      const totalHadir = studentRecords.length;
      const recentActivities = studentRecords.slice(0, 5).map((r, i) => `${i + 1}. (${r.tanggal}): ${r.ringkasanPekerjaan || r.keteranganDatang || 'Hadir'}`).join('\n');

      return `Yth. Bapak/Ibu Orang Tua/Wali dari *${studentName}* (${studentClass}),

Berikut adalah Rangkuman Laporan Kehadiran & Kegiatan PKL Mingguan di *${dudiName}*:

📊 *Total Kehadiran Tercatat:* ${totalHadir} Hari
🏢 *Tempat PKL:* ${dudiName}

📋 *Aktivitas Terbaru:*
${recentActivities || '- Belum ada jurnal aktivitas tercatat minggu ini.'}

💬 *Catatan Evaluasi Pembimbing (${guruName}):*
"${customNotes}"

Semoga putra/putri Bapak/Ibu senantiasa diberikan kesehatan dan kelancaran dalam menimba ilmu keahlian di dunia industri.

_Pesan otomatis dikirim melalui Sistem Monitoring PKL ${schoolName}_`;
    } else {
      // Evaluasi / Kemajuan
      return `Yth. Bapak/Ibu Orang Tua/Wali dari *${studentName}* (${studentClass}),

INFORMASI PERKEMBANGAN & EVALUASI PKL

🏢 *Tempat PKL:* ${dudiName}
👨‍🏫 *Guru Pembimbing:* ${guruName}

🌟 *Evaluasi Kemajuan & Kompetensi:*
"${customNotes}"

Kami mengapresiasi dedikasi dan kedisiplinan ${studentName} selama melaksanakan PKL. Mari terus kita motivasi agar menjadi lulusan yang kompeten dan siap kerja.

Terima kasih.
_Sistem Monitoring PKL ${schoolName}_`;
    }
  };

  const handleSendWhatsapp = () => {
    if (!parentPhone) {
      Swal.fire('Nomor WhatsApp Belum Diisi', 'Silakan masukkan nomor WhatsApp orang tua siswa terlebih dahulu.', 'warning');
      return;
    }

    let cleanPhone = parentPhone.trim().replace(/[^0-9+]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('62') && !cleanPhone.startsWith('+')) {
      cleanPhone = '62' + cleanPhone;
    }

    const message = generateMessage();
    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;

    window.open(waUrl, '_blank');
    showToast('Membuka WhatsApp', 'success', 'WhatsApp Web/App berhasil dibuka dengan pesan laporan.');
  };

  const handleCopyText = () => {
    const text = generateMessage();
    navigator.clipboard.writeText(text);
    showToast('Teks Disalin', 'success', 'Pesan laporan berhasil disalin ke clipboard.');
  };

  return (
    <div className="space-y-6 animate-fade-in-tab">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 md:p-8 shadow-xl border-2 border-emerald-500/30">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>MODUL WHATSAPP ORANG TUA PKL</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-wide text-white">
              Kirim Laporan Perkembangan PKL ke Orang Tua via WhatsApp
            </h1>
            <p className="text-xs md:text-sm text-emerald-200 max-w-2xl font-medium">
              Sampaikan informasi kehadiran, jurnal kegiatan harian, dan evaluasi kemajuan siswa peserta PKL secara langsung kepada orang tua/wali murid melalui pesan WhatsApp yang rapi dan profesional.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-950/60 p-3 rounded-2xl border border-emerald-500/30">
            <Phone className="w-6 h-6 text-emerald-400 animate-bounce" />
            <div className="text-left">
              <span className="block text-[10px] text-emerald-300 font-bold uppercase">Total Siswa PKL</span>
              <span className="text-lg font-black text-white">{siswaList.length} Siswa</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Configuration */}
        <div className="lg:col-span-5 space-y-5 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600" />
            <span>Pilih Siswa & Parameter Laporan</span>
          </h2>

          {/* Select Student */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              1. Pilih Nama Siswa Peserta PKL
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => {
                const sId = e.target.value;
                setSelectedStudentId(sId);
                const s = siswaList.find((item) => item.id === sId || item.nisn === sId);
                if (s) {
                  setParentPhone(s.noHpOrtu || '');
                }
              }}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="">-- Pilih Siswa PKL --</option>
              {siswaList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama} ({s.kelas}) - HP Ortu: {s.noHpOrtu || '-'}
                </option>
              ))}
            </select>
          </div>

          {/* Parent WhatsApp Number */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>2. Nomor WhatsApp Orang Tua / Wali</span>
              <span className="text-[10px] text-emerald-600 font-semibold">Format: 08xx / 62xx</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Phone className="w-4 h-4 text-emerald-500" />
              </span>
              <input
                type="text"
                placeholder="Contoh: 081234567890"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Report Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              3. Jenis Laporan
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setReportType('harian')}
                className={`py-2 px-3 rounded-xl text-xs font-black border transition-all ${
                  reportType === 'harian'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                Harian
              </button>
              <button
                type="button"
                onClick={() => setReportType('mingguan')}
                className={`py-2 px-3 rounded-xl text-xs font-black border transition-all ${
                  reportType === 'mingguan'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                Mingguan
              </button>
              <button
                type="button"
                onClick={() => setReportType('evaluasi')}
                className={`py-2 px-3 rounded-xl text-xs font-black border transition-all ${
                  reportType === 'evaluasi'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                Evaluasi
              </button>
            </div>
          </div>

          {reportType === 'harian' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Pilih Tanggal Presensi
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* Custom Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              4. Catatan Khusus Guru / Pembimbing untuk Orang Tua
            </label>
            <textarea
              rows={3}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Tuliskan pesan motivasi atau catatan khusus..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Student Quick Info Card */}
          {selectedStudent && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-black text-xs">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span>Info Tempat PKL Siswa</span>
              </div>
              <div className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                <p><strong>Nama:</strong> {selectedStudent.nama}</p>
                <p><strong>Kelas:</strong> {selectedStudent.kelas}</p>
                <p><strong>Tempat PKL:</strong> {targetRecord?.namaDudi || 'Belum diatur di presensi'}</p>
                <p><strong>Status Absen:</strong> {targetRecord?.status === 'selesai_pulang' ? '✅ Selesai Pulang' : targetRecord ? '🟢 Aktif PKL' : '⚠️ Belum ada presensi'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: WhatsApp Message Preview & Action */}
        <div className="lg:col-span-7 space-y-5 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 flex items-center justify-center font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Pratinjau Pesan WhatsApp
              </h3>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 font-bold">
              Siap Kirim
            </span>
          </div>

          {/* WhatsApp Message Box Preview */}
          <div className="flex-1 bg-slate-900 text-emerald-100 p-4 rounded-2xl font-mono text-xs whitespace-pre-wrap border border-slate-700 shadow-inner max-h-[420px] overflow-y-auto leading-relaxed">
            {generateMessage()}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all border border-slate-300 dark:border-slate-700 shadow-sm"
            >
              <Copy className="w-4 h-4" />
              <span>Salin Teks Pesan</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsapp}
              className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.01]"
            >
              <Send className="w-4 h-4" />
              <span>Kirim via WhatsApp Sekarang</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-70" />
            </button>
          </div>

          <p className="text-[11px] text-slate-500 text-center italic">
            *Catatan: Pastikan aplikasi WhatsApp Desktop atau WhatsApp Web aktif di perangkat Anda untuk langsung mengirim pesan ke nomor orang tua.
          </p>
        </div>
      </div>
    </div>
  );
};
