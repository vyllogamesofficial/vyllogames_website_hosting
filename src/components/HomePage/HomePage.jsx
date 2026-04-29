import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gameApi, platformLinksApi, websiteSettingsApi } from '../../api';
import GameCard from '../GameCard/GameCard';
import styles from './HomePage.module.css';

const HomePage = () => {
  const [featuredGames, setFeaturedGames] = useState([]);
  const [newGames, setNewGames] = useState([]);
  const [allGames, setAllGames] = useState([]);
  const [platformLinks, setPlatformLinks] = useState({});
  const [heroBannerUrl, setHeroBannerUrl] = useState('');
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

    const fetchPlatformLinks = async () => {
      try {
        const { data } = await platformLinksApi.get();
        setPlatformLinks(data || {});
      } catch (error) {
        console.error('Error fetching platform links:', error);
      }
    };

    const fetchWebsiteSettings = async () => {
      try {
        const { data } = await websiteSettingsApi.get();
        setHeroBannerUrl(data.heroBannerUrl || '');
      } catch (error) {
        console.error('Error fetching website settings:', error);
      }
    };

    fetchGames();
    fetchPlatformLinks();
    fetchWebsiteSettings();
  }, []);

  return (
    <div className={styles['home-page']}>
      {/* Hero Section */}
      <section className={styles['hero-section']}>
        {heroBannerUrl ? (
          <img
            src={heroBannerUrl}
            alt="Vyllo Games casual mobile games banner"
            style={{
              width: '100%',
              display: 'block',
              borderRadius: '0',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div className={styles['hero-content']}>
            <div className={styles['hero-brand']}>
              <img
                src="/Media/vyllo-games.png"
                alt="VYLLO games logo"
                className={styles['hero-logo']}
              />
              <h1 className={styles['hero-title']}>Vyllo Games</h1>
            </div>

            <p className={styles['hero-subtitle']}>
              Super Fun Mobile Games for Everyone
            </p>

            <div className={styles['hero-snow-animation']}></div>

            <div className={styles['about-us']} style={{ marginTop: '32px' }}>
              <h2 className={styles['about-title']}>About Us</h2>
              <p>
                Welcome to <strong>Vyllo Games</strong>, where games come to life!
              </p>
              <p>
                We’re passionate gamers building a place for players who love to explore,
                compete, and have fun. From quick casual games to intense challenges,
                our goal is simple: bring great games together in one easy-to-enjoy platform.
              </p>
              <p>
                We believe gaming is for everyone - no matter your age, skill level,
                or play style. Jump in, press play, and let the fun begin!
              </p>
            </div>
          </div>
        )}
      </section>

      {/* New Apps Section */}
      <section className={`${styles.section} ${styles['new-apps-section']}`}>
        <h2 className={styles['section-title']}>✨ New Apps</h2>

        <div className={styles['new-apps-list']}>
          {loading ? (
            <>
              <span className={styles['loading-bar']} />
              <span className={styles['loading-bar']} style={{ width: '60%' }} />
              <span className={styles['loading-bar']} style={{ width: '45%' }} />
            </>
          ) : newGames.length > 0 ? (
            newGames.map(game => (
              <Link key={game._id} to={`/game/${game._id}`} className={styles['new-app-link']}>
                <span className={styles['new-badge']}>NEW</span> {game.title}
              </Link>
            ))
          ) : (
            <span className={styles['empty-text']}>No new apps yet</span>
          )}
        </div>
      </section>

      {/* Featured Games Section */}
      {(loading || featuredGames.length > 0) && (
        <section className={`${styles.section} ${styles['featured-section']}`}>
          <h2 className={styles['section-title']}>⭐ Featured Apps</h2>

          <div className={`${styles['games-grid']} ${styles['featured-grid']}`}>
            {loading ? (
              <>
                <div className={styles['skeleton-card']} />
                <div className={styles['skeleton-card']} />
              </>
            ) : (
              featuredGames.map(game => (
                <GameCard key={game._id} game={game} featured />
              ))
            )}
          </div>
        </section>
      )}

      {/* All Games Section */}
      <section className={`${styles.section} ${styles['all-games-section']}`}>
        <h2 className={styles['section-title']}>📱 All Games</h2>

        <div className={styles['games-grid']}>
          {loading ? (
            <>
              <div className={styles['skeleton-card']} />
              <div className={styles['skeleton-card']} />
              <div className={styles['skeleton-card']} />
            </>
          ) : allGames.length > 0 ? (
            allGames.map(game => (
              <GameCard key={game._id} game={game} />
            ))
          ) : (
            <p className={styles['empty-text']}>No games found</p>
          )}
        </div>
      </section>

      {/* Footer Section */}
      <footer className={styles.footer}>
        <div className={styles['footer-content']}>
          <div className={styles['social-links']}>
            {(() => {
              const order = [
                'Twitter',
                'Instagram',
                'YouTube',
                'Facebook',
                'TikTok',
                'Twitch',
                'Kick',
                'LinkedIn',
                'Discord',
                'Reddit',
                'Rednote'
              ];

              return order.map((platform) => {
                const url = platformLinks && platformLinks[platform];

                if (!url) return null;

                const displayName = platform === 'Twitter' ? 'X' : platform;

                return (
                  <a
                    key={platform}
                    href={url}
                    className={styles['social-link']}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {displayName}
                  </a>
                );
              });
            })()}
          </div>

          <p className={styles.copyright}>
            © {new Date().getFullYear()} Vyllo Games. All rights reserved.
            <img
              src="/Media/vyllo-games.png"
              alt="Vyllo Games mobile game developer logo small"
              className={styles['footer-logo']}
            />
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
