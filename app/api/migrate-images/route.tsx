import { NextResponse } from 'next/server';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import connectDB from '@/lib/mongodb';
import Event from '@/database/event.model';

// 暫時性的路由：把本機圖片上傳到 Cloudinary，並更新資料庫裡的 image 欄位
// 用完請刪除這個檔案
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not allowed' }, { status: 403 });
  }

  try {
    await connectDB();

    // 只找 image 還是本機路徑（/images/ 開頭）的活動
    const events = await Event.find({ image: /^\/images\// });

    // 記錄已上傳過的圖片，同一張只上傳一次
    const uploaded = new Map<string, string>();
    let updated = 0;

    for (const event of events) {
      let url = uploaded.get(event.image);

      if (!url) {
        // 把 /images/event1.png 轉成硬碟上的實際路徑
        const filePath = path.join(process.cwd(), 'public', event.image);

        const result = await cloudinary.uploader.upload(filePath, {
          folder: 'DevEvent',
          resource_type: 'image',
        });

        url = result.secure_url;
        uploaded.set(event.image, url);
      }

      // 只更新 image 欄位
      await Event.updateOne({ _id: event._id }, { $set: { image: url } });
      updated++;
    }

    return NextResponse.json(
      {
        message: 'Migration completed',
        imagesUploaded: uploaded.size,
        eventsUpdated: updated,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: 'Migration failed', error: e instanceof Error ? e.message : 'Unknown' },
      { status: 500 }
    );
  }
}