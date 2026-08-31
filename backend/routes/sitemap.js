const express = require('express');
const router = express.Router();
const { generateSitemapHandler } = require('../utils/sitemapGenerator');
const Blog = require('../models/Blog');

// Dynamic sitemap for blogs
router.get('/blogs.xml', async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'published' })
      .select('slug updatedAt')
      .sort({ updatedAt: -1 })
      .limit(5000);

    const baseUrl = process.env.FRONTEND_URL || 'https://shasnadeshupdates.com';
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    blogs.forEach(blog => {
      const cleanSlug = encodeURIComponent((blog.slug || '').trim().replace(/^\/+|\/+$/g, ''));
      if (cleanSlug) {
        xml += `
    <url>
        <loc>${baseUrl}/blog/${cleanSlug}</loc>
        <lastmod>${blog.updatedAt ? blog.updatedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`;
      }
    });

    xml += '\n</urlset>';
    
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    res.status(500).send('Error generating sitemap');
  }
});

// Sitemap index
router.get('/index.xml', (req, res) => {
  const baseUrl = process.env.FRONTEND_URL || 'https://shasnadeshupdates.com';
  const today = new Date().toISOString().split('T')[0];
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap>
        <loc>${baseUrl}/sitemap.xml</loc>
        <lastmod>${today}</lastmod>
    </sitemap>
    <sitemap>
        <loc>${baseUrl}/sitemap-blogs.xml</loc>
        <lastmod>${today}</lastmod>
    </sitemap>
</sitemapindex>`;

  res.set('Content-Type', 'application/xml');
  res.send(xml);
});

// Generate static sitemap (for local/manual use)
router.get('/generate', generateSitemapHandler);

module.exports = router;