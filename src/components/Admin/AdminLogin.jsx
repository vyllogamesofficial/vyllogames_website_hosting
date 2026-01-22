import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import styles from './AdminLogin.module.css';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  // Removed loading state
  const [showPassword, setShowPassword] = useState(false);
  const [lockInfo, setLockInfo] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLockInfo(null);

    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        toast.success('Access granted!');
        navigate('/admin/dashboard');
      } else {
        if (result.locked) {
          setLockInfo({
            locked: true,
            timeRemaining: result.lockTimeRemaining
          });
          toast.error(`🔒 Locked for ${result.lockTimeRemaining} minutes`);
        } else if (result.attemptsRemaining !== undefined && result.attemptsRemaining > 0) {
          toast.error(`Invalid credentials. ${result.attemptsRemaining} attempts left.`);
        } else if (result.attemptsRemaining === 0) {
          setLockInfo({ locked: true, timeRemaining: 30 });
          toast.error('🔒 Account locked!');
        } else {
          toast.error(result.error || 'Access denied');
        }
      }
    } catch {
      toast.error('Connection error');
    }
  };

  return (
    <div className={styles['admin-login-page']}>
      <div className={styles['login-container']}>
        <Link to="/" className={styles['back-to-home']}>← Back to Home</Link>
        
        <div className={styles['login-card']}>
          <div className={styles['admin-badge']}>🛡️ SUPER ADMIN</div>
          <h1 className={styles['login-title']}>Secure Access</h1>
          
          {lockInfo?.locked && (
            <div className={styles['lock-warning']}>
              <span className={styles['lock-icon']}>🔒</span>
              <span>ACCESS LOCKED</span>
              <span className={styles['lock-time']}>Try again in {lockInfo.timeRemaining} min</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className={styles['login-form']}>
            <div className={styles['form-group']}>
              <label htmlFor="email">Admin Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="admin@example.com"
                autoComplete="email"
                disabled={lockInfo?.locked}
              />
            </div>
            
            <div className={styles['form-group']}>
              <label htmlFor="password">Password</label>
              <div className={styles['password-input-wrapper']}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={lockInfo?.locked}
                />
                <button 
                  type="button" 
                  className={styles['toggle-password']}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={lockInfo?.locked}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            
            <button 
              type="submit" 
              className={styles['login-btn']} 
              disabled={lockInfo?.locked}
            >
              🔓 Access Dashboard
            </button>
          </form>

          <div className={styles['security-notice']}>
            <span>🔐</span> Protected by rate limiting & session monitoring
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
