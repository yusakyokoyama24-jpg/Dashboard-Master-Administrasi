import React, { useState } from 'react';
import { Printer, Copy, FileDown, Check } from 'lucide-react';
import { exportService } from '../../services/export';
import { showToast } from '../../utils/toast';

interface DocPreviewToolbarProps {
  htmlContent: string;
  documentTitle: string;
}

export const DocPreviewToolbar: React.FC<DocPreviewToolbarProps> = ({ htmlContent, documentTitle }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('Tersalin ke Clipboard!', 'success', 'Kode dokumen HTML berhasil disalin.');
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = () => {
    const filename = `${documentTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.doc`;
    exportService.exportHtmlToWord(htmlContent, filename);
    showToast('Dokumen Word Dibuat!', 'success', `File "${filename}" berhasil diunduh.`);
  };

  return (
    <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-slate-800 text-white p-3 rounded-xl shadow-sm mb-4">
      <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        Pratinjau Dokumen Siap Cetak (A4 Standard)
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
        >
          <Printer className="w-3.5 h-3.5" />
          Cetak Dokumen (Ctrl+P)
        </button>

        <button
          onClick={handleExportWord}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
        >
          <FileDown className="w-3.5 h-3.5" />
          Ekspor ke Word (.doc)
        </button>

        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Tersalin' : 'Salin HTML'}
        </button>
      </div>
    </div>
  );
};
