const Blog = require('../models/Blog');
const fs = require('fs');
const path = require('path');

/**
 * Generate dynamic sitemap with blog posts
 */
async function generateSitemap() {
  try {
    // Fetch all published blogs
    const blogs = await Blog.find({ status: 'published' })
      .select('slug updatedAt')
      .sort({ updatedAt: -1 })
      .limit(5000); // Limit to 5000 posts for sitemap

    const baseUrl = process.env.FRONTEND_URL || 'https://shasnadeshupdates.com';
    
    // Start XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n`;

    // Add blog URLs
    blogs.forEach(blog => {
      const url = `${baseUrl}/blog/${encodeURIComponent(blog.slug)}`;
      const lastmod = blog.updatedAt.toISOString().split('T')[0];
      
      xml += `    <url>
        <loc>${url}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>hourly</changefreq>
        <priority>0.8</priority>
    </url>\n`;
    });

    // Close XML
    xml += '</urlset>';

    // Save to file
    const sitemapPath = path.join(__dirname, '../../frontend/public/sitemap-blogs.xml');
    fs.writeFileSync(sitemapPath, xml);
    
    console.log(`✅ Generated sitemap with ${blogs.length} blog posts at ${sitemapPath}`);
    
    return {
      success: true,
      count: blogs.length,
      path: sitemapPath
    };
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate sitemap index for multiple sitemaps
 */
function generateSitemapIndex() {
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

  const indexPath = path.join(__dirname, '../../frontend/public/sitemap-index.xml');
  fs.writeFileSync(indexPath, xml);
  
  console.log(`✅ Generated sitemap index at ${indexPath}`);
  
  return indexPath;
}

/**
 * API endpoint to trigger sitemap generation
 */
async function generateSitemapHandler(req, res) {
  try {
    const result = await generateSitemap();
    
    if (result.success) {
      res.json({
        success: true,
        message: `Sitemap generated with ${result.count} blog posts`,
        path: result.path
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  generateSitemap,
  generateSitemapIndex,
  generateSitemapHandler
};