const jwt = require('jsonwebtoken')
const Admin = require('../models/Admin')

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  })
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const admin = await Admin.findOne({ email })
    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    res.json({
      token: generateToken(admin._id),
      admin: { id: admin._id, name: admin.name, email: admin.email }
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.getMe = async (req, res) => {
  res.json(req.admin)
}