const Blog = require('../models/Blog')
const Analytics = require('../models/Analytics')
const slugify = require('../utils/slugify')
const { sendNotification } = require('./pushController')
const { generateSitemap, generateSitemapIndex } = require('../utils/sitemapGenerator')
const { notifyAllIndexing } = require('../services/indexingService')
const { S3Client, DeleteObjectsCommand } = require('@aws-sdk/client-s3')

/**
 * Helper to get Hindi transliteration from English text using Google Input Tools API.
 * Converts "police" -> "(police|पुलिस|पोलिस|पोलीस)" for robust regex searching.
 */
async function getSearchRegexString(search) {
  if (!search) return '';
  const query = search.trim();
  const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Only attempt transliteration if the query contains english alphabets
  if (!/[a-zA-Z]/.test(query)) return escapeRegExp(query);
  
  try {
    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(query)}&itc=hi-t-i0-und&num=3`;
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
    const data = await res.json();
    if (data && data[1] && data[1][0] && data[1][0][1]) {
      const predictions = data[1][0][1];
      const terms = [query, ...predictions].map(escapeRegExp);
      return `(${terms.join('|')})`;
    }
  } catch (error) {
    console.error("Transliteration API error:", error.message);
  }
  // Fallback
  return escapeRegExp(query);
}

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

// Public
exports.getBlogs = async (req, res) => {
  try {
    const {
      search, category, tag, year, featured,
      status = 'published',
      sort = '-createdAt',
      page = 1, limit = 12
    } = req.query

    const query = { status }
    if (search) {
      const searchRegexStr = await getSearchRegexString(search)
      query.$or = [
        { title: { $regex: searchRegexStr, $options: 'i' } },
        { excerpt: { $regex: searchRegexStr, $options: 'i' } },
        { content: { $regex: searchRegexStr, $options: 'i' } },
        { slug: { $regex: searchRegexStr, $options: 'i' } },
      ]
    }
    if (category) query.category = category
    if (tag) query.tags = tag
    if (featured === 'true') query.featured = true
    
    // Year filter
    if (year) {
      const startDate = new Date(`${year}-01-01`)
      const endDate = new Date(`${year}-12-31T23:59:59`)
      query.createdAt = { $gte: startDate, $lte: endDate }
    }

    const total = await Blog.countDocuments(query)
    const blogs = await Blog.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-content')

    res.json({ blogs, total, page: Number(page), pages: Math.ceil(total / limit) })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Search suggestions
exports.getSuggestions = async (req, res) => {
  try {
    const { q, limit = 8 } = req.query
    const query = (q || '').trim()
    if (!query) return res.json([])

    const searchRegexStr = await getSearchRegexString(query)
    const regex = new RegExp(searchRegexStr, 'i')
    const suggestions = await Blog.find({ 
      status: 'published', 
      $or: [
        { title: { $regex: regex } },
        { slug: { $regex: regex } }
      ]
    })
      .sort({ views: -1, createdAt: -1 })
      .limit(Number(limit))
      .select('title slug category')

    res.json(suggestions)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getBlog = async (req, res) => {
  try {
    const rawSlug = req.params.slug;
    const decodedSlug = decodeURIComponent(rawSlug);

    let blog = await Blog.findOneAndUpdate(
      { slug: rawSlug, status: 'published' },
      { $inc: { views: 1 } },
      { returnDocument: 'after' }
    );

    if (!blog && decodedSlug !== rawSlug) {
      blog = await Blog.findOneAndUpdate(
        { slug: decodedSlug, status: 'published' },
        { $inc: { views: 1 } },
        { returnDocument: 'after' }
      );
    }

    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin
exports.createBlog = async (req, res) => {
  try {
    const baseSlug = slugify(req.body.title) || `post-${Date.now()}`

    // Handle slug collisions by appending a counter
    let slug = baseSlug
    let counter = 1
    while (await Blog.exists({ slug })) {
      slug = `${baseSlug}-${counter++}`
    }

    const blog = await Blog.create({ ...req.body, slug })
    
    // Auto-update sitemaps, notify indexing APIs, and send push notification if blog is published
    if (blog.status === 'published') {
      generateSitemap().then(() => generateSitemapIndex()).catch(err => console.error('Sitemap update failed:', err))
      notifyAllIndexing(blog.slug, 'URL_UPDATED').catch(err => console.error('Indexing failed:', err))
      sendNotification(
        'नया ब्लॉग पोस्ट',
        blog.title,
        `/blog/${blog.slug}`,
        blog.thumbnail || '/logo512.png'
      ).catch(err => console.error('Push notification failed:', err))
    }
    
    res.status(201).json(blog)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.updateBlog = async (req, res) => {
  try {
    // Whitelist allowed fields — prevents overwriting views, slug, etc.
    const {
      title, content, excerpt, category, tags,
      status, featured, thumbnail, images, pdfs, videoUrl, links
    } = req.body

    const allowedUpdates = {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(excerpt !== undefined && { excerpt }),
      ...(category !== undefined && { category }),
      ...(tags !== undefined && { tags }),
      ...(status !== undefined && { status }),
      ...(featured !== undefined && { featured }),
      ...(thumbnail !== undefined && { thumbnail }),
      ...(images !== undefined && { images }),
      ...(pdfs !== undefined && { pdfs }),
      ...(videoUrl !== undefined && { videoUrl }),
      ...(links !== undefined && { links }),
      ...(req.body.watermark !== undefined && { watermark: req.body.watermark }),
    }

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      allowedUpdates,
      { returnDocument: 'after', runValidators: true }
    )
    if (!blog) return res.status(404).json({ message: 'Blog not found' })
    
    generateSitemap().then(() => generateSitemapIndex()).catch(err => console.error('Sitemap update failed:', err))
    if (blog.status === 'published') {
      notifyAllIndexing(blog.slug, 'URL_UPDATED').catch(err => console.error('Indexing failed:', err))
    }

    res.json(blog)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id)
    if (!blog) return res.status(404).json({ message: 'Blog not found' })

    // Extract all S3 URLs associated with the blog
    const urlsToDelete = new Set()
    
    if (blog.thumbnail) urlsToDelete.add(blog.thumbnail)
    
    if (Array.isArray(blog.images)) {
      blog.images.forEach(url => url && urlsToDelete.add(url))
    }
    
    if (Array.isArray(blog.pdfs)) {
      blog.pdfs.forEach(pdf => {
        const url = typeof pdf === 'string' ? pdf : pdf?.url
        if (url) urlsToDelete.add(url)
      })
    }
    
    if (blog.content) {
      const regex = /(?:src|href|data-src|poster)=["']([^"']+)["']/g
      const bgRegex = /url\(["']?([^"')]+)["']?\)/g
      let match
      while ((match = regex.exec(blog.content)) !== null) {
        if (match[1] && match[1].includes('amazonaws.com')) urlsToDelete.add(match[1])
      }
      while ((match = bgRegex.exec(blog.content)) !== null) {
        if (match[1] && match[1].includes('amazonaws.com')) urlsToDelete.add(match[1])
      }
    }
    
    // Convert URLs to keys and delete
    const keys = []
    urlsToDelete.forEach(url => {
      try {
        const u = new URL(url)
        if (u.hostname.includes('amazonaws.com')) {
          keys.push({ Key: u.pathname.replace(/^\//, '') })
        }
      } catch (e) {}
    })
    
    if (keys.length > 0) {
      const BATCH_SIZE = 1000
      for (let i = 0; i < keys.length; i += BATCH_SIZE) {
        const batch = keys.slice(i, i + BATCH_SIZE)
        s3.send(new DeleteObjectsCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Delete: { Objects: batch, Quiet: true }
        })).catch(err => console.error('S3 delete failed during blog deletion:', err))
      }
    }

    generateSitemap().then(() => generateSitemapIndex()).catch(err => console.error('Sitemap update failed:', err))
    notifyAllIndexing(blog.slug, 'URL_DELETED').catch(err => console.error('Indexing delete failed:', err))

    res.json({ message: 'Blog deleted' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.toggleStatus = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
    if (!blog) return res.status(404).json({ message: 'Blog not found' })
    const wasPublished = blog.status === 'published'
    blog.status = wasPublished ? 'draft' : 'published'
    await blog.save()
    
    generateSitemap().then(() => generateSitemapIndex()).catch(err => console.error('Sitemap update failed:', err))
    notifyAllIndexing(blog.slug, blog.status === 'published' ? 'URL_UPDATED' : 'URL_DELETED').catch(err => console.error('Indexing toggle failed:', err))

    res.json(blog)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.toggleFeatured = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
    if (!blog) return res.status(404).json({ message: 'Blog not found' })
    blog.featured = !blog.featured
    await blog.save()
    res.json(blog)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Admin - get all including drafts
exports.adminGetBlogs = async (req, res) => {
  try {
    const { search, status, category, sort = '-createdAt', page = 1, limit = 20 } = req.query
    const query = {}
    if (search) {
      const searchRegexStr = await getSearchRegexString(search)
      query.$or = [
        { title: { $regex: searchRegexStr, $options: 'i' } },
        { slug: { $regex: searchRegexStr, $options: 'i' } }
      ]
    }
    if (status) query.status = status
    if (category) query.category = category
    const total = await Blog.countDocuments(query)
    const blogs = await Blog.find(query).sort(sort)
      .skip((page - 1) * limit).limit(Number(limit))
    res.json({ blogs, total })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Manual trigger to request Google / IndexNow Instant Indexing
exports.requestInstantIndexing = async (req, res) => {
  try {
    const { url, blogId, type = 'URL_UPDATED' } = req.body
    let targetUrl = url

    if (!targetUrl && blogId) {
      const blog = await Blog.findById(blogId)
      if (!blog) return res.status(404).json({ message: 'Blog not found' })
      targetUrl = blog.slug
    }

    if (!targetUrl) {
      return res.status(400).json({ message: 'url or blogId is required' })
    }

    const result = await notifyAllIndexing(targetUrl, type)
    res.json({ message: 'Indexing notification sent', result })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get dynamic Open Graph meta HTML for social bot previews (WhatsApp, Facebook, Twitter, etc.)
exports.getBlogOgMeta = async (req, res) => {
  try {
    const rawSlug = req.params.slug;
    const decodedSlug = decodeURIComponent(rawSlug);

    const blog = await Blog.findOne({
      $or: [{ slug: rawSlug }, { slug: decodedSlug }],
      status: 'published'
    });

    if (!blog) {
      return res.redirect('https://shasnadeshupdates.com');
    }

    const title = (blog.title || 'Shasnadesh Updates').replace(/"/g, '&quot;');
    const description = (blog.excerpt || blog.title).replace(/"/g, '&quot;');
    const siteUrl = `https://shasnadeshupdates.com/blog/${blog.slug}`;
    
    let imageUrl = 'https://shasnadeshupdates.com/logo512.png';
    if (blog.thumbnail) {
      const cleanThumb = blog.thumbnail.replace(/\\/g, '/');
      if (cleanThumb.startsWith('http')) {
        imageUrl = cleanThumb;
      } else if (cleanThumb.startsWith('/uploads/') || cleanThumb.startsWith('uploads/')) {
        const formattedPath = cleanThumb.startsWith('/') ? cleanThumb : `/${cleanThumb}`;
        imageUrl = `https://shasnadesh-web-app.vercel.app${formattedPath}`;
      } else {
        const formattedPath = cleanThumb.startsWith('/') ? cleanThumb : `/${cleanThumb}`;
        imageUrl = `https://shasnadeshupdates.com${formattedPath}`;
      }
    }

    const html = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <title>${title} | Shasnadesh Updates</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${siteUrl}">

  <!-- Open Graph / WhatsApp / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${siteUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:secure_url" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Shasnadesh Updates">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${siteUrl}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">

  <script>window.location.href = "${siteUrl}";</script>
  <meta http-equiv="refresh" content="0;url=${siteUrl}">
</head>
<body>
  <p>Redirecting to <a href="${siteUrl}">${title}</a>...</p>
</body>
</html>`;

    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.redirect('https://shasnadeshupdates.com');
  }
};

// Get all unique categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await Blog.distinct('category', { status: 'published', category: { $ne: null, $ne: '' } })
        const cleaned = Array.from(new Set(categories.map(c => (typeof c === 'string' ? c.trim() : c)).filter(Boolean)))
        res.json(cleaned.sort())
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// Get all unique years
exports.getYears = async (req, res) => {
    try {
        const years = await Blog.aggregate([
            { $match: { status: 'published' } },
            { $project: { year: { $year: "$createdAt" } } },
            { $group: { _id: "$year" } },
            { $sort: { _id: -1 } }
        ])
        res.json(years.map(y => y._id.toString()))
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}