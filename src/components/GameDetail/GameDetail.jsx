import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { gameApi } from '../../api';
import styles from './GameDetail.module.css';

// Platform logo mapping
const PLATFORM_LOGOS = {
  'Google Play (Android)': '/src/assets/platform-logos/google-play.svg',
  'App Store (Apple)': '/src/assets/platform-logos/app-store.svg',
  'Huawei Store': '/src/assets/platform-logos/huawei-store.svg',
  'Amazon App Store': '/src/assets/platform-logos/amazon-app-store.svg',
  'PS4/PS5': '/src/assets/platform-logos/ps.svg',
  'XBOX': '/src/assets/platform-logos/xbox.svg',
  'Nintendo Switch 1/2': '/src/assets/platform-logos/nintendo-switch.svg',
  'Steam': '/src/assets/platform-logos/steam.svg',
  'Epic Store': '/src/assets/platform-logos/epic-store.svg',
};

// Server URL for static files (remove /api suffix if present)
const getServerUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return apiUrl.replace(/\/api\/?$/, '');
};
const SERVER_URL = getServerUrl();

const GameDetail = () => {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  // Removed loading state

  // Convert YouTube URL to embed URL
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    
    // Handle different YouTube URL formats
    let videoId = null;
    
    // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) {
      videoId = watchMatch[1];
    }
    
    // Short URL: https://youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch) {
      videoId = shortMatch[1];
    }
    
    // Already an embed URL
    const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/);
    if (embedMatch) {
      videoId = embedMatch[1];
    }
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    return null;
  };

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const { data } = await gameApi.getById(id);
        setGame(data);
      } catch (error) {
        console.error('Error fetching game:', error);
      }
    };
    fetchGame();
  }, [id]);

  // Removed loading screen

  if (!game) {
    return (
      <div className={styles['error-container']}>
        <h2>Game not found</h2>
        <Link to="/" className={styles['back-link']}>← Back to Home</Link>
      </div>
    );
  }

  const imageUrl = game.image?.startsWith('http') 
    ? game.image 
    : `${SERVER_URL}${game.image}`;

  return (
    <div className={styles['game-detail-page']}>
      <div className={styles['game-detail-container']}>
        <Link to="/" className={styles['back-link']}>← Back to Games</Link>
        
        <div className={styles['game-detail-card']}>
          <div className={styles['game-detail-header']}>
            <h1 className={styles['game-detail-title']}>{game.title}</h1>
            {game.isNewRelease && <span className={`${styles['detail-badge']} ${styles.new}`}>NEW</span>}
            {game.featured && <span className={`${styles['detail-badge']} ${styles.featured}`}>⭐ Featured</span>}
          </div>
          
          <div className={styles['game-detail-image-wrapper']}>
            <img 
              src={imageUrl} 
              alt={game.title}
              className={styles['game-detail-image']}
            />
          </div>
          
          <div className={styles['game-detail-content']}>
            <p className={styles['game-detail-description']}>{game.description}</p>
            
            {game.trailerUrl && getYouTubeEmbedUrl(game.trailerUrl) && (
              <div className={styles['game-trailer-section']}>
                <h3 className={styles['trailer-title']}>▶ TRAILER</h3>
                <div className={styles['trailer-wrapper']}>
                  <iframe
                    src={getYouTubeEmbedUrl(game.trailerUrl)}
                    title={`${game.title} Trailer`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className={styles['trailer-iframe']}
                  ></iframe>
                </div>
              </div>
            )}
            
            <div className={styles['game-detail-info']}>
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Category:</span>
                <span className={`${styles['info-value']} ${styles['category-badge']}`}>{game.category}</span>
              </div>
              
              <div className={styles['info-item']}>
                <span className={styles['info-label']}>Platforms:</span>
                <div className={styles['platforms-list']}>
                  {game.platforms?.map(platform => (
                    <span key={platform} className={styles['platform-badge']}>
                          {platform}
                    </span>
                  ))}
                </div>
              </div>
              
              {game.releaseDate && (
                <div className={styles['info-item']}>
                  <span className={styles['info-label']}>Release Date:</span>
                  <span className={styles['info-value']}>
                    {new Date(game.releaseDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            
            <div className={styles['game-links']}>
              <h3>Download Links</h3>
              <div className={styles['links-grid']}>
                {game.links?.googlePlay && (
                  <a href={game.links.googlePlay} target="_blank" rel="noopener noreferrer" className={styles['download-link']}>
                    Google Play
                  </a>
                )}
                {game.links?.appStore && (
                  <a href={game.links.appStore} target="_blank" rel="noopener noreferrer" className={styles['download-link']}>
                    App Store
                  </a>
                )}
                {game.links?.huaweiStore && (
                  <a href={game.links.huaweiStore} target="_blank" rel="noopener noreferrer" className={styles['download-link']}>
                    Huawei Store
                  </a>
                )}
                {game.links?.amazonAppStore && (
                  <a href={game.links.amazonAppStore} target="_blank" rel="noopener noreferrer" className={styles['download-link']}>
                    Amazon App Store
                  </a>
                )}
                {game.links?.ps && (
                  <a href={game.links.ps} target="_blank" rel="noopener noreferrer" className={styles['download-link']}>
                    PS4/PS5
                  </a>
                )}
                {game.links?.xbox && (
                  <a href={game.links.xbox} target="_blank" rel="noopener noreferrer" className={styles['download-link']}>
                    XBOX
                  </a>
                )}
                {game.links?.nintendoSwitch && (
                  <a href={game.links.nintendoSwitch} target="_blank" rel="noopener noreferrer" className={styles['download-link']}>
                    Nintendo Switch
                  </a>
                )}
                {game.links?.steam && (
                  <a href={game.links.steam} target="_blank" rel="noopener noreferrer" className={styles['download-link']}>
                    Steam
                  </a>
                )}
                {game.links?.epicStore && (
                  <a href={game.links.epicStore} target="_blank" rel="noopener noreferrer" className={styles['download-link']}>
                    Epic Store
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetail;
