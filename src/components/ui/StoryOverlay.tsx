'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { EVENT_DATA } from '@/config/event';
import { ArrowDown, ArrowUpRight, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { smoothstep } from '@/lib/sceneProgress';
import { CAMPUS_JOURNEY, MEMORY_STOPS, getMemoryOpacity } from '@/config/journey';

interface StoryOverlayProps { progress: number; }

export function StoryOverlay({ progress }: StoryOverlayProps) {
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const isVisible = progress >= CAMPUS_JOURNEY.start && progress < CAMPUS_JOURNEY.nextScene;
  const modalOpen = selectedStoryIndex !== null;

  useEffect(() => { if (!isVisible) setSelectedStoryIndex(null); }, [isVisible]);
  useEffect(() => {
    if (!modalOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, [modalOpen]);
  useEffect(() => {
    if (!modalOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelectedStoryIndex(null); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [modalOpen]);

  if (!isVisible) return null;
  const activeIndex = MEMORY_STOPS.findIndex((stop) => progress >= stop.start && progress < stop.end);
  const stop = activeIndex >= 0 ? MEMORY_STOPS[activeIndex] : null;
  const story = activeIndex >= 0 ? EVENT_DATA.stories[activeIndex] : null;
  const cardOpacity = stop ? getMemoryOpacity(progress, activeIndex) : 0;
  const enter = stop ? smoothstep(stop.start, stop.start + .009, progress) : 0;
  const exit = stop ? smoothstep(stop.holdEnd, stop.end, progress) : 0;
  const headingOpacity = smoothstep(.18, .195, progress) * (1 - smoothstep(.375, .39, progress));
  const doorOpacity = smoothstep(.382, .389, progress) * (1 - smoothstep(.4, .416, progress));
  const phase = progress >= CAMPUS_JOURNEY.doorOpen ? 'opening' : progress >= CAMPUS_JOURNEY.doorHold ? 'door' : activeIndex >= 0 ? 'memory' : 'approach';

  return (
    <div className="campus-story-overlay fixed inset-0 pointer-events-none z-10" data-journey-phase={phase}>
      <div className="memory-heading" style={{ opacity: headingOpacity }}>
        <span className="section-eyebrow">02 / NHỮNG NĂM THÁNG ẤY</span>
        <h2>Bốn năm.<br /><em>Một miền ký ức.</em></h2>
      </div>
      {story && stop && <div className={`memory-stop memory-stop-${stop.side}`} data-story-index={activeIndex}
        style={{ opacity: cardOpacity, visibility: cardOpacity < .01 ? 'hidden' : 'visible',
          transform: `perspective(1100px) translate3d(${(stop.side === 'left' ? -1 : 1) * (1 - enter) * 65}px, ${-exit * 40}px, ${-(1 - enter) * 100 - exit * 100}px) rotateY(${(stop.side === 'left' ? 1 : -1) * (1 - enter) * 8}deg)` }}>
        <article className="memory-stop-card" role="button" tabIndex={cardOpacity > .1 ? 0 : -1}
          aria-label={`Xem ảnh ${story.title}`} onClick={() => setSelectedStoryIndex(activeIndex)}
          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedStoryIndex(activeIndex); } }}>
          <div className="memory-stop-photo">
            <Image src={story.imageUrl} alt={story.title} fill sizes="(max-width: 767px) 82vw, 380px" className="object-cover" />
            <span className="memory-stop-year">{story.year}</span>
          </div>
          <div className="memory-stop-copy">
            <span className="memory-stop-eyebrow">MỘT CHẶNG ĐƯỜNG ĐÁNG NHỚ</span>
            <h3>{story.title}</h3>
            <p>{story.description}</p>
            <span className="memory-stop-link">Lưu giữ khoảnh khắc <ArrowUpRight size={14} /></span>
          </div>
        </article>
      </div>}
      {doorOpacity > 0 && <div className="door-prompt" style={{ opacity: doorOpacity }}>
        <span className="door-prompt-rule" />
        <p>Khép lại một hành trình.</p>
        <span>Cuộn tiếp để mở chương mới</span>
        <ArrowDown size={16} />
      </div>}
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
