'use client';

import { useEffect, useRef } from 'react';

type DecodedFrame = ImageBitmap | HTMLImageElement;

export function CameraPathCanvas({ scene, time, active, onReady }: {
  scene: 'scene-02' | 'scene-03'; time: number; active: boolean; onReady: () => void;
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
    const count = scene === 'scene-02' ? 190 : 73;
    const limit = window.innerWidth < 768 ? 12 : 20;
    const decoded = new Map<number, DecodedFrame>();
    const bytes = new Map<number, Blob>();
    const fetching = new Map<number, AbortController>();
    const decoding = new Set<number>();
    const failed = new Set<number>();
    const release = (value: DecodedFrame) => { if ('close' in value) value.close(); };

    const drawImage = (value: DecodedFrame, alpha: number) => {
      const scale = Math.max(canvas.width / value.width, canvas.height / value.height);
      const width = value.width * scale;
      const height = value.height * scale;
      ctx.globalAlpha = alpha;
      ctx.drawImage(value, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    };

    const draw = () => {
      if (!mounted || !activeRef.current) return;
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
    };

    const schedule = () => {
      if (!mounted) return;
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; draw(); });
      pump();
    };

    const decode = async (index: number) => {
      if (!mounted || decoded.has(index) || decoding.has(index) || failed.has(index) || !bytes.has(index)) return;
      decoding.add(index);
      try {
        const blob = bytes.get(index)!;
        let value: DecodedFrame;
        if (typeof createImageBitmap === 'function') value = await createImageBitmap(blob, window.innerWidth < 768 ? { resizeWidth: 768, resizeHeight: 432 } : {});
        else {
          const url = URL.createObjectURL(blob);
          const img = new Image(); img.src = url;
          try { await img.decode(); value = img; } finally { URL.revokeObjectURL(url); }
        }
        if (!mounted) { release(value); return; }
        if (Math.abs(index - targetRef.current) > limit / 2) { release(value); return; }
        decoded.set(index, value);
        while (decoded.size > limit) {
          const oldest = decoded.keys().next().value;
          if (oldest === undefined) break;
          release(decoded.get(oldest)!); decoded.delete(oldest);
        }
        if (!frame) frame = requestAnimationFrame(() => { frame = 0; draw(); });
      } catch { failed.add(index); } finally { decoding.delete(index); }
    };

    const fetchFrame = async (index: number) => {
      const controller = new AbortController(); fetching.set(index, controller);
      try {
        const response = await fetch(`/travel/${scene}/frame-${String(index).padStart(3, '0')}.webp`, { signal: controller.signal, cache: 'force-cache' });
        if (!response.ok) throw new Error(`Frame ${response.status}`);
        const blob = await response.blob();
        if (!mounted) return;
        bytes.set(index, blob);
        if (Math.abs(index - targetRef.current) <= (limit - 4) / 2) await decode(index);
      } catch {
        if (!controller.signal.aborted) failed.add(index);
      } finally { fetching.delete(index); if (mounted) pump(); }
    };

    const pump = () => {
      if (!mounted) return;
      const center = Math.max(0, Math.min(count - 1, Math.floor(targetRef.current)));
      const priority = [0, 1, 2, -1, 3, -2, 4, -3, 5, -4, 6, -5, 7, -6, 8, -7].slice(0, limit - 2).map((offset) => center + offset).filter((index) => index >= 0 && index < count);
      for (const index of priority) { if (bytes.has(index)) void decode(index); }
      // Retain compressed bytes for the full route; only nearby frames occupy decoded memory.
      const order = [...priority, ...Array.from({ length: Math.ceil(count / 8) }, (_, i) => i * 8), ...Array.from({ length: count }, (_, i) => i)];
      for (const index of order) {
        if (fetching.size >= 6) break;
        if (!bytes.has(index) && !fetching.has(index) && !failed.has(index)) void fetchFrame(index);
      }
    };

    scheduleRef.current = schedule;
    window.addEventListener('resize', schedule, { passive: true });
    schedule();
    return () => {
      mounted = false; scheduleRef.current = null;
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      fetching.forEach((controller) => controller.abort());
      decoded.forEach(release); decoded.clear(); bytes.clear();
    };
  }, [scene]);

  return <canvas ref={canvasRef} className="camera-path-canvas" data-camera-scene={scene} aria-hidden="true" />;
}
