const rateLimit = require('express-rate-limit')

// Strict limiter for auth routes — prevents brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
})

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
})

// Analytics track limiter — prevent spam tracking
const trackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { message: 'Too many track requests.' },
  standardHeaders: true,
  legacyHeaders: false
})

module.exports = { authLimiter, apiLimiter, trackLimiter }
