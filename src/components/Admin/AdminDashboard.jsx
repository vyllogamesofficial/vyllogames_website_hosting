import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { gameApi } from '../../api';
import toast from 'react-hot-toast';
import styles from './AdminDashboard.module.css';
import { platformLinksApi } from '../../api';

// Server URL for static files (remove /api suffix if present)
const getServerUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return apiUrl.replace(/\/api\/?$/, '');
};
const SERVER_URL = getServerUrl();

const AdminDashboard = () => {
    // Social platform links state
    const initialPlatformLinks = {
      TikTok: '',
      Rednote: '',
      YouTube: '',
      Facebook: '',
      Instagram: '',
      Twitter: '',
      Twitch: '',
      Kick: '',
      LinkedIn: '',
      Discord: '',
      Reddit: '',
    };

    // Social logo mapping
    const SOCIAL_LOGOS = {
      TikTok: '/src/assets/social-logos/tiktok.svg',
      Rednote: '/src/assets/social-logos/rednote.svg',
      YouTube: '/src/assets/social-logos/youtube.svg',
      Facebook: '/src/assets/social-logos/facebook.svg',
      Instagram: '/src/assets/social-logos/instagram.svg',
      Twitter: '/src/assets/social-logos/twitter.svg',
      Twitch: '/src/assets/social-logos/twitch.svg',
      Kick: '/src/assets/social-logos/kick.svg',
      LinkedIn: '/src/assets/social-logos/linkedin.svg',
      Discord: '/src/assets/social-logos/discord.svg',
      Reddit: '/src/assets/social-logos/reddit.svg',
    };
    const [platformLinks, setPlatformLinks] = useState(initialPlatformLinks);
    const [updatingLinks, setUpdatingLinks] = useState(false);

    // Load platform links from backend
    useEffect(() => {
      const fetchPlatformLinks = async () => {
        try {
          const { data } = await platformLinksApi.get();
          // Only update known platforms
          const links = {};
          Object.keys(initialPlatformLinks).forEach(key => {
            links[key] = data[key] || '';
          });
          setPlatformLinks(links);
        } catch (error) {
          toast.error('Failed to load platform links');
        }
      };
      fetchPlatformLinks();
    }, []);

    // Handler for updating platform links
    const handlePlatformLinksChange = (platform, value) => {
      setPlatformLinks(prev => ({ ...prev, [platform]: value }));
    };

    const handleUpdatePlatformLinks = async (e) => {
      e.preventDefault();
      setUpdatingLinks(true);
      try {
        await platformLinksApi.update(platformLinks);
        toast.success('Platform links updated successfully');
      } catch (error) {
        toast.error('Failed to update platform links');
      } finally {
        setUpdatingLinks(false);
      }
    };
  const [games, setGames] = useState([]);
  // Removed loading state
  const [adminUsername, setAdminUsername] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [updatingCredentials, setUpdatingCredentials] = useState(false);
  const { logout, user, updateSuperAdmin } = useAuth();
  const navigate = useNavigate();
  // Handler for updating super admin credentials
  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    setUpdatingCredentials(true);
    try {
      const result = await updateSuperAdmin(adminUsername, adminEmail, adminPassword);
      if (result.success) {
        toast.success('Credentials updated successfully');
        setAdminPassword('');
      } else {
        toast.error(result.error || 'Failed to update credentials');
      }
    } catch (error) {
      toast.error('Failed to update credentials');
    } finally {
      setUpdatingCredentials(false);
    }
  };

  // Initialize username/email from context
  useEffect(() => {
    if (user && user.username) {
      setAdminUsername(user.username);
    }
    if (user && user.email) {
      setAdminEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const { data } = await gameApi.getAllAdmin();
      setGames(data);
    } catch (error) {
      toast.error('Failed to fetch games');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await gameApi.toggleActive(id);
      setGames(games.map(game => 
        game._id === id ? { ...game, isActive: !game.isActive } : game
      ));
      toast.success('Game status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this game?')) return;
    
    try {
      await gameApi.delete(id);
      setGames(games.filter(game => game._id !== id));
      toast.success('Game deleted successfully');
    } catch (error) {
      toast.error('Failed to delete game');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // Removed loading screen

  return (
    <div className={styles['admin-dashboard']}>
      <header className={styles['admin-header']}>
        <div className={styles['header-left']}>
          <h1>🎮 Game Ads Dashboard</h1>
          <Link to="/" className={styles['view-site-link']}>View Site →</Link>
        </div>
        <div className={styles['header-right']}>
          <span className={styles['admin-badge']}>🛡️ Super Admin</span>
          <button onClick={handleLogout} className={styles['logout-btn']}>
            Logout
          </button>
        </div>
      </header>

      <main className={styles['admin-main']}>
        {/* Platform Links Edit Section */}
        <section className={styles['platform-links-section']} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #eee', borderRadius: '8px', maxWidth: '500px' }}>
          <h2>Edit Social Platform Links</h2>
          <form onSubmit={handleUpdatePlatformLinks} className={styles['platform-links-form']}>
            {Object.keys(platformLinks).map(platform => (
              <div key={platform} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                {(() => {
                  const displayName = platform === 'Twitter' ? 'X' : platform;
                  return (
                    <>
                      <label htmlFor={`platform-link-${platform}`} style={{ minWidth: 90 }}>{displayName}:</label>
                      <input
                        id={`platform-link-${platform}`}
                        type="url"
                        value={platformLinks[platform]}
                        onChange={e => handlePlatformLinksChange(platform, e.target.value)}
                        placeholder={`Enter ${displayName} link`}
                        style={{ width: '100%', padding: '0.5rem', marginLeft: 8 }}
                      />
                    </>
                  );
                })()}
              </div>
            ))}
            <button type="submit" disabled={updatingLinks} style={{ padding: '0.5rem 1rem' }}>
              {updatingLinks ? 'Updating...' : 'Update Platform Links'}
            </button>
          </form>
        </section>
        {/* Super Admin Credentials Edit Form */}
        <section className={styles['admin-credentials-section']} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #eee', borderRadius: '8px', maxWidth: '400px' }}>
          <h2>Edit Super Admin Credentials</h2>
          <form onSubmit={handleUpdateCredentials} className={styles['admin-credentials-form']}>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="admin-username">Username:</label>
              <input
                id="admin-username"
                type="text"
                value={adminUsername}
                onChange={e => setAdminUsername(e.target.value)}
                required
                autoComplete="username"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="admin-email">Email:</label>
              <input
                id="admin-email"
                type="email"
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                required
                autoComplete="email"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="admin-password">Password:</label>
              <input
                id="admin-password"
                type="password"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                required
                autoComplete="new-password"
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </div>
            <button type="submit" disabled={updatingCredentials} style={{ padding: '0.5rem 1rem' }}>
              {updatingCredentials ? 'Updating...' : 'Update Credentials'}
            </button>
          </form>
        </section>

        <div className={styles['admin-actions']}>
          <h2>Games ({games.length})</h2>
          <Link to="/admin/games/new" className={styles['add-game-btn']}>
            + Add New Game
          </Link>
        </div>

        <div className={styles['games-table-container']}>
          <table className={styles['games-table']}>
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {games.map(game => {
                const imageUrl = game.image?.startsWith('http') 
                  ? game.image 
                  : `${SERVER_URL}${game.image}`;
                  
                return (
                  <tr key={game._id} className={!game.isActive ? styles.inactive : ''}>
                    <td>
                      <img 
                        src={imageUrl} 
                        alt={game.title}
                        className={styles['game-thumbnail']}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/60x40?text=No+Image';
                        }}
                      />
                    </td>
                    <td>
                      <span className={styles['game-title']}>{game.title}</span>
                      {game.isNewRelease && <span className={`${styles.badge} ${styles.new}`}>NEW</span>}
                    </td>
                    <td>{game.category}</td>
                    <td>
                      <button 
                        onClick={() => handleToggleActive(game._id)}
                        className={`${styles['status-btn']} ${game.isActive ? styles.active : styles.inactive}`}
                      >
                        {game.isActive ? '✓ Active' : '✗ Inactive'}
                      </button>
                    </td>
                    <td>
                      {game.featured ? '⭐ Yes' : 'No'}
                    </td>
                    <td className={styles['actions-cell']}>
                      <Link to={`/admin/games/edit/${game._id}`} className={styles['edit-btn']}>
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleDelete(game._id)}
                        className={styles['delete-btn']}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {games.length === 0 && (
            <div className={styles['no-games']}>
              <p>No games found. Add your first game!</p>
              <Link to="/admin/games/new" className={styles['add-game-btn']}>
                + Add New Game
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
