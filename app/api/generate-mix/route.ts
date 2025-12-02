import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dbConnect from '@/lib/mongodb';
import Track from '@/models/Track';
import Mix from '@/models/Mix';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { mood } = await req.json();

    if (!mood) {
      return NextResponse.json({ error: 'Mood is required' }, { status: 400 });
    }

    // 1. Fetch all available tracks (only needed fields to save token usage)
    const allTracks = await Track.find({}, { _id: 1, title: 1, artist: 1 });

    if (allTracks.length === 0) {
      return NextResponse.json({ error: 'No tracks available to mix' }, { status: 404 });
    }

    // 2. Construct the Prompt for Gemini
    const trackListString = allTracks.map(t => 
      `ID: ${t._id}, Title: ${t.title}, Artist: ${t.artist}`
    ).join('\n');

    const prompt = `
      Act as a professional DJ. 
      I have the following songs available:
      ${trackListString}

      The user's current mood is: "${mood}".

      Task: Select 3 to 6 songs from the list that best match this mood. 
      Order them to create a good flow.
      
      Strict Output Requirement:
      Return ONLY a valid JSON object with this structure:
      {
        "trackIds": ["id_of_song_1", "id_of_song_2", ...]
      }
      Do not add any markdown formatting (like \`\`\`json). Just the raw JSON string.
    `;

    // 3. Call Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean up response if AI adds markdown accidentally
    const cleanJson = responseText.replace(/```json|```/g, '').trim();
    const selection = JSON.parse(cleanJson);

    if (!selection.trackIds || selection.trackIds.length === 0) {
      throw new Error('AI failed to select tracks');
    }

    // 4. Update "Selection Count" for analytics
    await Track.updateMany(
      { _id: { $in: selection.trackIds } },
      { $inc: { selectionCount: 1 } }
    );

    // 5. Save the Mix to DB
    const newMix = await Mix.create({
      mood,
      tracks: selection.trackIds
    });

    // 6. Return the full track details to the frontend
    // We populate the 'tracks' field to send actual song data (excluding huge audio buffers)
    const populatedMix = await Mix.findById(newMix._id).populate('tracks', 'title artist _id');

    return NextResponse.json(populatedMix);

  } catch (error) {
    console.error('AI Mix Error:', error);
    return NextResponse.json({ error: 'Failed to generate mix' }, { status: 500 });
  }
}