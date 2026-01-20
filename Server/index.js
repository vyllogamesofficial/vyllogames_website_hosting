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

  // Routes - dynamically imported AFTER env vars are set
  const gameRoutes = (await import('./routes/games.js')).default;
  const uploadRoutes = (await import('./routes/upload.js')).default;
  const authRoutes = (await import('./routes/auth.js')).default;

  const app = express();
  const PORT = process.env.PORT || 5000;

  // ============ SECURITY MIDDLEWARE ============

  // Set security HTTP headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  }));

  // Rate limiting - general API
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Strict rate limiting for auth routes
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per 15 minutes
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
  });

  // CORS configuration
  const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
  app.use(cors(corsOptions));

  // Body parser with size limit
  app.use(express.json({ limit: '10kb' })); // Limit body size to prevent DoS
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Data sanitization against NoSQL injection
  app.use(mongoSanitize());

  // Prevent HTTP Parameter Pollution
  app.use(hpp());

  // Apply general rate limiter to all routes
  app.use('/api', generalLimiter);

  // Apply strict rate limiter to auth routes
  app.use('/api/auth/login', authLimiter);

  // ============ DATABASE ============

  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

  // ============ ROUTES ============

  // Root route for Vercel health check
  app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Game Ads API Server', version: '1.0.0' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/games', gameRoutes);
  app.use('/api/upload', uploadRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Game Ads API is running' });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({ 
      error: process.env.NODE_ENV === 'production' 
        ? 'Something went wrong' 
        : err.message 
    });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
