export interface ModelAsset {
  id: string;
  url: string;
  fallbackType: 'chibi' | 'cap' | 'envelope' | 'diploma' | 'stage' | 'podium' | 'gate';
  scale: [number, number, number];
  rotation: [number, number, number];
  position: [number, number, number];
}

export const ASSET_REGISTRY: Record<string, ModelAsset> = {
  graduate: {
    id: 'graduate',
    url: '/models/graduate.glb',
    fallbackType: 'chibi',
    scale: [1.8, 1.8, 1.8],
    rotation: [0, 0, 0],
    position: [0, 0, 0],
  },
  graduate_rigged: {
    id: 'graduate_rigged',
    url: '/models/graduate_rigged.glb',
    fallbackType: 'chibi',
    scale: [1.8, 1.8, 1.8],
    rotation: [0, 0, 0],
    position: [0, 0, 0],
  },
  cap: {
    id: 'cap',
    url: '/models/cap.glb',
    fallbackType: 'cap',
    scale: [0.8, 0.8, 0.8],
    rotation: [0, 0, 0],
    position: [0, 0, 0],
  },
  diploma: {
    id: 'diploma',
    url: '/models/diploma.glb',
    fallbackType: 'diploma',
    scale: [0.5, 0.5, 0.5],
    rotation: [0, 0, 0],
    position: [0, 0, 0],
  },
};
