'use client';

import { useEffect } from 'react';
import { FIRST_MEMORY_PROGRESS, NAVIGATE_EVENT, TRANSITION_EVENT, INTRO_TRANSITION_MS, SCENE_TRANSITION_MS,
  getGestureDestination, getTransitionProgress } from '@/config/navigation';
import { IntroPlayback, clearIntroPlayback } from '@/lib/introPlayback';

interface ScrollDirectorProps {
  onProgress: (p: number) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  reducedMotion?: boolean;
}
function getScrollSegments(track: HTMLElement = document.documentElement) {
  return Array.from(track.querySelectorAll<HTMLElement>('[data-scene-track]')).map((e) => ({
    top: window.scrollY + e.getBoundingClientRect().top, height: e.offsetHeight,
    start: Number(e.dataset.progressStart), end: Number(e.dataset.progressEnd),
  }));
}
const editable = (el: Element | null) => !!el?.closest('input, textarea, select, [contenteditable="true"]');
const modalOpen = () => document.body.style.overflow === 'hidden' || !!document.querySelector('[role="dialog"][aria-modal="true"]');
function canScrollInside(el: Element | null, direction: number) {
  for (let node = el; node && node !== document.body; node = node.parentElement) {
    if (!(node instanceof HTMLElement) || !/(auto|scroll)/.test(getComputedStyle(node).overflowY)
      || node.scrollHeight <= node.clientHeight + 2) continue;
    if (direction > 0 ? node.scrollTop + node.clientHeight < node.scrollHeight - 2 : node.scrollTop > 1) return true;
  }
  return false;
}

export function ScrollDirector({ onProgress, scrollContainerRef, reducedMotion = false }: ScrollDirectorProps) {
  useEffect(() => {
    const track = scrollContainerRef.current;
    if (!track) return;
    let segments = getScrollSegments(track);
    let frame = 0, current = 0, target = 0, previousTime = 0;
    let lastWheelAt = -Infinity, settledAt = -Infinity, wheelAmount = 0, wheelArmed = true;
    let touch: { x: number; y: number; target: Element | null; consumed: boolean } | null = null;
    let flight: { from: number; to: number; started: number; duration: number; intro: boolean;
      backwards: boolean; player: IntroPlayback | null; openingStarted: number | null;
      settlingStarted: number | null } | null = null;
    const readProgress = () => {
      const s = segments.find((s) => window.scrollY < s.top + s.height) ?? segments[segments.length - 1];
      return s ? s.start + (s.end - s.start) * Math.max(0, Math.min(1, (window.scrollY - s.top) / s.height)) : 0;
    };
    const emit = () => {
      track.dataset.journeyProgress = current.toFixed(6);
      track.dataset.journeyTarget = (flight?.to ?? target).toFixed(6);
      track.dataset.journeyState = flight ? flight.intro && flight.openingStarted === null ? 'preparing' : 'traveling' : 'idle';
      onProgress(current);
    };
    const writeScroll = () => {
      const s = segments.find((s) => current < s.end) ?? segments[segments.length - 1];
      if (!s) return;
      const top = Math.round(s.top + (current - s.start) / (s.end - s.start) * s.height);
      window.scrollTo({ top, behavior: 'instant' });
    };
    const tick = (now: number) => {
      if (flight) {
        let complete = false;
        if (flight.intro) {
          if (!flight.player) {
            const video = document.querySelector<HTMLVideoElement>('[data-role="flow-arrival-video"]');
            if (video) flight.player = new IntroPlayback(video, flight.backwards);
          }
          const player = flight.player;
          if (player && flight.openingStarted === null && player.prepared) flight.openingStarted = now;
          if (player && flight.openingStarted !== null) {
            const open = Math.min(1, (now - flight.openingStarted) / 200);
            const ease = (v: number) => v * v * (3 - 2 * v);
            const travelStart = flight.backwards ? .205 : .18;
            const travelEnd = flight.backwards ? .18 : .205;
            if (open < 1) current = flight.from + (travelStart - flight.from) * ease(open);
            else {
              player.start();
              current = travelStart + (travelEnd - travelStart) * player.progress;
              if (player.done) {
                if (flight.settlingStarted === null) flight.settlingStarted = now;
                const settle = Math.min(1, (now - flight.settlingStarted) / 160);
                current = travelEnd + (flight.to - travelEnd) * ease(settle);
                complete = settle === 1;
              }
            }
          }
        } else {
          const t = Math.min(1, (now - flight.started) / flight.duration);
          current = getTransitionProgress(flight.from, flight.to, t);
          complete = t === 1;
        }
        target = current;
        if (complete) {
          current = target = flight.to;
          flight.player?.dispose();
          flight = null; settledAt = now;
          // Keep document scrolling off the critical playback path. All visible
          // layers are fixed; sync the scrollbar only after reaching the stop.
          writeScroll();
        }
      } else {
        const dt = Math.min((now - previousTime) / 1000 || 1 / 60, .05);
        current += (target - current) * (reducedMotion ? 1 : 1 - Math.exp(-11 * dt));
        if (Math.abs(target - current) < .00003) current = target;
      }
      previousTime = now; emit();
      frame = flight || current !== target ? requestAnimationFrame(tick) : 0;
    };
    const navigate = (destination: number) => {
      if (flight || modalOpen() || editable(document.activeElement)) return;
      if (!Number.isFinite(destination)) return;
      const to = Math.max(0, Math.min(1, destination));
      if (Math.abs(to - current) < .0001) return;
      cancelAnimationFrame(frame);
      const intro = current < .18 && to === FIRST_MEMORY_PROGRESS
        || to === 0 && current >= FIRST_MEMORY_PROGRESS && current <= .233;
      const duration = reducedMotion ? 0 : intro ? INTRO_TRANSITION_MS : SCENE_TRANSITION_MS;
      window.dispatchEvent(new CustomEvent(TRANSITION_EVENT, { detail: { from: current, to, duration } }));
      if (reducedMotion) {
        clearIntroPlayback();
        current = target = to; frame = 0; writeScroll(); settledAt = performance.now(); emit(); return;
      }
      if (!intro) clearIntroPlayback();
      flight = { from: current, to, started: performance.now(), duration, intro,
        backwards: to === 0, player: null, openingStarted: null, settlingStarted: null };
      emit(); frame = requestAnimationFrame(tick);
    };
    const onScroll = () => {
      if (modalOpen()) { writeScroll(); return; }
      if (flight) return;
      const next = readProgress();
      if (Math.abs(next - current) < .0001) return;
      clearIntroPlayback();
      window.dispatchEvent(new CustomEvent(TRANSITION_EVENT, { detail: { from: current, to: next, duration: 0 } }));
      target = next;
      if (!frame) { previousTime = performance.now(); frame = requestAnimationFrame(tick); }
    };
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || !e.deltaY) return;
      const el = e.target instanceof Element ? e.target : null;
      const now = performance.now(), gap = now - lastWheelAt;
      lastWheelAt = now;
      const nested = canScrollInside(el, e.deltaY);
      if (modalOpen() || editable(el) || editable(document.activeElement) || nested) {
        wheelArmed = false; wheelAmount = 0; if (!nested) e.preventDefault(); return;
      }
      e.preventDefault();
      if (flight || now - settledAt < 120) { wheelArmed = false; wheelAmount = 0; return; }
      // A continuous touchpad tail is consumed until a quiet gap rearms it.
      if (gap >= 180) { wheelArmed = true; wheelAmount = 0; }
      if (!wheelArmed) return;
      const pixels = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
      if (wheelAmount && Math.sign(wheelAmount) !== Math.sign(pixels)) wheelAmount = 0;
      wheelAmount += pixels;
      if (Math.abs(wheelAmount) < 18) return;
      wheelArmed = false; navigate(getGestureDestination(current, Math.sign(wheelAmount))); wheelAmount = 0;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || modalOpen() || editable(document.activeElement)) return;
      const el = e.target instanceof Element ? e.target : null;
      if (e.key === ' ' && el?.closest('button, a, [role="button"]')) return;
      const dir = ['ArrowDown', 'PageDown', ' '].includes(e.key) ? (e.shiftKey ? -1 : 1)
        : ['ArrowUp', 'PageUp'].includes(e.key) ? -1 : 0;
      if ((!dir && !['Home', 'End'].includes(e.key)) || canScrollInside(el, dir)) return;
      e.preventDefault();
      if (!e.repeat) navigate(e.key === 'Home' ? 0 : e.key === 'End' ? 1 : getGestureDestination(current, dir));
    };
    const onTouchStart = (e: TouchEvent) => {
      touch = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY,
        target: e.target instanceof Element ? e.target : null, consumed: false } : null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!touch || e.touches.length !== 1) return;
      const dy = touch.y - e.touches[0].clientY, dx = touch.x - e.touches[0].clientX;
      if (Math.abs(dx) > Math.abs(dy) || Math.abs(dy) < 3) return;
      const nested = canScrollInside(touch.target, dy);
      if (modalOpen() || editable(touch.target) || editable(document.activeElement) || nested) {
        if (!nested) e.preventDefault(); return;
      }
      e.preventDefault();
      if (!touch.consumed && Math.abs(dy) >= 24) {
        touch.consumed = true; navigate(getGestureDestination(current, Math.sign(dy)));
      }
    };
    const onTouchEnd = () => { touch = null; };
    const onNavigate = (e: Event) => navigate((e as CustomEvent<{ progress: number }>).detail.progress);
    const onResize = () => { segments = getScrollSegments(track); writeScroll(); };
    const onVisibility = () => flight?.player?.syncVisibility();
    current = target = readProgress(); emit();
    document.documentElement.dataset.journeyNavigation = 'ready';
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
    window.addEventListener(NAVIGATE_EVENT, onNavigate);
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(frame); flight?.player?.dispose(); delete document.documentElement.dataset.journeyNavigation;
      window.removeEventListener('scroll', onScroll); window.removeEventListener('wheel', onWheel, true);
      window.removeEventListener('keydown', onKey); window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove, true); window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd); window.removeEventListener(NAVIGATE_EVENT, onNavigate);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [onProgress, scrollContainerRef, reducedMotion]);
  return null;
}
export function scrollToProgress(progress: number) {
  if (typeof window === 'undefined') return;
  const p = Math.max(0, Math.min(1, progress));
  if (document.documentElement.dataset.journeyNavigation === 'ready') {
    window.dispatchEvent(new CustomEvent(NAVIGATE_EVENT, { detail: { progress: p } })); return;
  }
  const segments = getScrollSegments(), s = segments.find((s) => p < s.end) ?? segments[segments.length - 1];
  window.scrollTo({ top: s ? s.top + (p - s.start) / (s.end - s.start) * s.height : 0, behavior: 'instant' });
}
