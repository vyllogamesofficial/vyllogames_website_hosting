import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      const admin = await SuperAdmin.create({
        username: process.env.ADMIN_USERNAME,
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword
      });
      console.log('✅ Super Admin created:', {
        username: admin.username,
        email: admin.email,
        password: process.env.ADMIN_PASSWORD
      });
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
// Seed Sample Games
// ------------------------
const seedGames = async () => {
  try {
    await Game.deleteMany({});
    console.log('✅ Cleared existing games');

    const sampleGames = [
      {
        title: 'Demon Castle Story',
        description: 'Become the demon overlord in an RPG world full of monsters! Vanquish adventurers who dare to enter the dungeons of your realm! Build your castle, recruit monsters, and defend against heroes.',
        shortDescription: 'Become the demon overlord in an RPG world full of monsters!',
        image: 'https://via.placeholder.com/600x300/8B0000/FFFFFF?text=Demon+Castle+Story',
        category: 'RPG',
        platforms: ['iOS', 'Android', 'Steam'],
        links: { ios: 'https://apps.apple.com', android: 'https://play.google.com', steam: 'https://store.steampowered.com' },
        featured: true,
        isNew: true,
        order: 1
      },
      {
        title: 'Final Frontier Story',
        description: 'Shoot \'Em Up Simulation Game! Explore a new world and build a grand city in space! Manage resources, fight aliens, and expand your galactic empire.',
        shortDescription: 'Explore a new world and build a grand city in space!',
        image: 'https://via.placeholder.com/600x300/1E3A5F/FFFFFF?text=Final+Frontier+Story',
        category: 'Simulation',
        platforms: ['iOS', 'Android', 'Switch'],
        links: { ios: 'https://apps.apple.com', android: 'https://play.google.com' },
        featured: true,
        isNew: true,
        order: 2
      },
      {
        title: 'Skating Rink Story',
        description: 'A delightful ice rink management game. Spin and jump across the glistening ice! Build the ultimate skating rink, train champions, and host competitions.',
        shortDescription: 'A delightful ice rink management game!',
        image: 'https://via.placeholder.com/600x300/87CEEB/333333?text=Skating+Rink+Story',
        category: 'Simulation',
        platforms: ['iOS', 'Android'],
        links: { ios: 'https://apps.apple.com', android: 'https://play.google.com' },
        featured: false,
        isNew: true,
        order: 3
      },
      {
        title: 'Dorayaki Shop Game',
        description: 'Run your own sweet shop with Doraemon! Manage customers, create delicious dorayaki, and expand your business in this charming simulation game.',
        shortDescription: 'Run your own sweet shop with Doraemon!',
        image: 'https://via.placeholder.com/600x300/FFD700/333333?text=Dorayaki+Shop+Game',
        category: 'Simulation',
        platforms: ['iOS', 'Android'],
        links: { ios: 'https://apps.apple.com', android: 'https://play.google.com' },
        featured: true,
        isNew: false,
        order: 4
      },
      {
        title: 'RPG Town Management Sim',
        description: 'Build and manage your own RPG town! Recruit heroes, establish shops, and create the ultimate adventure hub. Watch as your town grows from a small village to a bustling city.',
        shortDescription: 'Build and manage your own RPG town!',
        image: 'https://via.placeholder.com/600x300/228B22/FFFFFF?text=RPG+Town+Management',
        category: 'RPG',
        platforms: ['iOS', 'Android', 'Steam', 'Switch'],
        links: { ios: 'https://apps.apple.com', android: 'https://play.google.com', steam: 'https://store.steampowered.com' },
        featured: false,
        isNew: false,
        order: 5
      },
      {
        title: 'Game Dev Story',
        description: 'A game company simulation. Manage your own game company, develop your own console, and hire your own staff. You\'re in charge--you decide! Aim for that million-selling hit in this unique simulation!',
        shortDescription: 'Manage your own game company simulation!',
        image: 'https://via.placeholder.com/600x300/4169E1/FFFFFF?text=Game+Dev+Story',
        category: 'Simulation',
        platforms: ['iOS', 'Android', 'Steam', 'Switch', 'PS4'],
        links: { ios: 'https://apps.apple.com', android: 'https://play.google.com', steam: 'https://store.steampowered.com' },
        featured: true,
        isNew: false,
        order: 6
      }
    ];

    await Game.insertMany(sampleGames);
    console.log(`✅ Inserted ${sampleGames.length} sample games`);
  } catch (error) {
    console.error('❌ Error seeding games:', error);
    process.exit(1);
  }
};

// ------------------------
// Run Seeder
// ------------------------
const seedDatabase = async () => {
  await connectDB();
  await seedSuperAdmin();
  await seedGames();

  console.log('\n🎉 Database seeding complete!');
  console.log(`🔐 Super Admin Login: ${process.env.ADMIN_EMAIL} / ${process.env.ADMIN_PASSWORD}`);
  process.exit(0);
};

seedDatabase();
