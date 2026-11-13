'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollDirectorProps {
  onProgress: (p: number) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

export function ScrollDirector({ onProgress, scrollContainerRef }: ScrollDirectorProps) {
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const trigger = ScrollTrigger.create({
      trigger: scrollContainerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.8, // Smooth scrub
      onUpdate: (self) => {
        onProgress(self.progress);
      },
    });

    const handleResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      trigger.kill();
    };
  }, [onProgress, scrollContainerRef]);

  return null;
}

export function scrollToProgress(p: number) {
  if (typeof window === 'undefined') return;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo({
    top: p * maxScroll,
    behavior: 'smooth',
  });
}
