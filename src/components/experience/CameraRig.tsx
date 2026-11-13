'use client';

import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraRigProps {
  progress: number;
}

// Keyframe waypoints for camera position and look-at target
const WAYPOINTS = [
  // Scene 1: Hero (0.00 - 0.18) - Framed for cinematic envelope, floating cap, and chibi
  { p: 0.00, pos: new THREE.Vector3(0, 0.4, 4.6), look: new THREE.Vector3(0, 0.2, 0) },
  { p: 0.04, pos: new THREE.Vector3(0, 0.4, 4.5), look: new THREE.Vector3(0, 0.2, 0) },
  { p: 0.08, pos: new THREE.Vector3(0, 0.4, 4.4), look: new THREE.Vector3(0, 0.2, 0) },
  { p: 0.12, pos: new THREE.Vector3(0, 0.45, 4.2), look: new THREE.Vector3(0, 0.25, 0) },
  { p: 0.16, pos: new THREE.Vector3(0, 0.8, 3.8), look: new THREE.Vector3(0, 0.5, -1.0) },
  { p: 0.18, pos: new THREE.Vector3(0, 1.4, 3.0), look: new THREE.Vector3(0, 1.0, -3.0) },

  // Scene 2: Campus (0.18 - 0.42)
  { p: 0.24, pos: new THREE.Vector3(0, 1.8, 1.0), look: new THREE.Vector3(0, 1.4, -5.0) },
  { p: 0.32, pos: new THREE.Vector3(0.5, 1.6, -1.5), look: new THREE.Vector3(0, 1.3, -5.5) },
  { p: 0.38, pos: new THREE.Vector3(0, 1.5, -3.2), look: new THREE.Vector3(0, 1.2, -6.5) },
  { p: 0.42, pos: new THREE.Vector3(0, 2.0, -5.0), look: new THREE.Vector3(0, 1.5, -11.0) },

  // Scene 3: Ceremony (0.42 - 0.60)
  { p: 0.46, pos: new THREE.Vector3(0, 2.2, -6.5), look: new THREE.Vector3(0, 1.5, -11.0) },
  { p: 0.52, pos: new THREE.Vector3(0, 1.7, -7.5), look: new THREE.Vector3(0, 1.3, -11.0) },
  { p: 0.56, pos: new THREE.Vector3(0, 1.8, -7.5), look: new THREE.Vector3(0, 1.8, -11.0) },
  { p: 0.60, pos: new THREE.Vector3(0, 1.5, -9.5), look: new THREE.Vector3(0, 1.2, -18.0) },

  // Scene 4: Event & Venue (0.60 - 0.80)
  { p: 0.66, pos: new THREE.Vector3(0, 1.3, -13.5), look: new THREE.Vector3(0, 1.1, -18.0) },
  { p: 0.75, pos: new THREE.Vector3(0, 1.3, -14.0), look: new THREE.Vector3(0, 1.1, -18.0) },
  { p: 0.80, pos: new THREE.Vector3(0, 1.5, -16.0), look: new THREE.Vector3(0, 1.2, -25.0) },

  // Scene 5: Wishes & RSVP (0.80 - 1.00)
  { p: 0.88, pos: new THREE.Vector3(0, 1.4, -20.5), look: new THREE.Vector3(0, 1.1, -25.0) },
  { p: 0.96, pos: new THREE.Vector3(0, 1.3, -21.0), look: new THREE.Vector3(0, 1.0, -25.0) },
  { p: 1.00, pos: new THREE.Vector3(0, 1.2, -21.5), look: new THREE.Vector3(0, 1.0, -25.0) },
];

function getInterpolatedTransform(p: number) {
  const clamped = Math.max(0, Math.min(1, p));

  // Find surrounding waypoints
  let i = 0;
  while (i < WAYPOINTS.length - 1 && WAYPOINTS[i + 1].p <= clamped) {
    i++;
  }

  if (i >= WAYPOINTS.length - 1) {
    return {
      pos: WAYPOINTS[WAYPOINTS.length - 1].pos,
      look: WAYPOINTS[WAYPOINTS.length - 1].look,
    };
  }

  const w0 = WAYPOINTS[i];
  const w1 = WAYPOINTS[i + 1];
  const t = (clamped - w0.p) / (w1.p - w0.p);
  // Smooth cubic ease
  const easeT = t * t * (3 - 2 * t);

  const currentPos = new THREE.Vector3().lerpVectors(w0.pos, w1.pos, easeT);
  const currentLook = new THREE.Vector3().lerpVectors(w0.look, w1.look, easeT);

  return { pos: currentPos, look: currentLook };
}

export function CameraRig({ progress }: CameraRigProps) {
  const { camera } = useThree();
  const currentLookAt = useRef(new THREE.Vector3(0, 0.8, 0));

  useFrame((_, delta) => {
    const target = getInterpolatedTransform(progress);
    // Smooth damp camera position and lookAt target for buttery 60fps feel
    camera.position.lerp(target.pos, Math.min(1, delta * 8));
    currentLookAt.current.lerp(target.look, Math.min(1, delta * 8));
    camera.lookAt(currentLookAt.current);
  });

  return null;
}
