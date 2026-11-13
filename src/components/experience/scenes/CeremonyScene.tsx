'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Graduate } from '../models/Graduate';
import { Diploma } from '../models/Diploma';
import { Cap } from '../models/Cap';
import { smoothstep, lerp } from '@/lib/sceneProgress';

interface CeremonySceneProps {
  progress: number;
}

function AuditoriumStage() {
  return (
    <group position={[0, 0, 0]}>
      {/* Stage Floor */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[14, 0.4, 8]} />
        <meshStandardMaterial color="#0a162b" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Stage Steps */}
      <mesh position={[0, -0.15, 4.3]} receiveShadow>
        <boxGeometry args={[8, 0.2, 0.6]} />
        <meshStandardMaterial color="#10264A" roughness={0.4} />
      </mesh>

      {/* Royal Blue Backdrops & Curtains */}
      <mesh position={[-5.5, 3.2, -3.8]}>
        <boxGeometry args={[3, 6, 0.2]} />
        <meshStandardMaterial color="#10264A" roughness={0.7} />
      </mesh>
      <mesh position={[5.5, 3.2, -3.8]}>
        <boxGeometry args={[3, 6, 0.2]} />
        <meshStandardMaterial color="#10264A" roughness={0.7} />
      </mesh>

      {/* Center Stage LED Wall backdrop */}
      <mesh position={[0, 3.5, -3.9]}>
        <planeGeometry args={[7.8, 4.5]} />
        <meshStandardMaterial color="#183664" emissive="#0d2140" emissiveIntensity={0.6} />
      </mesh>

      {/* Gold Trim Header */}
      <mesh position={[0, 5.8, -3.8]}>
        <boxGeometry args={[8.2, 0.2, 0.25]} />
        <meshStandardMaterial color="#F0C66D" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Podium */}
      <group position={[-2.4, 0.2, 0.8]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.7, 1.2, 0.6]} />
          <meshStandardMaterial color="#142642" roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.22, 0.05]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[0.8, 0.08, 0.7]} />
          <meshStandardMaterial color="#F0C66D" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

function ConfettiParticles({ active }: { active: boolean }) {
  const count = 75;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = React.useMemo(() => new THREE.Object3D(), []);

  const particles = React.useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 6,
      y: Math.random() * 4 + 1,
      z: (Math.random() - 0.5) * 4,
      vx: (Math.random() - 0.5) * 0.03,
      vy: Math.random() * 0.04 + 0.02,
      vz: (Math.random() - 0.5) * 0.03,
      rotX: Math.random() * Math.PI,
      rotY: Math.random() * Math.PI,
    }));
  }, [count]);

  useFrame(() => {
    if (!meshRef.current || !active) return;
    particles.forEach((p, i) => {
      p.y -= p.vy * 0.4;
      if (p.y < 0.2) p.y = 4.5;
      p.rotX += 0.05;
      p.rotY += 0.05;
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rotX, p.rotY, 0);
      dummy.scale.set(0.12, 0.06, 0.02);
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#F0C66D" roughness={0.3} metalness={0.7} />
    </instancedMesh>
  );
}

export function CeremonyScene({ progress }: CeremonySceneProps) {
  const p = progress;
  // Scene active window: 0.40 to 0.62
  const isVisible = p >= 0.40 && p <= 0.62;
  if (!isVisible) return null;

  // Walk to center: 0.44 to 0.52
  const walkProgress = smoothstep(0.44, 0.52, p);
  // Raise diploma: 0.50 to 0.55
  const diplomaProgress = smoothstep(0.50, 0.55, p);
  // Cap throw & celebrate: 0.53 to 0.60
  const throwProgress = smoothstep(0.53, 0.60, p);

  // Chibi coordinates
  const chibiX = lerp(-2.5, 0, walkProgress);
  const diplomaY = lerp(0.8, 1.8, diplomaProgress);

  // Thrown cap physics arc
  const capHeight = Math.sin(throwProgress * Math.PI) * 2.8 + 1.2;
  const capZ = lerp(0, 3.8, throwProgress);
  const capScale = lerp(0.8, 3.2, throwProgress);

  return (
    <group position={[0, 0, -11]}>
      {/* 3D Stage & Podium */}
      <AuditoriumStage />

      {/* Spotlights */}
      <spotLight
        position={[0, 8, 2]}
        angle={0.6}
        penumbra={0.8}
        intensity={3}
        color="#ffffff"
        castShadow
      />
      <spotLight
        position={[-3, 6, 1]}
        angle={0.5}
        penumbra={0.7}
        intensity={2}
        color="#F0C66D"
      />
      <spotLight
        position={[3, 6, 1]}
        angle={0.5}
        penumbra={0.7}
        intensity={2}
        color="#2469BC"
      />

      {/* Chibi Graduate */}
      <Graduate
        position={[chibiX, 0.2, 0]}
        rotation={[0, walkProgress < 0.9 ? 0.3 : 0, 0]}
        scale={1.4}
        celebrating={p >= 0.53}
      />

      {/* Diploma Scroll */}
      {p >= 0.48 && (
        <Diploma
          position={[chibiX + 0.4, diplomaY, 0.2]}
          rotation={[0.2, 0.4, 0.4]}
          scale={0.9}
          floating
        />
      )}

      {/* Thrown Cap Transition Bridge */}
      {p >= 0.53 && (
        <Cap
          position={[0, capHeight, capZ]}
          rotation={[throwProgress * 8, throwProgress * 6, throwProgress * 2]}
          scale={capScale}
          spinning
        />
      )}

      {/* Celebration Confetti */}
      <ConfettiParticles active={p >= 0.52 && p <= 0.60} />
    </group>
  );
}
