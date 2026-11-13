'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Plus, MessageCircle, Send, Sparkles, X, User } from 'lucide-react';
import { DataAdapter, WishData } from '@/lib/dataAdapter';

interface WishesWallProps {
  progress: number;
  onOpenRSVP: () => void;
}

export function WishesWall({ progress, onOpenRSVP }: WishesWallProps) {
  const [wishes, setWishes] = useState<WishData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [relation, setRelation] = useState('Bạn bè');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setWishes(DataAdapter.getWishes());
  }, []);

  // Visible in Scene 5: 0.80 to 1.00
  const isVisible = progress >= 0.79;
  if (!isVisible) return null;

  const handleLike = (id: string) => {
    const newLikes = DataAdapter.likeWish(id);
    setWishes((prev) =>
      prev.map((w) => (w.id === id ? { ...w, likes: newLikes } : w))
    );
  };

  const handleAddWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !message.trim()) {
      setError('Vui lòng điền tên và lời chúc của bạn');
      return;
    }
    setError('');

    const newWish = DataAdapter.addWish({
      senderName: senderName.trim(),
      relation,
      message: message.trim(),
    });

    setWishes((prev) => [newWish, ...prev]);
    setSenderName('');
    setMessage('');
    setIsModalOpen(false);
  };

  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col justify-end pb-8 sm:pb-12 px-4 z-20">
      <div className="w-full max-w-4xl mx-auto flex flex-col pointer-events-auto">
        {/* Header & Action bar */}
        <div className="flex items-center justify-between mb-4 glass-panel px-4 py-2.5 rounded-2xl border border-gold/30">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-gold" />
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Sổ Lưu Bút Kỷ Niệm ({wishes.length})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1.5 rounded-full bg-gold hover:bg-gold-light text-navy text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Gửi lời chúc</span>
            </button>
            <button
              onClick={onOpenRSVP}
              className="px-3 py-1.5 rounded-full bg-iuh hover:bg-iuh-light text-white text-xs font-semibold transition-all shadow-md"
            >
              RSVP
            </button>
          </div>
        </div>

        {/* Wishes Cards Grid (Horizontally scrollable / responsive) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-h-56 sm:max-h-64 overflow-y-auto p-1">
          {wishes.map((item) => (
            <div
              key={item.id}
              className="glass-panel-light text-navy p-3.5 rounded-2xl border border-gold/30 shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-navy truncate max-w-[140px]">
                    {item.senderName}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-iuh/10 text-iuh font-semibold">
                    {item.relation}
                  </span>
                </div>
                <p className="text-xs text-gray-700 leading-snug line-clamp-3">
                  &ldquo;{item.message}&rdquo;
                </p>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200/80">
                <span className="text-[10px] text-gray-400">
                  {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                </span>
                <button
                  onClick={() => handleLike(item.id)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:scale-110 transition-transform"
                >
                  <Heart size={13} className="fill-red-500" />
                  <span>{item.likes}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Wish Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm pointer-events-auto">
          <div className="w-full max-w-md bg-navy rounded-3xl border border-gold/40 p-5 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h4 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                <MessageCircle size={16} className="text-gold" />
                <span>Viết lời chúc gửi Nhựt Minh</span>
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs mb-3">
                {error}
              </div>
            )}

            <form onSubmit={handleAddWish} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Tên của bạn <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Ví dụ: Bạn An (Lớp CNTT)"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 focus:border-gold focus:outline-none text-white text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Mối quan hệ</label>
                <select
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-navy-deep border border-white/15 focus:border-gold focus:outline-none text-white text-xs sm:text-sm"
                >
                  <option value="Bạn bè">Bạn bè</option>
                  <option value="Thầy Cô">Thầy Cô</option>
                  <option value="Gia đình">Gia đình</option>
                  <option value="Đồng nghiệp">Đồng nghiệp</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Lời chúc <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Chúc bạn chặng đường mới luôn gặt hái nhiều thành công..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 focus:border-gold focus:outline-none text-white text-xs sm:text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                className="mt-2 w-full py-2.5 rounded-full bg-gradient-to-r from-gold to-gold-dark text-navy font-bold text-xs sm:text-sm shadow-md hover:scale-[1.02] transition-transform flex items-center justify-center gap-1.5"
              >
                <Send size={15} />
                <span>Đăng Lời Chúc</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
