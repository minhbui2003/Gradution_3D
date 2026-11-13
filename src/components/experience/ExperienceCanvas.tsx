'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraRig } from './CameraRig';
import { InvitationScene } from './scenes/InvitationScene';
import { CampusScene } from './scenes/CampusScene';
import { CeremonyScene } from './scenes/CeremonyScene';
import { EventScene } from './scenes/EventScene';
import { WishesScene } from './scenes/WishesScene';

interface ExperienceCanvasProps {
  progress: number;
}

export function ExperienceCanvas({ progress }: ExperienceCanvasProps) {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 1.75]} // limit DPR for mobile performance
        camera={{ position: [0, 1.4, 5.8], fov: 45 }}
      >
        {/* Lights */}
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1.8}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0001}
        />
        <directionalLight position={[-4, 6, -2]} intensity={0.6} color="#8FC3FF" />
        <hemisphereLight args={['#F0C66D', '#10264A', 0.5]} />

        {/* Camera Rig driven by scroll progress */}
        <CameraRig progress={progress} />

        {/* 5 Story Chapters */}
        <Suspense fallback={null}>
          <InvitationScene progress={progress} />
          <CampusScene progress={progress} />
          <CeremonyScene progress={progress} />
          <EventScene progress={progress} />
          <WishesScene progress={progress} />
        </Suspense>
      </Canvas>
    </div>
  );
}
