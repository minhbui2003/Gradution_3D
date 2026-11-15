'use client';

import { useEffect, useRef } from 'react';

type DecodedFrame = ImageBitmap | HTMLImageElement;

export function CameraPathCanvas({ scene, time, active, onReady, frameCount }: {
  scene: string; time: number; active: boolean; onReady: () => void; frameCount?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef(time * 24);
  const activeRef = useRef(active);
  const readyRef = useRef(onReady);
  const scheduleRef = useRef<(() => void) | null>(null);
  readyRef.current = onReady;
  activeRef.current = active;
  if (active) targetRef.current = time * 24;

  useEffect(() => { if (active) scheduleRef.current?.(); }, [time, active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !ctx) return;
    let mounted = true;
    let frame = 0;
    const count = frameCount ?? (scene === 'scene-02' ? 190 : 73);
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    const limit = mobile ? 10 : 16;
    const byteLimit = mobile ? 24 : 48;
    const concurrency = mobile ? 3 : 4;
    const decoded = new Map<number, DecodedFrame>();
    const bytes = new Map<number, Blob>();
    const fetching = new Map<number, AbortController>();
    const decoding = new Set<number>();
    const failed = new Set<number>();
    const release = (value: DecodedFrame) => { if ('close' in value) value.close(); };
    const priorities = () => {
      const center = Math.max(0, Math.min(count - 1, Math.floor(targetRef.current)));
      const offsets = activeRef.current ? [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7] : [0, 1, 2];
      return offsets.slice(0, limit).map((offset) => center + offset).filter((index) => index >= 0 && index < count);
    };
    const trim = <T,>(cache: Map<number, T>, maximum: number, dispose?: (value: T) => void) => {
      const furthest = Array.from(cache.keys()).sort((a, b) => Math.abs(b - targetRef.current) - Math.abs(a - targetRef.current));
      while (cache.size > maximum) {
        const index = furthest.shift()!;
        dispose?.(cache.get(index)!);
        cache.delete(index);
      }
    };

    const drawImage = (value: DecodedFrame, alpha: number) => {
      const scale = Math.max(canvas.width / value.width, canvas.height / value.height);
      const width = value.width * scale;
      const height = value.height * scale;
      ctx.globalAlpha = alpha;
      ctx.drawImage(value, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    };

    const draw = () => {
      if (!mounted || !activeRef.current || document.hidden) return;
      const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1 : 1.25);
      const width = Math.round(window.innerWidth * dpr);
      const height = Math.round(window.innerHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      const position = Math.max(0, Math.min(count - 1, targetRef.current));
      const lower = Math.floor(position);
      const upper = Math.min(count - 1, lower + 1);
      const a = decoded.get(lower);
      const b = decoded.get(upper);
      if (a && b) {
        drawImage(a, 1);
        drawImage(b, position - lower);
        decoded.delete(lower); decoded.set(lower, a);
        decoded.delete(upper); decoded.set(upper, b);
        canvas.dataset.renderedFrame = position.toFixed(4);
        readyRef.current();
      } else {
        let distance = Infinity;
        let nearest: DecodedFrame | null = null;
        let nearestIndex = 0;
        decoded.forEach((value, index) => {
          if (Math.abs(index - position) < distance) { distance = Math.abs(index - position); nearest = value; nearestIndex = index; }
        });
        if (nearest) { drawImage(nearest, 1); canvas.dataset.renderedFrame = String(nearestIndex); if (distance < 1.1) readyRef.current(); }
      }
      ctx.globalAlpha = 1;
      canvas.dataset.framePosition = position.toFixed(4);
      canvas.dataset.decodedFrames = String(decoded.size);
      canvas.dataset.cachedFrames = String(bytes.size);
    };

    const schedule = () => {
      if (!mounted) return;
      const wanted = new Set(priorities());
      fetching.forEach((controller, index) => { if (!wanted.has(index) || document.hidden) controller.abort(); });
      if (document.hidden) return;
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; draw(); });
      pump();
    };

    const decode = async (index: number) => {
      if (!mounted || document.hidden || decoding.size >= 2 || decoded.has(index) || decoding.has(index) || failed.has(index) || !bytes.has(index)) return;
      decoding.add(index);
      try {
        const blob = bytes.get(index)!;
        let value: DecodedFrame;
        if (typeof createImageBitmap === 'function') value = await createImageBitmap(blob, mobile ? { resizeWidth: 960, resizeHeight: 540 } : {});
        else {
          const url = URL.createObjectURL(blob);
          const img = new Image(); img.src = url;
          try { await img.decode(); value = img; } finally { URL.revokeObjectURL(url); }
        }
        if (!mounted) { release(value); return; }
        if (!priorities().includes(index)) { release(value); return; }
        decoded.set(index, value);
        trim(decoded, limit, release);
        if (!frame) frame = requestAnimationFrame(() => { frame = 0; draw(); });
      } catch { failed.add(index); } finally { decoding.delete(index); if (mounted) pump(); }
    };

    const fetchFrame = async (index: number) => {
      const controller = new AbortController(); fetching.set(index, controller);
      try {
        const response = await fetch(`/travel/${scene}/frame-${String(index).padStart(3, '0')}.webp`, { signal: controller.signal, cache: 'force-cache' });
        if (!response.ok) throw new Error(`Frame ${response.status}`);
        const blob = await response.blob();
        if (!mounted) return;
        bytes.set(index, blob);
        trim(bytes, byteLimit);
        if (priorities().includes(index)) await decode(index);
      } catch {
        if (!controller.signal.aborted) failed.add(index);
      } finally { fetching.delete(index); if (mounted) pump(); }
    };

    const pump = () => {
      if (!mounted || document.hidden) return;
      const priority = priorities();
      for (const index of priority) { if (bytes.has(index)) void decode(index); }
      // Warm only the arrival frames. Fetch around the current viewpoint instead
      // of downloading both complete routes when the visitor is still at the hero.
      for (const index of priority) {
        if (fetching.size >= concurrency) break;
        if (!bytes.has(index) && !fetching.has(index) && !failed.has(index)) void fetchFrame(index);
      }
    };

    scheduleRef.current = schedule;
    const reconnect = () => { failed.clear(); schedule(); };
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('online', reconnect);
    document.addEventListener('visibilitychange', schedule);
    schedule();
    return () => {
      mounted = false; scheduleRef.current = null;
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('online', reconnect);
      document.removeEventListener('visibilitychange', schedule);
      fetching.forEach((controller) => controller.abort());
      decoded.forEach(release); decoded.clear(); bytes.clear();
    };
  }, [scene, frameCount]);

  return <canvas ref={canvasRef} className="camera-path-canvas" data-camera-scene={scene} aria-hidden="true" />;
}
