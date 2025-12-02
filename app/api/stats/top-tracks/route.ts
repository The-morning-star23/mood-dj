import { NextResponse } from 'next/server';
import Redis from 'ioredis';
import dbConnect from '@/lib/mongodb';
import Track from '@/models/Track';

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL!);

export async function GET() {
  try {
    // 1. Check Cache First
    const cachedData = await redis.get('top-tracks');

    if (cachedData) {
      console.log('Serving from Redis Cache');
      return NextResponse.json(JSON.parse(cachedData));
    }

    // 2. If no cache, query Database
    console.log('Fetching from MongoDB');
    await dbConnect();

    // Find top 10 tracks, sort by selectionCount descending
    // We strictly select only necessary fields to reduce data size
    const topTracks = await Track.find({}, 'title artist selectionCount')
      .sort({ selectionCount: -1 })
      .limit(10);

    // 3. Save to Redis Cache (Expire in 60 seconds)
    // 'EX' stands for expire time in seconds
    await redis.set('top-tracks', JSON.stringify(topTracks), 'EX', 60);

    return NextResponse.json(topTracks);

  } catch (error) {
    console.error('Stats Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}