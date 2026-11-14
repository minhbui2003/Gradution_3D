'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ScrollDirector } from '@/components/experience/ScrollDirector';
import { Navigation } from '@/components/ui/Navigation';
import { InvitationOverlay } from '@/components/ui/InvitationOverlay';
import { StoryOverlay } from '@/components/ui/StoryOverlay';
import { EventDetails } from '@/components/ui/EventDetails';
import { WishesWall } from '@/components/ui/WishesWall';
import { RSVPDrawer } from '@/components/ui/RSVPDrawer';
import { DebugPanel } from '@/components/ui/DebugPanel';

// Dynamically import the 750-frame WebP sequence canvas with SSR disabled
const FrameSequenceCanvas = dynamic(
  () =>
    import('@/components/experience/FrameSequenceCanvas').then(
      (mod) => mod.FrameSequenceCanvas
    ),
  { ssr: false }
);

// Dynamically import transparent Three.js Canvas for Scene 03 Chibi
const ExperienceCanvas = dynamic(
  () =>
    import('@/components/experience/ExperienceCanvas').then(
      (mod) => mod.ExperienceCanvas
    ),
  { ssr: false }
);

export default function GraduationPage() {
  const [progress, setProgress] = useState(0);
  const [isRSVPOpen, setIsRSVPOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <main className="relative bg-[#07111e] text-paper min-h-screen">
      {/* Top Header / Navigation */}
      <Navigation progress={progress} />

      {/* 750-Frame WebP HTML5 Background Canvas (z-0) */}
      {isMounted && <FrameSequenceCanvas progress={progress} />}

      {/* Transparent 3D Stage Canvas for Scene 03 Chibi GLB (z-[2]) */}
      {isMounted && <ExperienceCanvas progress={progress} />}

      {/* Vignette Overlay for cinematic lighting */}
      <div className="fixed inset-0 vignette-overlay z-[5]" />

      {/* HTML Overlays synchronized with scroll progress */}
      <InvitationOverlay
        progress={progress}
        onOpenRSVP={() => setIsRSVPOpen(true)}
      />
      <StoryOverlay progress={progress} />
      <EventDetails progress={progress} />
      <WishesWall
        progress={progress}
        onOpenRSVP={() => setIsRSVPOpen(true)}
      />

      {/* Slide-out RSVP Drawer */}
      <RSVPDrawer isOpen={isRSVPOpen} onClose={() => setIsRSVPOpen(false)} />

      {/* Dev Debug Inspector */}
      <DebugPanel progress={progress} />

      {/* GSAP Scroll Trigger Driver */}
      <ScrollDirector
        onProgress={setProgress}
        scrollContainerRef={scrollContainerRef}
      />

      {/* 700vh Scroll Track driving the journey */}
      <div
        ref={scrollContainerRef}
        className="relative w-full h-[700vh] pointer-events-none"
        aria-hidden="true"
      >
        {/* Invisible spatial section markers for screen readers */}
        <div className="h-[126vh]" title="Thiệp mời & Lời ngỏ" />
        <div className="h-[168vh]" title="Hành trình 4 năm đại học IUH" />
        <div className="h-[126vh]" title="Lễ tốt nghiệp & Vinh danh" />
        <div className="h-[140vh]" title="Thời gian & Địa điểm" />
        <div className="h-[140vh]" title="Sổ lưu bút & Xác nhận tham dự" />
      </div>
    </main>
  );
}
