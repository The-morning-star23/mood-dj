import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITrack extends Document {
  filename: string;
  title: string;
  artist: string;
  contentType: string; // e.g., 'audio/mpeg'
  audioData: Buffer;   // The actual music file stored as binary
  createdAt: Date;
}

const TrackSchema: Schema = new Schema({
  filename: { type: String, required: true },
  title: { type: String, required: true },
  artist: { type: String, default: 'Unknown Artist' },
  contentType: { type: String, required: true },
  audioData: { type: Buffer, required: true }, // Storing file directly in DB for simplicity
  createdAt: { type: Date, default: Date.now },
});

// Prevent model recompilation error in Next.js hot reloading
const Track: Model<ITrack> = mongoose.models.Track || mongoose.model<ITrack>('Track', TrackSchema);

export default Track;