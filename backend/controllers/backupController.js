const Blog = require('../models/Blog');
const Analytics = require('../models/Analytics');
const PushSubscription = require('../models/PushSubscription');
const JSZip = require('jszip');

// Helper to extract S3 & external resource URLs from HTML content
function extractUrlsFromHtml(html = '') {
  const urls = [];
  const regex = /(?:src|href)=["']([^"']+)["']/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const url = match[1];
    if (url && (url.includes('s3') || url.includes('amazonaws.com') || url.startsWith('http'))) {
      urls.push(url);
    }
  }
  return urls;
}

exports.exportBackup = async (req, res) => {
  try {
    const { startDate, endDate, category, status = 'all', resourceType = 'all', format = 'json' } = req.query;

    const query = {};

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    const blogs = await Blog.find(query).sort({ createdAt: -1 }).lean();

    // Fetch collection data for full database backup
    let analyticsData = [];
    let pushSubscriptionsData = [];
    try {
      analyticsData = await Analytics.find().lean();
    } catch (e) {
      console.warn('Analytics backup fetch warning:', e.message);
    }
    try {
      pushSubscriptionsData = await PushSubscription.find().select('-keys').lean();
    } catch (e) {
      console.warn('PushSubscription backup fetch warning:', e.message);
    }

    // Extract all S3 resources
    const s3ResourcesSet = new Map();

    blogs.forEach((blog) => {
      // 1. Thumbnail
      if (blog.thumbnail) {
        s3ResourcesSet.set(blog.thumbnail, {
          url: blog.thumbnail,
          type: 'thumbnail',
          blogId: blog._id,
          blogTitle: blog.title,
          slug: blog.slug,
        });
      }

      // 2. Images array
      if (Array.isArray(blog.images)) {
        blog.images.forEach((imgUrl) => {
          if (imgUrl) {
            s3ResourcesSet.set(imgUrl, {
              url: imgUrl,
              type: 'image',
              blogId: blog._id,
              blogTitle: blog.title,
              slug: blog.slug,
            });
          }
        });
      }

      // 3. PDFs array
      if (Array.isArray(blog.pdfs)) {
        blog.pdfs.forEach((pdf) => {
          const pdfUrl = typeof pdf === 'string' ? pdf : pdf.url;
          if (pdfUrl) {
            s3ResourcesSet.set(pdfUrl, {
              url: pdfUrl,
              type: 'pdf',
              title: typeof pdf === 'object' ? pdf.title : undefined,
              blogId: blog._id,
              blogTitle: blog.title,
              slug: blog.slug,
            });
          }
        });
      }

      // 4. HTML embedded media (images, videos, attachments)
      if (blog.content) {
        const embeddedUrls = extractUrlsFromHtml(blog.content);
        embeddedUrls.forEach((u) => {
          if (!s3ResourcesSet.has(u)) {
            s3ResourcesSet.set(u, {
              url: u,
              type: 'embedded',
              blogId: blog._id,
              blogTitle: blog.title,
              slug: blog.slug,
            });
          }
        });
      }
    });

    const allResources = Array.from(s3ResourcesSet.values());
    
    let s3Resources = allResources.filter(item => item.url.includes('amazonaws.com') || item.url.includes('cloudfront.net'));
    let externalResources = allResources.filter(item => !item.url.includes('amazonaws.com') && !item.url.includes('cloudfront.net'));

    // Filter by resourceType if specified
    if (resourceType && resourceType !== 'all') {
      s3Resources = s3Resources.filter((item) => item.type === resourceType);
      externalResources = externalResources.filter((item) => item.type === resourceType);
    }

    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      filtersApplied: {
        startDate: startDate || 'All Time',
        endDate: endDate || 'All Time',
        category: category || 'All Categories',
        status: status || 'All Statuses',
        resourceType: resourceType || 'All Resources',
      },
      summary: {
        totalBlogs: blogs.length,
        totalS3Resources: s3Resources.length,
        totalExternalResources: externalResources.length,
        totalAnalyticsRecords: analyticsData.length,
        totalPushSubscriptions: pushSubscriptionsData.length,
      },
      collections: {
        blogs,
        analytics: analyticsData,
        pushSubscriptions: pushSubscriptionsData,
      },
      s3Resources,
      externalResources,
    };

    if (format === 'preview') {
      return res.json(backupData);
    }

    const filename = `shasnadesh-backup-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(JSON.stringify(backupData, null, 2));
  } catch (error) {
    console.error('Backup Export Error:', error);
    res.status(500).json({ message: 'Backup export failed: ' + error.message });
  }
};

// Server-side S3 Media ZIP Exporter (bypasses browser CORS completely)
exports.exportS3MediaZip = async (req, res) => {
  try {
    const { startDate, endDate, category, status = 'all', resourceType = 'pdf' } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }
    if (category && category !== 'all') query.category = category;
    if (status && status !== 'all') query.status = status;

    const blogs = await Blog.find(query).sort({ createdAt: -1 }).lean();

    const s3ResourcesSet = new Map();

    blogs.forEach((blog) => {
      if (blog.thumbnail) {
        s3ResourcesSet.set(blog.thumbnail, {
          url: blog.thumbnail,
          type: 'thumbnail',
          blogTitle: blog.title,
        });
      }
      if (Array.isArray(blog.images)) {
        blog.images.forEach((imgUrl) => {
          if (imgUrl) {
            s3ResourcesSet.set(imgUrl, {
              url: imgUrl,
              type: 'image',
              blogTitle: blog.title,
            });
          }
        });
      }
      if (Array.isArray(blog.pdfs)) {
        blog.pdfs.forEach((pdf) => {
          const pdfUrl = typeof pdf === 'string' ? pdf : pdf.url;
          if (pdfUrl) {
            s3ResourcesSet.set(pdfUrl, {
              url: pdfUrl,
              type: 'pdf',
              blogTitle: blog.title,
            });
          }
        });
      }
      if (blog.content) {
        const embeddedUrls = extractUrlsFromHtml(blog.content);
        embeddedUrls.forEach((u) => {
          if (!s3ResourcesSet.has(u)) {
            s3ResourcesSet.set(u, {
              url: u,
              type: 'embedded',
              blogTitle: blog.title,
            });
          }
        });
      }
    });

    let s3List = Array.from(s3ResourcesSet.values());

    if (resourceType === 'pdf') {
      s3List = s3List.filter((item) => item.type === 'pdf');
    } else if (resourceType === 'image') {
      s3List = s3List.filter((item) => item.type === 'image' || item.type === 'thumbnail');
    }

    if (!s3List.length) {
      return res.status(404).json({ message: `No ${resourceType} media files found for selected filters.` });
    }

    const zip = new JSZip();
    const folderName = resourceType === 'pdf' ? 'pdf_documents' : resourceType === 'image' ? 'images_and_thumbnails' : 's3_media';
    const folder = zip.folder(folderName);

    folder.file('s3_manifest.json', JSON.stringify(s3List, null, 2));
    folder.file('s3_urls.txt', s3List.map((item) => item.url).join('\n'));

    // Server-side fetch for binary S3 objects
    await Promise.all(
      s3List.map(async (item, idx) => {
        try {
          const fileRes = await fetch(item.url);
          if (fileRes.ok) {
            const arrayBuffer = await fileRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const ext = item.url.split('.').pop().split('?')[0] || (resourceType === 'pdf' ? 'pdf' : 'jpg');
            const cleanTitle = (item.blogTitle || `file-${idx + 1}`)
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '-')
              .replace(/-+/g, '-')
              .slice(0, 40);
            const fileName = `${String(idx + 1).padStart(3, '0')}_${cleanTitle}.${ext}`;
            folder.file(fileName, buffer);
          }
        } catch (fetchErr) {
          console.warn(`Server side fetch failed for S3 URL ${item.url}:`, fetchErr.message);
        }
      })
    );

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    const filename = `shasnadesh-${folderName}-${new Date().toISOString().slice(0, 10)}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(zipBuffer);
  } catch (error) {
    console.error('S3 Media ZIP Export Error:', error);
    res.status(500).json({ message: 'Failed to generate S3 media ZIP: ' + error.message });
  }
};
