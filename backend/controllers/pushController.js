const webPush = require('web-push')
const PushSubscription = require('../models/PushSubscription')
const NotificationLog = require('../models/NotificationLog')

// VAPID keys setup
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
}

webPush.setVapidDetails(
  'mailto:' + (process.env.VAPID_EMAIL || 'admin@shasnadeshupdates.com'),
  vapidKeys.publicKey,
  vapidKeys.privateKey
)

exports.subscribe = async (req, res) => {
  try {
    const { endpoint, keys } = req.body
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { endpoint, keys },
      { upsert: true, new: true }
    )
    res.status(201).json({ message: 'Subscribed successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body
    await PushSubscription.deleteOne({ endpoint })
    res.json({ message: 'Unsubscribed successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.sendNotification = async (title, body, url, image, tag) => {
  try {
    // Check last notification time (prevent spam)
    const lastNotification = await NotificationLog.findOne().sort({ sentAt: -1 })
    if (lastNotification) {
      const timeDiff = Date.now() - lastNotification.sentAt.getTime()
      const minInterval = 3600000 // 1 hour minimum
      if (timeDiff < minInterval) {
        throw new Error(`Please wait ${Math.ceil((minInterval - timeDiff) / 60000)} minutes before sending next notification`)
      }
    }

    const subscriptions = await PushSubscription.find()
    const payload = JSON.stringify({ 
      title, 
      body, 
      url, 
      image,
      tag: tag || `notification-${Date.now()}`,
      timestamp: Date.now()
    })
    
    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webPush.sendNotification({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth }
        }, payload, {
          urgency: 'normal',
          TTL: 86400 // 24 hours
        })
      )
    )

    // Remove invalid subscriptions
    const invalidSubs = []
    results.forEach((result, index) => {
      if (result.status === 'rejected' && (result.reason.statusCode === 410 || result.reason.statusCode === 404)) {
        invalidSubs.push(subscriptions[index]._id)
      }
    })
    
    if (invalidSubs.length > 0) {
      await PushSubscription.deleteMany({ _id: { $in: invalidSubs } })
    }

    // Log notification
    await NotificationLog.create({ type: 'push', sentAt: new Date() })

    return { sent: results.filter(r => r.status === 'fulfilled').length }
  } catch (error) {
    console.error('Push notification error:', error)
    throw error
  }
}

exports.getVapidPublicKey = (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey })
}
