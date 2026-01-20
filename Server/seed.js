import mongoose from 'mongoose';
import Game from './models/Game.js';
import dotenv from 'dotenv';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing games
    await Game.deleteMany({});
    console.log('Cleared existing games');

    // Create sample games
    const sampleGames = [
      {
        title: 'Demon Castle Story',
        description: 'Become the demon overlord in an RPG world full of monsters! Vanquish adventurers who dare to enter the dungeons of your realm! Build your castle, recruit monsters, and defend against heroes.',
        shortDescription: 'Become the demon overlord in an RPG world full of monsters!',
        image: 'https://via.placeholder.com/600x300/8B0000/FFFFFF?text=Demon+Castle+Story',
        category: 'RPG',
        platforms: ['iOS', 'Android', 'Steam'],
        links: {
          ios: 'https://apps.apple.com',
          android: 'https://play.google.com',
          steam: 'https://store.steampowered.com'
        },
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
        links: {
          ios: 'https://apps.apple.com',
          android: 'https://play.google.com'
        },
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
        links: {
          ios: 'https://apps.apple.com',
          android: 'https://play.google.com'
        },
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
        links: {
          ios: 'https://apps.apple.com',
          android: 'https://play.google.com'
        },
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
        links: {
          ios: 'https://apps.apple.com',
          android: 'https://play.google.com',
          steam: 'https://store.steampowered.com'
        },
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
        links: {
          ios: 'https://apps.apple.com',
          android: 'https://play.google.com',
          steam: 'https://store.steampowered.com'
        },
        featured: true,
        isNew: false,
        order: 6
      }
    ];

    await Game.insertMany(sampleGames);
    console.log(`${sampleGames.length} sample games created`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n🔐 Super Admin Login:');
    console.log('   Use credentials from your .env file');
    console.log('   Or default: admin@placeholder.com / Admin@123!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
