import * as THREE from 'three';

/**
 * Creates animation clips for the Mixamo-rigged chibi model (model_coxuong.glb).
 * In this model, the forward axis is +X and its left side is -Z.
 */
export function createMixamoGraduateClips(root: THREE.Object3D): THREE.AnimationClip[] {
  const bones = new Map<string, THREE.Bone>();
  root.updateMatrixWorld(true);
  root.traverse((node) => {
    if ((node as THREE.Bone).isBone) {
      bones.set(node.name.replace(/^mixamorig:?/, ''), node as THREE.Bone);
    }
  });

  const required = [
    'Spine', 'Spine1', 'Spine2', 'Head', 'LeftArm', 'LeftForeArm',
    'LeftHand', 'RightArm', 'RightForeArm', 'LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg',
  ];
  if (!required.every((name) => bones.has(name))) {
    return [];
  }

  const axes = {
    forward: new THREE.Vector3(1, 0, 0),
    up: new THREE.Vector3(0, 1, 0),
    side: new THREE.Vector3(0, 0, 1),
  };

  const rest = new Map<string, { rotation: THREE.Quaternion; world: THREE.Quaternion }>();
  bones.forEach((bone, name) => {
    rest.set(name, {
      rotation: bone.quaternion.clone(),
      world: bone.getWorldQuaternion(new THREE.Quaternion()),
    });
  });

  const track = (name: string, axisName: keyof typeof axes, times: number[], angles: number[]) => {
    const bone = bones.get(name)!;
    const pose = rest.get(name)!;
    const axis = axes[axisName].clone().applyQuaternion(pose.world.clone().invert());
    const values = angles.flatMap((angle) =>
      pose.rotation
        .clone()
        .multiply(new THREE.Quaternion().setFromAxisAngle(axis, angle))
        .toArray()
    );
    return new THREE.QuaternionKeyframeTrack(`${bone.uuid}.quaternion`, times, values);
  };

  const clip = (
    name: string,
    duration: number,
    specs: [string, keyof typeof axes, number[], number[]][]
  ) =>
    new THREE.AnimationClip(
      name,
      duration,
      specs.map(([joint, axis, times, angles]) => track(joint, axis, times, angles))
    );

  const idle = [0, 1.6, 3.2];
  const gesture = [0, 0.4, 0.75, 1.05, 1.35, 1.65, 1.95, 2.4];
  const cheer = [0, 0.4, 0.8, 1.15, 1.5, 1.85, 2.2, 2.8];

  return [
    clip('Idle', 3.2, [
      ['Spine2', 'side', idle, [0, -0.018, 0]],
      ['Head', 'side', idle, [0, 0.015, 0]],
      ['LeftArm', 'forward', idle, [0, 0.018, 0]],
      ['RightArm', 'forward', idle, [0, -0.018, 0]],
    ]),
    clip('Wave', 2.4, [
      ['LeftArm', 'forward', gesture, [0, 0.16, 0.22, 0.16, 0.22, 0.16, 0.1, 0]],
      ['LeftForeArm', 'forward', gesture, [0, 0.15, 0.28, -0.12, 0.28, -0.12, 0.15, 0]],
      ['LeftHand', 'forward', gesture, [0, 0.12, -0.2, 0.2, -0.2, 0.2, -0.1, 0]],
      ['Head', 'side', gesture, [0, -0.035, -0.055, -0.035, -0.055, -0.035, -0.02, 0]],
    ]),
    clip('Celebrate', 2.8, [
      ['LeftArm', 'forward', cheer, [0, 0.22, 0.38, 0.22, 0.38, 0.22, 0.3, 0]],
      ['RightArm', 'forward', cheer, [0, -0.22, -0.38, -0.22, -0.38, -0.22, -0.3, 0]],
      ['LeftForeArm', 'forward', cheer, [0, 0.15, 0.3, 0.15, 0.3, 0.15, 0.2, 0]],
      ['RightForeArm', 'forward', cheer, [0, -0.15, -0.3, -0.15, -0.3, -0.15, -0.2, 0]],
      ['Head', 'side', cheer, [0, -0.04, -0.06, -0.04, -0.06, -0.04, -0.02, 0]],
    ]),
  ];
}
