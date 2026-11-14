'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Graduate } from './models/Graduate';
import { TravelingCap } from './TravelingCap';
import { smoothstep } from '@/lib/sceneProgress';

interface ExperienceCanvasProps { progress: number; motionEnabled?: boolean; ceremonyReady?: boolean; }

class SceneBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

function CameraMotion({ enabled }: { enabled: boolean }) {
  const { camera } = useThree();
  useFrame(({ pointer, clock }, delta) => {
    const t = enabled ? clock.elapsedTime : 0;
    const x = enabled ? pointer.x * 0.14 + Math.sin(t * 0.24) * 0.025 : 0;
    const y = 0.1 + (enabled ? pointer.y * 0.08 : 0);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, x, 4, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, y, 4, delta);
    camera.lookAt(0, 0.1, 0);
  });
  return null;
}

function GraduateJourney({ progress, motionEnabled, ceremonyReady }: Required<ExperienceCanvasProps>) {
  const group = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const { viewport, size } = useThree();
  const mobile = size.width < 768;
  const stage = progress >= 0.43 && progress <= 0.62 && ceremonyReady;
  const farewell = progress >= 0.81;
  const enter = stage ? smoothstep(0.43, 0.48, progress) : farewell ? smoothstep(0.81, 0.87, progress) : 1;
  const exit = stage ? 1 - smoothstep(0.57, 0.62, progress) : 1;
  const visibility = enter * exit;
  const scale = (stage ? 0.61 : farewell && !mobile ? 0.40 : 0) * visibility;
  const x = farewell ? viewport.width * 0.27 : 0;
  const y = stage ? -0.80 : 0.0;

  useFrame((_, delta) => {
    if (!group.current) return;
    if (motionEnabled) elapsed.current += Math.min(delta, .05);
    group.current.position.set(x, y + Math.sin(elapsed.current * 1.25) * .012, 0);
    // Bone world rotations cannot be decomposed through a zero-scale ancestor.
    // Keep a tiny positive scale while hidden so animation bindings stay valid.
    group.current.scale.setScalar(Math.max(.0001, motionEnabled ? THREE.MathUtils.damp(group.current.scale.x, scale, 5, delta) : scale));
    group.current.visible = group.current.scale.x > .005;
  });

  return (
    <group ref={group} scale={.0001}>
      <Graduate waving={farewell} celebrating={stage && progress > 0.52} animated={motionEnabled && (stage || farewell)} />
      <mesh position={[0, -0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 48]} />
        <meshBasicMaterial color="#030b18" transparent opacity={0.26} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function ExperienceCanvas({ progress, motionEnabled = true, ceremonyReady = false }: ExperienceCanvasProps) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  const eventSource = useMemo(() => typeof document !== 'undefined' ? document.body : undefined, []);
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-[2]" aria-hidden="true">
      <SceneBoundary>
        <Canvas
          eventSource={eventSource} eventPrefix="client"
          frameloop={visible && motionEnabled ? 'always' : 'demand'}
          gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1, powerPreference: 'high-performance' }}
          dpr={[1, 1.5]} camera={{ position: [0, 0.1, 4.8], fov: 38 }}
          onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
          fallback={<span className="sr-only">Lời mời và thông tin sự kiện ở bên dưới.</span>}
        >
          <ambientLight intensity={1.5} />
          <hemisphereLight args={['#e6f0ff', '#38476a', 1.5]} />
          <directionalLight position={[-3, 5, 5]} intensity={3} color="#fff1d9" />
          <directionalLight position={[4, 3, -2]} intensity={3} color="#96bfff" />
          <CameraMotion enabled={motionEnabled} />
          <TravelingCap progress={progress} motionEnabled={motionEnabled} />
          <Suspense fallback={null}>
            {progress >= .40 && <GraduateJourney progress={progress} motionEnabled={motionEnabled} ceremonyReady={ceremonyReady} />}
          </Suspense>
        </Canvas>
      </SceneBoundary>
    </div>
  );
}
