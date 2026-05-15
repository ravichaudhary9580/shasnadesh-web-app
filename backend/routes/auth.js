const express = require('express')
const router = express.Router()
const { login, getMe } = require('../controllers/authController')
const { protect } = require('../middleware/authMiddleware')
const { authLimiter } = require('../middleware/rateLimitMiddleware')
const { validate, loginSchema } = require('../middleware/validationMiddleware')

router.post('/login', authLimiter, validate(loginSchema), login)
router.get('/me', protect, getMe)

module.exports = router