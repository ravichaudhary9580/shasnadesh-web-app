const express = require('express')
const router = express.Router()
const { getBlogs, getBlog, getCategories, getYears, getSuggestions, getBlogOgMeta } = require('../controllers/blogController')

router.get('/', getBlogs)
router.get('/suggestions', getSuggestions)
router.get('/categories/list', getCategories)
router.get('/years/list', getYears)
router.get('/og/:slug', getBlogOgMeta)
router.get('/:slug', getBlog)

module.exports = router