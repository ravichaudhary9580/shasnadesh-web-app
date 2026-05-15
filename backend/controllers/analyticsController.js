const Analytics = require('../models/Analytics')
const Blog = require('../models/Blog')

exports.track = async (req, res) => {
  try {
    const { blogId, slug, referrer } = req.body

    if (!blogId || !slug) {
      return res.status(400).json({ message: 'blogId and slug are required' })
    }

    const userAgent = req.headers['user-agent'] || ''
    const device = /mobile/i.test(userAgent) ? 'mobile' : 'desktop'

    // x-forwarded-for can be a comma-separated list; take the first (real) IP
    const forwarded = req.headers['x-forwarded-for']
    const visitorIp = forwarded ? forwarded.split(',')[0].trim() : req.ip

    await Analytics.create({ blogId, slug, visitorIp, userAgent, device, referrer })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getOverview = async (req, res) => {
  try {
    const totalVisits = await Analytics.countDocuments()
    const totalBlogs = await Blog.countDocuments()
    const published = await Blog.countDocuments({ status: 'published' })
    const totalViews = await Blog.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } }
    ])
    res.json({
      totalVisits,
      totalBlogs,
      published,
      totalViews: totalViews[0]?.total || 0
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getPopular = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'published' })
      .sort('-views').limit(5).select('title slug views')
    res.json(blogs)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getDeviceSplit = async (req, res) => {
  try {
    const data = await Analytics.aggregate([
      { $group: { _id: '$device', count: { $sum: 1 } } }
    ])
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getDailyVisits = async (req, res) => {
  try {
    const data = await Analytics.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$visitedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ])
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}