const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const multer = require('multer')
const {
  createBlog, updateBlog, deleteBlog,
  toggleStatus, toggleFeatured, adminGetBlogs
} = require('../controllers/blogController')
const { uploadFile, getSignedUrl } = require('../controllers/uploadController')
const {
  getOverview, getPopular,
  getDeviceSplit, getDailyVisits
} = require('../controllers/analyticsController')
const { validate, createBlogSchema, updateBlogSchema } = require('../middleware/validationMiddleware')

const upload = multer({ storage: multer.memoryStorage() })

// Blog CRUD
router.get('/blogs', protect, adminGetBlogs)
router.post('/blogs', protect, validate(createBlogSchema), createBlog)
router.put('/blogs/:id', protect, validate(updateBlogSchema), updateBlog)
router.delete('/blogs/:id', protect, deleteBlog)
router.patch('/blogs/:id/status', protect, toggleStatus)
router.patch('/blogs/:id/featured', protect, toggleFeatured)

// Upload
router.post('/upload', protect, upload.single('file'), uploadFile)
router.get('/signed-url', protect, getSignedUrl)

// Analytics
router.get('/analytics/overview', protect, getOverview)
router.get('/analytics/popular', protect, getPopular)
router.get('/analytics/devices', protect, getDeviceSplit)
router.get('/analytics/daily', protect, getDailyVisits)

module.exports = router