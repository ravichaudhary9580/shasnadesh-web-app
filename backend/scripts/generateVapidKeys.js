const webPush = require('web-push')

const vapidKeys = webPush.generateVAPIDKeys()

console.log('\n=== VAPID Keys Generated ===\n')
console.log('Add these to your backend .env file:\n')
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`)
console.log(`VAPID_EMAIL=admin@shasnadeshupdates.com`)
console.log('\n============================\n')
