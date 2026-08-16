const { z } = require('zod')

// Generic validator factory — wraps a Zod schema into Express middleware
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }))
    const errorDetails = errors.map(e => `${e.field ? e.field + ': ' : ''}${e.message}`).join(', ')
    console.error(`[Validation Failed] on ${req.method} ${req.originalUrl || req.url}:`, errors)
    return res.status(400).json({ 
      message: `Validation failed: ${errorDetails}`, 
      errors 
    })
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
  title: z.string({ required_error: 'Title is required' }).min(1, 'Title is required'),
  content: z.string({ required_error: 'Content is required' }).min(1, 'Content is required'),
  excerpt: z.string().optional().nullable().or(z.literal('')),
  category: z.string().optional().nullable().or(z.literal('')),
  tags: z.array(z.string()).optional().nullable(),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  featured: z.boolean().optional().nullable(),
  thumbnail: z.string().optional().nullable().or(z.literal('')),
  images: z.array(z.string()).optional().nullable(),
  pdfs: z.array(
    z.object({
      title: z.string().optional().nullable().or(z.literal('')),
      url: z.string().optional().nullable().or(z.literal(''))
    }).passthrough()
  ).optional().nullable(),
  videoUrl: z.string().optional().nullable().or(z.literal('')),
  links: z.array(
    z.object({
      title: z.string().optional().nullable().or(z.literal('')),
      url: z.string().optional().nullable().or(z.literal(''))
    }).passthrough()
  ).optional().nullable(),
  watermark: z.object({
    enabled: z.boolean().optional().nullable(),
    type: z.string().optional().nullable(),
    text: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable().or(z.literal('')),
    opacity: z.union([z.number(), z.string()]).optional().nullable().transform(val => {
      if (val === '' || val === null || val === undefined) return 0.12;
      const num = Number(val);
      return isNaN(num) ? 0.12 : num;
    }),
    pattern: z.string().optional().nullable()
  }).passthrough().optional().nullable()
}).passthrough()

const updateBlogSchema = createBlogSchema.partial() // all fields optional on update

const trackSchema = z.object({
  blogId: z.string().min(1, 'blogId is required'),
  slug: z.string().min(1, 'slug is required'),
  referrer: z.string().optional().nullable()
}).passthrough()

module.exports = {
  validate,
  loginSchema,
  createBlogSchema,
  updateBlogSchema,
  trackSchema
}

