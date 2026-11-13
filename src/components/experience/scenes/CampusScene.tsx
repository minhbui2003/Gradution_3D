'use client';

import React, { useRef, useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Graduate } from '../models/Graduate';
import { smoothstep, lerp } from '@/lib/sceneProgress';

// Preload all Scene 02 textures so Drei never suspends unexpectedly
useTexture.preload('/images/memory_1.png');
useTexture.preload('/images/memory_2.png');
useTexture.preload('/images/memory_3.png');
useTexture.preload('/images/memory_4.png');
useTexture.preload('/images/campus_facade.png');
useTexture.preload('/images/cloud_soft.png');

interface CampusSceneProps {
  progress: number;
}

// -------------------------------------------------------------
// Flower Hedge (Dense white & periwinkle hydrangea clusters)
// -------------------------------------------------------------
function FlowerHedge({ position, scale = 1, flip = false }: { position: [number, number, number]; scale?: number; flip?: boolean }) {
  return (
    <group position={position} scale={scale}>
      {/* Foliage mounds */}
      <mesh position={[0, 0.25, 0]}>
        <sphereGeometry args={[0.6, 12, 10]} />
        <meshStandardMaterial color="#1a4224" roughness={0.8} />
      </mesh>
      <mesh position={[flip ? -0.3 : 0.3, 0.22, 0.2]}>
        <sphereGeometry args={[0.48, 10, 8]} />
        <meshStandardMaterial color="#23542f" roughness={0.8} />
      </mesh>
      <mesh position={[flip ? 0.3 : -0.3, 0.28, -0.15]}>
        <sphereGeometry args={[0.5, 10, 8]} />
        <meshStandardMaterial color="#2a6337" roughness={0.8} />
      </mesh>

      {/* Blossom clusters: Soft white */}
      <mesh position={[0, 0.52, 0.1]}>
        <dodecahedronGeometry args={[0.22, 1]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
      </mesh>
      <mesh position={[flip ? -0.25 : 0.25, 0.44, 0.05]}>
        <dodecahedronGeometry args={[0.2, 1]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
      </mesh>

      {/* Blossom clusters: Periwinkle blue */}
      <mesh position={[flip ? 0.22 : -0.22, 0.48, 0.15]}>
        <dodecahedronGeometry args={[0.22, 1]} />
        <meshStandardMaterial color="#8ab8f8" roughness={0.4} />
      </mesh>
      <mesh position={[0.08, 0.62, -0.05]}>
        <dodecahedronGeometry args={[0.18, 1]} />
        <meshStandardMaterial color="#a9ccff" roughness={0.4} />
      </mesh>
      <mesh position={[flip ? -0.35 : 0.35, 0.38, 0.25]}>
        <dodecahedronGeometry args={[0.19, 1]} />
        <meshStandardMaterial color="#bfe0ff" roughness={0.4} />
      </mesh>
    </group>
  );
}

// -------------------------------------------------------------
// Campus Gate (Iconic IUH Archway with Royal Blue & Gold Trim)
// Proportioned to fit elegantly within camera view
// -------------------------------------------------------------
function CampusGate({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Left Column */}
      <mesh position={[-2.7, 1.8, 0]} castShadow>
        <boxGeometry args={[0.8, 3.6, 0.8]} />
        <meshStandardMaterial color="#1a3f78" roughness={0.35} metalness={0.15} />
      </mesh>
      {/* Left Column Base */}
      <mesh position={[-2.7, 0.15, 0]} castShadow>
        <boxGeometry args={[1.05, 0.3, 1.05]} />
        <meshStandardMaterial color="#10264A" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Left Column Gold Capital Trim */}
      <mesh position={[-2.7, 3.65, 0]}>
        <boxGeometry args={[0.95, 0.12, 0.95]} />
        <meshStandardMaterial color="#F0C66D" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* Left Glowing Inner Light Strip */}
      <mesh position={[-2.28, 1.8, 0.08]}>
        <boxGeometry args={[0.05, 3.3, 0.06]} />
        <meshStandardMaterial color="#F0C66D" emissive="#F0C66D" emissiveIntensity={1.5} />
      </mesh>

      {/* Right Column */}
      <mesh position={[2.7, 1.8, 0]} castShadow>
        <boxGeometry args={[0.8, 3.6, 0.8]} />
        <meshStandardMaterial color="#1a3f78" roughness={0.35} metalness={0.15} />
      </mesh>
      {/* Right Column Base */}
      <mesh position={[2.7, 0.15, 0]} castShadow>
        <boxGeometry args={[1.05, 0.3, 1.05]} />
        <meshStandardMaterial color="#10264A" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Right Column Gold Capital Trim */}
      <mesh position={[2.7, 3.65, 0]}>
        <boxGeometry args={[0.95, 0.12, 0.95]} />
        <meshStandardMaterial color="#F0C66D" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* Right Glowing Inner Light Strip */}
      <mesh position={[2.28, 1.8, 0.08]}>
        <boxGeometry args={[0.05, 3.3, 0.06]} />
        <meshStandardMaterial color="#F0C66D" emissive="#F0C66D" emissiveIntensity={1.5} />
      </mesh>

      {/* Overhead Horizontal Arch Crossbeam */}
      <mesh position={[0, 3.9, 0]} castShadow>
        <boxGeometry args={[6.2, 0.5, 0.8]} />
        <meshStandardMaterial color="#1a3f78" roughness={0.35} metalness={0.15} />
      </mesh>

      {/* Curved Arch Crown */}
      <mesh position={[0, 4.3, 0]} castShadow>
        <boxGeometry args={[3.8, 0.4, 0.82]} />
        <meshStandardMaterial color="#102a54" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Bottom Gold Trim along Arch */}
      <mesh position={[0, 3.62, 0]}>
        <boxGeometry args={[4.7, 0.06, 0.82]} />
        <meshStandardMaterial color="#F0C66D" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* Top Gold Trim along Arch */}
      <mesh position={[0, 4.18, 0]}>
        <boxGeometry args={[6.3, 0.06, 0.82]} />
        <meshStandardMaterial color="#F0C66D" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Golden Lotus / Emblem on Top Crown */}
      <group position={[0, 4.45, 0.44]}>
        <mesh>
          <sphereGeometry args={[0.26, 16, 16]} />
          <meshStandardMaterial color="#F0C66D" metalness={0.9} roughness={0.15} emissive="#F0C66D" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[-0.18, 0.04, 0]} rotation={[0, 0, 0.4]}>
          <coneGeometry args={[0.12, 0.32, 16]} />
          <meshStandardMaterial color="#F0C66D" metalness={0.9} roughness={0.15} />
        </mesh>
        <mesh position={[0.18, 0.04, 0]} rotation={[0, 0, -0.4]}>
          <coneGeometry args={[0.12, 0.32, 16]} />
          <meshStandardMaterial color="#F0C66D" metalness={0.9} roughness={0.15} />
        </mesh>
      </group>

      {/* Street Lamps on Left & Right with warm glow */}
      <group position={[-3.6, 0, 0.6]}>
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.05, 0.07, 2.4, 12]} />
          <meshStandardMaterial color="#10264A" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[0, 2.5, 0]}>
          <octahedronGeometry args={[0.2]} />
          <meshStandardMaterial color="#FFE29E" emissive="#FFE29E" emissiveIntensity={2.2} roughness={0.1} />
        </mesh>
        <pointLight position={[0, 2.5, 0]} color="#FFE29E" intensity={2.0} distance={5} decay={2} />
        {/* Navy banner */}
        <mesh position={[0.2, 1.8, 0]}>
          <planeGeometry args={[0.32, 0.75]} />
          <meshStandardMaterial color="#1a3f78" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
      </group>

      <group position={[3.6, 0, 0.6]}>
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.05, 0.07, 2.4, 12]} />
          <meshStandardMaterial color="#10264A" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[0, 2.5, 0]}>
          <octahedronGeometry args={[0.2]} />
          <meshStandardMaterial color="#FFE29E" emissive="#FFE29E" emissiveIntensity={2.2} roughness={0.1} />
        </mesh>
        <pointLight position={[0, 2.5, 0]} color="#FFE29E" intensity={2.0} distance={5} decay={2} />
        {/* Navy banner */}
        <mesh position={[-0.2, 1.8, 0]}>
          <planeGeometry args={[0.32, 0.75]} />
          <meshStandardMaterial color="#1a3f78" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

// -------------------------------------------------------------
// Floating 3D Gold-Framed Polaroid Memory
// -------------------------------------------------------------
interface MemoryFrameProps {
  imagePath: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
  bobOffset?: number;
}

function MemoryFrame({ imagePath, position, rotation, scale = 1, bobOffset = 0 }: MemoryFrameProps) {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useTexture(imagePath);
  texture.generateMipmaps = true;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime() + bobOffset;
    groupRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.05;
    groupRef.current.rotation.z = rotation[2] + Math.sin(t * 1.2) * 0.02;
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Golden Bezel Border Frame */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[1.9, 1.9, 0.05]} />
        <meshStandardMaterial color="#F0C66D" metalness={0.88} roughness={0.18} />
      </mesh>
      {/* Inner White Matte */}
      <mesh position={[0, 0, 0.028]}>
        <boxGeometry args={[1.78, 1.78, 0.015]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
      </mesh>
      {/* Memory Photo Canvas */}
      <mesh position={[0, 0, 0.04]}>
        <planeGeometry args={[1.66, 1.66]} />
        <meshStandardMaterial map={texture} roughness={0.3} />
      </mesh>
      {/* Subtle Warm Backlight Glow */}
      <pointLight position={[0, 0, 0.25]} color="#F0C66D" intensity={0.4} distance={2.2} />
    </group>
  );
}

// -------------------------------------------------------------
// Winding Golden Light Ribbon along walkway
// -------------------------------------------------------------
function GoldenWalkwayTrail() {
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.3, 0.06, 4.5),
      new THREE.Vector3(-0.6, 0.06, 3.0),
      new THREE.Vector3(-0.15, 0.06, 1.6),
      new THREE.Vector3(0.4, 0.06, 0.4),
      new THREE.Vector3(0.1, 0.06, -1.2),
      new THREE.Vector3(0.0, 0.06, -3.5),
    ]);
  }, []);

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 48, 0.045, 8, false]} />
        <meshStandardMaterial
          color="#F0C66D"
          emissive="#F0C66D"
          emissiveIntensity={1.8}
          roughness={0.2}
          metalness={0.7}
        />
      </mesh>
    </group>
  );
}

// -------------------------------------------------------------
// Ground Courtyard with Paved Walkway, Flowers & Distant Building
// -------------------------------------------------------------
function CampusCourtyard({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const facadeTexture = useTexture('/images/campus_facade.png');
  facadeTexture.generateMipmaps = true;
  const cloudTexture = useTexture('/images/cloud_soft.png');

  return (
    <group position={position}>
      {/* Stone Plaza Ground Floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 24]} />
        <meshStandardMaterial color="#122544" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Paved Center Walkway */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4.6, 22]} />
        <meshStandardMaterial color="#1a355d" roughness={0.65} metalness={0.15} />
      </mesh>

      {/* Distant Modern Campus Building Billboard */}
      <mesh position={[0, 3.4, -4.8]}>
        <planeGeometry args={[12.5, 7.5]} />
        <meshStandardMaterial map={facadeTexture} transparent opacity={0.92} roughness={0.5} />
      </mesh>

      {/* Daylight Sky Backdrop Plane with soft graduation morning blue */}
      <mesh position={[0, 4.5, -5.2]}>
        <planeGeometry args={[20, 10]} />
        <meshBasicMaterial color="#3570bd" />
      </mesh>

      {/* Warm Golden Horizon Sun Gradient */}
      <mesh position={[0, 3.8, -5.1]}>
        <planeGeometry args={[16, 6]} />
        <meshBasicMaterial color="#ffd899" transparent opacity={0.3} />
      </mesh>

      {/* Flower hedges along walkway borders */}
      <FlowerHedge position={[-2.2, 0, 3.2]} scale={1.05} />
      <FlowerHedge position={[-2.1, 0, 1.8]} scale={0.95} flip />
      <FlowerHedge position={[-2.3, 0, 0.5]} scale={1.0} />
      <FlowerHedge position={[2.2, 0, 3.1]} scale={1.0} flip />
      <FlowerHedge position={[2.1, 0, 1.7]} scale={1.1} />
      <FlowerHedge position={[2.3, 0, 0.4]} scale={0.95} flip />

      {/* Soft Cloud Sprites at Foreground Bottom Corners */}
      <mesh position={[-3.6, 0.35, 3.8]} rotation={[-0.2, 0.3, 0]}>
        <planeGeometry args={[4.2, 2.0]} />
        <meshBasicMaterial map={cloudTexture} transparent opacity={0.55} depthWrite={false} />
      </mesh>
      <mesh position={[3.6, 0.35, 3.8]} rotation={[-0.2, -0.3, 0]}>
        <planeGeometry args={[4.2, 2.0]} />
        <meshBasicMaterial map={cloudTexture} transparent opacity={0.55} depthWrite={false} />
      </mesh>
    </group>
  );
}

// -------------------------------------------------------------
// MAIN SCENE 02 EXPORT
// -------------------------------------------------------------
export function CampusScene({ progress }: CampusSceneProps) {
  const p = progress;
  // Scene active window: 0.16 to 0.44
  const isVisible = p >= 0.16 && p <= 0.44;
  if (!isVisible) return null;

  const { viewport } = useThree();
  const isMobile = viewport.width < 5.0;

  const localP = smoothstep(0.18, 0.42, p);

  // Chibi coordinates along walkway: moving through the gate toward graduation
  // Scaled proportionally so chibi looks like a student walking down the path
  const chibiZ = lerp(1.4, -1.2, localP);
  const chibiX = lerp(-0.35, 0.0, localP);
  const chibiScale = isMobile ? 0.65 : 0.75;

  // Frame layout: wide on desktop, snug on mobile
  const frameXOffset = isMobile ? 1.4 : 2.7;
  const frameScale = isMobile ? 0.62 : 0.88;

  return (
    <group position={[0, 0, -5]}>
      {/* Courtyard, Walkway, Flowers, and Distant Building */}
      <CampusCourtyard position={[0, 0, 0]} />

      {/* Iconic Campus Gate / Archway */}
      <CampusGate position={[0, 0, 0]} />

      {/* Winding Golden Light Path */}
      <GoldenWalkwayTrail />

      {/* 4 Floating 3D Gold Memory Frames (Directly matching Concept Art 02) */}
      {/* 1. Top Left: Sunset Silhouette */}
      <MemoryFrame
        imagePath="/images/memory_1.png"
        position={[-frameXOffset, 2.3, 1.2]}
        rotation={[0.06, 0.35, -0.06]}
        scale={frameScale}
        bobOffset={0}
      />

      {/* 2. Bottom Left: Study Desk & Laptop */}
      <MemoryFrame
        imagePath="/images/memory_2.png"
        position={[-frameXOffset + 0.15, 0.85, 2.2]}
        rotation={[-0.05, 0.38, 0.05]}
        scale={frameScale * 0.95}
        bobOffset={1.2}
      />

      {/* 3. Top Right: Classroom Group Discussion */}
      <MemoryFrame
        imagePath="/images/memory_3.png"
        position={[frameXOffset, 2.3, 1.0]}
        rotation={[0.06, -0.35, 0.06]}
        scale={frameScale}
        bobOffset={2.1}
      />

      {/* 4. Bottom Right: Graduation Cap Toss */}
      <MemoryFrame
        imagePath="/images/memory_4.png"
        position={[frameXOffset - 0.15, 0.85, 2.0]}
        rotation={[-0.05, -0.38, -0.05]}
        scale={frameScale * 0.95}
        bobOffset={3.3}
      />

      {/* Chibi Graduate Walking Forward on Path toward Gate */}
      <Graduate
        position={[chibiX, 0.12, chibiZ]}
        rotation={[0, -0.75, 0]} // Faces forward-right toward camera & walkway
        scale={chibiScale}
        waving={false}
      />

      {/* Ambient Floating Gold Dust Particles */}
      <points position={[0, 2.0, 1.5]}>
        <sphereGeometry args={[5, 16, 16]} />
        <pointsMaterial size={0.05} color="#F0C66D" transparent opacity={0.65} />
      </points>
    </group>
  );
}
