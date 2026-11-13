'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, User, Users, MessageSquare, Send } from 'lucide-react';
import { DataAdapter, RSVPData } from '@/lib/dataAdapter';

interface RSVPDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RSVPDrawer({ isOpen, onClose }: RSVPDrawerProps) {
  const [fullName, setFullName] = useState('');
  const [attendance, setAttendance] = useState<'yes' | 'no'>('yes');
  const [guestCount, setGuestCount] = useState(1);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const existing = DataAdapter.getSavedRSVP();
      if (existing) {
        setFullName(existing.fullName);
        setAttendance(existing.attendance);
        setGuestCount(existing.guestCount);
        setMessage(existing.message || '');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên của bạn');
      return;
    }
    setError('');

    DataAdapter.saveRSVP({
      fullName: fullName.trim(),
      attendance,
      guestCount: attendance === 'yes' ? guestCount : 0,
      message: message.trim(),
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity">
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
            <p className="text-xs text-gray-300 max-w-xs">
              Thông tin xác nhận của bạn đã được ghi nhận thành công. Nhựt Minh rất mong được đón tiếp bạn vào ngày 25/11!
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
                  Số lượng người đi cùng
                </label>
                <div className="relative">
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-navy-deep border border-white/15 focus:border-gold focus:outline-none text-white text-xs sm:text-sm pl-10"
                  >
                    <option value={1}>Đi một mình (1 người)</option>
                    <option value={2}>Đi cùng bạn/người thân (2 người)</option>
                    <option value={3}>Đi nhóm (3 người)</option>
                    <option value={4}>Đi nhóm (4+ người)</option>
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
                className="w-full py-3 rounded-full bg-gradient-to-r from-gold to-gold-dark text-navy font-bold text-xs sm:text-sm shadow-lg shadow-gold/20 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Send size={16} />
                <span>Gửi Xác Nhận</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
