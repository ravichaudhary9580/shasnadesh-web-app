const mongoose = require('mongoose')

const analyticsSchema = new mongoose.Schema({
  blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog' },
  slug: String,
  visitorIp: String,
  userAgent: String,
  device: String,
  referrer: String,
  visitedAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Analytics', analyticsSchema)