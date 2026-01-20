import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { gameApi } from '../../api';
import toast from 'react-hot-toast';
import styles from './AdminDashboard.module.css';

// Server URL for static files (remove /api suffix if present)
const getServerUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return apiUrl.replace(/\/api\/?$/, '');
};
const SERVER_URL = getServerUrl();

const AdminDashboard = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const { data } = await gameApi.getAllAdmin();
      setGames(data);
    } catch (error) {
      toast.error('Failed to fetch games');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className={styles['loading-container']}>
        <div className={styles['loading-spinner']}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

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
