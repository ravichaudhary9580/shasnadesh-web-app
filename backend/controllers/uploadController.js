const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { v4: uuidv4 } = require('uuid')
const path = require('path')

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })

    const ext = path.extname(req.file.originalname)
    const key = `uploads/${uuidv4()}${ext}`

    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    }))

    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    res.json({ url, key })
  } catch (error) {
    console.error('Upload error:', error.message)
    res.status(500).json({ message: error.message })
  }
}

exports.getSignedUrl = async (req, res) => {
  try {
    const { key } = req.query
    if (!key) return res.status(400).json({ message: 'Key is required' })
    
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
    const { GetObjectCommand } = require('@aws-sdk/client-s3')
    
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    })
    
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 })
    res.json({ url: signedUrl })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.proxyImage = async (req, res) => {
  try {
    const key = req.params.key
    if (!key) return res.status(400).json({ message: 'Key is required' })
    
    const { GetObjectCommand } = require('@aws-sdk/client-s3')
    const { Readable } = require('stream')
    
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    })
    
    const response = await s3.send(command)
    
    res.setHeader('Content-Type', response.ContentType || 'application/octet-stream')
    res.setHeader('Cache-Control', 'public, max-age=31536000')
    
    const stream = response.Body
    if (stream instanceof Readable) {
      stream.pipe(res)
    } else {
      const chunks = []
      for await (const chunk of stream) chunks.push(chunk)
      res.send(Buffer.concat(chunks))
    }
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).json({ message: error.message })
  }
}