import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api, { authApi } from '../api';

const AuthContext = createContext(null);

// Security constants
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const TOKEN_REFRESH_INTERVAL = 13 * 60 * 1000; // Refresh 2 mins before expiry

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const inactivityTimer = useRef(null);
  const refreshTimer = useRef(null);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
    if (refreshTimer.current) {
      clearInterval(refreshTimer.current);
      refreshTimer.current = null;
    }
  }, []);

  // Logout function
  const logout = useCallback(async (silent = false) => {
    try {
      // Call logout endpoint to clear refresh token
      await api.post('/auth/logout').catch(() => {});
    } catch (e) {
      // Ignore errors on logout
    }
    
    clearTimers();
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    
    if (!silent) {
      // Redirect to login
      window.location.href = '/admin/login';
    }
  }, [clearTimers]);

  // Refresh token function
  const refreshAccessToken = useCallback(async () => {
    const refreshToken = localStorage.getItem('adminRefreshToken');
    
    if (!refreshToken) {
      logout(true);
      return false;
    }

    try {
      const { data } = await api.post('/auth/refresh', { refreshToken });
      
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminRefreshToken', data.refreshToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout(true);
      return false;
    }
  }, [logout]);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    
    inactivityTimer.current = setTimeout(() => {
      console.log('Session expired due to inactivity');
      logout();
    }, INACTIVITY_TIMEOUT);
  }, [logout]);

  // Setup activity listeners
  const setupActivityListeners = useCallback(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      resetInactivityTimer();
    };
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });
    
    // Initial timer
    resetInactivityTimer();
    
    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [resetInactivityTimer]);

  // Setup token refresh interval
  const setupTokenRefresh = useCallback(() => {
    refreshTimer.current = setInterval(async () => {
      const success = await refreshAccessToken();
      if (!success) {
        clearTimers();
      }
    }, TOKEN_REFRESH_INTERVAL);
  }, [refreshAccessToken, clearTimers]);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('adminToken');
      const savedUser = localStorage.getItem('adminUser');
      const refreshToken = localStorage.getItem('adminRefreshToken');
      
      if (token && savedUser && refreshToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        try {
          // Verify token is still valid
          await api.get('/auth/verify');
          
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
          
          // Setup security measures
          setupActivityListeners();
          setupTokenRefresh();
        } catch (error) {
          // Token expired or invalid - try refresh
          const refreshed = await refreshAccessToken();
          
          if (refreshed) {
            setUser(JSON.parse(savedUser));
            setIsAuthenticated(true);
            setupActivityListeners();
            setupTokenRefresh();
          } else {
            // Clear invalid data
            logout(true);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
    
    return () => {
      clearTimers();
    };
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminRefreshToken', data.refreshToken);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      
      setUser(data.user);
      setIsAuthenticated(true);
      
      // Setup security measures
      setupActivityListeners();
      setupTokenRefresh();
      
      return { success: true };
    } catch (error) {
      const errorData = error.response?.data;
      return { 
        success: false, 
        error: errorData?.error || 'Login failed'
      };
    }
  };


  // Update super admin credentials
  const updateSuperAdmin = async (username, email, password) => {
    try {
      const { data } = await authApi.updateSuperAdmin({ username, email, password });
      // Update local user state if username or email changed
      if (user && (user.username !== username || user.email !== email)) {
        const updatedUser = { ...user, username, email };
        setUser(updatedUser);
        localStorage.setItem('adminUser', JSON.stringify(updatedUser));
      }
      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to update credentials' };
    }
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout: () => logout(false),
    updateSuperAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
