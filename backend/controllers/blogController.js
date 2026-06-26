const Blog = require('../models/Blog')
const Analytics = require('../models/Analytics')
const slugify = require('../utils/slugify')
const { sendNotification } = require('./pushController')

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
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
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

    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    const suggestions = await Blog.find({ status: 'published', title: { $regex: regex } })
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
    const blog = await Blog.findOneAndUpdate(
      { slug: req.params.slug, status: 'published' },
      { $inc: { views: 1 } },
      { returnDocument: 'after' }
    )
    if (!blog) return res.status(404).json({ message: 'Blog not found' })
    res.json(blog)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Admin
exports.createBlog = async (req, res) => {
  try {
    const baseSlug = slugify(req.body.title)

    // Handle slug collisions by appending a counter
    let slug = baseSlug
    let counter = 1
    while (await Blog.exists({ slug })) {
      slug = `${baseSlug}-${counter++}`
    }

    const blog = await Blog.create({ ...req.body, slug })
    
    // Send push notification if blog is published
    if (blog.status === 'published') {
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
      status, thumbnail, images, pdfs, videoUrl, links
    } = req.body

    const allowedUpdates = {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(excerpt !== undefined && { excerpt }),
      ...(category !== undefined && { category }),
      ...(tags !== undefined && { tags }),
      ...(status !== undefined && { status }),
      ...(thumbnail !== undefined && { thumbnail }),
      ...(images !== undefined && { images }),
      ...(pdfs !== undefined && { pdfs }),
      ...(videoUrl !== undefined && { videoUrl }),
      ...(links !== undefined && { links }),
    }

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      allowedUpdates,
      { returnDocument: 'after', runValidators: true }
    )
    if (!blog) return res.status(404).json({ message: 'Blog not found' })
    
    res.json(blog)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id)
    if (!blog) return res.status(404).json({ message: 'Blog not found' })
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
    if (search) query.title = { $regex: search, $options: 'i' }
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

// Get all unique categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Blog.distinct('category', { status: 'published', category: { $ne: null, $ne: '' } })
    res.json(categories.sort())
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}