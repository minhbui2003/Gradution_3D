'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SCENES, getActiveScene } from '@/config/scenes';
import { CAMPUS_JOURNEY, MEMORY_STOPS, getCampusVideoTime, getHallEntryTime, getCampusHold } from '@/config/journey';
import { FLOW_PILOT, getFlowArrivalTime } from '@/config/flowPilot';
import { CameraPathCanvas } from './CameraPathCanvas';
import { smoothstep } from '@/lib/sceneProgress';
import { FIRST_MEMORY_PROGRESS, TRANSITION_EVENT, JourneyTransition } from '@/config/navigation';

interface VideoSceneBackgroundProps {
  progress: number;
  motionEnabled: boolean;
  onSceneSettled: (sceneId: string | null) => void;
}

function StopAmbience({ id, opacity, active, motionEnabled, src }: { id: string; opacity: number; active: boolean; motionEnabled: boolean; src?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const sync = () => {
      if (video.readyState >= 2) setReady(true);
      if (active && motionEnabled && !document.hidden) { video.muted = true; video.play().catch(() => {}); }
      else video.pause();
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    document.addEventListener('pointerdown', sync, { passive: true });
    return () => { video.pause(); document.removeEventListener('visibilitychange', sync); document.removeEventListener('pointerdown', sync); };
  }, [active, motionEnabled]);
  return <video ref={ref} className="scene-video stop-ambience" data-role="stop-ambience" data-stop={id}
    src={src ?? `/videos/${id}.mp4`} loop muted playsInline preload="auto" disablePictureInPicture tabIndex={-1}
    onLoadedData={() => setReady(true)} onPlaying={() => setReady(true)} style={{ opacity: ready ? opacity : 0 }} />;
}

function FlowArrival({ progress, active, motionEnabled, onReady }: {
  progress: number; active: boolean; motionEnabled: boolean; onReady: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [nativePlayback, setNativePlayback] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const readyRef = useRef(onReady);
  readyRef.current = onReady;
  useEffect(() => {
    const prepare = (event: Event) => {
      const { from, to, duration } = (event as CustomEvent<JourneyTransition>).detail;
      const intro = from < CAMPUS_JOURNEY.start && to === FIRST_MEMORY_PROGRESS
        || to === 0 && from >= FIRST_MEMORY_PROGRESS && from <= MEMORY_STOPS[0].holdEnd;
      setNativePlayback(intro && duration > 0);
    };
    window.addEventListener(TRANSITION_EVENT, prepare);
    return () => window.removeEventListener(TRANSITION_EVENT, prepare);
  }, []);
  // A preloaded video can become the requested layer without another playing
  // event. Re-announce readiness when the scene becomes active.
  useEffect(() => { if (active && ready) readyRef.current(); }, [active, ready]);
  const native = nativePlayback || rootRef.current?.dataset.native === 'true';
  const holdEnd = MEMORY_STOPS[0].holdEnd;
  const opacity = 1 - smoothstep(holdEnd - .002, holdEnd, progress);
  return <div ref={rootRef} className="flow-arrival" data-role="flow-arrival" style={{ opacity: ready ? opacity : 0 }}>
    <CameraPathCanvas scene={FLOW_PILOT.transition.frameDirectory}
      frameCount={FLOW_PILOT.transition.frameCount} time={getFlowArrivalTime(progress, motionEnabled)}
      active={active && opacity > 0 && !native} onReady={() => { setReady(true); onReady(); }} />
    <video className="scene-video flow-arrival-native" data-role="flow-arrival-video"
      src={FLOW_PILOT.transition.arrivalVideo} poster={FLOW_PILOT.transition.poster} muted playsInline preload="auto"
      disablePictureInPicture tabIndex={-1}
      onLoadedData={() => setReady(true)} onPlaying={() => { if (active) readyRef.current(); }} />
    <img className="scene-video flow-arrival-fallback" data-role="flow-arrival-fallback"
      src={FLOW_PILOT.transition.arrivalPoster} alt="" onLoad={() => setReady(true)} />
  </div>;
}

function SceneVideo({ index, progress, visible, requested, motionEnabled, onReady, onSettled }: {
  index: number; progress: number; visible: boolean; requested: boolean; motionEnabled: boolean;
  onReady: (index: number) => void; onSettled: (sceneId: string | null) => void;
}) {
  const entryRef = useRef<HTMLVideoElement>(null);
  const ambientRef = useRef<HTMLVideoElement>(null);
  const scene = SCENES[index];
  const hero = scene.id === 'hero';
  const campus = scene.id === 'campus';
  const ceremony = scene.id === 'ceremony';
  const controlled = campus || ceremony && progress < CAMPUS_JOURNEY.hallEntered;
  const [ambient, setAmbient] = useState(hero || (!motionEnabled && !ceremony && !campus));
  const [ambientReady, setAmbientReady] = useState(false);
  const settledRef = useRef(false);
  const hold = campus ? getCampusHold(progress) : null;
  const still = [...MEMORY_STOPS].reverse().find((stop) => progress >= stop.start);
  const cameraTime = motionEnabled
    ? campus ? getCampusVideoTime(progress) : getHallEntryTime(progress)
    : campus ? still?.time ?? 0 : CAMPUS_JOURNEY.hallEntryTime;
  const showingFlowArrival = campus && progress < MEMORY_STOPS[0].holdEnd;
  // Warm the old route at the first memory's exit, not along its replaced arrival.
  const legacyCameraTime = campus && progress <= MEMORY_STOPS[0].holdEnd ? MEMORY_STOPS[0].time : cameraTime;

  useEffect(() => { if (hero && requested) onReady(index); }, [hero, requested, index, onReady]);

  useEffect(() => {
    if (controlled && ceremony) { setAmbient(false); setAmbientReady(false); settledRef.current = false; if (requested) onSettled(null); }
  }, [controlled, ceremony, requested, onSettled]);

  useEffect(() => {
    const entry = entryRef.current;
    const loop = ambientRef.current;
    if (!entry || !loop) return;
    const sync = () => {
      const playing = requested && motionEnabled && !controlled && !hero && !document.hidden;
      const current = ambient ? loop : entry;
      const other = ambient ? entry : loop;
      other.pause();
      if (ceremony && !controlled && requested && !ambient && entry.readyState >= 1 && entry.currentTime < CAMPUS_JOURNEY.hallEntryTime) {
        entry.currentTime = motionEnabled ? CAMPUS_JOURNEY.hallEntryTime : entry.duration - 1 / 24;
      }
      if (playing) { current.muted = true; current.play().catch(() => {}); }
      else current.pause();
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    document.addEventListener('pointerdown', sync, { passive: true });
    return () => { entry.pause(); loop.pause(); document.removeEventListener('visibilitychange', sync); document.removeEventListener('pointerdown', sync); };
  }, [ambient, requested, motionEnabled, controlled, ceremony, hero]);

  const settle = () => {
    if (requested && !controlled && !settledRef.current) { settledRef.current = true; onSettled(scene.id); }
  };
  useEffect(() => { if (requested && !controlled && settledRef.current) onSettled(scene.id); }, [requested, controlled, scene.id, onSettled]);
  useEffect(() => {
    const video = ambient ? ambientRef.current : entryRef.current;
    if (requested && !controlled && video && video.readyState >= 2) onReady(index);
  }, [requested, controlled, ambient, index, onReady]);

  return (
    <div className="scene-video-layer" data-scene={scene.id} data-visible={visible} data-scroll-controlled={controlled}
      style={{ opacity: visible ? 1 : 0, zIndex: visible ? 2 : 1,
        transitionDuration: campus && showingFlowArrival ? '0ms' : undefined }}>
      <div className="scene-camera-view" data-camera-zoom="1">
        {controlled && <CameraPathCanvas scene={campus ? 'scene-02' : 'scene-03'} time={legacyCameraTime} active={requested}
          onReady={() => { if (!showingFlowArrival) onReady(index); }} />}
        {campus && progress < MEMORY_STOPS[0].holdEnd + .005 && <FlowArrival progress={progress}
          active={requested} motionEnabled={motionEnabled} onReady={() => { if (showingFlowArrival) onReady(index); }} />}
        <video ref={entryRef} className="scene-video" data-role="entry"
          src={hero || campus ? undefined : `/videos/${scene.videoId}-${ceremony ? 'path' : 'entry'}.mp4`}
          poster={`/sequences/${scene.videoId}/frame-000.webp`}
          muted playsInline preload={requested ? 'auto' : 'metadata'} disablePictureInPicture tabIndex={-1}
          onLoadedData={() => {
            const video = entryRef.current;
            if (!video) return;
            if (ceremony && video.currentTime < CAMPUS_JOURNEY.hallEntryTime) video.currentTime = motionEnabled ? CAMPUS_JOURNEY.hallEntryTime : video.duration - 1 / 24;
            if (!controlled && !ambient) onReady(index);
          }}
          onPlaying={() => { if (!controlled) onReady(index); }}
          onTimeUpdate={() => { if ((entryRef.current?.currentTime ?? 0) >= 4.5) settle(); }}
          onEnded={() => { if (!controlled) { settle(); setAmbient(true); } }}
          onError={() => { if (!controlled) onReady(index); }}
          style={{ opacity: controlled || hero || ambient && ambientReady ? 0 : 1 }} />
        <video ref={ambientRef} className="scene-video" data-role="ambient"
          src={campus || hero ? undefined : `/videos/${scene.videoId}-living.mp4`}
          poster={`/sequences/${scene.videoId}/frame-149.webp`}
          muted playsInline loop preload={requested ? 'auto' : 'metadata'} disablePictureInPicture tabIndex={-1}
          onLoadedData={() => { if (ambient && !controlled) { setAmbientReady(true); onReady(index); settle(); } }}
          onPlaying={() => { setAmbientReady(true); if (!controlled) onReady(index); settle(); }}
          onError={() => { if (ambient && !controlled) onReady(index); }}
          style={{ opacity: !controlled && ambient && ambientReady ? 1 : 0 }} />
        {/* Keep the invitation at the exact camera pose where T01 begins.
            HTML atmosphere still moves; no old hero video changes the framing. */}
        {hero && <img className="scene-video hero-campus-bridge" src={FLOW_PILOT.transition.poster}
          alt="" onLoad={() => { if (requested) onReady(index); }} />}
        {hold && <StopAmbience key={hold.id} id={hold.id} opacity={hold.opacity} active={requested} motionEnabled={motionEnabled}
          src={hold.id === MEMORY_STOPS[0].ambient ? FLOW_PILOT.ambient.src : undefined} />}
      </div>
    </div>
  );
}

export function VideoSceneBackground({ progress, motionEnabled, onSceneSettled }: VideoSceneBackgroundProps) {
  const scene = getActiveScene(progress);
  const requested = SCENES.findIndex((item) => item.id === scene.id);
  const requestedRef = useRef(requested);
  requestedRef.current = requested;
  const displayedRef = useRef(requested);
  const [displayed, setDisplayed] = useState(requested);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const ready = useCallback((index: number) => {
    if (index !== requestedRef.current || index === displayedRef.current) return;
    setOutgoing(displayedRef.current); displayedRef.current = index; setDisplayed(index);
  }, []);
  useEffect(() => {
    if (outgoing === null) return;
    const timeout = window.setTimeout(() => setOutgoing(null), motionEnabled ? 550 : 0);
    return () => window.clearTimeout(timeout);
  }, [displayed, outgoing, motionEnabled]);
  // Warm up the next camera path before reaching the cut, keeping its byte cache
  // separate from the bounded decoded-image cache.
  const warm = requested === 0 ? 1 : requested === 1 && progress > .36 ? 2 : null;
  const layers = Array.from(new Set([outgoing, displayed, requested, warm].filter((index): index is number => index !== null)));
  return <div className="video-scene-background" aria-hidden="true" data-active-scene={scene.id}
    style={{ backgroundImage: `url(${FLOW_PILOT.transition.poster})` }}>
    {layers.map((index) => <SceneVideo key={index} index={index} progress={progress} visible={index === displayed}
      requested={index === requested} motionEnabled={motionEnabled} onReady={ready} onSettled={onSceneSettled} />)}
  </div>;
}
