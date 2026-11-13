'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Cap } from '../models/Cap';
import { Diploma } from '../models/Diploma';

interface EventSceneProps {
  progress: number;
}

// -------------------------------------------------------------
// Stylized 3D Isometric Campus Map with Glowing Location Pin
// (Directly inspired by Concept Art 04)
// -------------------------------------------------------------
function IsometricCampusMap({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const pinRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (pinRef.current) {
      pinRef.current.position.y = 1.35 + Math.sin(t * 2.5) * 0.08;
    }
    if (ringRef.current) {
      const s = 1 + (Math.sin(t * 3) + 1) * 0.3;
      ringRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group position={position} rotation={[-0.35, 0.45, 0.15]}>
      {/* Floating Glass/Gold Map Base Plaque */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.8, 2.9, 0.22, 6]} />
        <meshStandardMaterial color="#0e2348" roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Gold Trim Bezel along base */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[2.82, 2.82, 0.04, 6]} />
        <meshStandardMaterial color="#F0C66D" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Plaza Courtyard surface */}
      <mesh position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.6, 6]} />
        <meshStandardMaterial color="#193867" roughness={0.5} />
      </mesh>

      {/* Stylized Miniature Campus Buildings */}
      {/* Main IUH Central Building */}
      <mesh position={[0, 0.65, -0.6]} castShadow>
        <boxGeometry args={[1.5, 0.9, 0.7]} />
        <meshStandardMaterial color="#eef4ff" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Building Blue Glass Facade */}
      <mesh position={[0, 0.65, -0.24]}>
        <planeGeometry args={[1.4, 0.8]} />
        <meshStandardMaterial color="#3578d6" roughness={0.1} metalness={0.6} />
      </mesh>

      {/* Left Wing Building */}
      <mesh position={[-1.1, 0.45, 0.3]} rotation={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[1.0, 0.6, 0.5]} />
        <meshStandardMaterial color="#e2ebfc" roughness={0.4} />
      </mesh>

      {/* Right Wing Building */}
      <mesh position={[1.1, 0.45, 0.3]} rotation={[0, -0.6, 0]} castShadow>
        <boxGeometry args={[1.0, 0.6, 0.5]} />
        <meshStandardMaterial color="#e2ebfc" roughness={0.4} />
      </mesh>

      {/* Mini Green Trees */}
      <mesh position={[-0.8, 0.3, -0.1]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color="#2d6e3c" roughness={0.8} />
      </mesh>
      <mesh position={[0.8, 0.3, -0.1]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial color="#2d6e3c" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.3, 0.6]}>
        <sphereGeometry args={[0.16, 8, 8]} />
        <meshStandardMaterial color="#388249" roughness={0.8} />
      </mesh>

      {/* Glowing Target Circle on Courtyard */}
      <mesh ref={ringRef} position={[0, 0.16, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.4, 24]} />
        <meshBasicMaterial color="#F0C66D" transparent opacity={0.8} />
      </mesh>

      {/* 3D Golden Location Marker Pin */}
      <group ref={pinRef} position={[0, 1.35, 0.1]}>
        {/* Pin Head */}
        <mesh castShadow>
          <sphereGeometry args={[0.32, 16, 16]} />
          <meshStandardMaterial color="#F0C66D" metalness={0.9} roughness={0.15} emissive="#F0C66D" emissiveIntensity={0.6} />
        </mesh>
        {/* Inner Pin Dot */}
        <mesh position={[0, 0, 0.28]}>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
        </mesh>
        {/* Pin Cone Tip */}
        <mesh position={[0, -0.32, 0]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.26, 0.45, 16]} />
          <meshStandardMaterial color="#F0C66D" metalness={0.9} roughness={0.15} />
        </mesh>
        {/* Pin Spotlight Glow */}
        <pointLight color="#F0C66D" intensity={1.8} distance={4} />
      </group>
    </group>
  );
}

// -------------------------------------------------------------
// MAIN SCENE 04 EXPORT
// -------------------------------------------------------------
export function EventScene({ progress }: EventSceneProps) {
  const p = progress;
  // Scene active window: 0.58 to 0.82
  const isVisible = p >= 0.58 && p <= 0.82;
  if (!isVisible) return null;

  return (
    <group position={[0, 0, -18]}>
      {/* Large Celestial Golden Archway in Background */}
      <mesh position={[0, 2.5, -3.5]}>
        <torusGeometry args={[6.2, 0.08, 16, 64]} />
        <meshStandardMaterial color="#F0C66D" metalness={0.85} roughness={0.2} emissive="#F0C66D" emissiveIntensity={0.3} />
      </mesh>

      {/* Floating 3D Isometric IUH Campus Model on the right */}
      <IsometricCampusMap position={[3.6, 0.2, 0.2]} />

      {/* Floating Celebration Cap at top center */}
      <Cap
        position={[-0.2, 2.8, 0.5]}
        rotation={[0.25, 0.4, -0.1]}
        scale={0.85}
        spinning
      />

      {/* Floating Rolled Diploma Scroll on the left */}
      <Diploma
        position={[-3.6, -0.4, 0.8]}
        rotation={[-0.2, -0.4, 0.3]}
        scale={0.85}
        floating
      />

      {/* Soft Cloud Floor Billows */}
      <mesh position={[0, -2.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 16]} />
        <meshStandardMaterial color="#0d1f3d" roughness={0.9} />
      </mesh>

      {/* Golden Celebration Sparkles */}
      <points position={[0, 1.2, 0]}>
        <sphereGeometry args={[7, 16, 16]} />
        <pointsMaterial size={0.06} color="#F0C66D" transparent opacity={0.6} />
      </points>
    </group>
  );
}
