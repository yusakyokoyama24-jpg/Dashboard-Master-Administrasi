import { VisitorStats, KomentarPengunjung } from '../types';

const STATS_STORAGE_KEY = 'tongguru_visitor_stats_cache';
const COMMENTS_STORAGE_KEY = 'tongguru_comments_cache';
const LIKED_COMMENTS_KEY = 'tongguru_liked_comments';
const SESSION_VISITED_KEY = 'tongguru_session_counted';

export const visitorCommentService = {
  getLikedCommentIds(): string[] {
    try {
      const data = localStorage.getItem(LIKED_COMMENTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setLikedCommentId(id: string) {
    try {
      const current = this.getLikedCommentIds();
      if (!current.includes(id)) {
        current.push(id);
        localStorage.setItem(LIKED_COMMENTS_KEY, JSON.stringify(current));
      }
    } catch (e) {
      console.warn('Failed to save liked comment id', e);
    }
  },

  async recordVisit(): Promise<VisitorStats> {
    const isNewSession = !sessionStorage.getItem(SESSION_VISITED_KEY);
    if (isNewSession) {
      sessionStorage.setItem(SESSION_VISITED_KEY, 'true');
    }

    try {
      const res = await fetch('/api/visitors/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isNewSession }),
      });

      if (res.ok) {
        const data = await res.json();
        const stats: VisitorStats = {
          totalVisitors: data.totalVisitors,
          todayVisitors: data.todayVisitors,
          uniqueVisitors: data.uniqueVisitors,
          lastUpdated: data.lastUpdated,
        };
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
        return stats;
      }
    } catch (err) {
      console.warn('[VisitorService] Server unreachable, using local fallback:', err);
    }

    // Fallback if backend network issue
    const cached = this.getCachedStats();
    cached.totalVisitors += 1;
    cached.todayVisitors += 1;
    if (isNewSession) cached.uniqueVisitors += 1;
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(cached));
    return cached;
  },

  async getStats(): Promise<VisitorStats> {
    try {
      const res = await fetch('/api/visitors/stats');
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('[VisitorService] Failed to fetch stats:', err);
    }
    return this.getCachedStats();
  },

  getCachedStats(): VisitorStats {
    try {
      const saved = localStorage.getItem(STATS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      totalVisitors: 1548,
      todayVisitors: 164,
      uniqueVisitors: 992,
      lastUpdated: new Date().toISOString(),
      weeklyTrend: [
        { day: 'Sen', count: 210 },
        { day: 'Sel', count: 245 },
        { day: 'Rab', count: 280 },
        { day: 'Kam', count: 195 },
        { day: 'Jum', count: 230 },
        { day: 'Sab', count: 224 },
        { day: 'Min', count: 164 },
      ],
    };
  },

  async getComments(): Promise<KomentarPengunjung[]> {
    const likedIds = this.getLikedCommentIds();
    try {
      const res = await fetch('/api/comments');
      if (res.ok) {
        const data: KomentarPengunjung[] = await res.json();
        const enriched = data.map((c) => ({
          ...c,
          likedByMe: likedIds.includes(c.id),
        }));
        localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(enriched));
        return enriched;
      }
    } catch (err) {
      console.warn('[VisitorService] Failed to fetch comments:', err);
    }

    // Local cached fallback
    try {
      const saved = localStorage.getItem(COMMENTS_STORAGE_KEY);
      if (saved) {
        const parsed: KomentarPengunjung[] = JSON.parse(saved);
        return parsed.map((c) => ({ ...c, likedByMe: likedIds.includes(c.id) }));
      }
    } catch {}

    return [];
  },

  async addComment(params: {
    nama: string;
    instansi: string;
    role: string;
    komentar: string;
    rating: number;
    emoji?: string;
  }): Promise<KomentarPengunjung> {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Gagal mengirim komentar' }));
      throw new Error(err.error || 'Gagal mengirim komentar');
    }

    const data = await res.json();
    return data.comment;
  },

  async likeComment(commentId: string): Promise<number> {
    this.setLikedCommentId(commentId);
    try {
      const res = await fetch(`/api/comments/${commentId}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        return data.likes;
      }
    } catch (err) {
      console.warn('[VisitorService] Failed to like comment:', err);
    }
    return 1;
  },

  async deleteComment(commentId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  },
};
