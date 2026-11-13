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

const INITIAL_WISHES: WishData[] = [
  {
    id: "wish-1",
    senderName: "Ba Mẹ",
    relation: "Gia đình",
    message: "Chúc mừng con trai đã hoàn thành xuất sắc chặng đường đại học! Ba Mẹ luôn tự hào về con, chúc con vững bước trên con đường tương lai.",
    createdAt: "2026-11-10T14:30:00Z",
    likes: 12,
  },
  {
    id: "wish-2",
    senderName: "Thầy Hùng - Giảng viên HD",
    relation: "Thầy Cô",
    message: "Chúc mừng Nhựt Minh! Thầy đánh giá rất cao tinh thần tự học, nghiên cứu và đồ án tốt nghiệp chỉn chu của em. Chúc em thành công rực rỡ với nghề!",
    createdAt: "2026-11-11T09:15:00Z",
    likes: 8,
  },
  {
    id: "wish-3",
    senderName: "Nhóm Bạn Thân DHCNTT",
    relation: "Bạn bè",
    message: "Chúc mừng bro đã chính thức trở thành Software Engineer! 4 năm qua cùng gánh team, cày deadline tuyệt vời lắm. Hẹn 25/11 chụp cháy máy nhé!",
    createdAt: "2026-11-12T19:40:00Z",
    likes: 15,
  },
];

const STORAGE_KEYS = {
  RSVP: 'iuh_grad_rsvp_v1',
  WISHES: 'iuh_grad_wishes_v1',
};

export class DataAdapter {
  static getWishes(): WishData[] {
    if (typeof window === 'undefined') return INITIAL_WISHES;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WISHES);
      if (!stored) {
        localStorage.setItem(STORAGE_KEYS.WISHES, JSON.stringify(INITIAL_WISHES));
        return INITIAL_WISHES;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_WISHES;
    }
  }

  static addWish(wish: Omit<WishData, 'id' | 'createdAt' | 'likes'>): WishData {
    const newWish: WishData = {
      ...wish,
      id: `wish-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      likes: 1,
    };
    if (typeof window !== 'undefined') {
      try {
        const current = this.getWishes();
        const updated = [newWish, ...current];
        localStorage.setItem(STORAGE_KEYS.WISHES, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save wish to localStorage', err);
      }
    }
    return newWish;
  }

  static likeWish(id: string): number {
    if (typeof window === 'undefined') return 0;
    try {
      const current = this.getWishes();
      let newCount = 0;
      const updated = current.map((w) => {
        if (w.id === id) {
          newCount = w.likes + 1;
          return { ...w, likes: newCount };
        }
        return w;
      });
      localStorage.setItem(STORAGE_KEYS.WISHES, JSON.stringify(updated));
      return newCount;
    } catch {
      return 0;
    }
  }

  static saveRSVP(rsvp: Omit<RSVPData, 'id' | 'createdAt'>): RSVPData {
    const newRsvp: RSVPData = {
      ...rsvp,
      id: `rsvp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.RSVP, JSON.stringify(newRsvp));
      } catch (err) {
        console.warn('Failed to save RSVP', err);
      }
    }
    return newRsvp;
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
