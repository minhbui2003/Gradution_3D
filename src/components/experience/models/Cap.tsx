'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CapProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  spinning?: boolean;
}

export function Cap({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  spinning = false,
}: CapProps) {
  const groupRef = useRef<THREE.Group>(null);
  const tasselRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current && spinning) {
      groupRef.current.rotation.y += 0.04;
      groupRef.current.rotation.z = Math.sin(t * 3) * 0.15;
    }
    if (tasselRef.current) {
      tasselRef.current.rotation.z = Math.sin(t * 4) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Skullcap / base ring */}
      <mesh position={[0, -0.08, 0]} castShadow>
        <cylinderGeometry args={[0.26, 0.3, 0.16, 24]} />
        <meshStandardMaterial color="#0b172a" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Royal blue trim ribbon */}
      <mesh position={[0, -0.12, 0]}>
        <cylinderGeometry args={[0.295, 0.305, 0.04, 24]} />
        <meshStandardMaterial color="#2469BC" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Square mortarboard flat top */}
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.85, 0.035, 0.85]} />
        <meshStandardMaterial color="#0e1f38" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Gold center button */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.03, 16]} />
        <meshStandardMaterial color="#F0C66D" metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Golden tassel cord and fringe */}
      <group ref={tasselRef} position={[0, 0.05, 0]}>
        {/* Cord going to corner */}
        <mesh position={[0.22, -0.04, 0.22]} rotation={[0.2, -Math.PI / 4, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.35, 8]} />
          <meshStandardMaterial color="#F0C66D" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Hanging Tassel */}
        <mesh position={[0.35, -0.22, 0.35]} castShadow>
          <cylinderGeometry args={[0.02, 0.04, 0.25, 12]} />
          <meshStandardMaterial color="#F0C66D" metalness={0.7} roughness={0.25} />
        </mesh>
      </group>
    </group>
  );
}
