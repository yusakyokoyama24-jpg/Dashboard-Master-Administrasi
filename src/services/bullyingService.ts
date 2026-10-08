import { BullyingReport } from '../types';

const BULLYING_CACHE_KEY = 'tongguru_bullying_reports_cache';

const DEFAULT_BULLYING_REPORTS: BullyingReport[] = [
  {
    id: 'bully_001',
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '10:15',
    isAnonymous: true,
    jenisBullying: 'Verbal',
    lokasiKejadian: 'Kantin Sekolah',
    deskripsi: 'Diejek dan dipanggil dengan nama orang tua di depan teman-teman lain saat jam istirahat.',
    pihakTerlibat: 'Siswa kelas X (dirahasiakan)',
    status: 'Menunggu Penanganan',
    createdAt: new Date().toISOString(),
  },
];

export const bullyingService = {
  async fetchReports(): Promise<BullyingReport[]> {
    try {
      const res = await fetch('/api/bullying');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          localStorage.setItem(BULLYING_CACHE_KEY, JSON.stringify(data));
          return data;
        }
      }
    } catch {
      // offline fallback
    }

    try {
      const cached = localStorage.getItem(BULLYING_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Gagal baca cache bullying:', e);
    }

    localStorage.setItem(BULLYING_CACHE_KEY, JSON.stringify(DEFAULT_BULLYING_REPORTS));
    return DEFAULT_BULLYING_REPORTS;
  },

  async submitReport(payload: Omit<BullyingReport, 'id' | 'createdAt' | 'status'>): Promise<BullyingReport> {
    const newReport: BullyingReport = {
      ...payload,
      id: `bully_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status: 'Menunggu Penanganan',
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/bullying', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReport),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.record) {
          const current = await this.fetchReports();
          const updated = [data.record, ...current];
          localStorage.setItem(BULLYING_CACHE_KEY, JSON.stringify(updated));
          return data.record;
        }
      }
    } catch (err) {
      console.warn('API bullying offline, pakai localStorage:', err);
    }

    const current = await this.fetchReports();
    const updated = [newReport, ...current];
    localStorage.setItem(BULLYING_CACHE_KEY, JSON.stringify(updated));
    return newReport;
  },

  async updateReport(id: string, updates: Partial<BullyingReport>): Promise<BullyingReport | null> {
    try {
      const res = await fetch(`/api/bullying/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.record) {
          const current = await this.fetchReports();
          const updated = current.map((r) => (r.id === id ? data.record : r));
          localStorage.setItem(BULLYING_CACHE_KEY, JSON.stringify(updated));
          return data.record;
        }
      }
    } catch {
      // offline fallback
    }

    const current = await this.fetchReports();
    let target: BullyingReport | null = null;
    const updated = current.map((r) => {
      if (r.id === id) {
        target = { ...r, ...updates };
        return target;
      }
      return r;
    });

    localStorage.setItem(BULLYING_CACHE_KEY, JSON.stringify(updated));
    return target;
  },

  async deleteReport(id: string): Promise<boolean> {
    try {
      await fetch(`/api/bullying/${id}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
    const current = await this.fetchReports();
    const filtered = current.filter((r) => r.id !== id);
    localStorage.setItem(BULLYING_CACHE_KEY, JSON.stringify(filtered));
    return true;
  },
};
