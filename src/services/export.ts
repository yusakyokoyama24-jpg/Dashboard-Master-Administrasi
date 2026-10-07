import * as XLSX from 'xlsx';
import pptxgen from 'pptxgenjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Siswa, Absensi, Nilai, Agenda, Pengaturan, PptPresentation } from '../types';

export const exportService = {
  // 1. Export Siswa to Excel
  exportSiswaToExcel(siswaList: Siswa[], filename = 'Data_Siswa.xlsx') {
    const data = siswaList.map((s, idx) => ({
      No: idx + 1,
      NISN: s.nisn,
      'Nama Lengkap': s.nama,
      Kelas: s.kelas,
      'Jenis Kelamin': s.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
      'No. HP Orang Tua': s.noHpOrtu,
      Alamat: s.alamat,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');
    XLSX.writeFile(wb, filename);
  },

  // 2. Download Template Excel Siswa
  downloadTemplateSiswaExcel(filename = 'Template_Data_Siswa.xlsx') {
    const sampleData = [
      {
        No: 1,
        NISN: '0061234501',
        'Nama Lengkap': 'Ahmad Fauzi Pratama',
        Kelas: 'X RPL 1',
        'Jenis Kelamin': 'L',
        'No. HP Orang Tua': '081234567890',
        Alamat: 'Jl. Merdeka No. 12, Bandung',
      },
      {
        No: 2,
        NISN: '0061234502',
        'Nama Lengkap': 'Anisa Rahmawati',
        Kelas: 'X RPL 1',
        'Jenis Kelamin': 'P',
        'No. HP Orang Tua': '081234567891',
        Alamat: 'Jl. Diponegoro No. 45, Bandung',
      },
      {
        No: 3,
        NISN: '0061234503',
        'Nama Lengkap': 'Budi Santoso',
        Kelas: 'X RPL 1',
        'Jenis Kelamin': 'L',
        'No. HP Orang Tua': '081234567892',
        Alamat: 'Jl. Asia Afrika No. 8, Bandung',
      },
      {
        No: 4,
        NISN: '0061234504',
        'Nama Lengkap': 'Citra Lestari',
        Kelas: 'X RPL 1',
        'Jenis Kelamin': 'P',
        'No. HP Orang Tua': '081234567893',
        Alamat: 'Jl. Sukajadi No. 99, Bandung',
      },
      {
        No: 5,
        NISN: '0061234505',
        'Nama Lengkap': 'Daffa Danendra',
        Kelas: 'X RPL 1',
        'Jenis Kelamin': 'L',
        'No. HP Orang Tua': '081234567894',
        Alamat: 'Jl. Cihampelas No. 15, Bandung',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 15 },
      { wch: 30 },
      { wch: 12 },
      { wch: 15 },
      { wch: 20 },
      { wch: 35 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');
    XLSX.writeFile(wb, filename);
  },

  // 3. Parse Excel file to Siswa[] (Ultra Resilient, Flexible Header & Column Mapping)
  parseSiswaExcel(file: File, defaultKelas = 'X RPL 1'): Promise<Partial<Siswa>[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result;
          if (!arrayBuffer) {
            return reject(new Error('File tidak dapat dibaca.'));
          }

          const wb = XLSX.read(arrayBuffer, { type: 'array' });
          if (!wb.SheetNames || wb.SheetNames.length === 0) {
            return reject(new Error('Workbook Excel tidak memiliki sheet yang valid.'));
          }

          const firstSheet = wb.Sheets[wb.SheetNames[0]];
          // Read sheet as 2D array of raw values to dynamically find header row
          const rawRows: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

          if (!rawRows || rawRows.length === 0) {
            return resolve([]);
          }

          // Step 1: Find the header row (scan up to row 15)
          let headerRowIndex = -1;
          const nameKeywords = ['nama', 'siswa', 'peserta didik', 'student', 'name', 'lengkap'];

          for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
            const rowStrings = rawRows[r].map((cell) => String(cell || '').trim().toLowerCase());
            const hasNameCol = rowStrings.some((cell) => nameKeywords.some((kw) => cell.includes(kw)));
            if (hasNameCol) {
              headerRowIndex = r;
              break;
            }
          }

          // If no row explicitly mentions "nama", default to row 0 if it has headers, or treat row 0 as headers
          if (headerRowIndex === -1) {
            headerRowIndex = 0;
          }

          // Map column indices
          const headers = rawRows[headerRowIndex].map((h) => String(h || '').trim());
          const cleanHeaders = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

          // Find specific column indices
          let colIdxNama = cleanHeaders.findIndex((h) =>
            h.includes('nama') || h.includes('siswa') || h.includes('pesertadidik') || h.includes('student') || h.includes('name')
          );
          let colIdxNisn = cleanHeaders.findIndex((h) =>
            h.includes('nisn') || h.includes('nis') || h.includes('noinduk') || h.includes('nomorinduk') || h.includes('nipd')
          );
          let colIdxKelas = cleanHeaders.findIndex((h) =>
            h.includes('kelas') || h.includes('rombel') || h.includes('rombonganbelajar') || h.includes('tingkat') || h.includes('class')
          );
          let colIdxJk = cleanHeaders.findIndex((h) =>
            h.includes('jk') || h.includes('jeniskelamin') || h.includes('gender') || h.includes('sex') || h.includes('lp')
          );
          let colIdxHp = cleanHeaders.findIndex((h) =>
            h.includes('hp') || h.includes('telp') || h.includes('telepon') || h.includes('kontak') || h.includes('phone')
          );
          let colIdxAlamat = cleanHeaders.findIndex((h) =>
            h.includes('alamat') || h.includes('domisili') || h.includes('address') || h.includes('tinggal')
          );

          // Fallback: If colIdxNama was not found, inspect first data row for text that looks like a name
          if (colIdxNama === -1 && rawRows.length > headerRowIndex + 1) {
            const sampleRow = rawRows[headerRowIndex + 1];
            for (let c = 0; c < sampleRow.length; c++) {
              const val = String(sampleRow[c] || '').trim();
              if (val.length > 2 && isNaN(Number(val)) && !/^[0-9]+$/.test(val)) {
                colIdxNama = c;
                break;
              }
            }
          }

          // If still no name column found, use column 1 or 0
          if (colIdxNama === -1) {
            colIdxNama = headers.length > 1 ? 1 : 0;
          }

          const parsedList: Partial<Siswa>[] = [];
          const now = Date.now();

          // Step 2: Iterate over data rows
          for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
            const row = rawRows[r];
            if (!row || row.length === 0) continue;

            const rawNama = String(row[colIdxNama] ?? '').trim();
            // Ignore empty names, header repeats, or total count rows
            if (!rawNama || rawNama.toLowerCase() === 'nama' || rawNama.toLowerCase().startsWith('total') || rawNama.toLowerCase().startsWith('jumlah')) {
              continue;
            }

            // Extract NISN or auto-generate if empty
            let rawNisn = colIdxNisn !== -1 ? String(row[colIdxNisn] ?? '').trim() : '';
            // Strip decimals if Excel converted number to float e.g. 12345.0
            if (rawNisn.includes('.')) {
              rawNisn = rawNisn.split('.')[0];
            }
            if (!rawNisn || rawNisn === '-' || rawNisn === '0') {
              // Generate deterministic/unique 10-digit NISN format
              const seq = String(r).padStart(3, '0');
              rawNisn = `00${String(now).slice(-5)}${seq}`;
            }

            // Extract Kelas
            let rawKelas = colIdxKelas !== -1 ? String(row[colIdxKelas] ?? '').trim() : '';
            if (!rawKelas || rawKelas === '-') {
              rawKelas = defaultKelas || 'X RPL 1';
            }

            // Extract Gender (L / P)
            let rawJk = colIdxJk !== -1 ? String(row[colIdxJk] ?? '').trim().toUpperCase() : 'L';
            let jenisKelamin: 'L' | 'P' = 'L';
            if (rawJk.startsWith('P') || rawJk.startsWith('W') || rawJk.startsWith('F')) {
              jenisKelamin = 'P';
            } else {
              jenisKelamin = 'L';
            }

            // Extract HP
            let rawHp = colIdxHp !== -1 ? String(row[colIdxHp] ?? '').trim() : '';
            if (rawHp.includes('.')) {
              rawHp = rawHp.split('.')[0];
            }

            // Extract Alamat
            const rawAlamat = colIdxAlamat !== -1 ? String(row[colIdxAlamat] ?? '').trim() : '';

            parsedList.push({
              nisn: rawNisn,
              nama: rawNama,
              kelas: rawKelas,
              jenisKelamin,
              noHpOrtu: rawHp,
              alamat: rawAlamat,
            });
          }

          resolve(parsedList);
        } catch (err) {
          console.error('Error parsing Excel Siswa:', err);
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  },

  // 3. Export Rekap Absensi to Excel
  exportAbsensiToExcel(absensiList: Absensi[], kelas: string, periode: string) {
    const data = absensiList.map((a, idx) => ({
      No: idx + 1,
      Tanggal: a.tanggal,
      'Nama Siswa': a.namaSiswa,
      Kelas: a.kelas,
      Status: a.status,
      Keterangan: a.catatan || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Absensi_${kelas}`);
    XLSX.writeFile(wb, `Rekap_Presensi_${kelas}_${periode}.xlsx`);
  },

  // 4. Export Leger Nilai to Excel (10 Nilai Sumatif + 80% Rata Sumatif)
  exportLegerNilaiToExcel(nilaiList: Nilai[], siswaList: Siswa[], kelas: string) {
    const siswaInClass = siswaList.filter((s) => s.kelas === kelas);
    const data = siswaInClass.map((s, idx) => {
      const studentGrades = nilaiList.filter((n) => n.siswaId === s.id);
      const sumatifRecords = studentGrades.filter((n) => n.jenis === 'sumatif');
      const pasScores = studentGrades.filter((n) => n.jenis === 'pas').map((n) => n.skor);

      // Map values for Nilai Sumatif 1 s/d 10
      const sumatifValues: (number | string)[] = [];
      const numericScores: number[] = [];

      for (let i = 1; i <= 10; i++) {
        const found = sumatifRecords.find(
          (n) =>
            n.sumatifKe === i ||
            n.materi?.toLowerCase().includes(`sumatif ${i}`) ||
            n.materi?.toLowerCase().includes(`sumatif ke-${i}`) ||
            n.materi?.toLowerCase().includes(`tp ${i}`)
        );
        if (found) {
          sumatifValues.push(found.skor);
          numericScores.push(found.skor);
        } else {
          sumatifValues.push('-');
        }
      }

      // Average of all recorded sumatif scores
      const allSumatifScores = sumatifRecords.map((n) => n.skor);
      const activeScores = numericScores.length > 0 ? numericScores : allSumatifScores;
      const avgSumatif = activeScores.length
        ? Math.round(activeScores.reduce((a, b) => a + b, 0) / activeScores.length)
        : 0;
      const avgPas = pasScores.length
        ? Math.round(pasScores.reduce((a, b) => a + b, 0) / pasScores.length)
        : 0;

      // Final score formula: (Rata Sumatif × 80%) + (SAS × 20%)
      const nilaiAkhir =
        avgSumatif > 0
          ? avgPas > 0
            ? Math.round(avgSumatif * 0.8 + avgPas * 0.2)
            : avgSumatif
          : avgPas > 0
          ? avgPas
          : 0;

      let predikat = 'D';
      if (nilaiAkhir >= 90) predikat = 'A (Sangat Baik)';
      else if (nilaiAkhir >= 80) predikat = 'B (Baik)';
      else if (nilaiAkhir >= 70) predikat = 'C (Cukup)';

      return {
        No: idx + 1,
        NISN: s.nisn,
        'Nama Siswa': s.nama,
        Kelas: s.kelas,
        'Nilai Sumatif 1': sumatifValues[0],
        'Nilai Sumatif 2': sumatifValues[1],
        'Nilai Sumatif 3': sumatifValues[2],
        'Nilai Sumatif 4': sumatifValues[3],
        'Nilai Sumatif 5': sumatifValues[4],
        'Nilai Sumatif 6': sumatifValues[5],
        'Nilai Sumatif 7': sumatifValues[6],
        'Nilai Sumatif 8': sumatifValues[7],
        'Nilai Sumatif 9': sumatifValues[8],
        'Nilai Sumatif 10': sumatifValues[9],
        'Rata-rata Sumatif (80%)': avgSumatif,
        'Nilai SAS (20%)': avgPas,
        'Nilai Akhir Rapor': nilaiAkhir,
        Predikat: predikat,
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Leger_${kelas}`);
    XLSX.writeFile(wb, `Leger_Nilai_${kelas}.xlsx`);
  },

  // 4b. Export Agenda to Excel
  exportAgendaToExcel(agendaList: Agenda[], filename = 'Jurnal_Agenda_Mengajar.xlsx') {
    const data = agendaList.map((a, idx) => ({
      No: idx + 1,
      Tanggal: a.tanggal,
      Kelas: a.kelas,
      'Mata Pelajaran': a.mapel,
      'Materi Pokok': a.materi,
      Kegiatan: a.kegiatan,
      Kendala: a.kendala || '-',
      Refleksi: a.refleksi || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Jurnal Agenda');
    XLSX.writeFile(wb, filename);
  },

  // 5. Export PowerPoint (.pptx) via pptxgenjs
  exportPptPresentation(presentation: PptPresentation) {
    const ppt = new pptxgen();
    ppt.layout = 'LAYOUT_16x9';

    // Slide Title
    const titleSlide = ppt.addSlide();
    titleSlide.background = { color: '0A192F' };
    titleSlide.addText(presentation.presentationTitle, {
      x: 1,
      y: 2,
      w: 11.3,
      h: 1.5,
      fontSize: 34,
      bold: true,
      color: '64FFDA',
      align: 'center',
    });
    if (presentation.subject) {
      titleSlide.addText(`Mata Pelajaran: ${presentation.subject}`, {
        x: 1,
        y: 3.8,
        w: 11.3,
        h: 0.8,
        fontSize: 20,
        color: 'CCD6F6',
        align: 'center',
      });
    }
    titleSlide.addText('Tongguru EdAdmin Pro - Media Ajar Interaktif', {
      x: 1,
      y: 6.2,
      w: 11.3,
      h: 0.5,
      fontSize: 12,
      color: '8892B0',
      align: 'center',
    });

    // Content Slides
    presentation.slides.forEach((s) => {
      const slide = ppt.addSlide();
      slide.background = { color: 'F8FAFC' };

      // Header Banner
      slide.addShape(ppt.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 13.33,
        h: 1.2,
        fill: { color: '1A3A5C' },
      });

      slide.addText(s.title, {
        x: 0.8,
        y: 0.25,
        w: 11.5,
        h: 0.7,
        fontSize: 22,
        bold: true,
        color: 'FFFFFF',
      });

      if (s.subtitle) {
        slide.addText(s.subtitle, {
          x: 0.8,
          y: 1.5,
          w: 11.5,
          h: 0.5,
          fontSize: 14,
          italic: true,
          color: '475569',
        });
      }

      // Bullets
      if (s.bullets && s.bullets.length > 0) {
        const bulletItems = s.bullets.map((b) => ({ text: b, options: { bullet: true } }));
        slide.addText(bulletItems, {
          x: 0.8,
          y: 2.2,
          w: 7.5,
          h: 4.2,
          fontSize: 16,
          color: '1E293B',
          lineSpacing: 26,
        });
      }

      // Key Takeaway Card on the right
      if (s.keyTakeaway) {
        slide.addShape(ppt.ShapeType.roundRect, {
          x: 8.8,
          y: 2.2,
          w: 3.8,
          h: 4.0,
          fill: { color: 'EFF6FF' },
          line: { color: '3B82F6', width: 2 },
        });

        slide.addText('💡 PESAN KUNCI:', {
          x: 9.1,
          y: 2.5,
          w: 3.2,
          h: 0.4,
          fontSize: 13,
          bold: true,
          color: '1D4ED8',
        });

        slide.addText(s.keyTakeaway, {
          x: 9.1,
          y: 3.0,
          w: 3.2,
          h: 2.8,
          fontSize: 14,
          color: '1E293B',
        });
      }

      // Speaker Notes
      if (s.speakerNotes) {
        slide.addNotes(s.speakerNotes);
      }
    });

    const safeTitle = presentation.presentationTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
    ppt.writeFile({ fileName: `${safeTitle || 'Bahan_Tayang'}.pptx` });
  },

  // 6. Export Leger Nilai PDF
  exportLegerPdf(nilaiList: Nilai[], siswaList: Siswa[], kelas: string, pengaturan: Pengaturan) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Kop Surat
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(pengaturan.dinasPendidikan.toUpperCase(), 148, 15, { align: 'center' });
    doc.setFontSize(15);
    doc.text(pengaturan.namaSekolah.toUpperCase(), 148, 22, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`${pengaturan.alamatSekolah} | Telp: ${pengaturan.noTelpSekolah}`, 148, 28, { align: 'center' });
    doc.setLineWidth(0.8);
    doc.line(15, 31, 282, 31);
    doc.setLineWidth(0.2);
    doc.line(15, 32, 282, 32);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`LEGER NILAI ASESMEN SUMATIF (1-10) & SAS - KELAS ${kelas.toUpperCase()}`, 148, 40, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Mata Pelajaran: ${pengaturan.mapelUtama} | Guru Pengampu: ${pengaturan.namaGuru} | Formula: (Rata Sumatif × 80%) + (SAS × 20%)`, 15, 46);

    // Table Data
    const siswaInClass = siswaList.filter((s) => s.kelas === kelas);
    const tableBody = siswaInClass.map((s, idx) => {
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
      const sAvg = activeScores.length
        ? Math.round(activeScores.reduce((a, b) => a + b, 0) / activeScores.length)
        : 0;
      const pasVal = pasScores.length
        ? Math.round(pasScores.reduce((a, b) => a + b, 0) / pasScores.length)
        : 0;

      // Formula: (Rata Sumatif × 80%) + (SAS × 20%)
      const na =
        sAvg > 0
          ? pasVal > 0
            ? Math.round(sAvg * 0.8 + pasVal * 0.2)
            : sAvg
          : pasVal > 0
          ? pasVal
          : 0;

      let predikat = 'D';
      if (na >= 90) predikat = 'A';
      else if (na >= 80) predikat = 'B';
      else if (na >= 70) predikat = 'C';

      return [
        idx + 1,
        s.nisn,
        s.nama,
        s.jenisKelamin,
        sumatifScores[0],
        sumatifScores[1],
        sumatifScores[2],
        sumatifScores[3],
        sumatifScores[4],
        sumatifScores[5],
        sumatifScores[6],
        sumatifScores[7],
        sumatifScores[8],
        sumatifScores[9],
        sAvg || '-',
        pasVal || '-',
        na || '-',
        predikat,
      ];
    });

    autoTable(doc, {
      startY: 50,
      head: [
        [
          'No',
          'NISN',
          'Nama Siswa',
          'L/P',
          'S1',
          'S2',
          'S3',
          'S4',
          'S5',
          'S6',
          'S7',
          'S8',
          'S9',
          'S10',
          'Rata (80%)',
          'SAS (20%)',
          'Nilai Akhir',
          'Predikat',
        ],
      ],
      body: tableBody,
      headStyles: { fillColor: [26, 58, 92], textColor: 255, halign: 'center' },
      styles: { fontSize: 7.5, cellPadding: 1.8 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'center', cellWidth: 22 },
        2: { cellWidth: 50 },
        3: { halign: 'center', cellWidth: 10 },
        4: { halign: 'center', cellWidth: 12 },
        5: { halign: 'center', cellWidth: 12 },
        6: { halign: 'center', cellWidth: 12 },
        7: { halign: 'center', cellWidth: 12 },
        8: { halign: 'center', cellWidth: 12 },
        9: { halign: 'center', cellWidth: 12 },
        10: { halign: 'center', cellWidth: 12 },
        11: { halign: 'center', cellWidth: 12 },
        12: { halign: 'center', cellWidth: 12 },
        13: { halign: 'center', cellWidth: 12 },
        14: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
        15: { halign: 'center', cellWidth: 16 },
        16: { halign: 'center', fontStyle: 'bold', cellWidth: 18 },
        17: { halign: 'center', fontStyle: 'bold', cellWidth: 14 },
      },
    });

    // Signature
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    if (finalY < 175) {
      doc.setFontSize(9);
      doc.text(`Mengetahui,`, 30, finalY);
      doc.text(`Kepala ${pengaturan.namaSekolah}`, 30, finalY + 5);
      doc.text(`${pengaturan.namaKepsek}`, 30, finalY + 25);
      doc.text(`NIP. ${pengaturan.nipKepsek}`, 30, finalY + 30);

      doc.text(`${pengaturan.kota}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 220, finalY);
      doc.text(`Guru Mata Pelajaran`, 220, finalY + 5);
      doc.text(`${pengaturan.namaGuru}`, 220, finalY + 25);
      doc.text(`NIP. ${pengaturan.nipGuru}`, 220, finalY + 30);
    }

    doc.save(`Leger_Nilai_${kelas}.pdf`);
  },

  // 7. Export HTML content as Microsoft Word (.doc)
  exportHtmlToWord(htmlContent: string, filename = 'Dokumen_Administrasi.doc') {
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${filename}</title>
    <style>
      body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.4; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 15px; }
      th, td { border: 1px solid #000; padding: 6px; }
      th { background-color: #1a3a5c; color: #ffffff; }
    </style>
    </head><body>`;
    const footer = '</body></html>';
    const sourceHtml = header + htmlContent + footer;

    const blob = new Blob(['\ufeff' + sourceHtml], {
      type: 'application/msword',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.doc') ? filename : `${filename}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
