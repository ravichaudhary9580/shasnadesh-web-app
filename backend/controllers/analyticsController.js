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
      .sort('-views').limit(10).select('title slug views category')
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

exports.getAllTimeVisits = async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    let match = {};
    let format = '%Y-%m'; 
    
    const now = new Date();
    
    if (range === '30days') {
      match = { visitedAt: { $gte: new Date(now.setDate(now.getDate() - 30)) } };
      format = '%Y-%m-%d'; 
    } else if (range === 'thisYear') {
      match = { visitedAt: { $gte: new Date(now.getFullYear(), 0, 1) } };
      format = '%Y-%m'; 
    } else if (range === 'lastYear') {
      match = { 
        visitedAt: { 
          $gte: new Date(now.getFullYear() - 1, 0, 1),
          $lt: new Date(now.getFullYear(), 0, 1)
        } 
      };
      format = '%Y-%m';
    } else if (range === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      match = { visitedAt: { $gte: start, $lte: end } };
      
      const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
      format = diffDays > 60 ? '%Y-%m' : '%Y-%m-%d';
    }

    const pipeline = [];
    if (Object.keys(match).length > 0) pipeline.push({ $match: match });

    pipeline.push(
      {
        $group: {
          _id: { $dateToString: { format, date: '$visitedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    );

    const data = await Analytics.aggregate(pipeline);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getTopCategories = async (req, res) => {
  try {
    const data = await Blog.aggregate([
      { $match: { status: 'published', category: { $ne: null, $ne: '' } } },
      { $group: { _id: '$category', views: { $sum: '$views' } } },
      { $sort: { views: -1 } }
    ])
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getTrafficSources = async (req, res) => {
  try {
    const data = await Analytics.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $or: [{ $eq: ['$referrer', null] }, { $eq: ['$referrer', ''] }] },
              'Direct / Unknown',
              '$referrer'
            ]
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
    res.json(data)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}