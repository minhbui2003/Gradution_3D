'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Volume2, VolumeX, Sparkles, Calendar, BookOpen, Award, Heart, MessageSquare } from 'lucide-react';
import { scrollToProgress } from '../experience/ScrollDirector';
import { SCENES, getActiveScene } from '@/config/scenes';

interface NavigationProps {
  progress: number;
}

export function Navigation({ progress }: NavigationProps) {
  const [isMuted, setIsMuted] = useState(true);
  const activeScene = getActiveScene(progress);

  const navItems = [
    { id: 'hero', label: 'Thiệp mời', targetP: 0.00, icon: Sparkles },
    { id: 'campus', label: 'Kỷ niệm', targetP: 0.24, icon: BookOpen },
    { id: 'ceremony', label: 'Lễ trao bằng', targetP: 0.48, icon: Award },
    { id: 'event', label: 'Thông tin lễ', targetP: 0.66, icon: Calendar },
    { id: 'wishes', label: 'Lời chúc & RSVP', targetP: 0.88, icon: Heart },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between pointer-events-auto">
      {/* Brand & Active Scene */}
      <div className="flex items-center gap-3 glass-panel px-3.5 py-1.5 rounded-full border border-gold/30">
        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gold bg-navy">
          <Image
            src="/images/chibi_avatar.png"
            alt="Chibi Nhựt Minh"
            width={32}
            height={32}
            className="object-cover"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold tracking-wider text-gold uppercase">
            Bùi Tất Nhựt Minh
          </span>
          <span className="text-[10px] text-gray-300">
            {activeScene.name} ({(progress * 100).toFixed(0)}%)
          </span>
        </div>
      </div>

      {/* Chapter Navigation Links (Desktop) */}
      <nav className="hidden md:flex items-center gap-1.5 glass-panel px-3 py-1.5 rounded-full border border-gold/25">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScene.id === item.id;
          return (
            <button
              key={item.id}
              onClick={() => scrollToProgress(item.targetP)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? 'bg-iuh text-white shadow-sm shadow-iuh/50'
                  : 'text-gray-200 hover:text-gold hover:bg-white/5'
              }`}
            >
              <Icon size={13} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Skip to Content button (if at hero) */}
        {progress < 0.15 && (
          <button
            onClick={() => scrollToProgress(0.24)}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium glass-panel border border-gold/40 text-gold hover:bg-gold/10 transition-colors"
          >
            <span>Bỏ qua Intro</span>
          </button>
        )}

        {/* Audio Toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          className="p-2 rounded-full glass-panel border border-gold/30 text-gray-200 hover:text-gold hover:scale-105 transition-all"
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      {/* Top progress indicator bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-iuh via-gold to-gold-light transition-all duration-75"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </header>
  );
}
