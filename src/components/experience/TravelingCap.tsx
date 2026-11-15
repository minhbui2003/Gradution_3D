'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Cap } from './models/Cap';
import { smoothstep, lerp } from '@/lib/sceneProgress';
import { CAMPUS_JOURNEY } from '@/config/journey';

export function TravelingCap({ progress, motionEnabled }: { progress: number; motionEnabled: boolean }) {
  const group = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const { viewport, size } = useThree();
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(.09, .29, 0), new THREE.Vector3(.17, .26, .12),
    new THREE.Vector3(.03, .31, .2), new THREE.Vector3(.28, .22, 0),
    new THREE.Vector3(.30, .18, .1), new THREE.Vector3(-.03, .30, .2),
    new THREE.Vector3(.29, .26, 0), new THREE.Vector3(.31, .18, .1),
    new THREE.Vector3(.05, .32, .2), new THREE.Vector3(.29, .25, 0),
    new THREE.Vector3(.30, .19, .1), new THREE.Vector3(-.10, .29, .2),
    new THREE.Vector3(.26, .29, 0),
  ], false, 'catmullrom', .3), []);
  const trail = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(36 * 3), 3));
    const material = new THREE.LineBasicMaterial({ color: '#ebca85', transparent: true, opacity: .24, depthWrite: false });
    return new THREE.Line(geometry, material);
  }, []);
  const point = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => () => { trail.geometry.dispose(); trail.material.dispose(); }, [trail]);

  useFrame((_, delta) => {
    if (!group.current) return;
    if (motionEnabled) elapsed.current += Math.min(delta, .05);
    const t = elapsed.current;
    const idleX = Math.sin(t * .55) * .025;
    const idleY = Math.sin(t * .9) * .04;
    curve.getPoint(Math.max(0, Math.min(1, progress)), point);
    const door = smoothstep(.37, .4, progress) * (1 - smoothstep(.435, .465, progress));
    point.x = lerp(point.x, 0, door);
    point.y = lerp(point.y, .055, door);
    point.z = lerp(point.z, -2.6, door * smoothstep(CAMPUS_JOURNEY.doorOpen, .445, progress));
    group.current.position.set(point.x * viewport.width + idleX, point.y * viewport.height + .1 + idleY, point.z);
    const doorwayScale = 1 - .88 * smoothstep(CAMPUS_JOURNEY.doorOpen, .44, progress) * (1 - smoothstep(.44, .47, progress));
    group.current.scale.setScalar((size.width < 768 ? .36 : .65) * doorwayScale);
    group.current.rotation.set(.48 + Math.sin(t * .45) * .08, -progress * Math.PI * 6 + t * .22, Math.sin(progress * 16) * .25 + Math.sin(t * .7) * .05);
    const positions = trail.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      curve.getPoint(Math.max(0, Math.min(1, progress - .045 * i / (positions.count - 1))), point);
      point.x = lerp(point.x, 0, door);
      point.y = lerp(point.y, .055, door);
      point.z = lerp(point.z, -2.6, door * smoothstep(CAMPUS_JOURNEY.doorOpen, .445, progress));
      positions.setXYZ(i, point.x * viewport.width + idleX, point.y * viewport.height + .1 + idleY, point.z);
    }
    positions.needsUpdate = true;
    trail.geometry.computeBoundingSphere();
  });

  return <>
    <primitive object={trail} dispose={null} />
    <group ref={group} scale={size.width < 768 ? .36 : .65}>
      <Cap animated={motionEnabled} />
    </group>
  </>;
}
