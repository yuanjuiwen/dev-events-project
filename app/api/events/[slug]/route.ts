import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/database/event.model';

// Next.js 15+ 的動態路由參數是 Promise，需要 await
type RouteParams = {
  params: Promise<{ slug: string }>;
};


const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(
  _req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { slug } = await params;

    // 驗證：slug 必須存在且不是空字串
    if (!slug || slug.trim() === '') {
      return NextResponse.json(
        { message: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    // 正規化：去除空白並轉小寫，與資料庫儲存的格式一致
    const sanitizedSlug = slug.trim().toLowerCase();

    // 驗證：slug 格式必須合法
    if (!SLUG_PATTERN.test(sanitizedSlug)) {
      return NextResponse.json(
        { message: 'Invalid slug format' },
        { status: 400 }
      );
    }

    await connectDB();

    // lean() 回傳純物件而非 Mongoose 文件，唯讀查詢時效能較好
    const event = await Event.findOne({ slug: sanitizedSlug }).lean();

    if (!event) {
      return NextResponse.json(
        { message: `Event with slug '${sanitizedSlug}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Event fetched successfully', event },
      { status: 200 }
    );
  } catch (error) {
    // 詳細錯誤只記錄在伺服器端，不回傳給用戶端
    console.error('Error fetching event by slug:', error);

    return NextResponse.json(
      { message: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}