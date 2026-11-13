'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DiplomaProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  floating?: boolean;
}

export function Diploma({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  floating = false,
}: DiplomaProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current && floating) {
      const t = clock.getElapsedTime();
      groupRef.current.position.y = position[1] + Math.sin(t * 2.5) * 0.05;
      groupRef.current.rotation.y = rotation[1] + Math.sin(t * 1.5) * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Rolled parchment cylinder */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.7, 24]} />
        <meshStandardMaterial color="#FAF7EE" roughness={0.5} />
      </mesh>

      {/* Rolled paper ends detail */}
      <mesh position={[-0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.075, 0.075, 0.01, 16]} />
        <meshStandardMaterial color="#E8E2D0" roughness={0.6} />
      </mesh>
      <mesh position={[0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.075, 0.075, 0.01, 16]} />
        <meshStandardMaterial color="#E8E2D0" roughness={0.6} />
      </mesh>

      {/* Red/Navy ribbon tie */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.085, 0.085, 0.12, 24]} />
        <meshStandardMaterial color="#10264A" roughness={0.3} />
      </mesh>

      {/* Gold Bow */}
      <mesh position={[0, 0.09, 0]}>
        <boxGeometry args={[0.06, 0.06, 0.06]} />
        <meshStandardMaterial color="#F0C66D" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[-0.08, 0.1, 0]} rotation={[0, 0, 0.4]}>
        <coneGeometry args={[0.05, 0.12, 8]} />
        <meshStandardMaterial color="#F0C66D" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0.08, 0.1, 0]} rotation={[0, 0, -0.4]}>
        <coneGeometry args={[0.05, 0.12, 8]} />
        <meshStandardMaterial color="#F0C66D" metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  );
}
