import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface RSVPRecord {
  id: string;
  fullName: string;
  attendance: 'yes' | 'no';
  guestCount: number;
  message?: string;
  createdAt: string;
}

const DATA_FILE = path.join(process.cwd(), 'data', 'rsvp.json');

function readRSVP(): RSVPRecord[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading RSVP:', err);
    return [];
  }
}

function writeRSVP(records: RSVPRecord[]) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing RSVP:', err);
  }
}

// GET /api/rsvp - Get summary or list
export async function GET() {
  const records = readRSVP();
  return NextResponse.json({
    success: true,
    total: records.length,
    attendingCount: records.filter((r) => r.attendance === 'yes').length,
    records,
  });
}

// POST /api/rsvp - Submit RSVP
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, attendance, guestCount, message } = body;

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập họ và tên của bạn' },
        { status: 400 }
      );
    }

    if (attendance !== 'yes' && attendance !== 'no') {
      return NextResponse.json(
        { success: false, error: 'Vui lòng chọn trạng thái tham dự' },
        { status: 400 }
      );
    }

    const count = parseInt(guestCount, 10);
    const validGuestCount = isNaN(count) || count < 1 ? 1 : Math.min(10, count);

    const record: RSVPRecord = {
      id: `rsvp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fullName: fullName.trim().slice(0, 80),
      attendance,
      guestCount: validGuestCount,
      message: typeof message === 'string' ? message.trim().slice(0, 300) : '',
      createdAt: new Date().toISOString(),
    };

    const records = readRSVP();
    records.unshift(record);
    writeRSVP(records);

    return NextResponse.json({ success: true, record }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Máy chủ xử lý lỗi, vui lòng thử lại sau' },
      { status: 500 }
    );
  }
}
