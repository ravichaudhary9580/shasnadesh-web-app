const express = require('express')
const router = express.Router()
const { getBlogs, getBlog } = require('../controllers/blogController')

router.get('/', getBlogs)
router.get('/:slug', getBlog)

module.exports = router