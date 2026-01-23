import express from 'express';
import Game from '../models/Game.js';

const router = express.Router();

// Serve a dynamic sitemap.xml built from active games
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'https://www.vyllogames.com';

    const games = await Game.find({ isActive: true }).select('updatedAt createdAt').lean();

    const urls = [];

    // Homepage
    urls.push({
      loc: `${baseUrl}/`,
      changefreq: 'daily',
      priority: '1.0'
    });

    // Individual game pages
    for (const g of games) {
      const lastmod = (g.updatedAt || g.createdAt) ? new Date(g.updatedAt || g.createdAt).toISOString().split('T')[0] : null;
      urls.push({
        loc: `${baseUrl}/game/${g._id}`,
        lastmod,
        changefreq: 'monthly',
        priority: '0.6'
      });
    }

    // Build XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const u of urls) {
      xml += '  <url>\n';
      xml += `    <loc>${u.loc}</loc>\n`;
      if (u.lastmod) xml += `    <lastmod>${u.lastmod}</lastmod>\n`;
      if (u.changefreq) xml += `    <changefreq>${u.changefreq}</changefreq>\n`;
      if (u.priority) xml += `    <priority>${u.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    // cache for 1 hour in CDN
    res.header('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    console.error('Sitemap error:', err);
    res.status(500).send('Error generating sitemap');
  }
});

export default router;
