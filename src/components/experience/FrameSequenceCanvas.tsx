'use client';

import React, { useEffect, useRef } from 'react';

export interface FrameSequenceCanvasProps {
  progress: number;
}

interface Chapter {
  id: string;
  start: number;
  end: number;
  name: string;
}

const FRAME_COUNT = 150;

const CHAPTERS: Chapter[] = [
  { id: 'scene-01', start: 0.0, end: 0.18, name: 'Tòa nhà IUH' },
  { id: 'scene-02', start: 0.18, end: 0.42, name: 'Hành lang & Kỷ niệm' },
  { id: 'scene-03', start: 0.42, end: 0.60, name: 'Hội trường & Sân khấu' },
  { id: 'scene-04', start: 0.60, end: 0.80, name: 'Sảnh đại học & Thông tin' },
  { id: 'scene-05', start: 0.80, end: 1.00, name: 'Phòng vinh danh & RSVP' },
];

function selectFrame(progress: number): {
  chapterIndex: number;
  frameIndex: number;
  local: number;
} {
  const p = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const chapterIndex = CHAPTERS.findIndex(
    (chapter, i) => p < chapter.end || i === CHAPTERS.length - 1
  );
  const chapter = CHAPTERS[chapterIndex];
  const span = chapter.end - chapter.start;
  const local = span > 0 ? Math.max(0, Math.min(1, (p - chapter.start) / span)) : 0;
  const frameIndex = Math.min(FRAME_COUNT - 1, Math.max(0, Math.round(local * (FRAME_COUNT - 1))));
  return { chapterIndex, frameIndex, local };
}

function frameUrl(chapterIndex: number, frameIndex: number): string {
  const ch = CHAPTERS[chapterIndex];
  const padded = String(frameIndex).padStart(3, '0');
  return `/sequences/${ch.id}/frame-${padded}.webp`;
}

export function FrameSequenceCanvas({ progress }: FrameSequenceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(progress);
  const rafIdRef = useRef<number | null>(null);
  const scheduleUpdateRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    progressRef.current = progress;
    scheduleUpdateRef.current?.();
  }, [progress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let mounted = true;
    const cache = new Map<string, HTMLImageElement>();
    const pending = new Set<string>();
    let lastRenderedImage: HTMLImageElement | null = null;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const maxCacheSize = isMobile ? 22 : 40;
    const maxConcurrent = isMobile ? 4 : 8;

    const getCached = (url: string): HTMLImageElement | undefined => {
      const img = cache.get(url);
      if (img) {
        // Touch to preserve LRU freshness
        cache.delete(url);
        cache.set(url, img);
      }
      return img;
    };

    const draw = () => {
      if (!mounted) return;

      const p = progressRef.current;
      const { chapterIndex, frameIndex, local } = selectFrame(p);
      const currentUrl = frameUrl(chapterIndex, frameIndex);

      let image = getCached(currentUrl);

      // Nearest-neighbor fallback if current frame is still decoding
      if (!image) {
        for (let offset = 1; offset <= 14; offset++) {
          const before = frameIndex - offset;
          const after = frameIndex + offset;
          if (before >= 0) {
            image = getCached(frameUrl(chapterIndex, before));
            if (image) break;
          }
          if (after < FRAME_COUNT) {
            image = getCached(frameUrl(chapterIndex, after));
            if (image) break;
          }
        }
      }

      image = image ?? lastRenderedImage ?? undefined;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const targetWidth = Math.max(1, Math.round(window.innerWidth * dpr));
      const targetHeight = Math.max(1, Math.round(window.innerHeight * dpr));

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      // Keep the last valid frame on screen while a requested frame is loading.
      // On first load, leave the canvas transparent so the first-frame CSS
      // background underneath remains visible instead of flashing dark.
      if (image && image.naturalWidth > 0 && image.naturalHeight > 0) {
        ctx.fillStyle = '#07111e';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        // Calculate object-fit: cover scaling
        const scale = Math.max(
          targetWidth / image.naturalWidth,
          targetHeight / image.naturalHeight
        );
        const drawW = image.naturalWidth * scale;
        const drawH = image.naturalHeight * scale;
        const drawX = (targetWidth - drawW) / 2;
        const drawY = (targetHeight - drawH) / 2;

        ctx.drawImage(image, drawX, drawY, drawW, drawH);
        lastRenderedImage = image;

        // Subtle crossfade at chapter boundaries if adjoining frame is loaded
        if (local > 0.94 && chapterIndex < CHAPTERS.length - 1) {
          const nextUrl = frameUrl(chapterIndex + 1, 0);
          const nextImg = getCached(nextUrl);
          if (nextImg && nextImg.naturalWidth > 0) {
            // Blend all the way to the next scene before the chapter flips.
            // 0.65 caused a visible opacity jump at every scene boundary.
            const blendAlpha = Math.max(0, Math.min(1, (local - 0.94) / 0.06));
            ctx.save();
            ctx.globalAlpha = blendAlpha;
            const nScale = Math.max(
              targetWidth / nextImg.naturalWidth,
              targetHeight / nextImg.naturalHeight
            );
            const nW = nextImg.naturalWidth * nScale;
            const nH = nextImg.naturalHeight * nScale;
            ctx.drawImage(nextImg, (targetWidth - nW) / 2, (targetHeight - nH) / 2, nW, nH);
            ctx.restore();
          }
        }
      }
    };

    const requestImage = (url: string) => {
      if (!mounted || cache.has(url) || pending.has(url) || pending.size >= maxConcurrent) {
        return;
      }

      const img = new Image();
      pending.add(url);

      img.onload = () => {
        pending.delete(url);
        if (!mounted) return;

        cache.set(url, img);

        // LRU evict oldest items
        while (cache.size > maxCacheSize) {
          const oldestKey = cache.keys().next().value;
          if (!oldestKey) break;
          cache.delete(oldestKey);
        }

        // Trigger draw if this matches or is near current frame
        scheduleDraw();
        preloadLookahead();
      };

      img.onerror = () => {
        pending.delete(url);
      };

      img.src = url;
    };

    const preloadLookahead = () => {
      if (!mounted) return;
      const { chapterIndex, frameIndex, local } = selectFrame(progressRef.current);

      // Prioritize current frame and immediate neighborhood
      const offsets = [0, -1, 1, -2, 2, -3, 3, -5, 5, -8, 8, -12, 12];
      for (const offset of offsets) {
        const candidate = frameIndex + offset;
        if (candidate >= 0 && candidate < FRAME_COUNT) {
          requestImage(frameUrl(chapterIndex, candidate));
        }
      }

      // Preload next scene's start or previous scene's end when approaching boundaries
      if (local > 0.82 && chapterIndex < CHAPTERS.length - 1) {
        requestImage(frameUrl(chapterIndex + 1, 0));
        requestImage(frameUrl(chapterIndex + 1, 1));
        requestImage(frameUrl(chapterIndex + 1, 2));
      }
      if (local < 0.18 && chapterIndex > 0) {
        requestImage(frameUrl(chapterIndex - 1, FRAME_COUNT - 1));
        requestImage(frameUrl(chapterIndex - 1, FRAME_COUNT - 2));
      }
    };

    const scheduleDraw = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        draw();
      });
    };

    const handleUpdate = () => {
      scheduleDraw();
      preloadLookahead();
    };

    scheduleUpdateRef.current = handleUpdate;

    const handleResize = () => {
      scheduleDraw();
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Initial load: eagerly fetch first 5 frames of scene 01
    for (let i = 0; i < 5; i++) {
      requestImage(frameUrl(0, i));
    }
    handleUpdate();

    return () => {
      mounted = false;
      window.removeEventListener('resize', handleResize);
      scheduleUpdateRef.current = null;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      cache.clear();
      pending.clear();
      lastRenderedImage = null;
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#07111e]"
      style={{
        backgroundImage: 'url(/sequences/scene-01/frame-000.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <canvas ref={canvasRef} className="h-full w-full block" />
    </div>
  );
}
