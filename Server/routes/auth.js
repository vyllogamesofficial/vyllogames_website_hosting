import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
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
    const defaultPassword = process.env.ADMIN_PASSWORD || 'Admin@123!';
    const hashed = await bcrypt.hash(defaultPassword, 10);
    superAdmin = new SuperAdmin({
      username: process.env.ADMIN_USERNAME || 'SuperAdmin',
      email: (process.env.ADMIN_EMAIL || 'admin@placeholder.com').toLowerCase(),
      password: hashed
    });
    await superAdmin.save();
    console.log('Seeded default SuperAdmin (please change via dashboard)');
  }
  return superAdmin;
};

// ============ SECURITY STORE (persisted to DB) ============
// We keep a small in-memory cache but persist authoritative state to the SuperAdmin document.
const securityStore = {
  loginAttempts: 0,
  lockUntil: null,
  refreshToken: null,
  lastActivity: null,
  sessionId: null,
};

// ============ SECURITY CONSTANTS ============
// Increased session durations for local/admin convenience
const ACCESS_TOKEN_EXPIRY = '30m'; // access token lifetime
const REFRESH_TOKEN_EXPIRY = '7d'; // refresh token lifetime
// SESSION_TIMEOUT controls inactivity logout. Set to 0 to disable inactivity timeout.
const SESSION_TIMEOUT = 0; // 0 = disabled (previously 7 days)
const MAX_LOGIN_ATTEMPTS = 3;

// ============ LOCKOUT FUNCTIONS ============
const incrementLoginAttempts = async () => {
  const superAdmin = await getSuperAdmin();
  superAdmin.loginAttempts = (superAdmin.loginAttempts || 0) + 1;

  // Dynamic lock times
  let lockTime = 0;
  if (superAdmin.loginAttempts <= 3) {
    lockTime = 30 * 1000; // 30s
  } else if (superAdmin.loginAttempts <= 6) {
    lockTime = 2 * 60 * 1000; // 2min
  } else {
    lockTime = 10 * 60 * 1000; // 10min
  }

  superAdmin.lockUntil = Date.now() + lockTime;
  await superAdmin.save();

  // update cache
  securityStore.loginAttempts = superAdmin.loginAttempts;
  securityStore.lockUntil = superAdmin.lockUntil;
};

const isLocked = async () => {
  const superAdmin = await getSuperAdmin();
  if (superAdmin.lockUntil && superAdmin.lockUntil > Date.now()) {
    return true;
  }
  if (superAdmin.lockUntil && superAdmin.lockUntil <= Date.now()) {
    superAdmin.lockUntil = null;
    superAdmin.loginAttempts = 0;
    await superAdmin.save();

    securityStore.lockUntil = null;
    securityStore.loginAttempts = 0;
  }
  return false;
};

const getLockTimeRemaining = async () => {
  const superAdmin = await getSuperAdmin();
  if (!superAdmin.lockUntil) return 0;
  return Math.ceil((superAdmin.lockUntil - Date.now()) / 1000); // seconds
};

const resetLoginAttempts = async () => {
  const superAdmin = await getSuperAdmin();
  superAdmin.loginAttempts = 0;
  superAdmin.lockUntil = null;
  await superAdmin.save();
  securityStore.loginAttempts = 0;
  securityStore.lockUntil = null;
};

// ============ SESSION/TOKEN FUNCTIONS ============
const generateSessionId = () => crypto.randomBytes(32).toString('hex');

const generateTokens = async (superAdmin, sessionId) => {
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

  // Persist tokens/session info to DB
  superAdmin.refreshToken = refreshToken;
  superAdmin.sessionId = sessionId;
  superAdmin.lastActivity = Date.now();
  await superAdmin.save();

  // update cache
  securityStore.refreshToken = refreshToken;
  securityStore.lastActivity = superAdmin.lastActivity;
  securityStore.sessionId = sessionId;

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
        const hashed = await bcrypt.hash(password, 10);
        superAdmin = new SuperAdmin({ username, email: email.toLowerCase(), password: hashed });
      } else {
        superAdmin.username = username;
        superAdmin.email = email.toLowerCase();
        // Hash incoming password before storing
        superAdmin.password = await bcrypt.hash(password, 10);
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

    // Debug helper - mask passwords for logs
    const mask = (s) => {
      if (!s) return '';
      if (s.length <= 2) return '*'.repeat(s.length);
      return `${s[0]}${'*'.repeat(Math.max(0, s.length - 2))}${s.slice(-1)}`;
    };

    console.log('Login attempt:', { email: email, passwordPreview: mask(password) });

    if (await isLocked()) {
      return res.status(423).json({
        error: `Account locked. Try again in ${await getLockTimeRemaining()} seconds.`,
        locked: true,
        lockTimeRemaining: await getLockTimeRemaining()
      });
    }

    const superAdmin = await SuperAdmin.findOne({ email: email.toLowerCase() });
    if (!superAdmin) {
      await incrementLoginAttempts();
      const attemptsRemaining = Math.max(0, MAX_LOGIN_ATTEMPTS - (securityStore.loginAttempts || 0));
      return res.status(401).json({
        error: 'Invalid credentials',
        attemptsRemaining,
        locked: await isLocked(),
        lockTimeRemaining: await getLockTimeRemaining()
      });
    }

    // Determine if stored password is hashed
    let passwordMatch = false;
    try {
      if (superAdmin.password && superAdmin.password.startsWith('$2')) {
        passwordMatch = await bcrypt.compare(password, superAdmin.password);
      } else {
        // legacy plaintext match — if matches, re-hash and save
        if (password === superAdmin.password) {
          passwordMatch = true;
          superAdmin.password = await bcrypt.hash(password, 10);
          await superAdmin.save();
          console.log('Migrated superAdmin password to hashed value');
        }
      }
    } catch (err) {
      console.error('Password compare error:', err);
    }

    if (!passwordMatch) {
      await incrementLoginAttempts();
      const attemptsRemaining = Math.max(0, MAX_LOGIN_ATTEMPTS - (securityStore.loginAttempts || 0));
      return res.status(401).json({
        error: 'Invalid credentials',
        attemptsRemaining,
        locked: await isLocked(),
        lockTimeRemaining: await getLockTimeRemaining()
      });
    }

    // Successful login
    await resetLoginAttempts();
    const sessionId = generateSessionId();

    const { accessToken, refreshToken } = await generateTokens(superAdmin, sessionId);

    console.log(`✅ Super Admin logged in at ${new Date().toISOString()} from IP: ${req.ip}`);

    res.json({
      token: accessToken,
      refreshToken,
      user: { id: superAdmin._id, username: superAdmin.username, email: superAdmin.email, role: 'super-admin' }
    });
  } catch (error) {
    console.error('Login error:', error.stack || error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });
    const superAdmin = await getSuperAdmin();
    if (refreshToken !== superAdmin.refreshToken) {
      superAdmin.refreshToken = null;
      superAdmin.sessionId = null;
      await superAdmin.save();
      console.warn('⚠️ Invalid refresh token - session invalidated');
      return res.status(401).json({ error: 'Invalid refresh token. Please login again.' });
    }

    if (SESSION_TIMEOUT > 0 && superAdmin.lastActivity && Date.now() - superAdmin.lastActivity > SESSION_TIMEOUT) {
      superAdmin.refreshToken = null;
      superAdmin.sessionId = null;
      await superAdmin.save();
      return res.status(401).json({ error: 'Session expired due to inactivity' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'your-secret-key');

    if (decoded.type !== 'refresh' || decoded.sessionId !== superAdmin.sessionId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const tokens = await generateTokens(superAdmin, superAdmin.sessionId);

    res.json({ token: tokens.accessToken, refreshToken: tokens.refreshToken });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const superAdmin = await getSuperAdmin();
      superAdmin.refreshToken = null;
      superAdmin.sessionId = null;
      await superAdmin.save();
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
// Logout
router.post('/logout', async (req, res) => {
  try {
    const superAdmin = await getSuperAdmin();
    superAdmin.refreshToken = null;
    superAdmin.sessionId = null;
    superAdmin.lastActivity = null;
    await superAdmin.save();
    securityStore.refreshToken = null;
    securityStore.sessionId = null;
    securityStore.lastActivity = null;
    console.log(`🚪 Super Admin logged out at ${new Date().toISOString()}`);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify token
router.get('/verify', protect, async (req, res) => {
  try {
    const superAdmin = await getSuperAdmin();
    superAdmin.lastActivity = Date.now();
    await superAdmin.save();
    securityStore.lastActivity = superAdmin.lastActivity;
    res.json({ valid: true, user: req.user });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current admin info
router.get('/me', protect, async (req, res) => {
  try {
    const superAdmin = await getSuperAdmin();
    superAdmin.lastActivity = Date.now();
    await superAdmin.save();
    securityStore.lastActivity = superAdmin.lastActivity;
    res.json({
      user: { id: SUPER_ADMIN_ID, username: superAdmin.username, email: superAdmin.email, role: 'super-admin' }
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Status (debug)
router.get('/status', async (req, res) => {
  try {
    const superAdmin = await getSuperAdmin();
    res.json({
      locked: await isLocked(),
      attemptsRemaining: Math.max(0, MAX_LOGIN_ATTEMPTS - (superAdmin.loginAttempts || 0)),
      lockTimeRemaining: await getLockTimeRemaining(),
      hasActiveSession: !!superAdmin.sessionId,
      lastActivity: superAdmin.lastActivity || null
    });
  } catch (err) {
    console.error('Status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
