const { z } = require('zod')

// Generic validator factory — wraps a Zod schema into Express middleware
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }))
    return res.status(400).json({ message: 'Validation failed', errors })
  }
  req.body = result.data // use the parsed (and coerced) data
  next()
}

// --- Schemas ---

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

const createBlogSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500).optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']).optional(),
  thumbnail: z.string().url('Thumbnail must be a valid URL').optional().or(z.literal('')),
  images: z.array(z.string().url()).optional(),
  pdfs: z.array(z.object({ title: z.string(), url: z.string().url() })).optional(),
  videoUrl: z.string().url('Video URL must be valid').optional().or(z.literal('')),
  links: z.array(z.object({ title: z.string(), url: z.string().url() })).optional()
})

const updateBlogSchema = createBlogSchema.partial() // all fields optional on update

const trackSchema = z.object({
  blogId: z.string().min(1, 'blogId is required'),
  slug: z.string().min(1, 'slug is required'),
  referrer: z.string().optional()
})

module.exports = {
  validate,
  loginSchema,
  createBlogSchema,
  updateBlogSchema,
  trackSchema
}
