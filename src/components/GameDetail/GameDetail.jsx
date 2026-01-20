import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { gameApi } from '../../api';
import styles from './GameDetail.module.css';

// Server URL for static files (remove /api suffix if present)
const getServerUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return apiUrl.replace(/\/api\/?$/, '');
};
const SERVER_URL = getServerUrl();

const GameDetail = () => {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [id]);

  if (loading) {
    return (
      <div className={styles['loading-container']}>
        <div className={styles['loading-spinner']}></div>
        <p>Loading game details...</p>
      </div>
    );
  }

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
                    <span key={platform} className={styles['platform-badge']}>{platform}</span>
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
                {game.links?.ios && (
                  <a href={game.links.ios} target="_blank" rel="noopener noreferrer" className={`${styles['download-link']} ${styles.ios}`}>
                    📱 App Store
                  </a>
                )}
                {game.links?.android && (
                  <a href={game.links.android} target="_blank" rel="noopener noreferrer" className={`${styles['download-link']} ${styles.android}`}>
                    🤖 Google Play
                  </a>
                )}
                {game.links?.steam && (
                  <a href={game.links.steam} target="_blank" rel="noopener noreferrer" className={`${styles['download-link']} ${styles.steam}`}>
                    🎮 Steam
                  </a>
                )}
                {game.links?.website && (
                  <a href={game.links.website} target="_blank" rel="noopener noreferrer" className={`${styles['download-link']} ${styles.website}`}>
                    🌐 Website
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
