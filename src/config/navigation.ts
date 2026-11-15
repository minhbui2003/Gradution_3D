export const FIRST_MEMORY_PROGRESS = .22;
export const JOURNEY_STOPS = [0, FIRST_MEMORY_PROGRESS, .265, .31, .36, .51, .68, .88] as const;
export const NAVIGATE_EVENT = 'graduation:navigate';
export const TRANSITION_EVENT = 'graduation:transition';
export const INTRO_TRANSITION_MS = 1560;
export const SCENE_TRANSITION_MS = 1050;

export interface JourneyTransition { from: number; to: number; duration: number; }

export function getGestureDestination(progress: number, direction: number) {
  if (direction > 0) return JOURNEY_STOPS.find((stop) => stop > progress + .002) ?? JOURNEY_STOPS[JOURNEY_STOPS.length - 1];
  return [...JOURNEY_STOPS].reverse().find((stop) => stop < progress - .002) ?? 0;
}

export function getTransitionProgress(from: number, to: number, amount: number): number {
  const t = Math.max(0, Math.min(1, amount));
  const ease = (v: number) => v * v * (3 - 2 * v);
  const mix = (a: number, b: number, v: number) => a + (b - a) * v;
  return mix(from, to, ease(t));
}
