'use client';

import React, { useState, useEffect } from 'react';
import {
  Heart,
  Plus,
  Send,
  Sparkles,
  X,
  User,
  Users,
  MessageSquare,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { DataAdapter, WishData } from '@/lib/dataAdapter';

interface WishesWallProps {
  progress: number;
  onOpenRSVP: () => void;
}

export function WishesWall({ progress, onOpenRSVP }: WishesWallProps) {
  const [wishes, setWishes] = useState<WishData[]>([]);
  const [isWishModalOpen, setIsWishModalOpen] = useState(false);

  // New wish state
  const [senderName, setSenderName] = useState('');
  const [relation, setRelation] = useState('Bạn bè');
  const [message, setMessage] = useState('');
  const [isSubmittingWish, setIsSubmittingWish] = useState(false);
  const [wishError, setWishError] = useState('');

  // Embedded RSVP state
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpAttendance, setRsvpAttendance] = useState<'yes' | 'no'>('yes');
  const [rsvpGuests, setRsvpGuests] = useState(1);
  const [rsvpMessage, setRsvpMessage] = useState('');
  const [isSubmittingRSVP, setIsSubmittingRSVP] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [rsvpError, setRsvpError] = useState('');

  useEffect(() => {
    // Initial fetch from server
    DataAdapter.fetchWishes().then(setWishes);

    // Pre-fill existing RSVP if available
    const existing = DataAdapter.getSavedRSVP();
    if (existing) {
      setRsvpName(existing.fullName);
      setRsvpAttendance(existing.attendance);
      setRsvpGuests(existing.guestCount || 1);
      setRsvpMessage(existing.message || '');
      setRsvpSuccess(true);
    }
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isWishModalOpen) {
        setIsWishModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWishModalOpen]);

  // Visible in Scene 5: 0.80 to 1.00
  const isVisible = progress >= 0.79;
  if (!isVisible) return null;

  const handleLike = async (id: string) => {
    // Optimistic UI update
    setWishes((prev) =>
      prev.map((w) => (w.id === id ? { ...w, likes: (w.likes || 0) + 1 } : w))
    );
    const newLikes = await DataAdapter.submitLike(id);
    setWishes((prev) =>
      prev.map((w) => (w.id === id ? { ...w, likes: newLikes } : w))
    );
  };

  const handleAddWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !message.trim()) {
      setWishError('Vui lòng điền tên và lời chúc của bạn');
      return;
    }
    setWishError('');
    setIsSubmittingWish(true);

    try {
      const newWish = await DataAdapter.submitWish({
        senderName: senderName.trim(),
        relation,
        message: message.trim(),
      });

      setWishes((prev) => [newWish, ...prev]);
      setSenderName('');
      setMessage('');
      setIsWishModalOpen(false);
    } catch {
      setWishError('Không thể gửi lời chúc lúc này. Vui lòng thử lại.');
    } finally {
      setIsSubmittingWish(false);
    }
  };

  const handleEmbeddedRSVPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim()) {
      setRsvpError('Vui lòng nhập họ và tên của bạn');
      return;
    }
    setRsvpError('');
    setIsSubmittingRSVP(true);

    const result = await DataAdapter.submitRSVP({
      fullName: rsvpName.trim(),
      attendance: rsvpAttendance,
      guestCount: rsvpAttendance === 'yes' ? rsvpGuests : 0,
      message: rsvpMessage.trim(),
    });

    setIsSubmittingRSVP(false);

    if (result.success) {
      setRsvpSuccess(true);
    } else {
      setRsvpError(result.error || 'Có lỗi xảy ra khi lưu RSVP.');
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none flex items-end justify-center pb-3 sm:pb-6 px-3 sm:px-6 z-20 overflow-y-auto">
      <div className="w-full max-w-6xl mx-auto pointer-events-auto">
        {/* 2-Column Responsive Layout: Left Wishes Wall | Right RSVP Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-end">
          {/* LEFT: Wishes Wall (7 cols) */}
          <div className="lg:col-span-7 flex flex-col glass-panel p-3.5 sm:p-5 rounded-3xl border border-gold/40 shadow-2xl backdrop-blur-md">
            {/* Header & New Wish Button */}
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-gold" />
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                  Sổ Lưu Bút Kỷ Niệm ({wishes.length})
                </h3>
              </div>
              <button
                onClick={() => setIsWishModalOpen(true)}
                className="px-3 py-1 rounded-full bg-gold hover:bg-gold-light text-navy text-[11px] sm:text-xs font-bold transition-all shadow-md flex items-center gap-1.5 hover:scale-105 active:scale-95"
              >
                <Plus size={13} />
                <span>Gửi lời chúc</span>
              </button>
            </div>

            {/* Scrollable Wishes List with Scroll Isolation */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 sm:max-h-64 overflow-y-auto p-1"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {wishes.map((item) => (
                <div
                  key={item.id}
                  className="glass-panel-light text-navy p-3 rounded-2xl border border-gold/30 shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-navy truncate max-w-[130px]">
                        {item.senderName}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-iuh/10 text-iuh font-semibold">
                        {item.relation}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-700 leading-snug line-clamp-3">
                      &ldquo;{item.message}&rdquo;
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-200/80">
                    <span className="text-[9px] text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                    <button
                      onClick={() => handleLike(item.id)}
                      aria-label={`Thả tim lời chúc từ ${item.senderName}`}
                      className="flex items-center gap-1 text-[10px] font-semibold text-red-500 hover:scale-110 active:scale-95 transition-transform"
                    >
                      <Heart size={12} className="fill-red-500" />
                      <span>{item.likes || 1}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Embedded RSVP Form (5 cols) */}
          <div
            className="lg:col-span-5 glass-panel p-3.5 sm:p-5 rounded-3xl border border-gold/40 shadow-2xl backdrop-blur-md flex flex-col"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <div className="flex items-center gap-1.5 text-gold text-xs sm:text-sm font-bold uppercase tracking-wider">
                <Users size={15} />
                <span>Xác Nhận Tham Dự (RSVP)</span>
              </div>
              <button
                onClick={onOpenRSVP}
                className="text-[10px] text-gray-300 hover:text-gold underline"
              >
                Mở Drawer
              </button>
            </div>

            {rsvpSuccess ? (
              <div className="p-3 rounded-2xl bg-green-500/15 border border-green-500/30 text-center my-auto">
                <CheckCircle2 size={24} className="text-green-400 mx-auto mb-1" />
                <h4 className="text-xs font-bold text-white">Đã nhận phản hồi RSVP!</h4>
                <p className="text-[11px] text-gray-300 mt-0.5">
                  Cảm ơn <strong>{rsvpName}</strong>. Nhựt Minh rất mong được đón tiếp bạn!
                </p>
                <button
                  onClick={() => setRsvpSuccess(false)}
                  className="mt-2 text-[10px] text-gold underline hover:text-gold-light"
                >
                  Chỉnh sửa lại phản hồi
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmbeddedRSVPSubmit} className="space-y-2 text-left">
                {rsvpError && (
                  <p className="text-[10px] text-red-400 bg-red-950/40 p-1.5 rounded-lg">
                    {rsvpError}
                  </p>
                )}

                {/* Name */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-300 block mb-0.5">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={rsvpName}
                    onChange={(e) => setRsvpName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-gold"
                  />
                </div>

                {/* Attendance choice */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRsvpAttendance('yes')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all ${
                      rsvpAttendance === 'yes'
                        ? 'bg-iuh text-white border-iuh shadow-sm'
                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    ✓ Sẽ có mặt
                  </button>
                  <button
                    type="button"
                    onClick={() => setRsvpAttendance('no')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold border transition-all ${
                      rsvpAttendance === 'no'
                        ? 'bg-red-900/60 text-red-200 border-red-500'
                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    ✕ Không thể đến
                  </button>
                </div>

                {/* Guests & Message */}
                {rsvpAttendance === 'yes' && (
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-gray-300 uppercase font-bold shrink-0">
                      Khách đi cùng:
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setRsvpGuests(num)}
                          className={`w-6 h-6 rounded-lg text-[10px] font-bold border transition-all ${
                            rsvpGuests === num
                              ? 'bg-gold text-navy border-gold'
                              : 'bg-white/5 text-gray-300 border-white/10'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    value={rsvpMessage}
                    onChange={(e) => setRsvpMessage(e.target.value)}
                    placeholder="Lời nhắn gửi Minh (không bắt buộc)..."
                    className="w-full px-2.5 py-1 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-gold"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmittingRSVP}
                  className="w-full py-1.5 rounded-full bg-gradient-to-r from-iuh to-iuh-dark hover:from-iuh-light text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  {isSubmittingRSVP ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}
                  <span>Xác nhận tham dự</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* New Wish Modal */}
      {isWishModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsWishModalOpen(false);
          }}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div
            className="w-full max-w-md bg-navy rounded-3xl border border-gold/40 p-5 shadow-2xl flex flex-col"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h4 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-gold" />
                <span>Gửi Lời Chúc Mừng Tốt Nghiệp</span>
              </h4>
              <button
                onClick={() => setIsWishModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {wishError && (
              <div className="mb-3 p-2 rounded-xl bg-red-500/20 border border-red-500/40 text-xs text-red-300">
                {wishError}
              </div>
            )}

            <form onSubmit={handleAddWish} className="space-y-3 text-left">
              <div>
                <label className="text-xs uppercase font-bold text-gray-300 block mb-1">
                  Tên của bạn *
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Ví dụ: Anh Tuấn, Cô Lan, Nhóm bạn..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-gray-300 block mb-1">
                  Mối quan hệ
                </label>
                <select
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-navy border border-white/20 text-white focus:outline-none focus:border-gold"
                >
                  <option value="Bạn bè">Bạn bè</option>
                  <option value="Thầy Cô">Thầy Cô</option>
                  <option value="Gia đình">Gia đình</option>
                  <option value="Đồng nghiệp">Đồng nghiệp</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-gray-300 block mb-1">
                  Lời chúc gửi đến Nhựt Minh *
                </label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Chúc bạn luôn thành công trên con đường sự nghiệp..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-gold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsWishModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-white/20 text-xs text-gray-300 hover:bg-white/5 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWish}
                  className="px-5 py-2 rounded-full bg-gold hover:bg-gold-light text-navy text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  {isSubmittingWish ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  <span>Gửi lời chúc</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
