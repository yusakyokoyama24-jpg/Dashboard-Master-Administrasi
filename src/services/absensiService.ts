import { Absensi } from '../types';

const ABSENSI_CACHE_KEY = 'tongguru_absensi_v1';

export interface AbsensiSyncEvent {
  type: 'NEW_ABSENSI' | 'UPDATE_ABSENSI' | 'DELETE_ABSENSI' | 'BATCH_ABSENSI';
  record?: Absensi;
  items?: Absensi[];
  id?: string;
}

export const absensiService = {
  notifyChange() {
    try {
      window.dispatchEvent(new Event('tongguru_absensi_data_changed'));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('tongguru_absensi_channel');
        bc.postMessage({ type: 'DATA_CHANGED', timestamp: Date.now() });
        bc.close();
      }
    } catch {
      // ignore
    }
  },

  // Real-Time Server-Sent Events (SSE) stream listener from /api/absensi/stream
  subscribeRealtime(onEvent: (event: AbsensiSyncEvent) => void): () => void {
    let es: EventSource | null = null;
    try {
      if (typeof window !== 'undefined' && typeof EventSource !== 'undefined') {
        es = new EventSource('/api/absensi/stream');
        es.onmessage = (ev) => {
          try {
            if (!ev.data || ev.data.trim() === '') return;
            const data = JSON.parse(ev.data);
            if (data && data.type) {
              onEvent(data);
            }
          } catch (e) {
            console.debug('SSE absensi ping/parse issue:', e);
          }
        };
        es.onerror = () => {
          // SSE automatically reconnects
        };
      }
    } catch (err) {
      console.warn('Real-time SSE absensi not supported or blocked:', err);
    }

    return () => {
      if (es) {
        es.close();
      }
    };
  },

  // Fetch attendances from server API with local storage fallback
  async fetchAbsensi(filters?: { tanggal?: string; kelas?: string; siswaId?: string }): Promise<Absensi[]> {
    const params = new URLSearchParams();
    if (filters?.tanggal) params.append('tanggal', filters.tanggal);
    if (filters?.kelas && filters.kelas !== 'all') params.append('kelas', filters.kelas);
    if (filters?.siswaId) params.append('siswaId', filters.siswaId);

    try {
      const res = await fetch(`/api/absensi?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Update local cache
          try {
            localStorage.setItem(ABSENSI_CACHE_KEY, JSON.stringify(data));
          } catch {}
          return data;
        }
      }
    } catch (err) {
      console.warn('Server absensi offline, falling back to local cache:', err);
    }

    // Fallback to localStorage
    try {
      const raw = localStorage.getItem(ABSENSI_CACHE_KEY);
      if (raw) {
        let items: Absensi[] = JSON.parse(raw);
        if (filters?.tanggal) items = items.filter((a) => a.tanggal === filters.tanggal);
        if (filters?.kelas && filters.kelas !== 'all') items = items.filter((a) => a.kelas === filters.kelas);
        if (filters?.siswaId) items = items.filter((a) => a.siswaId === filters.siswaId);
        return items;
      }
    } catch {}

    return [];
  },

  // Record single attendance to server with instant fallback
  async recordAbsensi(record: Absensi): Promise<Absensi> {
    try {
      const res = await fetch('/api/absensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      if (res.ok) {
        const data = await res.json();
        const saved = data.record || record;
        this.updateLocalCache(saved);
        this.notifyChange();
        return saved;
      }
    } catch (err) {
      console.warn('Gagal POST absensi ke server, simpan offline:', err);
    }

    this.updateLocalCache(record);
    this.notifyChange();
    return record;
  },

  // Batch record attendance (from manual checklist)
  async recordBatchAbsensi(items: Absensi[]): Promise<boolean> {
    try {
      const res = await fetch('/api/absensi/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (res.ok) {
        // sync local cache
        items.forEach((item) => this.updateLocalCache(item));
        this.notifyChange();
        return true;
      }
    } catch (err) {
      console.warn('Gagal POST batch absensi ke server, simpan offline:', err);
    }

    items.forEach((item) => this.updateLocalCache(item));
    this.notifyChange();
    return true;
  },

  // Helper to maintain localStorage consistency
  updateLocalCache(item: Absensi) {
    try {
      const raw = localStorage.getItem(ABSENSI_CACHE_KEY);
      const list: Absensi[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((a) => a.siswaId === item.siswaId && a.tanggal === item.tanggal);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...item };
      } else {
        list.unshift(item);
      }
      localStorage.setItem(ABSENSI_CACHE_KEY, JSON.stringify(list));
    } catch {}
  },
};
