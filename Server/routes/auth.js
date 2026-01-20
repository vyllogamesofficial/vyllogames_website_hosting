import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ============ SUPER ADMIN CONFIGURATION ============
// Store these in environment variables for production!
const SUPER_ADMIN = {
  id: 'super-admin-001',
  username: process.env.ADMIN_USERNAME || 'SuperAdmin',
  email: process.env.ADMIN_EMAIL || 'admin@placeholder.com',
  password: process.env.ADMIN_PASSWORD || 'Admin@123!',
};

// Log admin email on startup (no sensitive data)
console.log('🔐 Admin config loaded:', {
  email: SUPER_ADMIN.email,
  username: SUPER_ADMIN.username,
  passwordLength: SUPER_ADMIN.password?.length
});

// In-memory security tracking (use Redis in production for multi-instance)
const securityStore = {
  loginAttempts: 0,
  lockUntil: null,
  refreshToken: null,
  lastActivity: null,
  sessionId: null,
};

// Security constants
const MAX_LOGIN_ATTEMPTS = 3;
const LOCK_TIME = 30 * 60 * 1000; // 30 minutes
const ACCESS_TOKEN_EXPIRY = '10m'; // Short-lived access token
const REFRESH_TOKEN_EXPIRY = '1h'; // 1 hour refresh token
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes inactivity

// ============ HELPER FUNCTIONS ============

const isLocked = () => {
  if (securityStore.lockUntil && securityStore.lockUntil > Date.now()) {
    return true;
  }
  // Reset if lock expired
  if (securityStore.lockUntil) {
    securityStore.lockUntil = null;
    securityStore.loginAttempts = 0;
  }
  return false;
};

const getLockTimeRemaining = () => {
  if (!securityStore.lockUntil) return 0;
  return Math.ceil((securityStore.lockUntil - Date.now()) / 60000);
};

const incrementLoginAttempts = () => {
  securityStore.loginAttempts += 1;
  if (securityStore.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
    securityStore.lockUntil = Date.now() + LOCK_TIME;
  }
};

const resetLoginAttempts = () => {
  securityStore.loginAttempts = 0;
  securityStore.lockUntil = null;
};

const generateSessionId = () => crypto.randomBytes(32).toString('hex');

const generateTokens = () => {
  const sessionId = generateSessionId();
  securityStore.sessionId = sessionId;
  
  const accessToken = jwt.sign(
    { 
      id: SUPER_ADMIN.id, 
      email: SUPER_ADMIN.email,
      sessionId,
      type: 'access'
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { 
      id: SUPER_ADMIN.id,
      sessionId,
      type: 'refresh'
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  securityStore.refreshToken = refreshToken;
  securityStore.lastActivity = Date.now();

  return { accessToken, refreshToken };
};

// Validation middleware
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// ============ ROUTES ============

// @route   POST /api/auth/login
// @desc    Super Admin login
// @access  Public
router.post('/login', validateLogin, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid input',
        details: errors.array() 
      });
    }

    // Check if locked out
    if (isLocked()) {
      const timeRemaining = getLockTimeRemaining();
      return res.status(423).json({
        error: `Account locked. Try again in ${timeRemaining} minutes.`,
        locked: true,
        lockTimeRemaining: timeRemaining
      });
    }

    const { email, password } = req.body;

    // Verify email matches super admin
    if (email.toLowerCase() !== SUPER_ADMIN.email.toLowerCase()) {
      incrementLoginAttempts();
      const attemptsLeft = MAX_LOGIN_ATTEMPTS - securityStore.loginAttempts;
      
      return res.status(401).json({
        error: 'Invalid credentials',
        attemptsRemaining: Math.max(0, attemptsLeft),
        locked: isLocked(),
        lockTimeRemaining: getLockTimeRemaining()
      });
    }

    // Verify password (plain text comparison)
    const isMatch = password === SUPER_ADMIN.password;
    
    if (!isMatch) {
      incrementLoginAttempts();
      const attemptsLeft = MAX_LOGIN_ATTEMPTS - securityStore.loginAttempts;
      
      return res.status(401).json({
        error: 'Invalid credentials',
        attemptsRemaining: Math.max(0, attemptsLeft),
        locked: isLocked(),
        lockTimeRemaining: getLockTimeRemaining()
      });
    }

    // Successful login - reset attempts and generate tokens
    resetLoginAttempts();
    const { accessToken, refreshToken } = generateTokens();

    // Log successful login
    console.log(`✅ Super Admin logged in at ${new Date().toISOString()} from IP: ${req.ip}`);

    res.json({
      token: accessToken,
      refreshToken,
      user: {
        id: SUPER_ADMIN.id,
        username: SUPER_ADMIN.username,
        email: SUPER_ADMIN.email,
        role: 'super-admin'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public (with valid refresh token)
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Verify refresh token matches stored one
    if (refreshToken !== securityStore.refreshToken) {
      // Potential token theft - invalidate session
      securityStore.refreshToken = null;
      securityStore.sessionId = null;
      console.warn('⚠️ Invalid refresh token attempt - session invalidated');
      return res.status(401).json({ error: 'Invalid refresh token. Please login again.' });
    }

    // Check session timeout
    if (securityStore.lastActivity && 
        Date.now() - securityStore.lastActivity > SESSION_TIMEOUT) {
      securityStore.refreshToken = null;
      securityStore.sessionId = null;
      return res.status(401).json({ error: 'Session expired due to inactivity' });
    }

    // Verify JWT
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'your-secret-key');
    
    if (decoded.type !== 'refresh' || decoded.sessionId !== securityStore.sessionId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Generate new tokens (rotation)
    const tokens = generateTokens();

    res.json({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      securityStore.refreshToken = null;
      securityStore.sessionId = null;
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout and invalidate session
// @access  Private
router.post('/logout', (req, res) => {
  securityStore.refreshToken = null;
  securityStore.sessionId = null;
  securityStore.lastActivity = null;
  console.log(`🚪 Super Admin logged out at ${new Date().toISOString()}`);
  res.json({ message: 'Logged out successfully' });
});

// @route   GET /api/auth/verify
// @desc    Verify token is valid
// @access  Private
router.get('/verify', protect, (req, res) => {
  // Update last activity
  securityStore.lastActivity = Date.now();
  res.json({ valid: true, user: req.user });
});

// @route   GET /api/auth/me
// @desc    Get current admin info
// @access  Private
router.get('/me', protect, (req, res) => {
  securityStore.lastActivity = Date.now();
  res.json({
    user: {
      id: SUPER_ADMIN.id,
      username: SUPER_ADMIN.username,
      email: SUPER_ADMIN.email,
      role: 'super-admin'
    }
  });
});

// @route   GET /api/auth/status
// @desc    Check login status (for debugging, remove in production)
// @access  Public
router.get('/status', (req, res) => {
  res.json({
    locked: isLocked(),
    attemptsRemaining: Math.max(0, MAX_LOGIN_ATTEMPTS - securityStore.loginAttempts),
    lockTimeRemaining: getLockTimeRemaining(),
    hasActiveSession: !!securityStore.sessionId
  });
});

export default router;
