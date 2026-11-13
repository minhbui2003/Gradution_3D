import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface WishItem {
  id: string;
  senderName: string;
  relation: string;
  message: string;
  createdAt: string;
  likes: number;
}

const DATA_FILE = path.join(process.cwd(), 'data', 'wishes.json');

function readWishes(): WishItem[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading wishes:', err);
    return [];
  }
}

function writeWishes(wishes: WishItem[]) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(wishes, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing wishes:', err);
  }
}

// GET /api/wishes - Retrieve all wishes
export async function GET() {
  const wishes = readWishes();
  return NextResponse.json({ success: true, wishes });
}

// POST /api/wishes - Submit a new wish
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { senderName, relation, message } = body;

    if (!senderName || typeof senderName !== 'string' || !senderName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập họ và tên của bạn' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập nội dung lời chúc' },
        { status: 400 }
      );
    }

    if (message.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Lời chúc không được vượt quá 500 ký tự' },
        { status: 400 }
      );
    }

    const newWish: WishItem = {
      id: `wish-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderName: senderName.trim().slice(0, 50),
      relation: typeof relation === 'string' && relation.trim() ? relation.trim().slice(0, 30) : 'Bạn bè',
      message: message.trim(),
      createdAt: new Date().toISOString(),
      likes: 1,
    };

    const wishes = readWishes();
    wishes.unshift(newWish);
    writeWishes(wishes);

    return NextResponse.json({ success: true, wish: newWish }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Máy chủ xử lý lỗi, vui lòng thử lại sau' },
      { status: 500 }
    );
  }
}

// PATCH /api/wishes - Like a wish
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ success: false, error: 'ID không hợp lệ' }, { status: 400 });
    }

    const wishes = readWishes();
    let newLikes = 0;
    const updated = wishes.map((w) => {
      if (w.id === id) {
        newLikes = (w.likes || 0) + 1;
        return { ...w, likes: newLikes };
      }
      return w;
    });

    writeWishes(updated);
    return NextResponse.json({ success: true, id, likes: newLikes });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Không thể cập nhật tim' }, { status: 500 });
  }
}
