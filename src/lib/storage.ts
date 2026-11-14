import fs from 'fs';
import path from 'path';

export interface RSVPRecord {
  id: string;
  fullName: string;
  attendance: 'yes' | 'no';
  guestCount: number;
  message?: string;
  createdAt: string;
  ipHash?: string;
}

export interface WishRecord {
  id: string;
  senderName: string;
  relation: string;
  message: string;
  createdAt: string;
  likes: number;
}

// Determine persistent data directory
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const RSVP_FILE = path.join(DATA_DIR, 'rsvp.json');
const WISHES_FILE = path.join(DATA_DIR, 'wishes.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Atomic write to prevent partial file corruption on concurrent writes.
 */
function atomicWriteJson<T>(filePath: string, data: T) {
  ensureDir();
  const tmpPath = `${filePath}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  try {
    fs.renameSync(tmpPath, filePath);
  } catch {
    // Fallback for Windows file locks
    fs.copyFileSync(tmpPath, filePath);
    fs.unlinkSync(tmpPath);
  }
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
}

// --- RSVP Storage API ---

export async function fetchRSVPSummary(): Promise<{ total: number; attendingCount: number }> {
  // If external durable DB or worker endpoint configured, query it
  const externalDbUrl = process.env.DATABASE_URL || process.env.DURABLE_STORAGE_URL;
  if (externalDbUrl && externalDbUrl.startsWith('http')) {
    try {
      const res = await fetch(`${externalDbUrl}/api/rsvp/summary`, {
        headers: { 'x-service-token': process.env.SERVICE_TOKEN || '' },
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('External DB query failed, using persistent local store:', e);
    }
  }

  const records = readJson<RSVPRecord[]>(RSVP_FILE, []);
  return {
    total: records.length,
    attendingCount: records.filter((r) => r.attendance === 'yes').length,
  };
}

export async function fetchAllRSVPRecords(): Promise<RSVPRecord[]> {
  return readJson<RSVPRecord[]>(RSVP_FILE, []);
}

export async function saveRSVPRecord(record: RSVPRecord): Promise<void> {
  const externalDbUrl = process.env.DATABASE_URL || process.env.DURABLE_STORAGE_URL;
  if (externalDbUrl && externalDbUrl.startsWith('http')) {
    try {
      await fetch(`${externalDbUrl}/api/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-service-token': process.env.SERVICE_TOKEN || '',
        },
        body: JSON.stringify(record),
      });
    } catch (e) {
      console.warn('Sync to external durable DB failed, writing to persistent store:', e);
    }
  }

  const records = readJson<RSVPRecord[]>(RSVP_FILE, []);
  records.unshift(record);
  atomicWriteJson(RSVP_FILE, records);
}

// --- Wishes Storage API ---

export async function fetchWishesRecords(): Promise<WishRecord[]> {
  const externalDbUrl = process.env.DATABASE_URL || process.env.DURABLE_STORAGE_URL;
  if (externalDbUrl && externalDbUrl.startsWith('http')) {
    try {
      const res = await fetch(`${externalDbUrl}/api/wishes`);
      if (res.ok) {
        const data = await res.json();
        if (data.wishes) return data.wishes;
      }
    } catch (e) {
      console.warn('External DB query for wishes failed, using persistent store:', e);
    }
  }

  return readJson<WishRecord[]>(WISHES_FILE, []);
}

export async function saveWishRecord(wish: WishRecord): Promise<void> {
  const externalDbUrl = process.env.DATABASE_URL || process.env.DURABLE_STORAGE_URL;
  if (externalDbUrl && externalDbUrl.startsWith('http')) {
    try {
      await fetch(`${externalDbUrl}/api/wishes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-service-token': process.env.SERVICE_TOKEN || '',
        },
        body: JSON.stringify(wish),
      });
    } catch (e) {
      console.warn('Sync wish to external durable DB failed:', e);
    }
  }

  const wishes = readJson<WishRecord[]>(WISHES_FILE, []);
  wishes.unshift(wish);
  atomicWriteJson(WISHES_FILE, wishes);
}

export async function updateWishLike(id: string): Promise<number> {
  const wishes = readJson<WishRecord[]>(WISHES_FILE, []);
  let newLikes = 1;
  const updated = wishes.map((w) => {
    if (w.id === id) {
      newLikes = (w.likes || 0) + 1;
      return { ...w, likes: newLikes };
    }
    return w;
  });
  atomicWriteJson(WISHES_FILE, updated);
  return newLikes;
}
