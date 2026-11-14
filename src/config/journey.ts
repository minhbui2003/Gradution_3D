import { clamp, lerp, smoothstep } from '@/lib/sceneProgress';

// Absolute progress is shared by the video, memory cards and traveling cap.
export const CAMPUS_JOURNEY = {
  start: .18,
  doorHold: .385,
  doorOpen: .40,
  nextScene: .42,
  hallEntered: .46,
  closedDoorTime: 5.0,
  lastFrameTime: 189 / 24,
  hallEntryTime: 2.8,
} as const;

export const MEMORY_STOPS = [
  { start: .205, holdEnd: .233, end: .25, side: 'left', time: 59 / 24, ambient: 'memory-1' },
  { start: .25, holdEnd: .278, end: .295, side: 'right', time: 85 / 24, ambient: 'memory-2' },
  { start: .295, holdEnd: .323, end: .34, side: 'left', time: 103 / 24, ambient: 'memory-3' },
  { start: .34, holdEnd: .368, end: .385, side: 'right', time: 115 / 24, ambient: 'memory-4' },
] as const;

const CAMERA_STOPS = [
  [.18, 0], [.205, 59 / 24], [.233, 59 / 24],
  [.25, 85 / 24], [.278, 85 / 24], [.295, 103 / 24],
  [.323, 103 / 24], [.34, 115 / 24], [.368, 115 / 24],
  [.385, 5.0], [.40, 5.0], [.42, 189 / 24],
] as const;

export function getCampusVideoTime(progress: number) {
  for (let i = 1; i < CAMERA_STOPS.length; i++) {
    const [end, endTime] = CAMERA_STOPS[i];
    const [start, startTime] = CAMERA_STOPS[i - 1];
    if (progress <= end) return lerp(startTime, endTime, smoothstep(start, end, progress));
  }
  return CAMPUS_JOURNEY.lastFrameTime;
}

export function getHallEntryTime(progress: number) {
  return clamp((progress - CAMPUS_JOURNEY.nextScene) / (CAMPUS_JOURNEY.hallEntered - CAMPUS_JOURNEY.nextScene)) * CAMPUS_JOURNEY.hallEntryTime;
}

export function getMemoryOpacity(progress: number, index: number) {
  const stop = MEMORY_STOPS[index];
  return smoothstep(stop.start, stop.start + .006, progress) * (1 - smoothstep(stop.holdEnd, stop.end, progress));
}

export function getCampusHold(progress: number) {
  const memory = MEMORY_STOPS.find((stop) => progress >= stop.start && progress <= stop.holdEnd);
  if (memory) return { id: memory.ambient, opacity: smoothstep(memory.start, memory.start + .002, progress) * (1 - smoothstep(memory.holdEnd - .002, memory.holdEnd, progress)) };
  if (progress >= CAMPUS_JOURNEY.doorHold && progress <= CAMPUS_JOURNEY.doorOpen) {
    return { id: 'door', opacity: smoothstep(.385, .387, progress) * (1 - smoothstep(.398, .40, progress)) };
  }
  return null;
}

export function getApproachZoom(progress: number, hero: boolean) {
  return hero ? 1 + .32 * smoothstep(0, .18, progress) : 1 + .32 * (1 - smoothstep(.18, .205, progress));
}
