import jwt from 'jsonwebtoken';

// Super Admin ID (must match auth.js)
const SUPER_ADMIN_ID = 'super-admin-001';

/**
 * Protect routes - verify JWT access token
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Verify it's an access token (not refresh)
    if (decoded.type !== 'access') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    // Verify it's the super admin
    if (decoded.id !== SUPER_ADMIN_ID) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      sessionId: decoded.sessionId,
      role: 'super-admin'
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', expired: true });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid token' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Check if user is super admin (always true if passed protect middleware)
 */
export const isSuperAdmin = (req, res, next) => {
  if (req.user?.role !== 'super-admin') {
    return res.status(403).json({ error: 'Super Admin access required' });
  }
  next();
};

// Legacy export for compatibility
export const authenticateToken = protect;
export const isAdmin = isSuperAdmin;

export default protect;
