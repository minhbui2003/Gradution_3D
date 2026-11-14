'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Menu, X, Sparkles, Calendar, BookOpen, Award, Heart } from 'lucide-react';
import { scrollToProgress } from '../experience/ScrollDirector';
import { getActiveScene } from '@/config/scenes';

interface NavigationProps {
  progress: number;
}

const NAV_ITEMS = [
  { id: 'hero', label: 'Thiệp mời', targetP: 0, icon: Sparkles },
  { id: 'campus', label: 'Kỷ niệm', targetP: 0.24, icon: BookOpen },
  { id: 'ceremony', label: 'Lễ trao bằng', targetP: 0.48, icon: Award },
  { id: 'event', label: 'Thông tin lễ', targetP: 0.66, icon: Calendar },
  { id: 'wishes', label: 'Lời chúc & RSVP', targetP: 0.88, icon: Heart },
] as const;

export function Navigation({ progress }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeScene = getActiveScene(progress);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  const handleNavigate = (targetP: number) => {
    setMobileMenuOpen(false);
    scrollToProgress(targetP);
  };

  return (
    <header className="experience-nav fixed top-0 left-0 right-0 z-50 px-3 sm:px-4 py-3 flex items-center justify-between gap-2 pointer-events-none">
      <div className="flex items-center gap-2 sm:gap-3 glass-panel px-2.5 sm:px-3.5 py-1.5 rounded-full border border-gold/30 min-w-0 pointer-events-auto">
        <div className="relative w-8 h-8 shrink-0 rounded-full overflow-hidden border border-gold bg-navy">
          <Image
            src={activeScene.id === 'hero' ? '/images/portrait.png' : '/images/chibi_avatar.png'}
            alt="Ảnh đại diện của Nhựt Minh"
            width={32}
            height={32}
            className="object-cover h-full w-full"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] sm:text-xs font-semibold tracking-wide text-gold uppercase truncate">
            Bùi Tất Nhựt Minh
          </span>
          <span className="text-[10px] text-gray-300 truncate">
            IUH · CLASS OF 2026
          </span>
        </div>
      </div>

      <nav aria-label="Đi đến phân cảnh" className="hidden lg:flex items-center gap-1.5 glass-panel px-3 py-1.5 rounded-full border border-gold/25 pointer-events-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeScene.id === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.targetP)}
              aria-current={isActive ? 'step' : undefined}
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

      <div className="flex items-center gap-2 pointer-events-auto">
        {progress < 0.15 && (
          <button
            type="button"
            onClick={() => handleNavigate(0.24)}
            className="hidden sm:flex items-center px-3 py-1.5 rounded-full text-xs font-medium glass-panel border border-gold/40 text-gold hover:bg-gold/10 transition-colors"
          >
            Khám phá ↓
          </button>
        )}
        <button
          type="button"
          aria-label={mobileMenuOpen ? 'Đóng mục lục phân cảnh' : 'Mở mục lục phân cảnh'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-scene-navigation"
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="lg:hidden p-2 rounded-full glass-panel border border-gold/30 text-white hover:text-gold transition-colors"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <nav
          id="mobile-scene-navigation"
          aria-label="Mục lục phân cảnh trên điện thoại"
          className="absolute top-full right-3 mt-2 w-[min(88vw,300px)] glass-panel rounded-2xl border border-gold/40 p-2 shadow-2xl lg:hidden pointer-events-auto"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeScene.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.targetP)}
                aria-current={isActive ? 'step' : undefined}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${
                  isActive ? 'bg-iuh text-white' : 'text-gray-200 hover:bg-white/10'
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/10" aria-hidden="true">
        <div
          className="h-full bg-gradient-to-r from-iuh via-gold to-gold-light"
          style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        />
      </div>
    </header>
  );
}
