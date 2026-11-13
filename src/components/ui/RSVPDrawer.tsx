'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, User, Users, MessageSquare, Send, Loader2 } from 'lucide-react';
import { DataAdapter } from '@/lib/dataAdapter';

interface RSVPDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RSVPDrawer({ isOpen, onClose }: RSVPDrawerProps) {
  const [fullName, setFullName] = useState('');
  const [attendance, setAttendance] = useState<'yes' | 'no'>('yes');
  const [guestCount, setGuestCount] = useState(1);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      const existing = DataAdapter.getSavedRSVP();
      if (existing) {
        setFullName(existing.fullName);
        setAttendance(existing.attendance);
        setGuestCount(existing.guestCount || 1);
        setMessage(existing.message || '');
      }
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên của bạn');
      return;
    }
    setError('');
    setIsSubmitting(true);

    const result = await DataAdapter.submitRSVP({
      fullName: fullName.trim(),
      attendance,
      guestCount: attendance === 'yes' ? guestCount : 0,
      message: message.trim(),
    });

    setIsSubmitting(false);

    if (result.success) {
      setSubmitted(true);
      timeoutRef.current = setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 3000);
    } else {
      setError(result.error || 'Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md h-full bg-navy border-l border-gold/30 p-6 flex flex-col shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div>
            <h3 className="text-lg font-serif font-bold text-white">Xác nhận tham dự (RSVP)</h3>
            <p className="text-xs text-gray-400 mt-0.5">Lễ Tốt Nghiệp Bùi Tất Nhựt Minh</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng biểu mẫu"
            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mb-4">
              <CheckCircle2 size={36} />
            </div>
            <h4 className="text-lg font-bold text-white mb-1">Cảm ơn bạn rất nhiều!</h4>
            <p className="text-xs text-gray-300 max-w-xs leading-relaxed">
              Thông tin xác nhận đã được máy chủ ghi nhận thành công. Nhựt Minh rất mong được đón tiếp bạn tại buổi lễ!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs">
                {error}
              </div>
            )}

            {/* Name Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Họ và tên của bạn <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-gold focus:outline-none text-white text-xs sm:text-sm pl-10"
                />
                <User size={16} className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>

            {/* Attendance Choice */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">
                Bạn có thể đến tham dự không?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAttendance('yes')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    attendance === 'yes'
                      ? 'bg-iuh border-iuh text-white shadow-md shadow-iuh/30'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  🎉 Chắc chắn sẽ đến
                </button>
                <button
                  type="button"
                  onClick={() => setAttendance('no')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    attendance === 'no'
                      ? 'bg-red-900/60 border-red-500/60 text-white'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  💐 Rất tiếc bận rồi
                </button>
              </div>
            </div>

            {/* Guest count if yes */}
            {attendance === 'yes' && (
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Tổng số người tham dự (bao gồm bạn)
                </label>
                <div className="relative">
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-navy-deep border border-white/15 focus:border-gold focus:outline-none text-white text-xs sm:text-sm pl-10"
                  >
                    <option value={1}>1 người (Chỉ mình tôi)</option>
                    <option value={2}>2 người (Tôi và 1 người đi cùng)</option>
                    <option value={3}>3 người (Tôi và 2 người đi cùng)</option>
                    <option value={4}>4 người (Tôi và 3 người đi cùng)</option>
                    <option value={5}>5+ người (Nhóm bạn / gia đình)</option>
                  </select>
                  <Users size={16} className="absolute left-3 top-3 text-gray-400" />
                </div>
              </div>
            )}

            {/* Message */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Lời nhắn gửi đến Nhựt Minh
              </label>
              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Gửi vài lời chúc mừng hoặc nhắn giờ bạn đến nhé..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-gold focus:outline-none text-white text-xs sm:text-sm pl-10 resize-none"
                />
                <MessageSquare size={16} className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>

            <div className="mt-auto pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-full bg-gradient-to-r from-gold to-gold-dark text-navy font-bold text-xs sm:text-sm shadow-lg shadow-gold/20 hover:scale-[1.02] active:scale-98 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang gửi xác nhận...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Gửi Xác Nhận</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
