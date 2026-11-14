'use client';

import { useEffect } from 'react';

export function MotionAtmosphere({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled || !window.matchMedia('(pointer: fine)').matches) return;
    let frame = 0;
    let x = 0;
    let y = 0;
    const apply = () => {
      frame = 0;
      document.documentElement.style.setProperty('--pointer-x', `${x}`);
      document.documentElement.style.setProperty('--pointer-y', `${y}`);
    };
    const move = (event: PointerEvent) => {
      x = event.clientX / window.innerWidth * 2 - 1;
      y = event.clientY / window.innerHeight * 2 - 1;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const reset = () => { x = 0; y = 0; if (!frame) frame = requestAnimationFrame(apply); };
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', reset);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', reset);
      document.documentElement.style.setProperty('--pointer-x', '0');
      document.documentElement.style.setProperty('--pointer-y', '0');
    };
  }, [enabled]);

  return (
    <div className="motion-atmosphere" aria-hidden="true">
      <div className="ambient-glow ambient-glow-blue" />
      <div className="ambient-glow ambient-glow-gold" />
      {Array.from({ length: 18 }, (_, index) => (
        <i key={index} className="light-mote" style={{
          left: `${(index * 37 + 9) % 100}%`, top: `${(index * 23 + 11) % 100}%`,
          animationDelay: `${-index * 1.7}s`, animationDuration: `${12 + index % 6 * 3}s`,
          width: index % 3 === 0 ? 3 : 2, height: index % 3 === 0 ? 3 : 2,
        }} />
      ))}
    </div>
  );
}
