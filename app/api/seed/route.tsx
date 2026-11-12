import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/database/event.model';
import { events } from '@/lib/constants';

// 暫時性的 seed 路由：把 lib/constants.ts 的假資料寫入資料庫
// 用完請刪除這個檔案
export async function GET() {
  // 正式環境禁止執行
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not allowed' }, { status: 403 });
  }

  try {
    await connectDB();

    // 找出資料庫裡已經有的 slug，避免重複寫入
    const existing = await Event.find({
      slug: { $in: events.map((e) => e.slug) },
    })
      .select('slug')
      .lean();
    const existingSlugs = new Set(existing.map((e) => e.slug));

    // 只處理還不存在的活動，並補上 Schema 要求的欄位
    const docs = events
      .filter((e) => !existingSlugs.has(e.slug))
      .map((e) => ({
        ...e,
        description: `${e.title} brings developers together in ${e.location} for talks, workshops and networking.`,
        overview: `Join us at ${e.title} in ${e.location}.`,
        venue: 'To be announced',
        mode: 'offline',
        audience: 'Developers of all levels',
        agenda: ['Opening keynote', 'Talks and workshops', 'Networking'],
        organizer: 'DevEvent',
        tags: ['developer', 'conference'],
      }));

    const inserted = await Event.insertMany(docs);

    return NextResponse.json(
      {
        message: 'Seed completed',
        inserted: inserted.length,
        skipped: events.length - inserted.length,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: 'Seed failed', error: e instanceof Error ? e.message : 'Unknown' },
      { status: 500 }
    );
  }
}