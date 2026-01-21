import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { gameApi, uploadApi } from '../../api';
import toast from 'react-hot-toast';
import styles from './GameForm.module.css';

// Server URL for static files (remove /api suffix if present)
const getServerUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return apiUrl.replace(/\/api\/?$/, '');
};
const SERVER_URL = getServerUrl();

const CATEGORIES = ['Simulation', 'RPG', 'Strategy', 'Action', 'Puzzle', 'Adventure', 'Sports', 'Other'];
const PLATFORMS = [
  'Google Play (Android)',
  'App Store (Apple)',
  'Huawei Store',
  'Amazon App Store',
  'PS4/PS5',
  'XBOX',
  'Nintendo Switch 1/2',
  'Steam',
  'Epic Store'
];

const GameForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    image: '',
    thumbnail: '',
    category: 'Simulation',
    platforms: [],
    links: {
      googlePlay: '',
      appStore: '',
      huaweiStore: '',
      amazonAppStore: '',
      ps: '',
      xbox: '',
      nintendoSwitch: '',
      steam: '',
      epicStore: ''
    },
    trailerUrl: '',
    featured: false,
    isNewRelease: true,
    isActive: true,
    order: 0
  });

  useEffect(() => {
    if (isEditing) {
      fetchGame();
    }
  }, [id]);

  const fetchGame = async () => {
    try {
      setLoading(true);
      const { data } = await gameApi.getById(id);
      setFormData({
        ...data,
        links: data.links || { ios: '', android: '', steam: '', website: '' },
        trailerUrl: data.trailerUrl || ''
      });
    } catch (error) {
      toast.error('Failed to fetch game');
      navigate('/admin/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('links.')) {
      const linkKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        links: { ...prev.links, [linkKey]: value }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handlePlatformToggle = (platform) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    try {
      setUploading(true);
      const { data } = await uploadApi.uploadImage(formDataUpload);
      setFormData(prev => ({ ...prev, image: data.url }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.shortDescription) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      if (isEditing) {
        await gameApi.update(id, formData);
        toast.success('Game updated successfully');
      } else {
        await gameApi.create(formData);
        toast.success('Game created successfully');
      }
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save game');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div className={styles['loading-container']}>
        <div className={styles['loading-spinner']}></div>
        <p>Loading game...</p>
      </div>
    );
  }

  return (
    <div className={styles['game-form-page']}>
      <div className={styles['form-container']}>
        <div className={styles['form-header']}>
          <Link to="/admin/dashboard" className={styles['back-link']}>← Back to Dashboard</Link>
          <h1>{isEditing ? '✏️ Edit Game' : '➕ Add New Game'}</h1>
        </div>

        <form onSubmit={handleSubmit} className={styles['game-form']}>
          <div className={styles['form-section']}>
            <h3>Basic Information</h3>
            
            <div className={styles['form-group']}>
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter game title"
              />
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="shortDescription">Short Description * (max 200 characters)</label>
              <input
                type="text"
                id="shortDescription"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                required
                maxLength={200}
                placeholder="Brief description for cards"
              />
              <span className={styles['char-count']}>{formData.shortDescription.length}/200</span>
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="description">Full Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={5}
                placeholder="Detailed game description"
              />
            </div>

            <div className={styles['form-group']}>
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles['form-section']}>
            <h3>Image</h3>
            
            <div className={styles['form-group']}>
              <label>Game Image</label>
              <div className={styles['image-upload-area']}>
                {formData.image && (
                  <img 
                    src={formData.image.startsWith('http') ? formData.image : `${SERVER_URL}${formData.image}`}
                    alt="Preview"
                    className={styles['image-preview']}
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                {uploading && <span className={styles.uploading}>Uploading...</span>}
              </div>
              <span className={styles['help-text']}>Or enter image URL directly:</span>
              <input
                type="text"
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div className={styles['form-section']}>
            <h3>Platforms</h3>
            <div className={styles['platforms-grid']}>
              {PLATFORMS.map(platform => (
                <label key={platform} className={styles['platform-checkbox']}>
                  <input
                    type="checkbox"
                    checked={formData.platforms.includes(platform)}
                    onChange={() => handlePlatformToggle(platform)}
                  />
                  <span>{platform}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles['form-section']}>
            <h3>Download Links</h3>
            
            <div className={styles['form-group']}>
              <label htmlFor="links.googlePlay">Google Play (Android) URL</label>
              <input
                type="url"
                id="links.googlePlay"
                name="links.googlePlay"
                value={formData.links.googlePlay}
                onChange={handleChange}
                placeholder="https://play.google.com/..."
              />
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="links.appStore">App Store (Apple) URL</label>
              <input
                type="url"
                id="links.appStore"
                name="links.appStore"
                value={formData.links.appStore}
                onChange={handleChange}
                placeholder="https://apps.apple.com/..."
              />
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="links.huaweiStore">Huawei Store URL</label>
              <input
                type="url"
                id="links.huaweiStore"
                name="links.huaweiStore"
                value={formData.links.huaweiStore}
                onChange={handleChange}
                placeholder="https://appgallery.huawei.com/..."
              />
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="links.amazonAppStore">Amazon App Store URL</label>
              <input
                type="url"
                id="links.amazonAppStore"
                name="links.amazonAppStore"
                value={formData.links.amazonAppStore}
                onChange={handleChange}
                placeholder="https://www.amazon.com/gp/mas/..."
              />
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="links.ps">PS4/PS5 URL</label>
              <input
                type="url"
                id="links.ps"
                name="links.ps"
                value={formData.links.ps}
                onChange={handleChange}
                placeholder="https://store.playstation.com/..."
              />
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="links.xbox">XBOX URL</label>
              <input
                type="url"
                id="links.xbox"
                name="links.xbox"
                value={formData.links.xbox}
                onChange={handleChange}
                placeholder="https://www.xbox.com/..."
              />
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="links.nintendoSwitch">Nintendo Switch 1/2 URL</label>
              <input
                type="url"
                id="links.nintendoSwitch"
                name="links.nintendoSwitch"
                value={formData.links.nintendoSwitch}
                onChange={handleChange}
                placeholder="https://www.nintendo.com/..."
              />
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="links.steam">Steam URL</label>
              <input
                type="url"
                id="links.steam"
                name="links.steam"
                value={formData.links.steam}
                onChange={handleChange}
                placeholder="https://store.steampowered.com/..."
              />
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="links.epicStore">Epic Store URL</label>
              <input
                type="url"
                id="links.epicStore"
                name="links.epicStore"
                value={formData.links.epicStore}
                onChange={handleChange}
                placeholder="https://www.epicgames.com/..."
              />
            </div>
          </div>

          <div className={styles['form-section']}>
            <h3>Trailer</h3>
            
            <div className={styles['form-group']}>
              <label htmlFor="trailerUrl">YouTube Trailer URL</label>
              <input
                type="url"
                id="trailerUrl"
                name="trailerUrl"
                value={formData.trailerUrl}
                onChange={handleChange}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
              />
              <span className={styles['help-text']}>Paste a YouTube video URL to embed the trailer on the game page</span>
            </div>
          </div>

          <div className={styles['form-section']}>
            <h3>Settings</h3>
            
            <div className={styles['form-group']}>
              <label htmlFor="order">Display Order</label>
              <input
                type="number"
                id="order"
                name="order"
                value={formData.order}
                onChange={handleChange}
                min={0}
              />
              <span className={styles['help-text']}>Lower numbers appear first</span>
            </div>

            <div className={styles['checkbox-group']}>
              <label className={styles['checkbox-label']}>
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                />
                <span>⭐ Featured Game</span>
              </label>

              <label className={styles['checkbox-label']}>
                <input
                  type="checkbox"
                  name="isNewRelease"
                  checked={formData.isNewRelease}
                  onChange={handleChange}
                />
                <span>🆕 Mark as New</span>
              </label>

              <label className={styles['checkbox-label']}>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                <span>✓ Active (visible on site)</span>
              </label>
            </div>
          </div>

          <div className={styles['form-actions']}>
            <button type="button" onClick={() => navigate('/admin/dashboard')} className={styles['cancel-btn']}>
              Cancel
            </button>
            <button type="submit" className={styles['submit-btn']} disabled={loading || uploading}>
              {loading ? 'Saving...' : (isEditing ? 'Update Game' : 'Create Game')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GameForm;
