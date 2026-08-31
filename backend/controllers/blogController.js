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

// Full Server-Side Rendered (SSR) HTML & Open Graph meta for search engine bots & crawlers (Googlebot, AdSense, WhatsApp, etc.)
exports.getBlogOgMeta = async (req, res) => {
  try {
    const rawSlug = req.params.slug;
    const decodedSlug = decodeURIComponent(rawSlug);

    const blog = await Blog.findOne({
      $or: [{ slug: rawSlug }, { slug: decodedSlug }],
      status: 'published'
    });

    if (!blog) {
      return res.status(404).send(`<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <title>पोस्ट नहीं मिली | Shasnadesh Updates</title>
  <meta name="robots" content="noindex, follow">
</head>
<body style="font-family: sans-serif; text-align: center; padding: 50px;">
  <h1>404 - पोस्ट उपलब्ध नहीं है</h1>
  <p>यह पोस्ट हटा दी गई है या इसका लिंक बदल गया है।</p>
  <a href="https://shasnadeshupdates.com/" style="color: #e8920a;">होमपेज पर जाएं</a>
</body>
</html>`);
    }

    const escapeHtml = (str) => {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const title = escapeHtml(blog.title || 'शासनादेश और सरकारी योजनाएं');
    const description = escapeHtml(blog.excerpt || (blog.content ? blog.content.replace(/<[^>]*>?/gm, '').substring(0, 160) : blog.title));
    const cleanSlug = encodeURIComponent((blog.slug || '').trim().replace(/^\/+|\/+$/g, ''));
    const siteUrl = `https://shasnadeshupdates.com/blog/${cleanSlug}`;
    const category = escapeHtml(blog.category || 'सरकारी आदेश');
    const publishedISO = blog.createdAt ? new Date(blog.createdAt).toISOString() : new Date().toISOString();
    const modifiedISO = blog.updatedAt ? new Date(blog.updatedAt).toISOString() : publishedISO;

    const formattedDate = new Date(blog.createdAt || Date.now()).toLocaleDateString('hi-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

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

    const pdfsHtml = Array.isArray(blog.pdfs) && blog.pdfs.length > 0
      ? `<div class="pdf-section">
          <h3>संबंधित दस्तावेज़ / शासनादेश PDF डाउनलोड:</h3>
          <ul>
            ${blog.pdfs.map(pdf => {
              const pdfUrl = typeof pdf === 'string' ? pdf : pdf?.url;
              const pdfTitle = escapeHtml(typeof pdf === 'string' ? 'शासनादेश PDF डाउनलोड करें' : (pdf?.title || 'शासनादेश PDF'));
              return pdfUrl ? `<li><a href="${escapeHtml(pdfUrl)}" target="_blank" rel="noopener noreferrer" class="pdf-link">📄 ${pdfTitle} (PDF)</a></li>` : '';
            }).join('')}
          </ul>
        </div>`
      : '';

    const tagsHtml = Array.isArray(blog.tags) && blog.tags.length > 0
      ? `<div class="tags-container">
          ${blog.tags.map(t => `<span class="tag-badge">#${escapeHtml(t)}</span>`).join(' ')}
        </div>`
      : '';

    const jsonLdArticle = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": siteUrl
      },
      "headline": blog.title || "Shasnadesh Updates",
      "description": blog.excerpt || blog.title,
      "image": [imageUrl],
      "datePublished": publishedISO,
      "dateModified": modifiedISO,
      "articleSection": blog.category || "Government Schemes & Orders",
      "inLanguage": "hi",
      "author": {
        "@type": "Organization",
        "name": "शासनादेश अपडेट्स संपादकीय टीम (Shasnadesh Updates Team)",
        "url": "https://shasnadeshupdates.com/about"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Shasnadesh Updates",
        "url": "https://shasnadeshupdates.com/",
        "logo": {
          "@type": "ImageObject",
          "url": "https://shasnadeshupdates.com/logo512.png",
          "width": 512,
          "height": 512
        }
      }
    });

    const jsonLdBreadcrumbs = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "होम",
          "item": "https://shasnadeshupdates.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": blog.category || "सरकारी आदेश",
          "item": `https://shasnadeshupdates.com/?category=${encodeURIComponent(blog.category || '')}`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": blog.title || "पोस्ट",
          "item": siteUrl
        }
      ]
    });

    const html = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - शासनादेश और सरकारी योजनाएं | Shasnadesh Updates</title>
  <meta name="description" content="${description}">
  <meta name="author" content="शासनादेश अपडेट्स संपादकीय टीम">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta name="googlebot" content="index, follow">
  <link rel="canonical" href="${siteUrl}">

  <!-- Google AdSense Account Verification & Ad Script -->
  <meta name="google-adsense-account" content="ca-pub-8129172226402333">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8129172226402333" crossorigin="anonymous"></script>

  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${siteUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:secure_url" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Shasnadesh Updates">
  <meta property="og:locale" content="hi_IN">
  <meta property="article:published_time" content="${publishedISO}">
  <meta property="article:modified_time" content="${modifiedISO}">
  <meta property="article:section" content="${category}">

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${siteUrl}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">

  <!-- Structured Data JSON-LD for Google Rich Results -->
  <script type="application/ld+json">${jsonLdArticle}</script>
  <script type="application/ld+json">${jsonLdBreadcrumbs}</script>

  <style>
    :root {
      --primary: #e8920a;
      --primary-dark: #b86e00;
      --ink: #26201a;
      --text: #333333;
      --bg: #faf8f5;
      --card-bg: #ffffff;
      --border: #e2dcd5;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Devanagari', Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.7;
      padding: 0;
    }
    header {
      background: #ffffff;
      border-bottom: 1px solid var(--border);
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 100%;
    }
    .logo {
      font-size: 20px;
      font-weight: 700;
      color: var(--primary);
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo img { width: 36px; height: 36px; border-radius: 6px; }
    nav a {
      margin-left: 15px;
      color: var(--ink);
      text-decoration: none;
      font-weight: 500;
      font-size: 14px;
    }
    nav a:hover { color: var(--primary); }
    .container {
      max-width: 860px;
      margin: 24px auto;
      padding: 0 16px;
    }
    .breadcrumbs {
      font-size: 13px;
      color: #666;
      margin-bottom: 16px;
    }
    .breadcrumbs a { color: #666; text-decoration: none; }
    .breadcrumbs a:hover { color: var(--primary); }
    .article-card {
      background: var(--card-bg);
      border-radius: 12px;
      border: 1px solid var(--border);
      padding: 28px 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .category-badge {
      display: inline-block;
      background: #fff4e5;
      color: var(--primary-dark);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 26px;
      line-height: 1.4;
      color: var(--ink);
      margin-bottom: 14px;
    }
    .meta-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 13px;
      color: #777;
      border-bottom: 1px solid #f0eae1;
      padding-bottom: 14px;
      margin-bottom: 20px;
    }
    .featured-image {
      width: 100%;
      max-height: 440px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    .article-content {
      font-size: 17px;
      line-height: 1.8;
      color: #2b2b2b;
    }
    .article-content p { margin-bottom: 18px; }
    .article-content h2, .article-content h3 {
      color: var(--ink);
      margin-top: 28px;
      margin-bottom: 14px;
      line-height: 1.35;
    }
    .article-content ul, .article-content ol {
      margin-left: 24px;
      margin-bottom: 18px;
    }
    .article-content li { margin-bottom: 8px; }
    .article-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 15px;
    }
    .article-content th, .article-content td {
      border: 1px solid var(--border);
      padding: 10px 14px;
      text-align: left;
    }
    .article-content th { background: #faf5ed; }
    .pdf-section {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 18px;
      margin: 26px 0;
    }
    .pdf-section h3 { font-size: 16px; margin-bottom: 10px; color: #1e293b; }
    .pdf-link {
      display: inline-block;
      background: #0284c7;
      color: #fff;
      padding: 8px 16px;
      border-radius: 6px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      margin-top: 6px;
    }
    .pdf-link:hover { background: #0369a1; }
    .tags-container {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #f0eae1;
    }
    .tag-badge {
      display: inline-block;
      background: #f3f4f6;
      color: #4b5563;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      margin-right: 6px;
      margin-bottom: 6px;
    }
    .author-box {
      margin-top: 32px;
      background: #fff8eb;
      border: 1px solid #fde0b2;
      border-radius: 8px;
      padding: 18px;
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .author-avatar {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      background: #e8920a;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: bold;
      flex-shrink: 0;
    }
    .author-info h4 { font-size: 15px; color: #7c2d12; margin-bottom: 4px; }
    .author-info p { font-size: 13px; color: #57534e; line-height: 1.5; }
    footer {
      background: #1f1b16;
      color: #e5e0d8;
      padding: 36px 20px 24px;
      margin-top: 48px;
      text-align: center;
      font-size: 14px;
    }
    .footer-links {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 18px;
      margin-bottom: 16px;
    }
    .footer-links a { color: #f59e0b; text-decoration: none; }
    .footer-links a:hover { text-decoration: underline; }
    .copyright { color: #9ca3af; font-size: 13px; }
  </style>
</head>
<body>
  <header>
    <a href="https://shasnadeshupdates.com/" class="logo">
      <img src="https://shasnadeshupdates.com/logo192.png" alt="Shasnadesh Updates" />
      <span>शासनादेश अपडेट्स</span>
    </a>
    <nav>
      <a href="https://shasnadeshupdates.com/">होम</a>
      <a href="https://shasnadeshupdates.com/about">About Us</a>
      <a href="https://shasnadeshupdates.com/contact">Contact Us</a>
      <a href="https://shasnadeshupdates.com/privacy-policy">Privacy Policy</a>
    </nav>
  </header>

  <main class="container">
    <div class="breadcrumbs">
      <a href="https://shasnadeshupdates.com/">होम</a> &rsaquo;
      <a href="https://shasnadeshupdates.com/?category=${encodeURIComponent(blog.category || '')}">${category}</a> &rsaquo;
      <span>${title}</span>
    </div>

    <article class="article-card">
      <span class="category-badge">${category}</span>
      <h1>${title}</h1>

      <div class="meta-bar">
        <span>✍️ <strong>लेखक:</strong> शासनादेश अपडेट्स संपादकीय टीम</span>
        <span>📅 <strong>दिनांक:</strong> ${formattedDate}</span>
        ${blog.views ? `<span>👁️ <strong>व्यूज:</strong> ${blog.views}</span>` : ''}
      </div>

      ${blog.thumbnail ? `<img src="${imageUrl}" alt="${title}" class="featured-image" />` : ''}

      <div class="article-content">
        ${blog.content || `<p>${description}</p>`}
      </div>

      ${pdfsHtml}
      ${tagsHtml}

      <div class="author-box">
        <div class="author-avatar">श</div>
        <div class="author-info">
          <h4>शासनादेश अपडेट्स संपादकीय टीम (Editorial Team)</h4>
          <p>यह जानकारी भारत सरकार एवं संबंधित राज्य सरकारों द्वारा जारी आधिकारिक अधिसूचनाओं और शासनादेशों के गहन अध्ययन और सत्यापन के बाद तैयार की गई है। हमारा उद्देश्य सरकारी योजनाओं और नियमों को नागरिकों तक सरल और सटीक रूप में पहुँचाना है।</p>
        </div>
      </div>
    </article>
  </main>

  <footer>
    <div class="footer-links">
      <a href="https://shasnadeshupdates.com/">Home</a>
      <a href="https://shasnadeshupdates.com/about">About Us (हमारे बारे में)</a>
      <a href="https://shasnadeshupdates.com/contact">Contact Us (संपर्क करें)</a>
      <a href="https://shasnadeshupdates.com/privacy-policy">Privacy Policy</a>
      <a href="https://shasnadeshupdates.com/terms">Terms & Conditions</a>
      <a href="https://shasnadeshupdates.com/disclaimer">Disclaimer (अस्वीकरण)</a>
    </div>
    <p class="copyright">&copy; ${new Date().getFullYear()} Shasnadesh Updates. All rights reserved.</p>
  </footer>
</body>
</html>`;

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Error in getBlogOgMeta:', error);
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