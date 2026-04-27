import mongoose from 'mongoose';

const websiteSettingsSchema = new mongoose.Schema({
  heroBannerUrl: { type: String, default: '' },
  heroBannerFileId: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('WebsiteSettings', websiteSettingsSchema);
