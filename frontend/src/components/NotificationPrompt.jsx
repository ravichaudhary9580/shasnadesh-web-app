import { useEffect } from 'react'
import { requestNotificationPermission, subscribeToPush, checkSubscriptionStatus } from '../services/pushNotification'

const NotificationPrompt = () => {
  useEffect(() => {
    const autoEnableNotifications = async () => {
      // Check if in standalone mode (PWA installed or Play Store)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          window.navigator.standalone || 
                          document.referrer.includes('android-app://')

      if (!isStandalone) return

      // Check if already subscribed
      const subscribed = await checkSubscriptionStatus()
      if (subscribed) return

      // Check if already attempted
      const attempted = localStorage.getItem('notificationAutoAttempted')
      if (attempted) return

      // Auto-request notification permission after 2 seconds
      setTimeout(async () => {
        const granted = await requestNotificationPermission()
        if (granted) {
          await subscribeToPush()
        }
        // Mark as attempted so we don't ask again
        localStorage.setItem('notificationAutoAttempted', 'true')
      }, 2000)
    }

    autoEnableNotifications()
  }, [])

  // This component doesn't render anything - it works silently
  return null
}

export default NotificationPrompt
