'use client';

import React from 'react';
import Image from 'next/image';
import { EVENT_DATA } from '@/config/event';
import { Sparkles, Calendar, BookOpen } from 'lucide-react';

interface StoryOverlayProps {
  progress: number;
}

export function StoryOverlay({ progress }: StoryOverlayProps) {
  // Visible in Campus & Story section (0.18 to 0.42)
  const isVisible = progress >= 0.18 && progress <= 0.42;
  if (!isVisible) return null;

  // Derive which story card is active based on sub-progress
  // 0.18 - 0.24: Story 1 (Năm 1)
  // 0.24 - 0.30: Story 2 (Năm 2)
  // 0.30 - 0.36: Story 3 (Năm 3)
  // 0.36 - 0.42: Story 4 (Năm 4)
  const localP = (progress - 0.18) / (0.42 - 0.18); // 0 to 1
  const activeIndex = Math.min(3, Math.max(0, Math.floor(localP * 4)));
  const activeStory = EVENT_DATA.stories[activeIndex] || EVENT_DATA.stories[0];

  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col justify-end pb-8 sm:pb-10 px-4 z-10 transition-opacity duration-300">
      <div className="w-full max-w-md sm:max-w-xl mx-auto pointer-events-auto">
        {/* Section Pill Badge */}
        <div className="text-center mb-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-panel border border-gold/40 text-gold text-[11px] font-semibold tracking-wider uppercase shadow-lg">
            <Sparkles size={13} className="text-gold" />
            <span>Hành trình Đại học ({activeIndex + 1}/4)</span>
          </div>
        </div>

        {/* Luxury Glass Card */}
        <div className="glass-panel text-white p-3.5 sm:p-4 rounded-2xl border border-gold/40 shadow-2xl flex flex-row gap-3.5 items-center backdrop-blur-md">
          {/* Photo Thumbnail */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shadow-md border border-gold/30 shrink-0 bg-navy">
            <Image
              src={activeStory.imageUrl}
              alt={activeStory.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 96px, 112px"
            />
            <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-navy-deep/90 text-gold text-[10px] font-bold border border-gold/30">
              {activeStory.year}
            </div>
          </div>

          {/* Text Content */}
          <div className="flex flex-col text-left flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-semibold text-gold uppercase tracking-wider">
                {activeStory.year} • IUH Memories
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-serif font-bold text-white leading-tight mb-1 truncate">
              {activeStory.title}
            </h3>
            <p className="text-[11px] sm:text-xs text-gray-200 leading-snug line-clamp-2 mb-2">
              {activeStory.description}
            </p>

            {/* Pagination dots & helper note */}
            <div className="flex items-center justify-between mt-auto pt-1 border-t border-white/10">
              <div className="flex items-center gap-1.5">
                {EVENT_DATA.stories.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === activeIndex ? 'w-5 bg-gold' : 'w-2 bg-white/30'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[9px] text-gray-400 italic">
                (Ký ức thời sinh viên)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
