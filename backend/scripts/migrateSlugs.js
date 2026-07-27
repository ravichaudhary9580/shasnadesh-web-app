require('dotenv').config();
const connectDB = require('../config/db');
const Blog = require('../models/Blog');
const slugify = require('../utils/slugify');

async function migrateSlugs() {
  try {
    await connectDB();
    const blogs = await Blog.find({});
    console.log(`Found ${blogs.length} blogs to migrate.`);
    
    let updatedCount = 0;

    for (const blog of blogs) {
      const newSlugBase = slugify(blog.title);
      let newSlug = newSlugBase;
      let counter = 1;

      // Ensure uniqueness, but skip checking against itself
      while (await Blog.exists({ slug: newSlug, _id: { $ne: blog._id } })) {
        newSlug = `${newSlugBase}-${counter++}`;
      }

      if (blog.slug !== newSlug) {
        console.log(`Updating slug: ${blog.slug} -> ${newSlug}`);
        blog.slug = newSlug;
        await blog.save();
        updatedCount++;
      }
    }

    console.log(`Migration complete! Updated ${updatedCount} blogs.`);
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

migrateSlugs();
