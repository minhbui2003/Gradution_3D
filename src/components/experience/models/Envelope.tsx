'use client';

import React from 'react';
import * as THREE from 'three';

interface EnvelopeProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  openProgress?: number; // 0 (closed) to 1 (fully open)
}

export function Envelope({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  openProgress = 1, // Default open for scenic quality
}: EnvelopeProps) {
  // Flap hinges open upward/backward: 0 (closed) to Math.PI * 0.85 (open)
  const flapAngle = openProgress * Math.PI * 0.85;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* 1. Main Ivory Envelope Pocket Back Plate */}
      <mesh position={[0, 0, -0.04]} receiveShadow castShadow>
        <boxGeometry args={[2.8, 1.9, 0.03]} />
        <meshStandardMaterial color="#FAF7EF" roughness={0.4} metalness={0.05} />
      </mesh>

      {/* Gold metallic perimeter trim on back */}
      <mesh position={[0, 0, -0.045]}>
        <boxGeometry args={[2.86, 1.96, 0.01]} />
        <meshStandardMaterial color="#F0C66D" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* 2. Interior Gold Glow Liner */}
      <mesh position={[0, 0.1, -0.02]}>
        <planeGeometry args={[2.7, 1.7]} />
        <meshStandardMaterial
          color="#FFF2D1"
          emissive="#FFE394"
          emissiveIntensity={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* 3. Front Lower Pocket (The V-neck front) */}
      <group position={[0, -0.2, 0.04]}>
        {/* Main pocket base */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.8, 1.3, 0.03]} />
          <meshStandardMaterial color="#F7F3E9" roughness={0.45} metalness={0.05} />
        </mesh>

        {/* Diagonal V-shaped folds on front pocket */}
        <mesh position={[-0.7, 0.25, 0.02]} rotation={[0, 0, -0.45]} receiveShadow>
          <boxGeometry args={[1.6, 0.04, 0.015]} />
          <meshStandardMaterial color="#E8E2D2" roughness={0.5} />
        </mesh>
        <mesh position={[0.7, 0.25, 0.02]} rotation={[0, 0, 0.45]} receiveShadow>
          <boxGeometry args={[1.6, 0.04, 0.015]} />
          <meshStandardMaterial color="#E8E2D2" roughness={0.5} />
        </mesh>

        {/* Royal Blue Ribbon crossing the pocket horizontally */}
        <mesh position={[0, 0.22, 0.035]}>
          <boxGeometry args={[2.82, 0.16, 0.01]} />
          <meshStandardMaterial color="#1B4E9B" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Gold piping along the ribbon */}
        <mesh position={[0, 0.31, 0.038]}>
          <boxGeometry args={[2.82, 0.02, 0.01]} />
          <meshStandardMaterial color="#F0C66D" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.13, 0.038]}>
          <boxGeometry args={[2.82, 0.02, 0.01]} />
          <meshStandardMaterial color="#F0C66D" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Hanging Ribbon Tails below the seal */}
        <group position={[0, 0.15, 0.045]}>
          <mesh position={[-0.15, -0.35, 0]} rotation={[0, 0, 0.25]}>
            <boxGeometry args={[0.16, 0.55, 0.01]} />
            <meshStandardMaterial color="#1B4E9B" roughness={0.3} />
          </mesh>
          <mesh position={[0.15, -0.35, 0]} rotation={[0, 0, -0.25]}>
            <boxGeometry args={[0.16, 0.55, 0.01]} />
            <meshStandardMaterial color="#1B4E9B" roughness={0.3} />
          </mesh>
        </group>

        {/* Gold Seal Medallion with Laurel Wreath */}
        <group position={[0, 0.22, 0.055]} rotation={[Math.PI / 2, 0, 0]}>
          {/* Outer gold fluted rim */}
          <mesh castShadow>
            <cylinderGeometry args={[0.26, 0.26, 0.04, 32]} />
            <meshStandardMaterial color="#F0C66D" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Inner medallion */}
          <mesh position={[0, 0.025, 0]}>
            <cylinderGeometry args={[0.21, 0.21, 0.02, 28]} />
            <meshStandardMaterial color="#E2A93A" metalness={0.95} roughness={0.15} />
          </mesh>
          {/* Laurel ring */}
          <mesh position={[0, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.13, 0.022, 12, 24]} />
            <meshStandardMaterial color="#FFF4D0" metalness={0.98} roughness={0.1} />
          </mesh>
        </group>
      </group>

      {/* 4. Triangular Opening Flap Hinged at top */}
      <group position={[0, 0.95, -0.02]} rotation={[flapAngle, 0, 0]}>
        {/* Flap body */}
        <mesh position={[0, -0.55, 0]} rotation={[0, 0, Math.PI]} castShadow>
          <coneGeometry args={[1.4, 1.1, 3]} />
          <meshStandardMaterial
            color="#FAF7EF"
            roughness={0.4}
            metalness={0.05}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Gold border on flap */}
        <mesh position={[0, -0.55, 0.005]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[1.38, 1.08, 3]} />
          <meshStandardMaterial
            color="#F0C66D"
            metalness={0.8}
            roughness={0.25}
            wireframe={true}
          />
        </mesh>
      </group>

      {/* Warm Golden Beam Light from inside the envelope */}
      <pointLight position={[0, 0.4, 0.3]} color="#FFE8A3" intensity={2.5} distance={4} />
    </group>
  );
}
