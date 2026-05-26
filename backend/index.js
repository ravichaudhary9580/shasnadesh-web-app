require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const connectDB = require('./config/db')
const { apiLimiter } = require('./middleware/rateLimitMiddleware')

connectDB()

const app = express()

app.use(cors())
app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(morgan('dev'))
app.use(express.json())

// Global rate limit — applies to all routes
app.use(apiLimiter)

app.use('/api/auth', require('./routes/auth'))
app.use('/api/blogs', require('./routes/blogs'))
app.use('/api/admin', require('./routes/admin'))
app.use('/api/analytics', require('./routes/analytics'))
app.use('/api/sitemap', require('./routes/sitemap'))
app.use('/api/push', require('./routes/push'))

app.get('/', (req, res) => res.json({ message: 'Shasnadesh API running' }))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

module.exports = app