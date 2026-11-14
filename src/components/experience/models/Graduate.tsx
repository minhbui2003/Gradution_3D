'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { createMixamoGraduateClips } from './MixamoGraduateClips';

interface GraduateProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  waving?: boolean;
  celebrating?: boolean;
  animated?: boolean;
}

export function ProceduralGraduate({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  waving = false,
  animated = true,
}: GraduateProps) {
  const groupRef = useRef<THREE.Group>(null);
  const armRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = animated ? clock.getElapsedTime() : 0;
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(t * 2) * 0.03;
    }
    if (armRef.current && waving) {
      armRef.current.rotation.z = Math.sin(t * 6) * 0.25 - 0.7;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Body / Gown */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.38, 0.75, 20]} />
        <meshStandardMaterial color="#0c1726" roughness={0.5} />
      </mesh>

      {/* Royal blue stole / trim */}
      <mesh position={[0, 0.52, 0.03]}>
        <cylinderGeometry args={[0.23, 0.39, 0.72, 20, 1, true, -Math.PI / 4, Math.PI / 2]} />
        <meshStandardMaterial color="#2469BC" roughness={0.35} />
      </mesh>

      {/* Gold V-shaped ribbon */}
      <mesh position={[0, 0.58, 0.16]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.2, 0.14, 0.05]} />
        <meshStandardMaterial color="#F0C66D" metalness={0.6} roughness={0.25} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial color="#F8D7BE" roughness={0.6} />
      </mesh>

      {/* Hair */}
      <mesh position={[0, 1.12, -0.04]}>
        <sphereGeometry args={[0.29, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.85} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.09, 1.02, 0.24]}>
        <sphereGeometry args={[0.038, 16, 16]} />
        <meshStandardMaterial color="#111111" roughness={0.1} />
      </mesh>
      <mesh position={[0.09, 1.02, 0.24]}>
        <sphereGeometry args={[0.038, 16, 16]} />
        <meshStandardMaterial color="#111111" roughness={0.1} />
      </mesh>
      <mesh position={[-0.08, 1.035, 0.27]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.1, 1.035, 0.27]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Smile */}
      <mesh position={[0, 0.93, 0.26]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.045, 0.009, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#A34848" />
      </mesh>

      {/* Waving Arm */}
      <group ref={armRef} position={[-0.26, 0.7, 0]}>
        <mesh position={[-0.08, 0.12, 0]} rotation={[0, 0, 0.6]} castShadow>
          <capsuleGeometry args={[0.07, 0.24, 8, 16]} />
          <meshStandardMaterial color="#0c1726" roughness={0.5} />
        </mesh>
        <mesh position={[-0.18, 0.24, 0]}>
          <sphereGeometry args={[0.065, 16, 16]} />
          <meshStandardMaterial color="#F8D7BE" />
        </mesh>
      </group>

      {/* Rest Arm */}
      <group position={[0.26, 0.7, 0]}>
        <mesh position={[0.06, -0.1, 0]} rotation={[0, 0, -0.2]} castShadow>
          <capsuleGeometry args={[0.07, 0.24, 8, 16]} />
          <meshStandardMaterial color="#0c1726" roughness={0.5} />
        </mesh>
        <mesh position={[0.12, -0.22, 0]}>
          <sphereGeometry args={[0.065, 16, 16]} />
          <meshStandardMaterial color="#F8D7BE" />
        </mesh>
      </group>
    </group>
  );
}

function RiggedGlbModel({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  waving = false,
  celebrating = false,
  animated = true,
}: GraduateProps) {
  const { scene } = useGLTF(
    '/models/graduate_rigged.glb',
    undefined,
    undefined,
    (loader) => {
      loader.setMeshoptDecoder(MeshoptDecoder);
    }
  );

  const groupRef = useRef<THREE.Group>(null);
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene) as THREE.Group, [scene]);
  const normalization = useMemo(() => {
    const bounds = new THREE.Box3().setFromObject(clonedScene);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const factor = 2.5 / Math.max(size.y, 0.001);
    return { factor, offset: [-center.x * factor, -bounds.min.y * factor, -center.z * factor] as [number, number, number] };
  }, [clonedScene]);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const activeActionRef = useRef<THREE.AnimationAction | null>(null);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const mat = (child as THREE.Mesh).material;
        if (mat) {
          (mat as THREE.MeshStandardMaterial).roughness = 0.35;
          (mat as THREE.MeshStandardMaterial).metalness = 0.1;
        }
      }
    });

    // Create animation clips from bones
    const clips = createMixamoGraduateClips(clonedScene);
    if (clips.length > 0) {
      const mixer = new THREE.AnimationMixer(clonedScene);
      mixerRef.current = mixer;

      actionsRef.current = Object.fromEntries(clips.map((clip) => [clip.name, mixer.clipAction(clip)]));
    }

    return () => {
      mixerRef.current?.stopAllAction();
      mixerRef.current?.uncacheRoot(clonedScene);
      mixerRef.current = null;
      actionsRef.current = {};
      activeActionRef.current = null;
    };
  }, [clonedScene]);

  useEffect(() => {
    const next = actionsRef.current[celebrating ? 'Celebrate' : waving ? 'Wave' : 'Idle'];
    const previous = activeActionRef.current;
    if (!next || next === previous) return;
    next.reset().setEffectiveWeight(1).play();
    if (previous) next.crossFadeFrom(previous, animated ? 0.45 : 0, false);
    activeActionRef.current = next;
  }, [clonedScene, waving, celebrating, animated]);

  useFrame((_, delta) => {
    if (mixerRef.current && animated) {
      mixerRef.current.update(delta);
    }
  });

  // The source model faces +X; rotate it to +Z, toward the viewer.
  const finalRotY = -Math.PI / 2 + (rotation[1] || 0);

  return (
    <group ref={groupRef} position={position} scale={scale} dispose={null}>
      <group rotation={[rotation[0] || 0, finalRotY, rotation[2] || 0]}>
        <primitive
          object={clonedScene}
          position={normalization.offset}
          scale={normalization.factor}
        />
      </group>
    </group>
  );
}

export function Graduate(props: GraduateProps) {
  return (
    <React.Suspense fallback={null}>
      <RiggedGlbModel {...props} />
    </React.Suspense>
  );
}
