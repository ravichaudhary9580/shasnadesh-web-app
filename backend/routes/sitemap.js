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
      xml += `
    <url>
        <loc>${baseUrl}/blog/${blog.slug}</loc>
        <lastmod>${blog.updatedAt.toISOString().split('T')[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`;
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
  const backendUrl = process.env.BACKEND_URL || 'https://shasnadesh-web-app.vercel.app';
  const today = new Date().toISOString().split('T')[0];
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap>
        <loc>${baseUrl}/sitemap.xml</loc>
        <lastmod>${today}</lastmod>
    </sitemap>
    <sitemap>
        <loc>${backendUrl}/api/sitemap/blogs.xml</loc>
        <lastmod>${today}</lastmod>
    </sitemap>
</sitemapindex>`;

  res.set('Content-Type', 'application/xml');
  res.send(xml);
});

// Generate static sitemap (for local/manual use)
router.get('/generate', generateSitemapHandler);

module.exports = router;