import express from 'express';
import multer from 'multer';
import ImageKit from 'imagekit';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Lazy initialization of ImageKit (after dotenv loads)
let imagekit = null;
const getImageKit = () => {
  if (!imagekit) {
    imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
    });
  }
  return imagekit;
};

// Use memory storage for multer (files stored in buffer, not disk)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Upload single image to ImageKit
router.post('/image', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload to ImageKit
    const result = await getImageKit().upload({
      file: req.file.buffer.toString('base64'),
      fileName: `game-${Date.now()}-${req.file.originalname}`,
      folder: '/game-ads',
      useUniqueFileName: true,
    });

    res.json({ 
      url: result.url,
      fileId: result.fileId,
      name: result.name,
      thumbnailUrl: result.thumbnailUrl
    });
  } catch (error) {
    console.error('ImageKit upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Upload multiple images to ImageKit
router.post('/images', protect, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Upload all files to ImageKit
    const uploadPromises = req.files.map(file => 
      getImageKit().upload({
        file: file.buffer.toString('base64'),
        fileName: `game-${Date.now()}-${file.originalname}`,
        folder: '/game-ads',
        useUniqueFileName: true,
      })
    );

    const results = await Promise.all(uploadPromises);
    
    const urls = results.map(result => ({
      url: result.url,
      fileId: result.fileId,
      name: result.name,
      thumbnailUrl: result.thumbnailUrl
    }));

    res.json(urls);
  } catch (error) {
    console.error('ImageKit upload error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// Delete image from ImageKit
router.delete('/image/:fileId', protect, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!fileId) {
      return res.status(400).json({ error: 'File ID required' });
    }

    await getImageKit().deleteFile(fileId);
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('ImageKit delete error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Get authentication parameters for client-side uploads (if needed)
router.get('/auth', protect, (req, res) => {
  try {
    const authParams = getImageKit().getAuthenticationParameters();
    res.json(authParams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate auth parameters' });
  }
});

export default router;
