const Blog = require('../models/Blog')
const Analytics = require('../models/Analytics')
const slugify = require('../utils/slugify')

// Public
exports.getBlogs = async (req, res) => {
  try {
    const {
      search, category, tag, year,
      status = 'published',
      sort = '-createdAt',
      page = 1, limit = 12
    } = req.query

    const query = { status }
    if (search) query.title = { $regex: search, $options: 'i' }
    if (category) query.category = category
    if (tag) query.tags = tag
    
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

exports.getBlog = async (req, res) => {
  try {
    const blog = await Blog.findOneAndUpdate(
      { slug: req.params.slug, status: 'published' },
      { $inc: { views: 1 } },
      { new: true }
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
      { new: true, runValidators: true } // runValidators ensures schema rules apply on update
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
    blog.status = blog.status === 'published' ? 'draft' : 'published'
    await blog.save()
    res.json(blog)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Admin - get all including drafts
exports.adminGetBlogs = async (req, res) => {
  try {
    const { search, status, sort = '-createdAt', page = 1, limit = 20 } = req.query
    const query = {}
    if (search) query.title = { $regex: search, $options: 'i' }
    if (status) query.status = status
    const total = await Blog.countDocuments(query)
    const blogs = await Blog.find(query).sort(sort)
      .skip((page - 1) * limit).limit(Number(limit))
    res.json({ blogs, total })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}