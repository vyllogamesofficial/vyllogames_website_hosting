import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gameApi } from '../../api';
import GameCard from '../GameCard/GameCard';
import styles from './HomePage.module.css';

const HomePage = () => {
  const [featuredGames, setFeaturedGames] = useState([]);
  const [newGames, setNewGames] = useState([]);
  const [allGames, setAllGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const [featuredRes, newRes, allRes] = await Promise.all([
          gameApi.getFeatured(),
          gameApi.getNew(),
          gameApi.getAll()
        ]);
        setFeaturedGames(featuredRes.data);
        setNewGames(newRes.data);
        setAllGames(allRes.data);
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  if (loading) {
    return (
      <div className={styles['loading-container']}>
        <div className={styles['loading-spinner']}></div>
        <p>Loading games...</p>
      </div>
    );
  }

  return (
    <div className={styles['home-page']}>
      {/* Hero Section */}
      <section className={styles['hero-section']}>
        <div className={styles['hero-content']}>
          <h1 className={styles['hero-title']}>🎮 Game Park</h1>
          <p className={styles['hero-subtitle']}>Magic and dreams in the palm of your hand</p>
          <div className={styles['hero-snow-animation']}></div>
        </div>
      </section>

      {/* New Apps Section */}
      <section className={`${styles.section} ${styles['new-apps-section']}`}>
        <h2 className={styles['section-title']}>✨ New Apps</h2>
        <div className={styles['new-apps-list']}>
          {newGames.map(game => (
            <Link key={game._id} to={`/game/${game._id}`} className={styles['new-app-link']}>
              <span className={styles['new-badge']}>NEW</span> {game.title}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Games Section */}
      {featuredGames.length > 0 && (
        <section className={`${styles.section} ${styles['featured-section']}`}>
          <h2 className={styles['section-title']}>⭐ Featured Apps</h2>
          <div className={`${styles['games-grid']} ${styles['featured-grid']}`}>
            {featuredGames.map(game => (
              <GameCard key={game._id} game={game} featured />
            ))}
          </div>
        </section>
      )}

      {/* All Games Section */}
      <section className={`${styles.section} ${styles['all-games-section']}`}>
        <h2 className={styles['section-title']}>📱 All Games</h2>
        <div className={styles['games-grid']}>
          {allGames.map(game => (
            <GameCard key={game._id} game={game} />
          ))}
        </div>
      </section>

      {/* Footer Section */}
      <footer className={styles.footer}>
        <div className={styles['footer-content']}>
          <div className={styles['social-links']}>
            <a href="#" className={`${styles['social-link']} ${styles.twitter}`}>Twitter</a>
            <a href="#" className={`${styles['social-link']} ${styles.instagram}`}>Instagram</a>
            <a href="#" className={`${styles['social-link']} ${styles.youtube}`}>YouTube</a>
          </div>
          <p className={styles.copyright}>© Game Park - All rights reserved</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
