'use client';

import React from 'react';
import Image from 'next/image';
import { EVENT_DATA } from '@/config/event';
import { Sparkles, Calendar } from 'lucide-react';

interface StoryOverlayProps {
  progress: number;
}

export function StoryOverlay({ progress }: StoryOverlayProps) {
  // Visible in Campus & Story section (0.18 to 0.42)
  const isVisible = progress >= 0.18 && progress <= 0.42;
  if (!isVisible) return null;

  // Derive which story card is active based on sub-progress
  // 0.20 - 0.25: Story 1
  // 0.25 - 0.30: Story 2
  // 0.30 - 0.35: Story 3
  // 0.35 - 0.41: Story 4
  const localP = (progress - 0.18) / (0.42 - 0.18); // 0 to 1
  const activeIndex = Math.min(3, Math.floor(localP * 4));
  const activeStory = EVENT_DATA.stories[activeIndex] || EVENT_DATA.stories[0];

  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col justify-end pb-12 sm:pb-16 px-4 z-10">
      <div className="w-full max-w-lg mx-auto pointer-events-auto">
        {/* Section Title */}
        <div className="text-center mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-panel border border-gold/30 text-gold text-xs font-semibold uppercase tracking-wider">
            <Sparkles size={12} />
            <span>Ký ức thời sinh viên ({activeIndex + 1}/4)</span>
          </div>
        </div>

        {/* Polaroid Card */}
        <div className="glass-panel-light text-navy p-4 sm:p-5 rounded-2xl border border-gold/40 shadow-2xl flex flex-col sm:flex-row gap-4 items-center">
          {/* Photo */}
          <div className="relative w-full sm:w-44 h-40 rounded-xl overflow-hidden shadow-inner bg-navy/10 shrink-0">
            <Image
              src={activeStory.imageUrl}
              alt={activeStory.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 176px"
            />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-navy/80 text-gold text-[10px] font-bold">
              {activeStory.year}
            </div>
          </div>

          {/* Text Content */}
          <div className="flex flex-col text-left">
            <h3 className="text-base sm:text-lg font-serif font-bold text-navy mb-1 leading-snug">
              {activeStory.title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mb-3">
              {activeStory.description}
            </p>

            {/* Pagination dots */}
            <div className="flex items-center gap-1.5 mt-auto">
              {EVENT_DATA.stories.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeIndex ? 'w-6 bg-iuh' : 'w-2 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
