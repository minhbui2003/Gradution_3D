import { NextResponse } from 'next/server';
import {
  checkRateLimit,
  getClientIp,
  sanitizeText,
  isAdminAuthorized,
} from '@/lib/security';
import {
  fetchRSVPSummary,
  fetchAllRSVPRecords,
  saveRSVPRecord,
  RSVPRecord,
} from '@/lib/storage';

// GET /api/rsvp - Protected from public privacy leakage
export async function GET(request: Request) {
  try {
    const summary = await fetchRSVPSummary();

    // If request contains valid admin authorization, return full guest records
    if (isAdminAuthorized(request)) {
      const records = await fetchAllRSVPRecords();
      return NextResponse.json({
        success: true,
        ...summary,
        records,
      });
    }

    // Public response: strictly aggregate statistics only.
    // Personal names, messages, and contact details are NEVER publicly exposed.
    return NextResponse.json({
      success: true,
      total: summary.total,
      attendingCount: summary.attendingCount,
    });
  } catch (err) {
    console.error('Error fetching RSVP summary:', err);
    return NextResponse.json(
      { success: false, error: 'Không thể truy xuất thông tin RSVP' },
      { status: 500 }
    );
  }
}

// POST /api/rsvp - Submit RSVP with anti-spam & rate limiting
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);

    // Rate limit: Max 5 RSVP submissions per 10 minutes per IP
    if (!checkRateLimit(`rsvp:${ip}`, 5, 10 * 60 * 1000)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bạn đã gửi yêu cầu quá nhiều lần. Vui lòng thử lại sau 10 phút.',
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { fullName, attendance, guestCount, message, honeypot } = body;

    // Honeypot spam trap
    if (honeypot) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Input sanitization & validation
    const cleanName = sanitizeText(fullName, 80);
    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập họ và tên hợp lệ (ít nhất 2 ký tự)' },
        { status: 400 }
      );
    }

    if (attendance !== 'yes' && attendance !== 'no') {
      return NextResponse.json(
        { success: false, error: 'Vui lòng chọn trạng thái tham dự hợp lệ' },
        { status: 400 }
      );
    }

    const count = parseInt(guestCount, 10);
    const validGuestCount =
      attendance === 'yes' ? (isNaN(count) || count < 1 ? 1 : Math.min(10, count)) : 0;

    const cleanMessage = sanitizeText(message, 300);

    const record: RSVPRecord = {
      id: `rsvp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fullName: cleanName,
      attendance,
      guestCount: validGuestCount,
      message: cleanMessage,
      createdAt: new Date().toISOString(),
    };

    await saveRSVPRecord(record);

    return NextResponse.json({ success: true, record }, { status: 201 });
  } catch (err) {
    console.error('Error handling RSVP submission:', err);
    return NextResponse.json(
      { success: false, error: 'Máy chủ xử lý lỗi, vui lòng thử lại sau' },
      { status: 500 }
    );
  }
}
