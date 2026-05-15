require('dotenv').config();
const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const fs = require('fs');
const path = require('path');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shasnadesh', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function generateBlogSitemap() {
  try {
    console.log('🔍 Fetching published blogs...');
    
    // Fetch all published blogs
    const blogs = await Blog.find({ status: 'published' })
      .select('slug updatedAt')
      .sort({ updatedAt: -1 })
      .limit(5000);

    console.log(`📝 Found ${blogs.length} published blogs`);

    const baseUrl = process.env.FRONTEND_URL || 'https://shasnadeshupdates.vercel.app';
    
    // Start XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n`;

    // Add blog URLs
    blogs.forEach(blog => {
      const url = `${baseUrl}/blog/${blog.slug}`;
      const lastmod = blog.updatedAt.toISOString().split('T')[0];
      
      xml += `    <url>
        <loc>${url}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>\n`;
    });

    // Close XML
    xml += '</urlset>';

    // Save to file
    const sitemapPath = path.join(__dirname, '../../frontend/public/sitemap-blogs.xml');
    fs.writeFileSync(sitemapPath, xml);
    
    console.log(`✅ Generated sitemap with ${blogs.length} blog posts at ${sitemapPath}`);
    
    // Update sitemap index
    const today = new Date().toISOString().split('T')[0];
    const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
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
    fs.writeFileSync(indexPath, indexXml);
    
    console.log(`✅ Updated sitemap index at ${indexPath}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

// Run the script
generateBlogSitemap();