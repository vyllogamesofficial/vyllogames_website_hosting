import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import { protect } from '../middleware/auth.js';
import SuperAdmin from '../models/SuperAdmin.js';

const router = express.Router();

// ============ SUPER ADMIN CONFIGURATION ============
const SUPER_ADMIN_ID = 'super-admin-001';

const getSuperAdmin = async () => {
  let superAdmin = await SuperAdmin.findOne();
  if (!superAdmin) {
    // Create a default admin if none exists
    superAdmin = new SuperAdmin({
      username: 'SuperAdmin',
      email: 'admin@placeholder.com',
      password: 'Admin@123!' // plain text
    });
    await superAdmin.save();
    console.log('Seeded default SuperAdmin (please change via dashboard)');
  }
  return superAdmin;
};

// ============ IN-MEMORY SECURITY STORE ============
const securityStore = {
  loginAttempts: 0,
  lockUntil: null,
  refreshToken: null,
  lastActivity: null,
  sessionId: null,
};

// ============ SECURITY CONSTANTS ============
const MAX_LOGIN_ATTEMPTS = 3;
const ACCESS_TOKEN_EXPIRY = '10m';
const REFRESH_TOKEN_EXPIRY = '1h';
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes inactivity

// ============ LOCKOUT FUNCTIONS ============
const incrementLoginAttempts = () => {
  securityStore.loginAttempts += 1;

  // Dynamic lock times
  let lockTime = 0;
  if (securityStore.loginAttempts <= 3) {
    lockTime = 30 * 1000; // 30s
  } else if (securityStore.loginAttempts <= 6) {
    lockTime = 2 * 60 * 1000; // 2min
  } else {
    lockTime = 10 * 60 * 1000; // 10min
  }

  securityStore.lockUntil = Date.now() + lockTime;
};

const isLocked = () => {
  if (securityStore.lockUntil && securityStore.lockUntil > Date.now()) {
    return true;
  }
  if (securityStore.lockUntil && securityStore.lockUntil <= Date.now()) {
    securityStore.lockUntil = null;
    securityStore.loginAttempts = 0;
  }
  return false;
};

const getLockTimeRemaining = () => {
  if (!securityStore.lockUntil) return 0;
  return Math.ceil((securityStore.lockUntil - Date.now()) / 1000); // seconds
};

const resetLoginAttempts = () => {
  securityStore.loginAttempts = 0;
  securityStore.lockUntil = null;
};

// ============ SESSION/TOKEN FUNCTIONS ============
const generateSessionId = () => crypto.randomBytes(32).toString('hex');

const generateTokens = (superAdmin, sessionId) => {
  const accessToken = jwt.sign(
    { id: SUPER_ADMIN_ID, email: superAdmin.email, sessionId, type: 'access' },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { id: SUPER_ADMIN_ID, sessionId, type: 'refresh' },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  securityStore.refreshToken = refreshToken;
  securityStore.lastActivity = Date.now();

  return { accessToken, refreshToken };
};

// ============ VALIDATION ============
const validateLogin = [
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// ============ ROUTES ============

// Update super admin credentials
router.post(
  '/update-super-admin',
  protect,
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input', details: errors.array() });
      }
      const { username, email, password } = req.body;

      let superAdmin = await SuperAdmin.findOne();
      if (!superAdmin) {
        superAdmin = new SuperAdmin({ username, email, password });
      } else {
        superAdmin.username = username;
        superAdmin.email = email;
        superAdmin.password = password; // plain text
      }
      await superAdmin.save();
      console.log('🔑 Super Admin credentials updated:', { username, email });
      res.json({ message: 'Super admin credentials updated successfully', username, email });
    } catch (error) {
      console.error('Update super admin error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Super admin login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input', details: errors.array() });
    }

    const { email, password } = req.body;

    const superAdmin = await SuperAdmin.findOne({ email: email.toLowerCase() });
    if (!superAdmin) {
      incrementLoginAttempts();
      return res.status(401).json({
        error: 'Invalid credentials',
        attemptsRemaining: Math.max(0, MAX_LOGIN_ATTEMPTS - securityStore.loginAttempts),
        locked: isLocked(),
        lockTimeRemaining: getLockTimeRemaining()
      });
    }

    if (isLocked()) {
      return res.status(423).json({
        error: `Account locked. Try again in ${getLockTimeRemaining()} seconds.`,
        locked: true,
        lockTimeRemaining: getLockTimeRemaining()
      });
    }

    if (password !== superAdmin.password) {
      incrementLoginAttempts();
      return res.status(401).json({
        error: 'Invalid credentials',
        attemptsRemaining: Math.max(0, MAX_LOGIN_ATTEMPTS - securityStore.loginAttempts),
        locked: isLocked(),
        lockTimeRemaining: getLockTimeRemaining()
      });
    }

    // Successful login
    resetLoginAttempts();
    const sessionId = generateSessionId();
    securityStore.sessionId = sessionId;

    const { accessToken, refreshToken } = generateTokens(superAdmin, sessionId);

    console.log(`✅ Super Admin logged in at ${new Date().toISOString()} from IP: ${req.ip}`);

    res.json({
      token: accessToken,
      refreshToken,
      user: { id: superAdmin._id, username: superAdmin.username, email: superAdmin.email, role: 'super-admin' }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

    if (refreshToken !== securityStore.refreshToken) {
      securityStore.refreshToken = null;
      securityStore.sessionId = null;
      console.warn('⚠️ Invalid refresh token - session invalidated');
      return res.status(401).json({ error: 'Invalid refresh token. Please login again.' });
    }

    if (securityStore.lastActivity && Date.now() - securityStore.lastActivity > SESSION_TIMEOUT) {
      securityStore.refreshToken = null;
      securityStore.sessionId = null;
      return res.status(401).json({ error: 'Session expired due to inactivity' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'your-secret-key');

    if (decoded.type !== 'refresh' || decoded.sessionId !== securityStore.sessionId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const superAdmin = await getSuperAdmin();
    const tokens = generateTokens(superAdmin, securityStore.sessionId);

    res.json({ token: tokens.accessToken, refreshToken: tokens.refreshToken });
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

// Logout
router.post('/logout', (req, res) => {
  securityStore.refreshToken = null;
  securityStore.sessionId = null;
  securityStore.lastActivity = null;
  console.log(`🚪 Super Admin logged out at ${new Date().toISOString()}`);
  res.json({ message: 'Logged out successfully' });
});

// Verify token
router.get('/verify', protect, (req, res) => {
  securityStore.lastActivity = Date.now();
  res.json({ valid: true, user: req.user });
});

// Get current admin info
router.get('/me', protect, async (req, res) => {
  securityStore.lastActivity = Date.now();
  const superAdmin = await getSuperAdmin();
  res.json({
    user: { id: SUPER_ADMIN_ID, username: superAdmin.username, email: superAdmin.email, role: 'super-admin' }
  });
});

// Status (debug)
router.get('/status', (req, res) => {
  res.json({
    locked: isLocked(),
    attemptsRemaining: Math.max(0, MAX_LOGIN_ATTEMPTS - securityStore.loginAttempts),
    lockTimeRemaining: getLockTimeRemaining(),
    hasActiveSession: !!securityStore.sessionId
  });
});

export default router;
