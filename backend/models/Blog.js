const mongoose = require('mongoose')

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  excerpt: { type: String },
  category: { type: String },
  tags: [String],
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  thumbnail: { type: String },
  images: [String],
  pdfs: [{ title: String, url: String }],
  videoUrl: { type: String },
  links: [{ title: String, url: String }],
  views: { type: Number, default: 0 },
}, { timestamps: true })

module.exports = mongoose.model('Blog', blogSchema)