/**
 * Security and anti-spam utilities for Next.js API routes.
 */

// In-memory sliding window rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitMap.forEach((val, key) => {
      if (val.resetAt < now) {
        rateLimitMap.delete(key);
      }
    });
  }, 5 * 60 * 1000);
}

/**
 * Check if a client has exceeded allowed requests within a window.
 * @param key unique identifier (e.g. ip + action)
 * @param maxRequests maximum allowed calls
 * @param windowMs time window in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count += 1;
  return true;
}

/**
 * Extract client IP from headers safely.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

/**
 * Sanitize plain text strings: strip HTML tags and control characters.
 */
export function sanitizeText(text: unknown, maxLength: number): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/<[^>]*>/g, '') // strip HTML markup
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars
    .trim()
    .slice(0, maxLength);
}

/**
 * Verify admin credentials for protected queries (e.g. Full RSVP export).
 */
export function isAdminAuthorized(request: Request): boolean {
  const adminSecret = process.env.ADMIN_SECRET || process.env.ADMIN_TOKEN;
  if (!adminSecret) return false;

  const authHeader = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const tokenHeader = request.headers.get('x-admin-token');

  return authHeader === adminSecret || tokenHeader === adminSecret;
}
