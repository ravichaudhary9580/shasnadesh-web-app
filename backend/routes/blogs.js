const express = require('express')
const router = express.Router()
const { getBlogs, getBlog, getCategories } = require('../controllers/blogController')

router.get('/', getBlogs)
router.get('/categories/list', getCategories)
router.get('/:slug', getBlog)

module.exports = router