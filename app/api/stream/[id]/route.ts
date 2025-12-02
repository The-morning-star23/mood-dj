import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Track from '@/models/Track';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params; // Await params for Next.js 15 compatibility
    await dbConnect();

    const track = await Track.findById(params.id);

    if (!track || !track.audioData) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Create headers to tell the browser this is an audio file
    const headers = new Headers();
    headers.set('Content-Type', track.contentType);
    headers.set('Content-Length', track.audioData.length.toString());

    // Return the raw binary data
    return new NextResponse(new Uint8Array(track.audioData), {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Stream error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}