const express = require('express')
const router = express.Router()
const { subscribe, unsubscribe, getVapidPublicKey } = require('../controllers/pushController')

router.post('/subscribe', subscribe)
router.post('/unsubscribe', unsubscribe)
router.get('/vapid-public-key', getVapidPublicKey)

module.exports = router
