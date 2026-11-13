'use client';

import React, { useMemo, useRef } from 'react';
import { useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Envelope } from '../models/Envelope';
import { Graduate } from '../models/Graduate';
import { Cap } from '../models/Cap';
import { smoothstep, lerp } from '@/lib/sceneProgress';

interface InvitationSceneProps {
  progress: number;
}

// 3D Golden Ribbon Light Trail swirling between envelope, cap, and chibi
function GoldenLightTrail({ isMobile }: { isMobile: boolean }) {
  const curve = useMemo(() => {
    if (isMobile) {
      return new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.4, -0.6, 0.4),
        new THREE.Vector3(-0.6, 0.5, 0.8),
        new THREE.Vector3(-0.3, 1.3, 0.6),
        new THREE.Vector3(0.2, 0.9, 0.6),
        new THREE.Vector3(0.8, 0.2, 0.8),
        new THREE.Vector3(0.5, -0.6, 0.9),
      ], true);
    }
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-3.2, -1.0, 0.2),
      new THREE.Vector3(-2.2, -0.2, 0.9),
      new THREE.Vector3(-1.3, 1.4, 0.8),
      new THREE.Vector3(-0.3, 1.7, 0.6),
      new THREE.Vector3(0.6, 1.3, 0.5),
      new THREE.Vector3(1.8, 0.7, 0.7),
      new THREE.Vector3(2.4, -0.2, 0.8),
      new THREE.Vector3(1.5, -0.9, 1.0),
      new THREE.Vector3(0.0, -0.7, 0.8),
    ], true);
  }, [isMobile]);

  const tubeGeo = useMemo(() => new THREE.TubeGeometry(curve, 100, isMobile ? 0.016 : 0.024, 8, true), [curve, isMobile]);

  return (
    <mesh geometry={tubeGeo}>
      <meshStandardMaterial
        color="#F0C66D"
        emissive="#E5AF39"
        emissiveIntensity={0.85}
        roughness={0.2}
        metalness={0.9}
      />
    </mesh>
  );
}

// Golden Sparkle Dust Particles
function GoldenSparkles() {
  const count = 45;
  const pointsRef = useRef<THREE.Points>(null);

  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4 + 0.6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3 + 0.8;
    }
    return [pos];
  }, [count]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime() * 0.4;
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] += Math.sin(t + i) * 0.002;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#F0C66D"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Layered Soft Clouds at the bottom (Cloud Carpet)
function LayeredClouds({ progress }: { progress: number }) {
  const cloudTexture = useTexture('/images/cloud_soft.png');

  // Gentle subtle parting: 0 to 0.12
  const partP = smoothstep(0, 0.12, progress);

  return (
    <group position={[0, -1.3, 0.6]}>
      {/* Background billowing cloud layer */}
      <mesh position={[0, 0.2, -2.5]}>
        <planeGeometry args={[18, 5]} />
        <meshBasicMaterial
          map={cloudTexture}
          transparent
          opacity={0.65}
          depthWrite={false}
          color="#EAF2FC"
        />
      </mesh>

      {/* Left cloud puff under envelope */}
      <mesh
        position={[-1.8 - partP * 3.0, 0.1, 0.8]}
        scale={[6.0, 3.2, 1]}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={cloudTexture}
          transparent
          opacity={0.85}
          depthWrite={false}
          color="#FFFFFF"
        />
      </mesh>

      {/* Right cloud puff under chibi */}
      <mesh
        position={[2.0 + partP * 3.0, 0.2, 0.9]}
        scale={[6.2, 3.4, 1]}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={cloudTexture}
          transparent
          opacity={0.85}
          depthWrite={false}
          color="#FFFFFF"
        />
      </mesh>

      {/* Center soft cloud puff */}
      <mesh position={[0, -0.3, 1.2]} scale={[8.0, 2.8, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={cloudTexture}
          transparent
          opacity={0.8}
          depthWrite={false}
          color="#F4F8FD"
        />
      </mesh>
    </group>
  );
}

// Background Campus Facade in distance (matching 01-invitation.png upper right)
function DistantCampus({ posX }: { posX: number }) {
  const texture = useTexture('/images/campus_facade.png');
  return (
    <mesh position={[posX, 1.3, -4.5]}>
      <planeGeometry args={[6.2, 4.0]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.7}
        color="#E6F0FA"
        depthWrite={false}
      />
    </mesh>
  );
}

// Dreamy Sky Gradient Backdrop
function SkyBackdrop() {
  return (
    <mesh position={[0, 1.2, -6.5]}>
      <planeGeometry args={[26, 16]} />
      <meshBasicMaterial>
        <primitive
          attach="map"
          object={
            new THREE.CanvasTexture(
              (() => {
                if (typeof document === 'undefined') return document;
                const canvas = document.createElement('canvas');
                canvas.width = 16;
                canvas.height = 256;
                const ctx = canvas.getContext('2d')!;
                const grad = ctx.createLinearGradient(0, 0, 0, 256);
                grad.addColorStop(0, '#2F70CB');   // Azure sky blue
                grad.addColorStop(0.5, '#1E4E98'); // IUH Blue
                grad.addColorStop(1, '#0C182B');   // Midnight navy
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, 16, 256);
                return canvas;
              })()
            )
          }
        />
      </meshBasicMaterial>
    </mesh>
  );
}

export function InvitationScene({ progress }: InvitationSceneProps) {
  const { viewport } = useThree();
  const isMobile = viewport.width < 5.0;

  const p = progress;
  const isVisible = p < 0.22;
  if (!isVisible) return null;

  // Envelope flap starts open at rest, stays open gracefully
  const flapProgress = 0.88 + smoothstep(0, 0.08, p) * 0.12;

  // Responsive positions:
  // Desktop: envelope at left (-1.35), chibi at right (+1.35)
  // Mobile (viewport.width ~ 1.8): envelope at -0.48, chibi at +0.42
  const envX = isMobile ? -0.48 : -1.35;
  const envY = isMobile ? 0.32 : 0.08;
  const envScale = isMobile ? 0.65 : 1.05;

  const chibiX = isMobile ? 0.42 : 1.35;
  const chibiY = isMobile ? -0.42 : -0.72;
  const chibiScale = isMobile ? 0.82 : 1.2;

  // Cap transition bridge:
  const capFly = smoothstep(0.12, 0.18, p);
  const capRestX = envX - 0.05;
  const capRestY = envY + (isMobile ? 0.95 : 1.35);
  const capRestZ = 0.65;

  const capPosX = lerp(capRestX, 0.0, capFly);
  const capPosY = lerp(capRestY, 1.45, capFly);
  const capPosZ = lerp(capRestZ, 2.2, capFly);
  const capScale = lerp(isMobile ? 0.55 : 0.85, isMobile ? 0.9 : 1.25, capFly);

  return (
    <group position={[0, 0, 0]}>
      {/* Sky backdrop */}
      <SkyBackdrop />

      {/* Distant Campus Building on Upper Right */}
      <React.Suspense fallback={null}>
        <DistantCampus posX={isMobile ? 2.0 : 4.2} />
      </React.Suspense>

      {/* Cinematic Lighting */}
      <spotLight
        position={[-2.5, 6, 2]}
        intensity={2.8}
        color="#FFF6DE"
        penumbra={0.7}
        angle={0.8}
        castShadow
      />
      <directionalLight position={[3, 5, 4]} intensity={1.8} color="#FFFFFF" />
      <ambientLight intensity={0.9} />

      {/* Layered Soft Clouds Carpet */}
      <React.Suspense fallback={null}>
        <LayeredClouds progress={p} />
      </React.Suspense>

      {/* Golden Ribbon Light Trail & Sparkles */}
      <GoldenLightTrail isMobile={isMobile} />
      <GoldenSparkles />

      {/* 3D Ivory & Gold Graduation Envelope (Left side) */}
      <Envelope
        position={[envX, envY, 0.45]}
        rotation={[0.06, 0.3, -0.04]}
        scale={envScale}
        openProgress={flapProgress}
      />

      {/* Chibi Graduate (Right side, facing camera) */}
      <Graduate
        position={[chibiX, chibiY, 0.75]}
        scale={chibiScale}
        waving={p <= 0.16}
      />

      {/* Floating Graduation Cap (Hovering above envelope, swooping forward at 16%) */}
      <Cap
        position={[capPosX, capPosY, capPosZ]}
        rotation={[0.35, -0.2 + p * 5, 0.1]}
        scale={capScale}
        spinning={p >= 0.12}
      />
    </group>
  );
}
