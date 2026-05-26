const webPush = require('web-push')
const PushSubscription = require('../models/PushSubscription')

// VAPID keys setup
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
}

webPush.setVapidDetails(
  'mailto:' + (process.env.VAPID_EMAIL || 'admin@shasnadesh.com'),
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

exports.sendNotification = async (title, body, url, image) => {
  try {
    const subscriptions = await PushSubscription.find()
    const payload = JSON.stringify({ title, body, url, image })
    
    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webPush.sendNotification({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth }
        }, payload)
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

    return { sent: results.filter(r => r.status === 'fulfilled').length }
  } catch (error) {
    console.error('Push notification error:', error)
    throw error
  }
}

exports.getVapidPublicKey = (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey })
}
