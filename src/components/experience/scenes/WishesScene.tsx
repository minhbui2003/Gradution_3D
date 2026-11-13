'use client';

import React from 'react';
import { Graduate } from '../models/Graduate';
import { Cap } from '../models/Cap';
import { smoothstep, lerp } from '@/lib/sceneProgress';

interface WishesSceneProps {
  progress: number;
}

export function WishesScene({ progress }: WishesSceneProps) {
  const p = progress;
  // Scene active window: 0.78 to 1.00
  const isVisible = p >= 0.78;
  if (!isVisible) return null;

  // Final Chibi return: 0.92 to 1.00
  const returnProgress = smoothstep(0.92, 0.98, p);
  const chibiY = lerp(-2.5, 0.2, returnProgress);

  return (
    <group position={[0, 0, -25]}>
      {/* Golden celebratory sparkles */}
      <points position={[0, 1.5, 0]}>
        <sphereGeometry args={[8, 20, 20]} />
        <pointsMaterial size={0.07} color="#F0C66D" transparent opacity={0.65} />
      </points>

      {/* Floating cap in corner */}
      <Cap
        position={[3.2, 1.8, 1]}
        rotation={[0.2, 0.5, 0]}
        scale={0.7}
        spinning
      />

      {/* Returning Chibi waving goodbye */}
      {p >= 0.90 && (
        <Graduate
          position={[0, chibiY, 1]}
          rotation={[0, 0, 0]}
          scale={1.4}
          waving
        />
      )}
    </group>
  );
}
