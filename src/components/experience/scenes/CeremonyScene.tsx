'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Graduate } from '../models/Graduate';
import { Cap } from '../models/Cap';
import { smoothstep, lerp } from '@/lib/sceneProgress';

interface CeremonySceneProps {
  progress: number;
}

// -------------------------------------------------------------
// Theater Auditorium Chairs (Instanced rows in foreground)
// -------------------------------------------------------------
function AuditoriumSeats() {
  const seats = useMemo(() => {
    const list: Array<{ pos: [number, number, number]; rot: [number, number, number] }> = [];
    // Front row
    for (let i = -5; i <= 5; i++) {
      if (Math.abs(i) === 0) continue; // aisle gap in center
      const x = i * 0.9;
      const z = 3.6 - Math.abs(i) * 0.08;
      const rotY = -i * 0.04;
      list.push({ pos: [x, -0.6, z], rot: [0, rotY, 0] });
    }
    // Second row
    for (let i = -6; i <= 6; i++) {
      if (Math.abs(i) === 0) continue;
      const x = i * 0.88;
      const z = 4.7 - Math.abs(i) * 0.08;
      const rotY = -i * 0.04;
      list.push({ pos: [x, -0.9, z], rot: [0, rotY, 0] });
    }
    return list;
  }, []);

  return (
    <group>
      {seats.map((seat, idx) => (
        <group key={idx} position={seat.pos} rotation={seat.rot}>
          {/* Seat Cushion */}
          <mesh position={[0, 0.45, 0]} castShadow>
            <boxGeometry args={[0.62, 0.12, 0.52]} />
            <meshStandardMaterial color="#0d1f3d" roughness={0.7} />
          </mesh>
          {/* Seat Backrest with Gold Accent Ribbon */}
          <mesh position={[0, 0.85, -0.22]}>
            <boxGeometry args={[0.58, 0.72, 0.1]} />
            <meshStandardMaterial color="#122a52" roughness={0.7} />
          </mesh>
          {/* Gold Ribbon Bow on seat back */}
          <mesh position={[0, 0.95, -0.28]}>
            <boxGeometry args={[0.22, 0.06, 0.04]} />
            <meshStandardMaterial color="#F0C66D" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Chair Leg Stand */}
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.44, 8]} />
            <meshStandardMaterial color="#08101e" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// -------------------------------------------------------------
// Flower Bed along stage front lip
// -------------------------------------------------------------
function StageFlowerBed() {
  const flowers = useMemo(() => {
    const list: Array<{ x: number; z: number; color: string; scale: number }> = [];
    for (let i = -7; i <= 7; i++) {
      const x = i * 0.65;
      const z = 2.4 - Math.abs(i) * 0.05;
      list.push({ x, z, color: '#FFFFFF', scale: 0.9 + Math.random() * 0.2 });
      if (Math.abs(i) % 2 === 0) {
        list.push({ x: x + 0.2, z: z + 0.1, color: '#F8E8B0', scale: 0.8 });
      }
    }
    return list;
  }, []);

  return (
    <group position={[0, 0.2, 0]}>
      {/* Green foliage base along stage lip */}
      <mesh position={[0, 0.05, 2.4]}>
        <boxGeometry args={[10.5, 0.15, 0.4]} />
        <meshStandardMaterial color="#193b22" roughness={0.8} />
      </mesh>
      {flowers.map((f, i) => (
        <group key={i} position={[f.x, 0.18, f.z]} scale={f.scale}>
          <mesh>
            <sphereGeometry args={[0.12, 7, 7]} />
            <meshStandardMaterial color={f.color} roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// -------------------------------------------------------------
// Grand Auditorium Architecture & Curtains
// -------------------------------------------------------------
function AuditoriumStage() {
  return (
    <group position={[0, 0, 0]}>
      {/* Tiered Polished Wooden Stage Floor */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[14, 0.4, 6]} />
        <meshStandardMaterial color="#0a1832" roughness={0.25} metalness={0.25} />
      </mesh>

      {/* Front Curved Stage Lip with Gold Trim */}
      <mesh position={[0, 0.2, 2.4]}>
        <boxGeometry args={[11.5, 0.08, 0.15]} />
        <meshStandardMaterial color="#F0C66D" metalness={0.9} roughness={0.15} emissive="#F0C66D" emissiveIntensity={0.3} />
      </mesh>

      {/* Stage Step down */}
      <mesh position={[0, -0.2, 3.1]} receiveShadow>
        <boxGeometry args={[12.5, 0.4, 1.4]} />
        <meshStandardMaterial color="#08142a" roughness={0.35} />
      </mesh>

      {/* Left Grand Velvet Curtain with Gold Fringe */}
      <group position={[-5.8, 3.2, -1.0]}>
        {/* Main Drape */}
        <mesh castShadow>
          <boxGeometry args={[2.8, 6.4, 0.4]} />
          <meshStandardMaterial color="#0c1e3d" roughness={0.75} />
        </mesh>
        {/* Gold Tie-back Ribbon */}
        <mesh position={[0.6, -0.6, 0.25]}>
          <torusGeometry args={[0.35, 0.05, 12, 24]} />
          <meshStandardMaterial color="#F0C66D" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Gold Tassel */}
        <mesh position={[0.6, -1.1, 0.25]}>
          <coneGeometry args={[0.12, 0.45, 12]} />
          <meshStandardMaterial color="#F0C66D" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>

      {/* Right Grand Velvet Curtain with Gold Fringe */}
      <group position={[5.8, 3.2, -1.0]}>
        <mesh castShadow>
          <boxGeometry args={[2.8, 6.4, 0.4]} />
          <meshStandardMaterial color="#0c1e3d" roughness={0.75} />
        </mesh>
        <mesh position={[-0.6, -0.6, 0.25]}>
          <torusGeometry args={[0.35, 0.05, 12, 24]} />
          <meshStandardMaterial color="#F0C66D" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh position={[-0.6, -1.1, 0.25]}>
          <coneGeometry args={[0.12, 0.45, 12]} />
          <meshStandardMaterial color="#F0C66D" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>

      {/* Center Backdrop LED Wall & Banners */}
      <mesh position={[0, 3.6, -2.8]}>
        <planeGeometry args={[9.5, 5.8]} />
        <meshStandardMaterial color="#102548" roughness={0.6} />
      </mesh>

      {/* Left Hanging Royal Blue Banner */}
      <mesh position={[-3.2, 3.8, -2.7]}>
        <planeGeometry args={[1.5, 4.2]} />
        <meshStandardMaterial color="#1a427d" roughness={0.5} />
      </mesh>
      {/* Right Hanging Royal Blue Banner */}
      <mesh position={[3.2, 3.8, -2.7]}>
        <planeGeometry args={[1.5, 4.2]} />
        <meshStandardMaterial color="#1a427d" roughness={0.5} />
      </mesh>

      {/* Gold Laurel Wreath Centerpiece Motif */}
      <group position={[0, 4.4, -2.65]}>
        <mesh rotation={[0, 0, Math.PI * 0.25]}>
          <torusGeometry args={[1.1, 0.06, 12, 32, Math.PI * 1.5]} />
          <meshStandardMaterial color="#F0C66D" metalness={0.9} roughness={0.15} emissive="#F0C66D" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* Gold Crown Header Bar */}
      <mesh position={[0, 6.2, -2.7]}>
        <boxGeometry args={[9.8, 0.2, 0.3]} />
        <meshStandardMaterial color="#F0C66D" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Academic Wooden Podium on Left */}
      <group position={[-2.8, 0.2, 0.8]}>
        {/* Podium Pillar */}
        <mesh position={[0, 0.65, 0]} castShadow>
          <boxGeometry args={[0.75, 1.3, 0.65]} />
          <meshStandardMaterial color="#22150c" roughness={0.4} />
        </mesh>
        {/* Slanted Reading Top with Gold Trim */}
        <mesh position={[0, 1.32, 0.05]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[0.85, 0.08, 0.75]} />
          <meshStandardMaterial color="#F0C66D" metalness={0.75} roughness={0.25} />
        </mesh>
        {/* Podium Floral Arrangement */}
        <group position={[0, 1.45, -0.15]}>
          <mesh>
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
          </mesh>
          <mesh position={[-0.12, 0.04, 0.06]}>
            <sphereGeometry args={[0.14, 8, 8]} />
            <meshStandardMaterial color="#FFF5D6" roughness={0.5} />
          </mesh>
        </group>
      </group>

      {/* Flower Bed along stage front */}
      <StageFlowerBed />

      {/* Auditorium Seating Rows */}
      <AuditoriumSeats />
    </group>
  );
}

// -------------------------------------------------------------
// Floating Golden Light Ring / Swirl around Graduate
// -------------------------------------------------------------
function GoldenSwirlRing({ active }: { active: boolean }) {
  const ringRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ringRef.current || !active) return;
    const t = clock.getElapsedTime();
    ringRef.current.rotation.y = t * 1.8;
    ringRef.current.rotation.x = Math.sin(t * 0.8) * 0.15;
  });

  if (!active) return null;

  return (
    <group ref={ringRef} position={[0, 1.3, 0]}>
      <mesh rotation={[Math.PI / 2.3, 0, 0]}>
        <torusGeometry args={[1.5, 0.035, 12, 48]} />
        <meshStandardMaterial
          color="#F0C66D"
          emissive="#F0C66D"
          emissiveIntensity={2.0}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </group>
  );
}

// -------------------------------------------------------------
// Celebratory Confetti Rain
// -------------------------------------------------------------
function ConfettiParticles({ active }: { active: boolean }) {
  const count = 90;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 7,
      y: Math.random() * 4.5 + 0.8,
      z: (Math.random() - 0.5) * 4.5,
      vx: (Math.random() - 0.5) * 0.02,
      vy: Math.random() * 0.03 + 0.02,
      rotX: Math.random() * Math.PI * 2,
      rotY: Math.random() * Math.PI * 2,
      rotZ: Math.random() * Math.PI * 2,
    }));
  }, [count]);

  useFrame(() => {
    if (!meshRef.current || !active) return;
    particles.forEach((p, i) => {
      p.y -= p.vy;
      if (p.y < 0.2) p.y = 5.2;
      p.rotX += 0.04;
      p.rotY += 0.03;
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rotX, p.rotY, p.rotZ);
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
      <meshStandardMaterial color="#F0C66D" roughness={0.3} metalness={0.8} />
    </instancedMesh>
  );
}

// -------------------------------------------------------------
// MAIN SCENE 03 EXPORT
// -------------------------------------------------------------
export function CeremonyScene({ progress }: CeremonySceneProps) {
  const p = progress;
  // Scene active window: 0.40 to 0.62
  const isVisible = p >= 0.40 && p <= 0.62;
  if (!isVisible) return null;

  // Walk onto stage & approach center: 0.42 to 0.50
  const walkProgress = smoothstep(0.42, 0.50, p);
  // Celebration moment: 0.52 to 0.60
  const celebrateProgress = smoothstep(0.52, 0.58, p);

  // Chibi coordinates
  const chibiX = lerp(-1.6, 0, walkProgress);

  // Floating celebration cap above raised hand (Never giant, perfectly framed)
  const capY = lerp(1.6, 2.4, celebrateProgress);
  const isCelebrating = p >= 0.52;

  return (
    <group position={[0, 0, -11]}>
      {/* 3D Grand Auditorium Stage, Curtains, Podium & Seats */}
      <AuditoriumStage />

      {/* Main Overhead Golden Spotlights */}
      <spotLight
        position={[0, 8.5, 1.5]}
        angle={0.55}
        penumbra={0.8}
        intensity={3.8}
        color="#ffffff"
        castShadow
      />
      {/* Warm Golden Key Light on Center Stage */}
      <spotLight
        position={[-2.5, 7.0, 2.0]}
        angle={0.6}
        penumbra={0.7}
        intensity={2.8}
        color="#F0C66D"
      />
      {/* Cool IUH Blue Rim Light from Behind */}
      <spotLight
        position={[2.5, 6.5, -2.0]}
        angle={0.65}
        penumbra={0.8}
        intensity={2.2}
        color="#3d84e6"
      />

      {/* Volumetric Stage Spotlight Cone Effect */}
      <mesh position={[0, 4.5, 0.5]} rotation={[-0.1, 0, 0]}>
        <cylinderGeometry args={[0.3, 2.2, 7.0, 16, 1, true]} />
        <meshBasicMaterial color="#ffebba" transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Chibi Graduate on Center Stage */}
      {/* Faces directly toward audience & camera: rotation.y = -0.85 rad */}
      <Graduate
        position={[chibiX, 0.22, 0]}
        rotation={[0, -0.85, 0]}
        scale={1.25}
        celebrating={isCelebrating}
        waving={isCelebrating}
      />

      {/* Flying Graduation Cap with Gold Tassel (Above hand, elegant scale) */}
      {isCelebrating && (
        <Cap
          position={[0.38, capY, 0.15]}
          rotation={[0.2, celebrateProgress * 6, 0.1]}
          scale={0.85}
          spinning
        />
      )}

      {/* Swirling Golden Light Ring around Graduate */}
      <GoldenSwirlRing active={isCelebrating} />

      {/* Celebratory Confetti Burst */}
      <ConfettiParticles active={p >= 0.51 && p <= 0.60} />
    </group>
  );
}
