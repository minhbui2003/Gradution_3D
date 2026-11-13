'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Graduate } from '../models/Graduate';
import { smoothstep, lerp } from '@/lib/sceneProgress';

interface WishesSceneProps {
  progress: number;
}

// -------------------------------------------------------------
// Small Floating Wish Letter Envelope with Gold Wax Seal
// -------------------------------------------------------------
function FloatingLetter({
  position,
  rotation,
  scale = 1,
  bobOffset = 0,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
  bobOffset?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime() + bobOffset;
    groupRef.current.position.y = position[1] + Math.sin(t * 1.6) * 0.08;
    groupRef.current.rotation.z = rotation[2] + Math.sin(t * 1.2) * 0.03;
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Ivory Letter Pocket */}
      <mesh castShadow>
        <boxGeometry args={[1.2, 0.8, 0.03]} />
        <meshStandardMaterial color="#FAF6EE" roughness={0.4} />
      </mesh>
      {/* Gold Border Trim */}
      <mesh position={[0, 0, 0.016]}>
        <boxGeometry args={[1.14, 0.74, 0.005]} />
        <meshStandardMaterial color="#FAF6EE" roughness={0.3} />
      </mesh>
      {/* Triangular Flap */}
      <mesh position={[0, 0.15, 0.02]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.55, 0.45, 3]} />
        <meshStandardMaterial color="#F4EEDC" roughness={0.4} />
      </mesh>
      {/* Gold Wax Seal */}
      <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
        <meshStandardMaterial color="#F0C66D" metalness={0.9} roughness={0.15} />
      </mesh>
    </group>
  );
}

// -------------------------------------------------------------
// Grand Central Gift Envelope with Gold Ribbon Bow & Wax Seal
// (Directly matching Concept Art 05)
// -------------------------------------------------------------
function GrandEnvelopeCenterpiece({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = position[1] + Math.sin(t * 1.2) * 0.05;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Main Ivory Envelope Body */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[4.2, 2.9, 0.12]} />
        <meshStandardMaterial color="#FAF6EE" roughness={0.35} />
      </mesh>
      {/* Gold Double Border Inset */}
      <mesh position={[0, 0, 0.065]}>
        <boxGeometry args={[3.95, 2.65, 0.01]} />
        <meshStandardMaterial color="#F0C66D" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.072]}>
        <boxGeometry args={[3.85, 2.55, 0.01]} />
        <meshStandardMaterial color="#FAF6EE" roughness={0.4} />
      </mesh>

      {/* Triangular Flap V-fold line */}
      <mesh position={[0, 0.4, 0.08]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[1.8, 1.3, 3]} />
        <meshStandardMaterial color="#F5EFE1" roughness={0.4} />
      </mesh>

      {/* Golden Satin Ribbon Cross */}
      <mesh position={[0, 0, 0.085]}>
        <boxGeometry args={[4.22, 0.35, 0.02]} />
        <meshStandardMaterial color="#F0C66D" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Big Golden Ribbon Bow on Top */}
      <group position={[0, 1.55, 0.1]}>
        {/* Left Bow Loop */}
        <mesh position={[-0.45, 0.1, 0]} rotation={[0, 0, 0.4]}>
          <torusGeometry args={[0.35, 0.1, 12, 24]} />
          <meshStandardMaterial color="#F0C66D" metalness={0.88} roughness={0.18} />
        </mesh>
        {/* Right Bow Loop */}
        <mesh position={[0.45, 0.1, 0]} rotation={[0, 0, -0.4]}>
          <torusGeometry args={[0.35, 0.1, 12, 24]} />
          <meshStandardMaterial color="#F0C66D" metalness={0.88} roughness={0.18} />
        </mesh>
        {/* Bow Knot */}
        <mesh position={[0, 0, 0.05]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#F0C66D" metalness={0.9} roughness={0.15} />
        </mesh>
      </group>

      {/* Embossed Gold Laurel Wax Seal with Graduation Cap */}
      <group position={[0, -0.15, 0.1]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.05, 32]} />
          <meshStandardMaterial color="#F0C66D" metalness={0.92} roughness={0.15} />
        </mesh>
        {/* Mini Cap Emblem on Seal */}
        <mesh position={[0, 0, 0.035]} rotation={[0, 0, 0.4]}>
          <boxGeometry args={[0.3, 0.3, 0.02]} />
          <meshStandardMaterial color="#D4A745" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

// -------------------------------------------------------------
// Classical Temple Columns on Sides
// -------------------------------------------------------------
function ClassicalPillars() {
  return (
    <group>
      {/* Left Column */}
      <group position={[-5.4, 1.2, 0]}>
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.38, 0.42, 5.5, 20]} />
          <meshStandardMaterial color="#eef3fa" roughness={0.5} />
        </mesh>
        <mesh position={[0, 4.3, 0]}>
          <boxGeometry args={[1.1, 0.25, 1.1]} />
          <meshStandardMaterial color="#F0C66D" metalness={0.8} roughness={0.25} />
        </mesh>
      </group>

      {/* Right Column */}
      <group position={[5.4, 1.2, 0]}>
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.38, 0.42, 5.5, 20]} />
          <meshStandardMaterial color="#eef3fa" roughness={0.5} />
        </mesh>
        <mesh position={[0, 4.3, 0]}>
          <boxGeometry args={[1.1, 0.25, 1.1]} />
          <meshStandardMaterial color="#F0C66D" metalness={0.8} roughness={0.25} />
        </mesh>
      </group>
    </group>
  );
}

// -------------------------------------------------------------
// MAIN SCENE 05 EXPORT
// -------------------------------------------------------------
export function WishesScene({ progress }: WishesSceneProps) {
  const p = progress;
  // Scene active window: 0.78 to 1.00
  const isVisible = p >= 0.78;
  if (!isVisible) return null;

  // Final Chibi entrance: 0.82 to 0.90
  const entranceProgress = smoothstep(0.82, 0.90, p);
  const chibiY = lerp(-1.8, 0.05, entranceProgress);

  return (
    <group position={[0, 0, -25]}>
      {/* Classical Temple Columns */}
      <ClassicalPillars />

      {/* Grand Ivory Envelope Centerpiece */}
      <GrandEnvelopeCenterpiece position={[-0.8, 1.6, -0.5]} />

      {/* Floating Letters around the Envelope */}
      <FloatingLetter
        position={[-3.6, 3.2, 0.8]}
        rotation={[0.1, 0.3, -0.15]}
        scale={0.9}
        bobOffset={0.5}
      />
      <FloatingLetter
        position={[-3.8, 1.0, 1.2]}
        rotation={[-0.05, 0.25, 0.2]}
        scale={0.85}
        bobOffset={1.8}
      />
      <FloatingLetter
        position={[2.8, 3.4, 0.5]}
        rotation={[0.15, -0.3, 0.12]}
        scale={0.9}
        bobOffset={2.6}
      />
      <FloatingLetter
        position={[-1.8, -0.3, 1.5]}
        rotation={[0.08, 0.15, -0.1]}
        scale={0.75}
        bobOffset={3.2}
      />

      {/* Graduate Chibi in Right Foreground waving happily to viewer */}
      {/* Well-framed, elegant scale, faces camera directly */}
      <Graduate
        position={[2.2, chibiY, 1.4]}
        rotation={[0, -0.85, 0]}
        scale={1.2}
        waving
      />

      {/* Soft Cloud Floor */}
      <mesh position={[0, -1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[26, 16]} />
        <meshStandardMaterial color="#0b1b36" roughness={0.85} />
      </mesh>

      {/* Celebratory Golden Sparkles Field */}
      <points position={[0, 1.5, 0]}>
        <sphereGeometry args={[9, 18, 18]} />
        <pointsMaterial size={0.065} color="#F0C66D" transparent opacity={0.65} />
      </points>
    </group>
  );
}
