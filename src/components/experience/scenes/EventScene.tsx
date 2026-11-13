'use client';

import React from 'react';
import { Cap } from '../models/Cap';
import { Diploma } from '../models/Diploma';

interface EventSceneProps {
  progress: number;
}

export function EventScene({ progress }: EventSceneProps) {
  const p = progress;
  // Scene active window: 0.58 to 0.82
  const isVisible = p >= 0.58 && p <= 0.82;
  if (!isVisible) return null;

  return (
    <group position={[0, 0, -18]}>
      {/* Decorative floating props off to sides so central HTML is fully readable */}
      <Cap
        position={[-3.2, 1.8, 0]}
        rotation={[0.3, 0.4, -0.2]}
        scale={0.75}
        spinning
      />
      <Diploma
        position={[3.2, -0.6, 0.5]}
        rotation={[-0.2, -0.4, 0.3]}
        scale={0.7}
        floating
      />

      {/* Gentle ambient particle field */}
      <points position={[0, 1, 0]}>
        <sphereGeometry args={[7, 16, 16]} />
        <pointsMaterial size={0.05} color="#F0C66D" transparent opacity={0.4} />
      </points>
    </group>
  );
}
