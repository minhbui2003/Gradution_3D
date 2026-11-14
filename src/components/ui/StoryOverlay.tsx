'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { EVENT_DATA } from '@/config/event';
import { Sparkles, Calendar, BookOpen, X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { scrollToProgress } from '../experience/ScrollDirector';

interface StoryOverlayProps {
  progress: number;
}

export function StoryOverlay({ progress }: StoryOverlayProps) {
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);

  // Visible in Campus & Story section (0.18 to 0.42)
  const isVisible = progress >= 0.17 && progress <= 0.43;

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedStoryIndex !== null) {
        setSelectedStoryIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStoryIndex]);

  if (!isVisible) return null;

  // Derive which story card is active based on sub-progress
  // 0.18 - 0.24: Story 1 (Năm 1)
  // 0.24 - 0.30: Story 2 (Năm 2)
  // 0.30 - 0.36: Story 3 (Năm 3)
  // 0.36 - 0.42: Story 4 (Năm 4)
  const localP = Math.max(0, Math.min(1, (progress - 0.18) / (0.42 - 0.18)));
  const activeIndex = Math.min(3, Math.max(0, Math.floor(localP * 4)));

  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col justify-end pb-4 sm:pb-8 px-3 sm:px-6 z-10 transition-opacity duration-300">
      <div className="w-full max-w-5xl mx-auto pointer-events-auto">
        {/* Section Pill Badge */}
        <div className="text-center mb-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-panel border border-gold/40 text-gold text-[10px] sm:text-xs font-semibold tracking-wider uppercase shadow-lg">
            <Sparkles size={12} className="text-gold" />
            <span>Ký ức 4 năm đại học ({activeIndex + 1}/4) • Nhấn vào ảnh để phóng to</span>
          </div>
        </div>

        {/* 4 Interactive Memory Photos Grid / Gallery Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
          {EVENT_DATA.stories.map((story, idx) => {
            const isActive = idx === activeIndex;
            return (
              <div
                key={story.id}
                onClick={() => setSelectedStoryIndex(idx)}
                className={`group cursor-pointer rounded-2xl p-2.5 sm:p-3 transition-all duration-300 backdrop-blur-md flex flex-col justify-between ${
                  isActive
                    ? 'glass-panel text-white border-2 border-gold shadow-2xl -translate-y-1.5 scale-[1.02] bg-navy/90'
                    : 'glass-panel-light text-navy border border-white/20 hover:border-gold/50 hover:-translate-y-1 bg-white/70 opacity-90'
                }`}
              >
                {/* Photo Thumbnail */}
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-2 shadow-md bg-navy-deep/80">
                  <Image
                    src={story.imageUrl}
                    alt={story.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 45vw, 220px"
                  />
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-navy-deep/90 text-gold text-[9px] font-bold border border-gold/30">
                    {story.year}
                  </div>
                  <div className="absolute bottom-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 size={11} />
                  </div>
                </div>

                {/* Text Content */}
                <div className="flex flex-col text-left">
                  <h4
                    className={`text-xs font-bold leading-tight truncate mb-1 ${
                      isActive ? 'text-white' : 'text-navy'
                    }`}
                  >
                    {story.title}
                  </h4>
                  <p
                    className={`text-[10px] leading-snug line-clamp-2 ${
                      isActive ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  >
                    {story.description}
                  </p>
                </div>

                {/* Indicator dot */}
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/10 text-[9px]">
                  <span className={isActive ? 'text-gold font-semibold' : 'text-gray-400'}>
                    {story.year}
                  </span>
                  <span className={isActive ? 'text-gold' : 'text-gray-400'}>
                    {isActive ? '● Đang xem' : 'Xem ảnh'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enlarged Memory Photo Lightbox Modal with Scroll Isolation */}
      {selectedStoryIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md pointer-events-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedStoryIndex(null);
          }}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div
            className="w-full max-w-2xl bg-navy rounded-3xl border border-gold/50 p-4 sm:p-6 shadow-2xl flex flex-col relative animate-in fade-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-gold/20 text-gold text-xs font-bold border border-gold/30">
                  {EVENT_DATA.stories[selectedStoryIndex].year}
                </span>
                <h3 className="text-sm sm:text-base font-serif font-bold text-white truncate">
                  {EVENT_DATA.stories[selectedStoryIndex].title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStoryIndex(null)}
                aria-label="Đóng xem ảnh"
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Enlarged Photo Container */}
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-white/15 bg-black/40 shadow-inner">
              <Image
                src={EVENT_DATA.stories[selectedStoryIndex].imageUrl}
                alt={EVENT_DATA.stories[selectedStoryIndex].title}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 90vw, 650px"
              />

              {/* Prev/Next Buttons */}
              <button
                onClick={() =>
                  setSelectedStoryIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : 3))
                }
                aria-label="Ảnh trước"
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-gold hover:text-navy transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() =>
                  setSelectedStoryIndex((prev) => (prev !== null && prev < 3 ? prev + 1 : 0))
                }
                aria-label="Ảnh kế tiếp"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-gold hover:text-navy transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Full Caption Description */}
            <div className="mt-3.5 text-left">
              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                {EVENT_DATA.stories[selectedStoryIndex].description}
              </p>
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/10 text-[11px] text-gray-400">
                <span>Trường Đại học Công nghiệp TP.HCM • Khoa CNTT</span>
                <span className="text-gold font-medium">Kỷ niệm thời sinh viên</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
