import React, { useState } from 'react';
import { FileText, Printer, FileSpreadsheet, Download, Calendar, Award, BookMarked, Filter, Users, Code2 } from 'lucide-react';
import { Siswa, Mapel, Absensi, Nilai, Agenda, Pengaturan } from '../../types';
import { exportService } from '../../services/export';
import { showToast } from '../../utils/toast';

interface PusatLaporanProps {
  siswaList: Siswa[];
  mapelList: Mapel[];
  absensiList: Absensi[];
  nilaiList: Nilai[];
  agendaList: Agenda[];
  pengaturan: Pengaturan;
}

export const PusatLaporan: React.FC<PusatLaporanProps> = ({
  siswaList,
  mapelList,
  absensiList,
  nilaiList,
  agendaList,
  pengaturan,
}) => {
  const [selectedReport, setSelectedReport] = useState<'presensi' | 'leger' | 'agenda'>('presensi');
  const [selectedKelas, setSelectedKelas] = useState('X RPL 1');
  const [selectedBulan, setSelectedBulan] = useState(new Date().getMonth() + 1);

  const kelasList = Array.from(new Set(siswaList.map((s) => s.kelas))).sort();
  const studentsInClass = siswaList.filter((s) => s.kelas === selectedKelas);

  const BULAN_NAMES = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleExportSiswaExcel = () => {
    const listToExport = selectedKelas === 'all' ? siswaList : studentsInClass;
    exportService.exportSiswaToExcel(listToExport, `Data_Siswa_${selectedKelas}.xlsx`);
    showToast('Ekspor Data Siswa Berhasil!', 'success', `Sebanyak ${listToExport.length} data siswa kelas ${selectedKelas} telah diekspor ke format Excel (.xlsx).`);
  };

  const handleExportLegerExcel = () => {
    exportService.exportLegerNilaiToExcel(nilaiList, siswaList, selectedKelas);
    showToast('Leger Nilai Diekspor!', 'success', `Rekap Leger Nilai kelas ${selectedKelas} berhasil disimpan ke format Excel (.xlsx).`);
  };

  const handleExportPresensiExcel = () => {
    exportService.exportAbsensiToExcel(absensiList, selectedKelas, BULAN_NAMES[selectedBulan - 1]);
    showToast('Rekap Presensi Diekspor!', 'success', `Rekap presensi bulan ${BULAN_NAMES[selectedBulan - 1]} kelas ${selectedKelas} berhasil diekspor.`);
  };

  const handleExportAgendaExcel = () => {
    exportService.exportAgendaToExcel(agendaList, `Jurnal_Agenda_Mengajar_${selectedKelas}.xlsx`);
    showToast('Jurnal Agenda Diekspor!', 'success', 'Jurnal agenda mengajar berhasil diekspor ke file Excel (.xlsx).');
  };

  const handleDownloadCodeTxt = async () => {
    try {
      const res = await fetch('/code.txt');
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'code.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Berhasil Mengunduh', 'success', 'File code.txt Google Apps Script (Code.gs) berhasil diunduh.');
    } catch (err) {
      showToast('Gagal Mengunduh', 'error', 'Tidak dapat mengunduh berkas code.txt.');
    }
  };

  const handleDownloadIndexTxt = async () => {
    try {
      const res = await fetch('/index.txt');
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'index.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Berhasil Mengunduh', 'success', 'File index.txt Web App (Index.html) berhasil diunduh.');
    } catch (err) {
      showToast('Gagal Mengunduh', 'error', 'Tidak dapat mengunduh berkas index.txt.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Pusat Cetak Dokumen & Rekapitulasi Laporan
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Rekap kehadiran bulanan, leger nilai rapor lengkap, data siswa, dan jurnal guru siap cetak A4 atau ekspor Excel/PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadCodeTxt}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            title="Unduh Berkas code.txt untuk Google Apps Script (Backend Code.gs)"
          >
            <Code2 className="w-4 h-4" />
            code.txt (Code.gs)
          </button>
          <button
            onClick={handleDownloadIndexTxt}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            title="Unduh Berkas index.txt untuk Google Apps Script (Frontend Index.html)"
          >
            <Code2 className="w-4 h-4" />
            index.txt (Index.html)
          </button>
          <button
            onClick={handleExportSiswaExcel}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            title="Ekspor Seluruh Data Siswa ke Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Ekspor Data Siswa (.xlsx)
          </button>
          <button
            onClick={handleExportLegerExcel}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            title="Ekspor Leger Nilai ke Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Ekspor Leger Nilai (.xlsx)
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            Cetak (Ctrl+P)
          </button>
        </div>
      </div>

      {/* Select Report Type & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
        <button
          onClick={() => setSelectedReport('presensi')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedReport === 'presensi'
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/60 rounded-xl text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Rekapitulasi Presensi</h4>
              <p className="text-xs text-slate-500">Laporan kehadiran siswa bulanan / semester</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setSelectedReport('leger')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedReport === 'leger'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/60 rounded-xl text-emerald-600">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Leger Nilai Rapor</h4>
              <p className="text-xs text-slate-500">Rekap 10 Nilai Sumatif (80%), SAS (20%), &amp; Nilai Akhir</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setSelectedReport('agenda')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            selectedReport === 'agenda'
              ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-900/60 rounded-xl text-purple-600">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Jurnal Agenda Mengajar</h4>
              <p className="text-xs text-slate-500">Dokumentasi pelaksanaan KBM guru</p>
            </div>
          </div>
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 no-print">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pilih Rombel / Kelas:</label>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              {kelasList.map((k) => (
                <option key={k} value={k}>
                  {k} ({siswaList.filter((s) => s.kelas === k).length} Siswa)
                </option>
              ))}
            </select>
          </div>

          {selectedReport === 'presensi' && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bulan:</label>
              <select
                value={selectedBulan}
                onChange={(e) => setSelectedBulan(Number(e.target.value))}
                className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                {BULAN_NAMES.map((b, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedReport === 'presensi' && (
            <button
              onClick={handleExportPresensiExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Ekspor Excel (.xlsx)
            </button>
          )}

          {selectedReport === 'leger' && (
            <>
              <button
                onClick={() => exportService.exportLegerPdf(nilaiList, siswaList, selectedKelas, pengaturan)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh PDF
              </button>
              <button
                onClick={handleExportLegerExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Ekspor Leger Excel (.xlsx)
              </button>
            </>
          )}

          {selectedReport === 'agenda' && (
            <button
              onClick={handleExportAgendaExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Ekspor Agenda Excel (.xlsx)
            </button>
          )}
        </div>
      </div>

      {/* Printable Document Container */}
      <div className="bg-white text-slate-900 border border-slate-300 p-8 rounded-2xl shadow-md print:border-none print:shadow-none print:p-0">
        {/* Kop Surat Sekolah Resmi */}
        <div className="flex items-center justify-between pb-3 mb-5 border-b-4 border-double border-slate-900 kop-surat">
          <div className="w-16 h-16 shrink-0 flex items-center justify-center">
            {pengaturan.logoDinasUrl ? (
              <img src={pengaturan.logoDinasUrl} alt="Logo Dinas" className="w-14 h-14 object-contain" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-xs text-blue-800">
                DINAS
              </div>
            )}
          </div>

          <div className="text-center flex-1 px-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">{pengaturan.dinasPendidikan}</h3>
            <h2 className="font-extrabold text-base uppercase tracking-widest text-slate-900">{pengaturan.namaSekolah}</h2>
            <p className="text-[11px] text-slate-600 font-medium">
              {pengaturan.alamatSekolah} | Telp: {pengaturan.noTelpSekolah} | Email: {pengaturan.emailSekolah || '-'}
            </p>
          </div>

          <div className="w-16 h-16 shrink-0 flex items-center justify-center">
            {pengaturan.logoSekolahUrl ? (
              <img src={pengaturan.logoSekolahUrl} alt="Logo Sekolah" className="w-14 h-14 object-contain" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-xs text-emerald-800">
                SEKOLAH
              </div>
            )}
          </div>
        </div>

        {/* Report 1: Presensi View */}
        {selectedReport === 'presensi' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-bold text-base uppercase underline">REKAPITULASI PRESENSI KEHADIRAN SISWA</h3>
              <p className="text-xs text-slate-600 mt-1">
                Kelas: <b>{selectedKelas}</b> | Bulan: <b>{BULAN_NAMES[selectedBulan - 1]}</b> | Tahun: <b>2026</b>
              </p>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr>
                  <th className="py-2 px-2 w-8 text-center">No</th>
                  <th className="py-2 px-2 w-28">NISN</th>
                  <th className="py-2 px-3">Nama Lengkap Siswa</th>
                  <th className="py-2 px-2 text-center w-10">L/P</th>
                  <th className="py-2 px-2 text-center w-14">Hadir (H)</th>
                  <th className="py-2 px-2 text-center w-14">Sakit (S)</th>
                  <th className="py-2 px-2 text-center w-14">Izin (I)</th>
                  <th className="py-2 px-2 text-center w-14">Alpa (A)</th>
                  <th className="py-2 px-2 text-center w-20">% Kehadiran</th>
                </tr>
              </thead>
              <tbody>
                {studentsInClass.map((s, idx) => {
                  const studentAttendance = absensiList.filter((a) => a.siswaId === s.id);
                  const hCount = studentAttendance.filter((a) => a.status === 'H').length;
                  const sCount = studentAttendance.filter((a) => a.status === 'S').length;
                  const iCount = studentAttendance.filter((a) => a.status === 'I').length;
                  const aCount = studentAttendance.filter((a) => a.status === 'A').length;
                  const totalRecorded = hCount + sCount + iCount + aCount || 1;
                  const pct = Math.round((hCount / totalRecorded) * 100);

                  return (
                    <tr key={s.id}>
                      <td className="py-2 px-2 text-center font-mono">{idx + 1}</td>
                      <td className="py-2 px-2 font-mono font-medium">{s.nisn}</td>
                      <td className="py-2 px-3 font-semibold">{s.nama}</td>
                      <td className="py-2 px-2 text-center">{s.jenisKelamin}</td>
                      <td className="py-2 px-2 text-center font-bold text-emerald-700">{hCount}</td>
                      <td className="py-2 px-2 text-center text-amber-700">{sCount}</td>
                      <td className="py-2 px-2 text-center text-blue-700">{iCount}</td>
                      <td className="py-2 px-2 text-center text-rose-700">{aCount}</td>
                      <td className="py-2 px-2 text-center font-mono font-bold">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 2: Leger View */}
        {selectedReport === 'leger' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-bold text-base uppercase underline">LEGER NILAI ASESMEN SUMATIF (1-10) &amp; SAS</h3>
              <p className="text-xs text-slate-600 mt-1">
                Kelas: <b>{selectedKelas}</b> | Mapel: <b>{pengaturan.mapelUtama}</b> | Guru: <b>{pengaturan.namaGuru}</b> | Formula: <b>(Rata Sumatif × 80%) + (SAS × 20%)</b>
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1a3a5c] text-white">
                    <th rowSpan={2} className="py-2 px-2 w-8 text-center border border-slate-600">No</th>
                    <th rowSpan={2} className="py-2 px-2 w-24 border border-slate-600">NISN</th>
                    <th rowSpan={2} className="py-2 px-3 border border-slate-600 min-w-[140px]">Nama Lengkap Siswa</th>
                    <th colSpan={10} className="py-1 px-2 text-center border border-slate-600 bg-sky-900 font-bold">
                      Nilai Sumatif (1 - 10)
                    </th>
                    <th rowSpan={2} className="py-2 px-2 text-center w-24 border border-slate-600 bg-amber-700 font-bold">
                      Rata Sumatif (80%)
                    </th>
                    <th rowSpan={2} className="py-2 px-2 text-center w-16 border border-slate-600">
                      SAS (20%)
                    </th>
                    <th rowSpan={2} className="py-2 px-2 text-center w-20 font-black border border-slate-600 bg-blue-800">
                      Nilai Akhir
                    </th>
                    <th rowSpan={2} className="py-2 px-2 text-center w-16 border border-slate-600">Predikat</th>
                  </tr>
                  <tr className="bg-sky-950 text-white text-center text-[10px]">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((idx) => (
                      <th key={idx} className="py-1 px-1.5 border border-slate-600 min-w-[28px]">
                        S{idx}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {studentsInClass.map((s, idx) => {
                    const studentGrades = nilaiList.filter((n) => n.siswaId === s.id);
                    const sumatifRecords = studentGrades.filter((n) => n.jenis === 'sumatif');
                    const pasScores = studentGrades.filter((n) => n.jenis === 'pas').map((n) => n.skor);

                    const sumatifScores: (number | string)[] = [];
                    const numScores: number[] = [];

                    for (let i = 1; i <= 10; i++) {
                      const found = sumatifRecords.find(
                        (n) =>
                          n.sumatifKe === i ||
                          n.materi?.toLowerCase().includes(`sumatif ${i}`) ||
                          n.materi?.toLowerCase().includes(`sumatif ke-${i}`) ||
                          n.materi?.toLowerCase().includes(`tp ${i}`)
                      );
                      if (found) {
                        sumatifScores.push(found.skor);
                        numScores.push(found.skor);
                      } else {
                        sumatifScores.push('-');
                      }
                    }

                    const allSumatifScores = sumatifRecords.map((n) => n.skor);
                    const activeScores = numScores.length > 0 ? numScores : allSumatifScores;
                    const avgSumatif = activeScores.length
                      ? Math.round(activeScores.reduce((a, b) => a + b, 0) / activeScores.length)
                      : 0;
                    const avgPas = pasScores.length
                      ? Math.round(pasScores.reduce((a, b) => a + b, 0) / pasScores.length)
                      : 0;

                    const na =
                      avgSumatif > 0
                        ? avgPas > 0
                          ? Math.round(avgSumatif * 0.8 + avgPas * 0.2)
                          : avgSumatif
                        : avgPas > 0
                        ? avgPas
                        : 0;

                    let predikat = 'D';
                    if (na >= 90) predikat = 'A (Sangat Baik)';
                    else if (na >= 80) predikat = 'B (Baik)';
                    else if (na >= 70) predikat = 'C (Cukup)';

                    return (
                      <tr key={s.id} className="border-b border-slate-200">
                        <td className="py-2 px-2 text-center font-mono border-r border-slate-200">{idx + 1}</td>
                        <td className="py-2 px-2 font-mono font-medium border-r border-slate-200">{s.nisn}</td>
                        <td className="py-2 px-3 font-semibold border-r border-slate-200">{s.nama}</td>
                        {sumatifScores.map((score, sIdx) => (
                          <td key={sIdx} className="py-2 px-1 text-center font-mono border-r border-slate-200">
                            {score}
                          </td>
                        ))}
                        <td className="py-2 px-2 text-center font-mono font-bold text-amber-700 bg-amber-50/50 border-r border-slate-200">
                          {avgSumatif || '-'}
                        </td>
                        <td className="py-2 px-2 text-center font-mono border-r border-slate-200">
                          {avgPas || '-'}
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-black text-blue-700 bg-blue-50/50 border-r border-slate-200">
                          {na || '-'}
                        </td>
                        <td className="py-2 px-2 text-center font-semibold">{predikat}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Report 3: Agenda View */}
        {selectedReport === 'agenda' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-bold text-base uppercase underline">JURNAL PELAKSANAAN MENGAJAR GURU</h3>
              <p className="text-xs text-slate-600 mt-1">
                Guru: <b>{pengaturan.namaGuru}</b> | NIP: <b>{pengaturan.nipGuru}</b>
              </p>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr>
                  <th className="py-2 px-2 w-8 text-center">No</th>
                  <th className="py-2 px-2 w-24">Tanggal</th>
                  <th className="py-2 px-2 w-16">Kelas</th>
                  <th className="py-2 px-3 w-40">Mata Pelajaran</th>
                  <th className="py-2 px-3">Materi Pokok & Kegiatan</th>
                  <th className="py-2 px-3 w-44">Kendala & Refleksi</th>
                </tr>
              </thead>
              <tbody>
                {agendaList.map((a, idx) => (
                  <tr key={a.id}>
                    <td className="py-2 px-2 text-center font-mono">{idx + 1}</td>
                    <td className="py-2 px-2 font-mono">{a.tanggal}</td>
                    <td className="py-2 px-2 font-semibold">{a.kelas}</td>
                    <td className="py-2 px-3">{a.mapel}</td>
                    <td className="py-2 px-3">
                      <b>{a.materi}</b>
                      <p className="text-[11px] text-slate-600 mt-0.5">{a.kegiatan}</p>
                    </td>
                    <td className="py-2 px-3 text-[11px]">
                      <span className="text-amber-800">Kendala: {a.kendala || '-'}</span>
                      <br />
                      <span className="text-emerald-800">Refleksi: {a.refleksi || '-'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tanda Tangan Sejajar Format Transparan */}
        <div className="mt-8 pt-4">
          <table style={{ border: 'none', width: '100%' }}>
            <tbody>
              <tr style={{ border: 'none' }}>
                <td style={{ border: 'none', width: '50%', textAlign: 'left', verticalAlign: 'top' }}>
                  <p className="text-xs">Mengetahui,</p>
                  <p className="text-xs font-bold">Kepala {pengaturan.namaSekolah}</p>
                  <div style={{ height: '55px' }}></div>
                  <p className="text-xs font-bold underline">{pengaturan.namaKepsek}</p>
                  <p className="text-xs">NIP. {pengaturan.nipKepsek}</p>
                </td>
                <td style={{ border: 'none', width: '50%', textAlign: 'right', verticalAlign: 'top' }}>
                  <p className="text-xs">
                    {pengaturan.kota},{' '}
                    {new Date().toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs font-bold">Guru Mata Pelajaran</p>
                  <div style={{ height: '55px' }}></div>
                  <p className="text-xs font-bold underline">{pengaturan.namaGuru}</p>
                  <p className="text-xs">NIP. {pengaturan.nipGuru}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
