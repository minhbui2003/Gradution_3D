import { NextResponse } from 'next/server';
import {
  checkRateLimit,
  getClientIp,
  sanitizeText,
} from '@/lib/security';
import {
  fetchWishesRecords,
  saveWishRecord,
  updateWishLike,
  WishRecord,
} from '@/lib/storage';

// GET /api/wishes - Retrieve all wishes
export async function GET() {
  try {
    const wishes = await fetchWishesRecords();
    return NextResponse.json({ success: true, wishes });
  } catch (err) {
    console.error('Error fetching wishes:', err);
    return NextResponse.json(
      { success: false, error: 'Không thể tải danh sách lời chúc' },
      { status: 500 }
    );
  }
}

// POST /api/wishes - Submit a new wish with anti-spam & rate limiting
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);

    // Rate limit: Max 5 wishes per 10 minutes per IP
    if (!checkRateLimit(`wish:${ip}`, 5, 10 * 60 * 1000)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bạn đã gửi lời chúc quá thường xuyên. Vui lòng thử lại sau 10 phút.',
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { senderName, relation, message, honeypot } = body;

    // Honeypot spam trap
    if (honeypot) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const cleanName = sanitizeText(senderName, 50);
    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập họ và tên của bạn (tối thiểu 2 ký tự)' },
        { status: 400 }
      );
    }

    const cleanMessage = sanitizeText(message, 500);
    if (!cleanMessage || cleanMessage.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập nội dung lời chúc hợp lệ' },
        { status: 400 }
      );
    }

    const cleanRelation = sanitizeText(relation, 30) || 'Bạn bè';

    const newWish: WishRecord = {
      id: `wish-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderName: cleanName,
      relation: cleanRelation,
      message: cleanMessage,
      createdAt: new Date().toISOString(),
      likes: 1,
    };

    await saveWishRecord(newWish);

    return NextResponse.json({ success: true, wish: newWish }, { status: 201 });
  } catch (err) {
    console.error('Error saving wish:', err);
    return NextResponse.json(
      { success: false, error: 'Máy chủ xử lý lỗi, vui lòng thử lại sau' },
      { status: 500 }
    );
  }
}

// PATCH /api/wishes - Like a wish with rate limiting
export async function PATCH(request: Request) {
  try {
    const ip = getClientIp(request);

    // Rate limit: Max 30 likes per minute per IP
    if (!checkRateLimit(`like:${ip}`, 30, 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: 'Thao tác quá nhanh, vui lòng chờ một lát.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ success: false, error: 'ID không hợp lệ' }, { status: 400 });
    }

    const cleanId = sanitizeText(id, 60);
    const newLikes = await updateWishLike(cleanId);

    return NextResponse.json({ success: true, id: cleanId, likes: newLikes });
  } catch (err) {
    console.error('Error liking wish:', err);
    return NextResponse.json({ success: false, error: 'Không thể cập nhật tim' }, { status: 500 });
  }
}
