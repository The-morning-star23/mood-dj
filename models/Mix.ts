import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMix extends Document {
  mood: string;
  tracks: mongoose.Types.ObjectId[]; // References to Track IDs
  createdAt: Date;
}

const MixSchema: Schema = new Schema({
  mood: { type: String, required: true },
  tracks: [{ type: Schema.Types.ObjectId, ref: 'Track' }],
  createdAt: { type: Date, default: Date.now },
});

const Mix: Model<IMix> = mongoose.models.Mix || mongoose.model<IMix>('Mix', MixSchema);

export default Mix;