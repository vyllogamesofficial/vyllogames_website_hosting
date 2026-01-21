import mongoose from 'mongoose';

const platformLinksSchema = new mongoose.Schema({
  TikTok: { type: String, default: '' },
  Rednote: { type: String, default: '' },
  YouTube: { type: String, default: '' },
  Facebook: { type: String, default: '' },
  Instagram: { type: String, default: '' },
  Twitter: { type: String, default: '' },
  Twitch: { type: String, default: '' },
  Kick: { type: String, default: '' },
  LinkedIn: { type: String, default: '' },
  Discord: { type: String, default: '' },
  Reddit: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('PlatformLinks', platformLinksSchema);
