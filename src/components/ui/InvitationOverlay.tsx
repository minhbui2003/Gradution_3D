'use client';

import React from 'react';
import { Calendar, MapPin, Sparkles, ChevronDown } from 'lucide-react';
import { EVENT_DATA } from '@/config/event';
import { scrollToProgress } from '../experience/ScrollDirector';

interface InvitationOverlayProps {
  progress: number;
  onOpenRSVP: () => void;
}

export function InvitationOverlay({ progress, onOpenRSVP }: InvitationOverlayProps) {
  // Visible in Scene 01 (0.00 to 0.18)
  const isVisible = progress <= 0.18;
  if (!isVisible) return null;

  // Fully visible from start 0.00 to 0.12, then gently fades out for transition 0.13 to 0.18
  let opacity = 1;
  if (progress > 0.12) {
    opacity = Math.max(0, 1 - (progress - 0.12) / 0.05);
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none flex flex-col justify-end p-4 sm:p-8 z-10 transition-opacity duration-300"
      style={{ opacity }}
    >
      <div className="w-full flex flex-col sm:flex-row items-end justify-between gap-4 pointer-events-auto">
        {/* Left Side: Compact, Elegant Glassmorphic Invitation Card */}
        <div className="w-full sm:max-w-md glass-panel-light text-navy p-5 rounded-3xl border-2 border-gold/60 shadow-2xl relative overflow-hidden backdrop-blur-md">
          {/* Subtle gold corner motifs */}
          <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-gold m-2 rounded-tl" />
          <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-gold m-2 rounded-tr" />
          <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-gold m-2 rounded-bl" />
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-gold m-2 rounded-br" />

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold/20 border border-gold/40 text-gold-dark text-[10px] font-bold tracking-wider uppercase mb-2">
            <Sparkles size={11} className="text-gold-dark" />
            <span>Thư Mời Lễ Tốt Nghiệp 2026</span>
          </div>

          <p className="text-[10px] sm:text-[11px] font-bold tracking-widest text-iuh uppercase">
            Trường Đại học Công nghiệp TP.HCM • Khoa CNTT
          </p>

          <h1 className="text-xl sm:text-2xl font-serif font-bold text-navy mt-0.5 mb-0.5 tracking-tight">
            {EVENT_DATA.graduate.fullName}
          </h1>

          <div className="inline-block px-2 py-0.5 bg-iuh/10 text-iuh font-semibold rounded-full text-[11px] mb-2.5">
            {EVENT_DATA.graduate.degree}
          </div>

          {/* Date & Hall summary */}
          <div className="grid grid-cols-2 gap-2 p-2 bg-white/70 rounded-xl border border-gray-200/80 mb-3 text-left">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-iuh/10 flex items-center justify-center text-iuh shrink-0">
                <Calendar size={14} />
              </div>
              <div className="truncate">
                <span className="text-[9px] font-medium text-gray-500 uppercase block">Thời gian</span>
                <span className="text-[11px] font-bold text-navy truncate block">25/11/2026</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gold/20 flex items-center justify-center text-gold-dark shrink-0">
                <MapPin size={14} />
              </div>
              <div className="truncate">
                <span className="text-[9px] font-medium text-gray-500 uppercase block">Địa điểm</span>
                <span className="text-[11px] font-bold text-navy truncate block">Hội trường E4</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenRSVP}
              className="flex-1 py-2 px-3 rounded-full bg-gradient-to-r from-iuh to-iuh-dark text-white font-semibold text-xs shadow-md shadow-iuh/25 hover:scale-105 active:scale-95 transition-all text-center"
            >
              Xác nhận tham dự
            </button>
            <button
              onClick={() => scrollToProgress(0.24)}
              className="py-2 px-3 rounded-full border border-gray-300 text-gray-700 font-medium text-xs hover:bg-gray-100 transition-colors text-center"
            >
              Hành trình 4 năm
            </button>
          </div>
        </div>

        {/* Scroll down indicator centered at bottom */}
        <div className="hidden sm:flex flex-col items-center text-gray-300 hover:text-gold transition-colors pb-2">
          <span className="text-[11px] font-medium tracking-wide">Cuộn chuột để tiếp tục</span>
          <ChevronDown size={18} className="text-gold animate-bounce" />
        </div>
      </div>
    </div>
  );
}
