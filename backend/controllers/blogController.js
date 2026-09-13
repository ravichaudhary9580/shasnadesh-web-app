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
        'नया पोस्ट',
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

// Asset cache for dynamic frontend css and js hashes
let cachedFrontendAssets = {
  css: '/static/css/main.12661ceb.css',
  js: '/static/js/main.8fa330d6.js',
  lastFetched: 0
};

async function getFrontendAssets() {
  const now = Date.now();
  if (now - cachedFrontendAssets.lastFetched < 5 * 60 * 1000) {
    return cachedFrontendAssets;
  }
  try {
    const res = await fetch('https://shasnadeshupdates.com/asset-manifest.json', { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.files) {
        if (data.files['main.css']) cachedFrontendAssets.css = data.files['main.css'];
        if (data.files['main.js']) cachedFrontendAssets.js = data.files['main.js'];
        cachedFrontendAssets.lastFetched = now;
      }
    }
  } catch (e) {}
  return cachedFrontendAssets;
}

// Full Server-Side Rendered (SSR) HTML matching the exact React BlogDetail design
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

    // Increment views for real human visitors (skip search bots & crawlers)
    const ua = (req.headers['user-agent'] || '').toLowerCase();
    const isBot = /bot|crawler|spider|google|bing|facebook|whatsapp|preview|lighthouse|curl|wget/i.test(ua);
    if (!isBot) {
      Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } }).catch(() => {});
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

    // Extract headings for Table of Contents and inject IDs into content
    let contentWithHeadingIds = blog.content || `<p>${description}</p>`;
    const headings = [];
    let headingIdx = 0;
    contentWithHeadingIds = contentWithHeadingIds.replace(/<h([2-4])([^>]*)>(.*?)<\/h\1>/gi, (match, level, attrs, text) => {
      const cleanText = text.replace(/<[^>]+>/g, '').trim();
      const id = `heading-${headingIdx++}`;
      headings.push({ level: parseInt(level), text: cleanText, id });
      return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
    });

    // Fetch related blogs in the same category
    let relatedBlogs = [];
    try {
      if (blog.category) {
        relatedBlogs = await Blog.find({
          category: blog.category,
          _id: { $ne: blog._id },
          status: 'published'
        })
        .select('title slug thumbnail createdAt category excerpt views')
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();
      }
    } catch (e) {
      console.error('Error fetching related for SSR:', e);
    }

    const assets = await getFrontendAssets();
    const isHindi = blog.category === 'hindi' || /[\u0900-\u097F]/.test(title);

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
  <title>${title} | Shasnadesh Updates</title>
  <meta name="description" content="${description}">
  <meta name="author" content="Shasnadesh Updates">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta name="googlebot" content="index, follow">
  <link rel="canonical" href="${siteUrl}">
  <meta name="theme-color" content="#e8920a">

  <link rel="icon" type="image/png" sizes="192x192" href="https://shasnadeshupdates.com/logo192.png" />
  <link rel="icon" type="image/png" sizes="512x512" href="https://shasnadeshupdates.com/logo512.png" />
  <link rel="shortcut icon" href="https://shasnadeshupdates.com/logo192.png" />

  <!-- Google AdSense -->
  <meta name="google-adsense-account" content="ca-pub-8129172226402333">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8129172226402333" crossorigin="anonymous"></script>

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${siteUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="Shasnadesh Updates">
  <meta property="og:locale" content="hi_IN">
  <meta property="article:published_time" content="${publishedISO}">
  <meta property="article:modified_time" content="${modifiedISO}">
  <meta property="article:section" content="${category}">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${siteUrl}">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">

  <!-- Structured Data JSON-LD -->
  <script type="application/ld+json">${jsonLdArticle}</script>
  <script type="application/ld+json">${jsonLdBreadcrumbs}</script>

  <!-- Preconnect & Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,600;1,400&family=Tiro+Devanagari+Hindi&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" />

  <!-- Production Tailwind Stylesheet from Frontend -->
  <link rel="stylesheet" href="https://shasnadeshupdates.com${assets.css}" />

  <style>
    /* Inline CSS Design Tokens matching index.css exactly */
    :root {
      --ink-50: #faf8f5;
      --ink-100: #f2ede4;
      --ink-200: #e2dcd5;
      --ink-300: #c8b99a;
      --ink-400: #a89070;
      --ink-500: #7a6850;
      --ink-600: #574432;
      --ink-700: #423223;
      --ink-800: #33261a;
      --ink-900: #26201a;
      --ink-950: #14100c;
      --saffron-50: #fff8eb;
      --saffron-100: #feecc8;
      --saffron-500: #e8920a;
      --saffron-600: #c87600;
      --saffron-700: #a05900;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--ink-50);
      color: var(--ink-900);
      font-family: 'Lora', Georgia, serif;
      line-height: 1.7;
      -webkit-font-smoothing: antialiased;
    }
    .font-display { font-family: 'Playfair Display', Georgia, serif; }
    .font-hindi { font-family: 'Noto Sans Devanagari', 'Tiro Devanagari Hindi', 'Poppins', sans-serif !important; }
    .font-body { font-family: 'Lora', Georgia, serif; }
    .font-ui { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 500;
      font-family: 'DM Sans', sans-serif;
    }
    .btn-ghost {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 8px;
      font-weight: 500;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 18px;
      background: var(--saffron-500);
      color: #fff;
      border-radius: 8px;
      font-weight: 500;
      font-family: 'DM Sans', sans-serif;
      text-decoration: none;
      transition: all 0.2s;
    }
    .card {
      background: #fff;
      border-radius: 16px;
      border: 1px solid var(--ink-100);
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .prose-blog {
      font-family: 'Lora', Georgia, serif;
      color: #37302a;
      line-height: 1.85;
      font-size: 1.0625rem;
    }
    .prose-blog h1, .prose-blog h2, .prose-blog h3, .prose-blog h4 {
      font-family: 'Playfair Display', Georgia, serif;
      color: var(--ink-900);
      font-weight: 700;
      line-height: 1.35;
    }
    .prose-blog h1 { font-size: 2rem; margin: 2rem 0 1rem; }
    .prose-blog h2 { font-size: 1.625rem; margin: 1.75rem 0 0.75rem; }
    .prose-blog h3 { font-size: 1.375rem; margin: 1.5rem 0 0.5rem; }
    .prose-blog h4 { font-size: 1.15rem; margin: 1.25rem 0 0.5rem; }
    .prose-blog p { margin-bottom: 1.25rem; }
    .prose-blog ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.25rem; }
    .prose-blog ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1.25rem; }
    .prose-blog li { margin-bottom: 0.35rem; }
    .prose-blog a { color: var(--saffron-600); text-decoration: underline; text-underline-offset: 3px; }
    .prose-blog blockquote {
      border-left: 4px solid var(--saffron-500);
      padding-left: 1rem;
      font-style: italic;
      color: var(--ink-600);
      margin: 1.5rem 0;
    }
    .prose-blog img {
      border-radius: 12px;
      margin: 1.5rem 0;
      width: 100%;
      object-fit: cover;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .prose-blog table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      font-size: 0.9375rem;
    }
    .prose-blog th, .prose-blog td {
      border: 1px solid var(--ink-200);
      padding: 10px 14px;
      text-align: left;
    }
    .prose-blog th { background: #faf5ed; font-weight: 600; color: var(--ink-900); }
  </style>
</head>
<body>
  <div id="root">
    <div class="min-h-screen bg-ink-50">
      
      <!-- Navbar (Fixed Header matching React Navbar exactly) -->
      <header class="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-ink-100" style="position:fixed;top:0;left:0;right:0;z-index:40;background:rgba(255,255,255,0.95);backdrop-filter:blur(8px);border-bottom:1px solid #f2ede4;">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3" style="max-width:1280px;margin:0 auto;padding:0 16px;height:60px;display:flex;align-items:center;justify-content:space-between;">
          <a href="https://shasnadeshupdates.com/" class="flex items-center gap-2.5 group" style="display:flex;align-items:center;gap:10px;text-decoration:none;">
            <img src="https://shasnadeshupdates.com/logo192.png" alt="Shasnadesh Updates Logo" style="width:36px;height:36px;border-radius:10px;object-fit:contain;" />
            <div style="display:flex;flex-direction:column;">
              <span class="font-display font-bold text-base sm:text-lg text-ink-900" style="font-size:18px;font-weight:700;color:#26201a;line-height:1.2;">शासनादेश अपडेट्स</span>
              <span class="font-hindi" style="font-size:10px;color:#a89070;line-height:1;">shasnadeshupdates.com</span>
            </div>
          </a>
          <nav class="hidden md:flex items-center gap-1" style="display:flex;align-items:center;gap:8px;">
            <a href="https://shasnadeshupdates.com/" class="px-3 py-1.5 rounded-lg text-sm font-ui font-medium text-ink-700 hover:text-saffron-600 transition-colors" style="padding:6px 12px;border-radius:8px;font-size:14px;color:#423223;text-decoration:none;font-weight:500;">होम</a>
            <a href="https://shasnadeshupdates.com/?category=उत्तर प्रदेश शासनादेश" class="px-3 py-1.5 rounded-lg text-sm font-ui font-medium text-ink-700 hover:text-saffron-600 transition-colors" style="padding:6px 12px;border-radius:8px;font-size:14px;color:#423223;text-decoration:none;font-weight:500;">उत्तर प्रदेश शासनादेश</a>
            <a href="https://shasnadeshupdates.com/?category=वैकेंसी अलर्ट" class="px-3 py-1.5 rounded-lg text-sm font-ui font-medium text-ink-700 hover:text-saffron-600 transition-colors" style="padding:6px 12px;border-radius:8px;font-size:14px;color:#423223;text-decoration:none;font-weight:500;">वैकेंसी अलर्ट</a>
            <a href="https://shasnadeshupdates.com/?category=शिक्षा विभाग" class="px-3 py-1.5 rounded-lg text-sm font-ui font-medium text-ink-700 hover:text-saffron-600 transition-colors" style="padding:6px 12px;border-radius:8px;font-size:14px;color:#423223;text-decoration:none;font-weight:500;">शिक्षा विभाग</a>
            <a href="https://shasnadeshupdates.com/about" class="px-3 py-1.5 rounded-lg text-sm font-ui font-medium text-ink-700 hover:text-saffron-600 transition-colors" style="padding:6px 12px;border-radius:8px;font-size:14px;color:#423223;text-decoration:none;font-weight:500;">About Us</a>
          </nav>
        </div>
      </header>

      <!-- Thumbnail Hero Section (Exact matching BlogDetail.jsx) -->
      <div style="padding-top:60px;">
        ${blog.thumbnail ? `
          <div class="relative w-full overflow-hidden bg-ink-950 flex justify-center items-center" style="position:relative;width:100%;height:48vh;max-height:600px;overflow:hidden;background:#14100c;display:flex;justify-content:center;align-items:center;">
            <!-- Blurred background -->
            <div
              class="absolute inset-0 bg-cover bg-center opacity-40 blur-2xl scale-110"
              style="position:absolute;inset:0;background-image:url('${imageUrl}');background-size:cover;background-position:center;opacity:0.4;filter:blur(36px);transform:scale(1.1);"
            ></div>
            <!-- Foreground image -->
            <img
              src="${imageUrl}"
              alt="${title}"
              class="relative z-10 w-full h-full object-contain drop-shadow-2xl"
              style="position:relative;z-index:10;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 25px 25px rgba(0,0,0,0.5));"
            />
          </div>
        ` : ''}
      </div>

      <!-- Main Container (Exact matching BlogDetail.jsx) -->
      <main class="max-w-3xl mx-auto px-4 sm:px-6 py-10 relative" style="max-width:820px;margin:0 auto;padding:36px 20px;">
        <div class="space-y-8">
          
          <!-- Breadcrumbs -->
          <nav class="flex items-center gap-2 text-sm font-ui text-ink-400" style="display:flex;align-items:center;gap:8px;font-size:14px;color:#a89070;margin-bottom:20px;">
            <a href="https://shasnadeshupdates.com/" style="color:#a89070;text-decoration:none;">Home</a>
            <span>/</span>
            ${blog.category ? `
              <a href="https://shasnadeshupdates.com/?category=${encodeURIComponent(blog.category)}" style="color:#a89070;text-decoration:none;text-transform:capitalize;">${category}</a>
              <span>/</span>
            ` : ''}
            <span class="text-ink-600 truncate" style="color:#574432;max-width:320px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</span>
          </nav>

          <!-- Badges & Title Header -->
          <div style="margin-bottom:24px;">
            <div class="mb-4 flex flex-wrap gap-2" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
              ${blog.category ? `<span class="badge" style="background:#feecc8;color:#a05900;font-weight:600;padding:4px 12px;border-radius:9999px;">${category}</span>` : ''}
              ${Array.isArray(blog.tags) ? blog.tags.map(t => `<span class="badge" style="background:#f2ede4;color:#574432;padding:4px 10px;border-radius:9999px;">#${escapeHtml(t)}</span>`).join(' ') : ''}
            </div>

            <!-- Title -->
            <h1 class="font-display font-bold text-ink-900 leading-tight mb-4 ${isHindi ? 'font-hindi' : ''}" style="font-size:28px;font-weight:800;color:#26201a;line-height:1.35;margin-bottom:16px;">
              ${title}
            </h1>

            ${blog.excerpt ? `
              <p class="text-xl text-ink-500 font-body leading-relaxed ${isHindi ? 'font-hindi' : ''}" style="font-size:18px;color:#7a6850;line-height:1.65;margin-bottom:16px;">
                ${escapeHtml(blog.excerpt)}
              </p>
            ` : ''}
          </div>

          <!-- Meta row -->
          <div class="flex items-center justify-between py-4 border-y border-ink-100 flex-wrap gap-3" style="display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-top:1px solid #f2ede4;border-bottom:1px solid #f2ede4;margin-bottom:24px;">
            <div class="flex items-center gap-3 text-xs sm:text-sm font-ui text-ink-600 flex-wrap" style="display:flex;align-items:center;gap:12px;font-size:13px;color:#574432;">
              <span class="flex items-center gap-1.5 font-medium text-ink-700" style="display:flex;align-items:center;gap:6px;font-weight:600;color:#423223;">
                <span>📅</span> ${formattedDate}
              </span>
              ${blog.views ? `<span>·</span><span>👁 ${Number(blog.views).toLocaleString()} views</span>` : ''}
            </div>
            <button onclick="if(navigator.share){navigator.share({title:document.title,url:window.location.href})}else{navigator.clipboard.writeText(window.location.href);alert('लिंक कॉपी हो गया!')}" class="btn-ghost" style="background:#fff;border:1px solid #e2dcd5;color:#423223;font-size:13px;padding:6px 14px;border-radius:8px;">
              🔗 Share
            </button>
          </div>

          <!-- Table of Contents -->
          ${headings.length > 0 ? `
            <div class="p-5 sm:p-6 bg-white/90 backdrop-blur-xs border border-ink-100 rounded-2xl shadow-sm" style="background:rgba(255,255,255,0.92);border:1px solid #f2ede4;border-radius:16px;padding:24px;margin-bottom:28px;box-shadow:0 1px 4px rgba(0,0,0,0.03);">
              <h3 class="font-display text-lg font-bold text-ink-900 mb-4 flex items-center gap-2" style="font-size:18px;font-weight:700;color:#26201a;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
                <span style="font-size:20px;">📑</span> विषय सूची (Table of Contents)
              </h3>
              <ul class="space-y-3" style="list-style:none;padding:0;">
                ${headings.map(h => `
                  <li style="margin-bottom:10px;padding-left:${h.level === 3 ? '20px' : (h.level === 4 ? '32px' : '0')};">
                    <a href="#${h.id}" class="group flex items-start gap-2.5 text-ink-600 hover:text-saffron-600 font-ui text-sm sm:text-base transition-colors" style="display:flex;align-items:flex-start;gap:8px;color:#574432;text-decoration:none;font-size:14px;">
                      <span style="color:#c8b99a;margin-top:2px;">•</span>
                      <span style="line-height:1.4;">${escapeHtml(h.text)}</span>
                    </a>
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- Article Body -->
          <article class="prose-blog ${isHindi ? 'font-hindi' : ''}">
            ${contentWithHeadingIds}
          </article>

          <!-- Documents / PDFs (Inline Google Viewer + Download) -->
          ${Array.isArray(blog.pdfs) && blog.pdfs.length > 0 ? `
            <div id="documents" class="mt-10 scroll-mt-24" style="margin-top:40px;">
              <div style="text-align:center;margin:24px 0;"><span style="background:#fff;padding:0 12px;font-size:20px;">📄</span></div>
              <h3 class="font-display text-xl font-bold text-ink-900 mb-4" style="font-size:20px;font-weight:700;color:#26201a;margin-bottom:16px;">Documents (शासनादेश पीडीएफ)</h3>
              <div style="display:flex;flex-direction:column;gap:16px;">
                ${blog.pdfs.map(pdf => {
                  const pdfUrl = typeof pdf === 'string' ? pdf : pdf?.url;
                  const pdfTitle = escapeHtml(typeof pdf === 'string' ? 'शासनादेश PDF' : (pdf?.title || 'शासनादेश PDF'));
                  if (!pdfUrl) return '';
                  return `
                  <div style="border:1px solid #e2dcd5;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
                    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#fff;border-bottom:1px solid #f2ede4;">
                      <div style="display:flex;align-items:center;gap:10px;min-width:0;">
                        <span style="font-size:20px;">📑</span>
                        <span class="font-ui font-medium text-sm text-ink-800" style="font-size:14px;font-weight:600;color:#33261a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${pdfTitle}</span>
                      </div>
                      <div style="display:flex;align-items:center;gap:8px;">
                        <a href="${escapeHtml(pdfUrl)}" target="_blank" rel="noopener noreferrer" download class="btn-primary" style="padding:6px 14px;font-size:13px;border-radius:8px;">
                          ⬇ Download PDF
                        </a>
                        <a href="${escapeHtml(pdfUrl)}" target="_blank" rel="noopener noreferrer" style="color:#7a6850;text-decoration:none;font-size:16px;padding:4px 8px;" title="Open directly">
                          ↗
                        </a>
                      </div>
                    </div>
                    <div>
                      <iframe
                        src="https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true"
                        title="${pdfTitle}"
                        style="width:100%;height:65vh;min-height:440px;border:none;"
                        loading="lazy"
                      ></iframe>
                    </div>
                  </div>`;
                }).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Editorial Trust & Fact Check Box -->
          <div class="mt-12 bg-white border border-ink-100 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style="margin-top:40px;background:#fff;border:1px solid #f2ede4;border-radius:16px;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
            <div class="flex items-center gap-3" style="display:flex;align-items:center;gap:12px;">
              <div class="w-10 h-10 rounded-full bg-saffron-500 text-white font-bold flex items-center justify-center text-sm shadow-sm" style="width:40px;height:40px;border-radius:50%;background:#e8920a;color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:14px;">
                SU
              </div>
              <div>
                <h4 class="font-ui font-bold text-sm text-ink-900" style="font-size:14px;font-weight:700;color:#26201a;">
                  Shasnadesh Updates Editorial Team
                </h4>
                <p class="font-hindi text-xs text-ink-500" style="font-size:12px;color:#7a6850;">
                  सत्यापित शासनादेश एवं आधिकारिक सूचना पोर्टल · Verified Information
                </p>
              </div>
            </div>
            <a
              href="https://shasnadeshupdates.com/about"
              class="text-xs font-semibold text-saffron-600 hover:text-saffron-700 underline font-ui"
              style="font-size:12px;font-weight:600;color:#c87600;text-decoration:underline;"
            >
              Editorial Policy & Fact-Checking →
            </a>
          </div>

          <!-- Related Posts (Exact BlogCard styling) -->
          ${Array.isArray(relatedBlogs) && relatedBlogs.length > 0 ? `
            <div class="mt-16 pt-8 border-t border-ink-200" style="margin-top:48px;padding-top:32px;border-top:1px solid #e2dcd5;">
              <div class="flex items-center gap-3 mb-6" style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
                <span style="font-size:24px;">🔥</span>
                <h3 class="font-display text-2xl font-bold text-ink-900" style="font-size:22px;font-weight:700;color:#26201a;">
                  सम्बंधित खबरें (Related Posts)
                </h3>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(230px, 1fr));gap:20px;">
                ${relatedBlogs.map(r => {
                  const rSlug = encodeURIComponent((r.slug || '').trim().replace(/^\/+|\/+$/g, ''));
                  const rTitle = escapeHtml(r.title);
                  const rThumb = r.thumbnail || 'https://shasnadeshupdates.com/logo512.png';
                  const rDate = new Date(r.createdAt || Date.now()).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                  return `
                  <div class="card" style="border-radius:16px;overflow:hidden;background:#fff;border:1px solid #e2dcd5;display:flex;flex-direction:column;">
                    <a href="https://shasnadeshupdates.com/blog/${rSlug}" style="display:block;aspect-ratio:16/9;overflow:hidden;background:#f2ede4;text-decoration:none;">
                      <img src="${escapeHtml(rThumb)}" alt="${rTitle}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" />
                    </a>
                    <div style="padding:16px;display:flex;flex-direction:column;flex:1;">
                      ${r.category ? `<span class="badge" style="align-self:flex-start;background:#feecc8;color:#a05900;font-size:11px;padding:2px 8px;border-radius:6px;margin-bottom:8px;font-weight:600;">${escapeHtml(r.category)}</span>` : ''}
                      <a href="https://shasnadeshupdates.com/blog/${rSlug}" class="font-display font-bold text-base text-ink-900 leading-snug" style="color:#26201a;font-weight:700;font-size:15px;line-height:1.4;text-decoration:none;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                        ${rTitle}
                      </a>
                      <div style="margin-top:auto;padding-top:10px;border-top:1px solid #f2ede4;display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#7a6850;">
                        <span>📅 ${rDate}</span>
                        <span style="color:#e8920a;font-weight:600;">Read →</span>
                      </div>
                    </div>
                  </div>`;
                }).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Back button -->
          <div class="mt-8 pt-6 border-t border-ink-100 flex items-center justify-between" style="margin-top:32px;padding-top:24px;border-top:1px solid #f2ede4;display:flex;align-items:center;justify-content:space-between;">
            <a href="https://shasnadeshupdates.com/" class="btn-ghost text-xs sm:text-sm" style="color:#574432;text-decoration:none;font-size:14px;">
              ← Back to all posts
            </a>
            <a href="https://shasnadeshupdates.com/contact" class="text-xs text-ink-400 hover:text-ink-600 underline" style="font-size:12px;color:#a89070;text-decoration:underline;">
              Report an issue with this post
            </a>
          </div>

        </div>
      </main>

      <!-- Footer (Exact matching React Footer) -->
      <footer class="border-t border-ink-100 py-8" style="border-top:1px solid #f2ede4;padding:36px 0;margin-top:60px;background:#fff;">
        <div class="max-w-3xl mx-auto px-4 sm:px-6" style="max-width:820px;margin:0 auto;padding:0 20px;text-align:center;">
          <div style="display:flex;flex-direction:column;align-items:center;gap:16px;">
            <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:16px;font-size:13px;">
              <a href="https://shasnadeshupdates.com/about" style="color:#7a6850;text-decoration:none;">About Us</a>
              <a href="https://shasnadeshupdates.com/contact" style="color:#7a6850;text-decoration:none;">Contact</a>
              <a href="https://shasnadeshupdates.com/privacy-policy" style="color:#7a6850;text-decoration:none;">Privacy Policy</a>
              <a href="https://shasnadeshupdates.com/terms" style="color:#7a6850;text-decoration:none;">Terms & Conditions</a>
              <a href="https://shasnadeshupdates.com/disclaimer" style="color:#7a6850;text-decoration:none;">Disclaimer</a>
            </div>
            <p style="font-size:12px;color:#a89070;">
              &copy; ${new Date().getFullYear()} Shasnadesh Updates. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

    </div>
  </div>

  <!-- React Client Hydration Script -->
  <script defer="defer" src="https://shasnadeshupdates.com${assets.js}"></script>
</body>
</html>`;

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400');
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