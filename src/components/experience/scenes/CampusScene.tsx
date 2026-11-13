'use client';

import React, { useRef } from 'react';
import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Cap } from '../models/Cap';
import { smoothstep, lerp } from '@/lib/sceneProgress';

interface CampusSceneProps {
  progress: number;
}

function CampusGate({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Left Pillar */}
      <mesh position={[-2.8, 1.8, 0]} castShadow>
        <boxGeometry args={[0.6, 3.6, 0.6]} />
        <meshStandardMaterial color="#2469BC" roughness={0.4} />
      </mesh>
      {/* Left Pillar Base */}
      <mesh position={[-2.8, 0.1, 0]} castShadow>
        <boxGeometry args={[0.9, 0.2, 0.9]} />
        <meshStandardMaterial color="#10264A" roughness={0.5} />
      </mesh>

      {/* Right Pillar */}
      <mesh position={[2.8, 1.8, 0]} castShadow>
        <boxGeometry args={[0.6, 3.6, 0.6]} />
        <meshStandardMaterial color="#2469BC" roughness={0.4} />
      </mesh>
      {/* Right Pillar Base */}
      <mesh position={[2.8, 0.1, 0]} castShadow>
        <boxGeometry args={[0.9, 0.2, 0.9]} />
        <meshStandardMaterial color="#10264A" roughness={0.5} />
      </mesh>

      {/* Arch / Top Crossbeam */}
      <mesh position={[0, 3.7, 0]} castShadow>
        <boxGeometry args={[6.4, 0.5, 0.7]} />
        <meshStandardMaterial color="#10264A" roughness={0.4} />
      </mesh>

      {/* Gold Trim along Gate Arch */}
      <mesh position={[0, 3.98, 0]}>
        <boxGeometry args={[6.5, 0.08, 0.75]} />
        <meshStandardMaterial color="#F0C66D" metalness={0.7} roughness={0.25} />
      </mesh>

      {/* Campus Sign Plaque */}
      <mesh position={[0, 3.7, 0.38]}>
        <boxGeometry args={[3.8, 0.35, 0.04]} />
        <meshStandardMaterial color="#F4F7FC" roughness={0.3} />
      </mesh>
    </group>
  );
}

function CampusBackdrop({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const texture = useTexture('/images/campus_facade.png');
  texture.generateMipmaps = true;

  return (
    <group position={position}>
      {/* 2.5D Campus Building Billboard */}
      <mesh position={[0, 3.2, 0]}>
        <planeGeometry args={[11, 7]} />
        <meshStandardMaterial map={texture} transparent opacity={0.92} roughness={0.6} />
      </mesh>
      {/* Soft ground courtyard */}
      <mesh position={[0, -0.05, 3]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0e1f38" roughness={0.8} />
      </mesh>
    </group>
  );
}

export function CampusScene({ progress }: CampusSceneProps) {
  const p = progress;
  // Scene active window: 0.16 to 0.44
  const isVisible = p >= 0.16 && p <= 0.44;
  if (!isVisible) return null;

  const localP = smoothstep(0.18, 0.42, p);

  // Moving cap guiding through campus
  const capZ = lerp(4, -2, localP);
  const capY = lerp(1.8, 1.2, localP) + Math.sin(localP * Math.PI * 4) * 0.3;
  const capX = Math.sin(localP * Math.PI * 3) * 1.2;

  return (
    <group position={[0, 0, -5]}>
      {/* 2.5D Campus Facade */}
      <React.Suspense fallback={null}>
        <CampusBackdrop position={[0, 0, -4]} />
      </React.Suspense>

      {/* Stylized Portal Gate */}
      <CampusGate position={[0, 0, 0]} />

      {/* Golden Cap guiding the way */}
      <Cap
        position={[capX, capY, capZ]}
        rotation={[0.3, localP * 10, 0.1]}
        scale={0.7}
        spinning
      />

      {/* Subtle floating gold sparkle particles */}
      <points position={[0, 2, 0]}>
        <sphereGeometry args={[4, 12, 12]} />
        <pointsMaterial size={0.06} color="#F0C66D" transparent opacity={0.6} />
      </points>
    </group>
  );
}
