'use client';

import { useEffect, useRef } from 'react';

/** Standalone sample. Receive the existing normalized 0..1 scroll progress from ScrollDirector. */
export interface FrameSequenceCanvasProps {
  progress: number;
}

type Chapter = { id: string; start: number; end: number };
const FRAME_COUNT = 150;
const CHAPTERS: Chapter[] = [
  { id: 'scene-01', start: 0, end: 0.18 },
  { id: 'scene-02', start: 0.18, end: 0.42 },
  { id: 'scene-03', start: 0.42, end: 0.60 },
  { id: 'scene-04', start: 0.60, end: 0.80 },
  { id: 'scene-05', start: 0.80, end: 1 },
];

function selectFrame(progress: number): { chapterIndex: number; index: number; local: number } {
  const p = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const chapterIndex = CHAPTERS.findIndex((chapter, i) => p < chapter.end || i === CHAPTERS.length - 1);
  const chapter = CHAPTERS[chapterIndex];
  const local = Math.max(0, Math.min(1, (p - chapter.start) / (chapter.end - chapter.start)));
  return { chapterIndex, index: Math.round(local * (FRAME_COUNT - 1)), local };
}

function imageUrl(chapterIndex: number, index: number): string {
  return `/sequences/${CHAPTERS[chapterIndex].id}/frame-${String(index).padStart(3, '0')}.webp`;
}

export function FrameSequenceCanvas({ progress }: FrameSequenceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(progress);
  const refreshRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let mounted = true;
    const cache = new Map<string, HTMLImageElement>();
    const loading = new Set<string>();
    let lastImage: HTMLImageElement | null = null;
    const maxCache = window.innerWidth < 768 ? 16 : 32;
    const maxInflight = window.innerWidth < 768 ? 4 : 6;

    const touchCache = (key: string): HTMLImageElement | undefined => {
      const image = cache.get(key);
      if (image) {
        cache.delete(key);
        cache.set(key, image);
      }
      return image;
    };

    const draw = () => {
      if (!mounted) return;
      const { chapterIndex, index } = selectFrame(progressRef.current);
      let image = touchCache(imageUrl(chapterIndex, index));
      // When a frame is not decoded yet, use its nearest loaded neighbor.
      if (!image) {
        for (let offset = 1; offset <= 10 && !image; offset++) {
          for (const candidate of [index - offset, index + offset]) {
            if (candidate >= 0 && candidate < FRAME_COUNT) {
              image = touchCache(imageUrl(chapterIndex, candidate));
              if (image) break;
            }
          }
        }
      }
      image = image ?? lastImage ?? undefined;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(window.innerWidth * dpr));
      const height = Math.max(1, Math.round(window.innerHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      ctx.fillStyle = '#081629';
      ctx.fillRect(0, 0, width, height);
      if (!image || !image.naturalWidth) return;
      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
      const w = image.naturalWidth * scale;
      const h = image.naturalHeight * scale;
      ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
      lastImage = image;
    };

    const loadOne = (url: string) => {
      if (!mounted || cache.has(url) || loading.has(url) || loading.size >= maxInflight) return;
      const img = new Image();
      loading.add(url);
      img.onload = () => {
        loading.delete(url);
        if (!mounted) return;
        cache.set(url, img);
        while (cache.size > maxCache) {
          const oldest = cache.keys().next().value;
          if (!oldest) break;
          cache.delete(oldest);
        }
        draw();
        refreshRef.current?.();
      };
      img.onerror = () => {
        loading.delete(url);
        // Do not retry a missing frame in an infinite loop. The agent should validate file paths.
      };
      img.src = url;
    };

    const refresh = () => {
      if (!mounted) return;
      const { chapterIndex, index, local } = selectFrame(progressRef.current);
      draw();
      // Prioritize the requested frame and its closest neighbors, not the full 750-frame set.
      const offsets = [0, -1, 1, -2, 2, -3, 3, -5, 5, -8, 8];
      for (const offset of offsets) {
        const n = index + offset;
        if (n >= 0 && n < FRAME_COUNT) loadOne(imageUrl(chapterIndex, n));
      }
      if (local > 0.87 && chapterIndex < CHAPTERS.length - 1) {
        loadOne(imageUrl(chapterIndex + 1, 0));
      }
      if (local < 0.13 && chapterIndex > 0) {
        loadOne(imageUrl(chapterIndex - 1, FRAME_COUNT - 1));
      }
    };

    refreshRef.current = refresh;
    window.addEventListener('resize', refresh);
    refresh();
    return () => {
      mounted = false;
      window.removeEventListener('resize', refresh);
      refreshRef.current = null;
      cache.clear();
      loading.clear();
      lastImage = null;
    };
  }, []);

  useEffect(() => {
    progressRef.current = progress;
    refreshRef.current?.();
  }, [progress]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#081629]"
      style={{ backgroundImage: 'url(/sequences/scene-01/frame-000.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
