'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ScrollDirector, scrollToProgress } from '@/components/experience/ScrollDirector';
import { InvitationOverlay } from '@/components/ui/InvitationOverlay';
import { StoryOverlay } from '@/components/ui/StoryOverlay';
import { EventDetails } from '@/components/ui/EventDetails';
import { WishesWall } from '@/components/ui/WishesWall';
import { RSVPDrawer } from '@/components/ui/RSVPDrawer';
import { DebugPanel } from '@/components/ui/DebugPanel';
import { MotionAtmosphere } from '@/components/experience/MotionAtmosphere';
import { Pause, Play, ArrowDown } from 'lucide-react';
import { getActiveScene, SCENES } from '@/config/scenes';
import { smoothstep } from '@/lib/sceneProgress';

// Background scenes run freely; the campus walk and doorway follow scroll.
const VideoSceneBackground = dynamic(
  () =>
    import('@/components/experience/VideoSceneBackground').then(
      (mod) => mod.VideoSceneBackground
    ),
  { ssr: false }
);

// One transparent WebGL canvas carries the graduate across the journey.
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
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [settledScene, setSettledScene] = useState<string | null>(null);
  const handleSceneSettled = useCallback((sceneId: string | null) => setSettledScene(sceneId), []);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setMotionEnabled(!preference.matches);
    updateMotion();
    preference.addEventListener('change', updateMotion);
    return () => preference.removeEventListener('change', updateMotion);
  }, []);

  const scene = getActiveScene(progress);
  useEffect(() => setSettledScene(null), [scene.id]);
  const stageOpacity = smoothstep(0.46, 0.48, progress) * (1 - smoothstep(0.56, 0.60, progress));

  return (
    <main className={`experience relative bg-[#07111e] text-paper min-h-screen ${motionEnabled ? '' : 'motion-paused'}`}>
      {/* Shared story progress controls the campus walk and its doorway. */}
      {isMounted && <VideoSceneBackground progress={progress} motionEnabled={motionEnabled} onSceneSettled={handleSceneSettled} />}

      {/* Live 3D foreground (z-[2]) */}
      {isMounted && <ExperienceCanvas progress={progress} motionEnabled={motionEnabled} ceremonyReady={settledScene === 'ceremony' && progress >= .46} />}
      <MotionAtmosphere enabled={motionEnabled} />
      <div className="cinematic-shade" aria-hidden="true" style={{ opacity: 1 - smoothstep(0.10, 0.2, progress) }} />

      {/* Vignette Overlay for cinematic lighting */}
      <div className="fixed inset-0 vignette-overlay z-[5]" />

      {/* HTML Overlays synchronized with scroll progress */}
      <InvitationOverlay
        progress={progress}
        onOpenRSVP={() => setIsRSVPOpen(true)}
      />
      <StoryOverlay progress={progress} />
      {stageOpacity > 0 && <section className="ceremony-caption" style={{ opacity: stageOpacity, transform: `translateY(${(1 - stageOpacity) * 24}px)` }}>
        <span className="section-eyebrow">03 / KHOẢNH KHẮC TỎA SÁNG</span>
        <h2>Và hôm nay,<br /><em>mình đã làm được.</em></h2>
        <p>Một tấm bằng. Vạn lời biết ơn.</p>
      </section>}
      <EventDetails progress={progress} />
      <WishesWall
        progress={progress}
        onOpenRSVP={() => setIsRSVPOpen(true)}
      />

      {/* Slide-out RSVP Drawer */}
      <RSVPDrawer isOpen={isRSVPOpen} onClose={() => setIsRSVPOpen(false)} />

      {/* Dev Debug Inspector */}
      <DebugPanel progress={progress} />
      <div className="experience-controls">
        <button type="button" className="ambient-motion-toggle" onClick={() => setMotionEnabled((value) => !value)} aria-pressed={!motionEnabled} aria-label={motionEnabled ? 'Giảm chuyển động' : 'Bật chuyển động'} title={motionEnabled ? 'Giảm chuyển động' : 'Bật chuyển động'}>
          {motionEnabled ? <Pause size={12} /> : <Play size={12} />}
        </button>
        {progress < .14 && <button type="button" className="scroll-invitation" onClick={() => scrollToProgress(.24)} style={{ opacity: 1 - smoothstep(.08, .14, progress) }}>
          <span>Cuộn để khám phá</span><ArrowDown size={13} />
        </button>}
      </div>

      {/* Shared, damped scroll progress */}
      <ScrollDirector
        onProgress={setProgress}
        scrollContainerRef={scrollContainerRef}
        reducedMotion={!motionEnabled}
      />

      {/* Each memory gets a full scroll beat before the doorway opens. */}
      <div
        ref={scrollContainerRef}
        className="relative w-full pointer-events-none"
        aria-hidden="true"
      >
        {SCENES.map((item) => <div key={item.id} data-scene-track={item.id}
          data-progress-start={item.range[0]} data-progress-end={item.range[1]}
          style={{ height: `${item.scrollScreens * 100}vh` }} />)}
        <div className="h-screen" />
      </div>
    </main>
  );
}
