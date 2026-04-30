import express from 'express';
import WebsiteSettings from '../models/WebsiteSettings.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get website settings
router.get('/', async (req, res) => {
  try {
    let settings = await WebsiteSettings.findOne();

    if (!settings) {
      settings = await WebsiteSettings.create({});
    }

    // Add CORS headers for dashboard domain
    res.setHeader("Access-Control-Allow-Origin", "https://dashboard.vyllogames.com");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    res.json(settings);
  } catch (error) {
    console.error('Get website settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update website settings
router.post('/update', protect, async (req, res) => {
  try {
    const { heroBannerUrl, heroBannerFileId } = req.body;

    let settings = await WebsiteSettings.findOne();

    if (!settings) {
      settings = await WebsiteSettings.create({});
    }

    if (heroBannerUrl !== undefined) {
      settings.heroBannerUrl = heroBannerUrl;
    }

    if (heroBannerFileId !== undefined) {
      settings.heroBannerFileId = heroBannerFileId;
    }

    await settings.save();

    // Add CORS headers for dashboard domain
    res.setHeader("Access-Control-Allow-Origin", "https://dashboard.vyllogames.com");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    res.json({
      message: 'Website settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Update website settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
