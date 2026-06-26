const mongoose = require('mongoose')

const notificationLogSchema = new mongoose.Schema({
  type: { type: String, required: true },
  sentAt: { type: Date, default: Date.now, expires: 86400 }
})

module.exports = mongoose.model('NotificationLog', notificationLogSchema)
