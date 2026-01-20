import { Link } from 'react-router-dom';
import styles from './GameCard.module.css';

// Server URL for static files (remove /api suffix if present)
const getServerUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return apiUrl.replace(/\/api\/?$/, '');
};
const SERVER_URL = getServerUrl();

const GameCard = ({ game, featured = false }) => {
  const imageUrl = game.image?.startsWith('http') 
    ? game.image 
    : `${SERVER_URL}${game.image}`;

  return (
    <div className={`${styles['game-card']} ${featured ? styles.featured : ''}`}>
      <Link to={`/game/${game._id}`} className={styles['game-card-link']}>
        <div className={styles['game-card-image-wrapper']}>
          <img 
            src={imageUrl} 
            alt={game.title}
            className={styles['game-card-image']}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x200?text=Game+Image';
            }}
          />
          {game.isNewRelease && <span className={`${styles['game-badge']} ${styles.new}`}>NEW</span>}
          {game.featured && <span className={`${styles['game-badge']} ${styles.featured}`}>⭐ Featured</span>}
        </div>
        
        <div className={styles['game-card-content']}>
          <h3 className={styles['game-card-title']}>{game.title}</h3>
          <p className={styles['game-card-description']}>{game.shortDescription}</p>
          
          <div className={styles['game-card-meta']}>
            <span className={styles['game-category']}>{game.category}</span>
            <div className={styles['game-platforms']}>
              {game.platforms?.map(platform => (
                <span key={platform} className={styles['platform-badge']}>
                  {platform}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default GameCard;
