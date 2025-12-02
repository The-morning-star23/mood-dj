import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Track from '@/models/Track';

export async function POST(req: NextRequest) {
  try {
    // 1. Connect to DB
    await dbConnect();

    // 2. Parse the incoming form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string;
    const artist = formData.get('artist') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 3. Convert file to Buffer (binary data)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Save to MongoDB
    const newTrack = await Track.create({
      filename: file.name,
      contentType: file.type,
      title: title || file.name,
      artist: artist || 'Unknown',
      audioData: buffer,
    });

    return NextResponse.json({ 
      message: 'Upload successful', 
      trackId: newTrack._id 
    }, { status: 201 });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}