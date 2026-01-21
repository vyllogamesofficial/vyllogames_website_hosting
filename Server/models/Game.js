import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    required: true,
    maxlength: 200
  },
  image: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: true,
    enum: ['Simulation', 'RPG', 'Strategy', 'Action', 'Puzzle', 'Adventure', 'Sports', 'Other']
  },
  platforms: [{
    type: String,
    enum: [
      'Google Play (Android)',
      'App Store (Apple)',
      'Huawei Store',
      'Amazon App Store',
      'PS4/PS5',
      'XBOX',
      'Nintendo Switch 1/2',
      'Steam',
      'Epic Store'
    ]
  }],
  links: {
    googlePlay: { type: String, default: '' },
    appStore: { type: String, default: '' },
    huaweiStore: { type: String, default: '' },
    amazonAppStore: { type: String, default: '' },
    ps: { type: String, default: '' },
    xbox: { type: String, default: '' },
    nintendoSwitch: { type: String, default: '' },
    steam: { type: String, default: '' },
    epicStore: { type: String, default: '' }
  },
  trailerUrl: {
    type: String,
    default: ''
  },
  featured: {
    type: Boolean,
    default: false
  },
  isNewRelease: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  releaseDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Game', gameSchema);
