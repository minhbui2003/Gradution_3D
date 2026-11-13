export interface RSVPData {
  id?: string;
  fullName: string;
  attendance: 'yes' | 'no';
  guestCount: number;
  message?: string;
  createdAt: string;
}

export interface WishData {
  id: string;
  senderName: string;
  relation: string;
  message: string;
  createdAt: string;
  likes: number;
}

export const INITIAL_WISHES: WishData[] = [
  {
    id: 'wish-1',
    senderName: 'Ba Mẹ',
    relation: 'Gia đình',
    message: '(Lời chúc minh họa) Chúc mừng con trai đã hoàn thành xuất sắc chặng đường đại học! Ba Mẹ luôn tự hào về con, chúc con vững bước trên con đường tương lai.',
    createdAt: '2026-11-10T14:30:00Z',
    likes: 12,
  },
  {
    id: 'wish-2',
    senderName: 'Thầy Hùng - GV Hướng Dẫn',
    relation: 'Thầy Cô',
    message: '(Lời chúc minh họa) Chúc mừng Nhựt Minh! Thầy đánh giá rất cao tinh thần tự học, nghiên cứu và đồ án tốt nghiệp chỉn chu của em. Chúc em thành công rực rỡ với nghề!',
    createdAt: '2026-11-11T09:15:00Z',
    likes: 8,
  },
  {
    id: 'wish-3',
    senderName: 'Nhóm Bạn Thân DHCNTT',
    relation: 'Bạn bè',
    message: '(Lời chúc minh họa) Chúc mừng bro đã chính thức trở thành Software Engineer! 4 năm qua cùng gánh team, cày deadline tuyệt vời lắm. Hẹn 25/11 chụp cháy máy nhé!',
    createdAt: '2026-11-12T19:40:00Z',
    likes: 15,
  },
];

const STORAGE_KEYS = {
  RSVP: 'iuh_grad_rsvp_v2',
  WISHES: 'iuh_grad_wishes_v2',
};

export class DataAdapter {
  // Asynchronously fetch shared wishes from server, falling back to local storage
  static async fetchWishes(): Promise<WishData[]> {
    if (typeof window === 'undefined') return INITIAL_WISHES;
    try {
      const res = await fetch('/api/wishes');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.wishes)) {
          localStorage.setItem(STORAGE_KEYS.WISHES, JSON.stringify(data.wishes));
          return data.wishes;
        }
      }
    } catch (err) {
      console.warn('Using offline cached wishes:', err);
    }
    return this.getWishesSync();
  }

  static getWishesSync(): WishData[] {
    if (typeof window === 'undefined') return INITIAL_WISHES;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WISHES);
      return stored ? JSON.parse(stored) : INITIAL_WISHES;
    } catch {
      return INITIAL_WISHES;
    }
  }

  // Submit new wish to shared server
  static async submitWish(wish: Omit<WishData, 'id' | 'createdAt' | 'likes'>): Promise<WishData> {
    const fallbackWish: WishData = {
      ...wish,
      id: `wish-${Date.now()}`,
      createdAt: new Date().toISOString(),
      likes: 1,
    };

    try {
      const res = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wish),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.wish) {
          const current = this.getWishesSync();
          localStorage.setItem(STORAGE_KEYS.WISHES, JSON.stringify([data.wish, ...current]));
          return data.wish;
        }
      }
    } catch (err) {
      console.warn('Network error saving wish, caching locally:', err);
    }

    const current = this.getWishesSync();
    localStorage.setItem(STORAGE_KEYS.WISHES, JSON.stringify([fallbackWish, ...current]));
    return fallbackWish;
  }

  // Like wish with server update
  static async submitLike(id: string): Promise<number> {
    try {
      const res = await fetch('/api/wishes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          return data.likes;
        }
      }
    } catch (err) {
      console.warn('Error syncing like with server:', err);
    }
    // Fallback local update
    const current = this.getWishesSync();
    let newLikes = 0;
    const updated = current.map((w) => {
      if (w.id === id) {
        newLikes = (w.likes || 0) + 1;
        return { ...w, likes: newLikes };
      }
      return w;
    });
    localStorage.setItem(STORAGE_KEYS.WISHES, JSON.stringify(updated));
    return newLikes;
  }

  // Submit RSVP to shared server
  static async submitRSVP(rsvp: Omit<RSVPData, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rsvp),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Không thể lưu xác nhận' };
      }
      localStorage.setItem(STORAGE_KEYS.RSVP, JSON.stringify(data.record));
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.' };
    }
  }

  static getSavedRSVP(): RSVPData | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RSVP);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}
