'use client';

import React, { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Graduate } from './models/Graduate';
import { smoothstep, lerp } from '@/lib/sceneProgress';

interface ExperienceCanvasProps {
  progress: number;
}

// -------------------------------------------------------------
// Floating Golden Light Ring / Swirl around Graduate
// -------------------------------------------------------------
function GoldenSwirlRing({ active }: { active: boolean }) {
  const ringRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ringRef.current || !active) return;
    const t = clock.getElapsedTime();
    ringRef.current.rotation.y = t * 1.6;
    ringRef.current.rotation.x = Math.sin(t * 0.8) * 0.12;
  });

  if (!active) return null;

  return (
    <group ref={ringRef} position={[0, 0.45, 0]}>
      <mesh rotation={[Math.PI / 2.3, 0, 0]}>
        <torusGeometry args={[0.75, 0.02, 12, 48]} />
        <meshStandardMaterial
          color="#F0C66D"
          emissive="#F0C66D"
          emissiveIntensity={1.8}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </group>
  );
}

// -------------------------------------------------------------
// Celebratory Confetti Rain for Scene 03
// -------------------------------------------------------------
function ConfettiParticles({ active }: { active: boolean }) {
  const count = 60;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 4.2,
      y: Math.random() * 2.8 + 0.2,
      z: (Math.random() - 0.5) * 2.5,
      vx: (Math.random() - 0.5) * 0.01,
      vy: Math.random() * 0.02 + 0.012,
      rotX: Math.random() * Math.PI * 2,
      rotY: Math.random() * Math.PI * 2,
      rotZ: Math.random() * Math.PI * 2,
    }));
  }, [count]);

  useFrame(() => {
    if (!meshRef.current || !active) return;
    particles.forEach((p, i) => {
      p.y -= p.vy;
      if (p.y < -0.6) p.y = 2.8;
      p.rotX += 0.04;
      p.rotY += 0.03;
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rotX, p.rotY, p.rotZ);
      dummy.scale.set(0.065, 0.035, 0.012);
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#F0C66D" roughness={0.3} metalness={0.8} />
    </instancedMesh>
  );
}

// -------------------------------------------------------------
// Chibi 3D Stage Actor (Synchronized with Scene 03 Video Spotlight)
// -------------------------------------------------------------
function ChibiStageActor({ progress }: { progress: number }) {
  const p = progress;
  // Scene 03 range: 0.42 to 0.60
  // Fade in as video camera approaches and settles on center stage (around 0.48..0.60)
  const isVisible = p >= 0.46 && p <= 0.61;
  if (!isVisible) return null;

  // Staging timeline within Scene 03
  const arriveProgress = smoothstep(0.46, 0.50, p);
  const fadeOutProgress = smoothstep(0.58, 0.61, p);
  const overallOpacity = (1 - fadeOutProgress) * arriveProgress;

  const isWaving = p >= 0.49;
  const isCelebrating = p >= 0.52;

  // Accurately calibrated to stand on the wooden floor spotlight of the auditorium video frame
  // Y position: -0.70, Scale: 0.50
  const chibiY = lerp(-1.0, -0.70, arriveProgress);
  const chibiScale = lerp(0.35, 0.50, arriveProgress) * (1 - fadeOutProgress * 0.4);

  return (
    <group position={[0, chibiY, 0]} scale={chibiScale}>
      {/* Stage Key Lighting matching video's overhead spotlights */}
      <spotLight
        position={[0, 4.5, 2.0]}
        angle={0.5}
        penumbra={0.7}
        intensity={2.8 * overallOpacity}
        color="#ffffff"
      />
      <directionalLight
        position={[-2, 3, 2]}
        intensity={1.5 * overallOpacity}
        color="#F0C66D"
      />
      <directionalLight
        position={[2, 3, -1]}
        intensity={1.0 * overallOpacity}
        color="#5ba2ff"
      />

      {/* Ground Soft Contact Shadow on stage wood */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35 * overallOpacity} />
      </mesh>

      {/* 3D Chibi Model facing audience directly */}
      <Graduate
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        scale={1.0}
        waving={isWaving}
        celebrating={isCelebrating}
      />

      {/* Golden Aura Ring */}
      <GoldenSwirlRing active={isCelebrating && overallOpacity > 0.4} />

      {/* Confetti Particles Rain */}
      <ConfettiParticles active={isCelebrating && overallOpacity > 0.4} />
    </group>
  );
}

export function ExperienceCanvas({ progress }: ExperienceCanvasProps) {
  // Mount WebGL elements when Scene 03 is in view or approaching
  const isNearScene03 = progress >= 0.44 && progress <= 0.63;

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-[2]">
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.1, 4.8], fov: 38 }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0); // Transparent background!
        }}
      >
        <ambientLight intensity={0.8} />

        <Suspense fallback={null}>
          {isNearScene03 && <ChibiStageActor progress={progress} />}
        </Suspense>
      </Canvas>
    </div>
  );
}
