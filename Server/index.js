import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configure dotenv FIRST before anything else
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

console.log('📁 Environment loaded. ADMIN_EMAIL:', process.env.ADMIN_EMAIL);

// Now dynamically import everything else AFTER env is loaded
async function startServer() {
  const express = (await import('express')).default;
  const cors = (await import('cors')).default;
  const mongoose = (await import('mongoose')).default;
  const helmet = (await import('helmet')).default;
  const rateLimit = (await import('express-rate-limit')).default;
  const mongoSanitize = (await import('express-mongo-sanitize')).default;
  const hpp = (await import('hpp')).default;

  // Routes
  const gameRoutes = (await import('./routes/games.js')).default;
  const uploadRoutes = (await import('./routes/upload.js')).default;
  const authRoutes = (await import('./routes/auth.js')).default;
  const platformLinksRoutes = (await import('./routes/platformLinks.js')).default;
  const websiteSettingsRoutes = (await import('./routes/websiteSettings.js')).default;
  const sitemapRoutes = (await import('./routes/sitemap.js')).default;

  const app = express();
  app.set('trust proxy', 1);

  const PORT = process.env.PORT || 5000;

  // SECURITY
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  }));

  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
  });

  // ✅ CORS CONFIG (WITH DEBUG LOG)
  const prodFrontends = [
    process.env.FRONTEND_URL,
    'https://vyllogames.com',
    'https://www.vyllogames.com',
    'https://dashboard.vyllogames.com',
    'https://vyllogames-website-hosting.vercel.app'
  ].filter(Boolean);

  const localOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];

  const whitelist = new Set(localOrigins.concat(prodFrontends));

  const corsOptions = {
    origin: (origin, callback) => {
      console.log("🌍 Incoming origin:", origin); // 🔥 IMPORTANT DEBUG

      if (!origin) return callback(null, true);

      if (whitelist.has(origin)) {
        return callback(null, true);
      }

      console.log("❌ Blocked by CORS:", origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };

  app.use(cors(corsOptions));
  console.log('✅ CORS whitelist:', Array.from(whitelist));

  // BODY
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  app.use(mongoSanitize());
  app.use(hpp());

  app.use('/api', generalLimiter);
  app.use('/api/auth/login', authLimiter);

  // DATABASE
  const mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000
  };

  mongoose.connect(process.env.MONGODB_URI, mongooseOptions)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error (event):', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected - will attempt to reconnect periodically');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
  });

  const ensureConnection = async () => {
    if (mongoose.connection.readyState !== 1) {
      try {
        await mongoose.connect(process.env.MONGODB_URI, mongooseOptions);
        console.log('✅ Reconnected to MongoDB (ensureConnection)');
      } catch (err) {
        console.error('Reconnection attempt failed:', err && err.message ? err.message : err);
      }
    }
  };

  setInterval(ensureConnection, 30 * 1000);

  // ROUTES
  app.get('/', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Game Ads API Server',
      version: '1.0.0'
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/games', gameRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/platform-links', platformLinksRoutes);
  app.use('/api/website-settings', websiteSettingsRoutes);

  app.use('/', sitemapRoutes);

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Game Ads API is running'
    });
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  app.use((err, req, res, next) => {
    console.error('Error:', err.message);

    res.status(err.status || 500).json({
      error: process.env.NODE_ENV === 'production'
        ? 'Something went wrong'
        : err.message
    });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
