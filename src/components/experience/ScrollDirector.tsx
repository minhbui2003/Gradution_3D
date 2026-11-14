'use client';

import { useEffect } from 'react';

interface ScrollDirectorProps {
  onProgress: (p: number) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  reducedMotion?: boolean;
}

function getScrollSegments(track: HTMLElement = document.documentElement) {
  return Array.from(track.querySelectorAll<HTMLElement>('[data-scene-track]')).map((element) => ({
    top: window.scrollY + element.getBoundingClientRect().top,
    height: element.offsetHeight,
    start: Number(element.dataset.progressStart),
    end: Number(element.dataset.progressEnd),
  }));
}

export function ScrollDirector({ onProgress, scrollContainerRef, reducedMotion = false }: ScrollDirectorProps) {
  useEffect(() => {
    const track = scrollContainerRef.current;
    if (!track) return;
    let segments = getScrollSegments(track);
    let frame = 0;
    let target = 0;
    let current = 0;
    let previousTime = 0;
    let initialized = false;
    const tick = (time: number) => {
      const delta = Math.min((time - previousTime) / 1000 || 1 / 60, .05);
      previousTime = time;
      current += (target - current) * (reducedMotion ? 1 : 1 - Math.exp(-11 * delta));
      if (Math.abs(target - current) < .00003) current = target;
      onProgress(current);
      frame = current === target ? 0 : requestAnimationFrame(tick);
    };
    const update = () => {
      const y = window.scrollY;
      const segment = segments.find((item) => y < item.top + item.height) ?? segments[segments.length - 1];
      if (!segment) return;
      const local = Math.max(0, Math.min(1, (y - segment.top) / Math.max(1, segment.height)));
      target = segment.start + (segment.end - segment.start) * local;
      if (!initialized) { current = target; initialized = true; onProgress(current); }
      if (!frame) { previousTime = performance.now(); frame = requestAnimationFrame(tick); }
    };
    const resize = () => { segments = getScrollSegments(track); update(); };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', resize);
    };
  }, [onProgress, scrollContainerRef, reducedMotion]);
  return null;
}

export function scrollToProgress(progress: number) {
  if (typeof window === 'undefined') return;
  const p = Math.max(0, Math.min(1, progress));
  const segments = getScrollSegments();
  const segment = segments.find((item) => p < item.end) ?? segments[segments.length - 1];
  const top = segment
    ? segment.top + (p - segment.start) / Math.max(.001, segment.end - segment.start) * segment.height
    : p * (document.documentElement.scrollHeight - window.innerHeight);
  window.scrollTo({ top, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}
