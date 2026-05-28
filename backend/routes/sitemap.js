const express = require('express');
const router = express.Router();
const { generateSitemapHandler } = require('../utils/sitemapGenerator');

// Generate sitemap (admin only or cron job)
router.get('/generate', generateSitemapHandler);

// Get sitemap index
router.get('/index', (req, res) => {
  const baseUrl = process.env.FRONTEND_URL || 'https://shasnadeshupdates.com';
  const today = new Date().toISOString().split('T')[0];
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    
    <!-- Main sitemap -->
    <sitemap>
        <loc>${baseUrl}/sitemap.xml</loc>
        <lastmod>${today}</lastmod>
    </sitemap>
    
    <!-- Blog posts sitemap -->
    <sitemap>
        <loc>${baseUrl}/sitemap-blogs.xml</loc>
        <lastmod>${today}</lastmod>
    </sitemap>
    
</sitemapindex>`;

  res.set('Content-Type', 'application/xml');
  res.send(xml);
});

module.exports = router;