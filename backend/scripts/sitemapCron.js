require('dotenv').config();
const mongoose = require('mongoose');
const { generateSitemap, generateSitemapIndex } = require('../utils/sitemapGenerator');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/shasnadesh');

async function runSitemapCron() {
  try {
    console.log('🔄 Starting scheduled sitemap regeneration...');
    
    // Generate blog sitemap
    const result = await generateSitemap();
    
    if (result.success) {
      console.log(`✅ Sitemap regenerated with ${result.count} blog posts`);
      
      // Generate sitemap index
      generateSitemapIndex();
      console.log('✅ Sitemap index updated');
    } else {
      console.error('❌ Sitemap regeneration failed:', result.error);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Cron job failed:', error);
    process.exit(1);
  }
}

// Run the cron job
runSitemapCron();