import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Game from './models/Game.js';
import SuperAdmin from './models/SuperAdmin.js';

// Try loading .env from project root first, then fallback to Server/.env
const rootEnvPath = path.resolve(process.cwd(), '.env');
const serverEnvPath = path.resolve(process.cwd(), 'Server', '.env');
dotenv.config({ path: rootEnvPath });
if (!process.env.MONGODB_URI) {
  // fallback
  dotenv.config({ path: serverEnvPath });
}

// Debug info to help identify where envs were loaded from
console.log('ENV load check — cwd:', process.cwd());
console.log('MONGODB_URI present?', !!process.env.MONGODB_URI);

// ------------------------
// Helper: Check required env vars
// ------------------------
const requiredEnv = ['MONGODB_URI', 'ADMIN_EMAIL', 'ADMIN_USERNAME', 'ADMIN_PASSWORD'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnv.join(', ')}`);
  console.error('Checked paths:', rootEnvPath, serverEnvPath);
  process.exit(1);
}

// ------------------------
// Connect to MongoDB
// ------------------------
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// ------------------------
// Seed Super Admin
// ------------------------
const seedSuperAdmin = async () => {
  try {
    const existingAdmin = await SuperAdmin.findOne();
    if (!existingAdmin) {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@placeholder.com';
      const adminUsername = process.env.ADMIN_USERNAME || 'SuperAdmin';

      // Use provided ADMIN_PASSWORD if present, otherwise generate a random one.
      let adminPassword = process.env.ADMIN_PASSWORD;
      let generated = false;
      if (!adminPassword) {
        adminPassword = crypto.randomBytes(8).toString('hex'); // 16 hex chars
        generated = true;
      }

      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const admin = await SuperAdmin.create({
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword
      });

      console.log('✅ Super Admin created:', {
        username: admin.username,
        email: admin.email
      });

      if (generated) {
        console.log('⚠️ No ADMIN_PASSWORD env var found — a password was generated for the Super Admin.');
        console.log('Store this password securely; it will not be shown again:');
        console.log(`Generated SuperAdmin password: ${adminPassword}`);
      }
    } else {
      console.log('ℹ️ Super Admin already exists:', {
        username: existingAdmin.username,
        email: existingAdmin.email
      });
    }
  } catch (error) {
    console.error('❌ Error seeding Super Admin:', error);
    process.exit(1);
  }
};

// ------------------------
// Run Seeder
// ------------------------
const seedDatabase = async () => {
  await connectDB();
  await seedSuperAdmin();

  console.log('\n🎉 Database seeding complete!');
  console.log(`🔐 Super Admin Login: ${admin.email} / ${admin.password}`);
  process.exit(0);
};

seedDatabase();
