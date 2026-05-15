const express = require('express')
const router = express.Router()
const { track } = require('../controllers/analyticsController')
const { trackLimiter } = require('../middleware/rateLimitMiddleware')
const { validate, trackSchema } = require('../middleware/validationMiddleware')

router.post('/track', trackLimiter, validate(trackSchema), track)

module.exports = router