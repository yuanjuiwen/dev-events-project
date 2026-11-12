'use server';

import connectDB from '@/lib/mongodb';
import Event, { IEvent } from '@/database/event.model';

/**
 * 取得與指定 slug 的活動擁有相同 tag 的其他活動（不含自己）
 */
const getSimilarEventsBySlug = async (slug: string): Promise<IEvent[]> => {
  try {
    await connectDB();

    const event = await Event.findOne({ slug }).lean();
    if (!event) return [];

    const similarEvents = await Event.find({
      _id: { $ne: event._id },
      tags: { $in: event.tags },
    })
      .limit(3)
      .lean();

    return similarEvents as unknown as IEvent[];
  } catch (error) {
    console.error('Error fetching similar events:', error);
    return [];
  }
};

export default getSimilarEventsBySlug;
