import mongoose from 'mongoose';

const SuperAdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed password
  // Session & security fields persisted to survive restarts
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Number, default: null }, // timestamp in ms
  refreshToken: { type: String, default: null },
  sessionId: { type: String, default: null },
  lastActivity: { type: Number, default: null }
});

const SuperAdmin = mongoose.model('SuperAdmin', SuperAdminSchema);
export default SuperAdmin;