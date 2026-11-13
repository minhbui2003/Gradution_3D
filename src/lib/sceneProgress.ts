/**
 * Calculates local progress [0, 1] within a subrange [start, end] of global progress p [0, 1].
 */
export function getSceneProgress(p: number, start: number, end: number): number {
  if (p <= start) return 0;
  if (p >= end) return 1;
  return (p - start) / (end - start);
}

/**
 * Smooth Hermite interpolation (smoothstep)
 */
export function smoothstep(min: number, max: number, value: number): number {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Clamp a number between min and max
 */
export function clamp(val: number, min: number = 0, max: number = 1): number {
  return Math.max(min, Math.min(max, val));
}
