import { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { requestNotificationPermission, subscribeToPush, unsubscribeFromPush, checkSubscriptionStatus } from '../services/pushNotification'

const NotificationSettings = () => {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [permission, setPermission] = useState('default')

  useEffect(() => {
    const checkStatus = async () => {
      const subscribed = await checkSubscriptionStatus()
      setIsSubscribed(subscribed)
      setPermission(Notification.permission)
      setIsLoading(false)
    }
    checkStatus()
  }, [])

  const handleToggle = async () => {
    setIsLoading(true)
    
    if (isSubscribed) {
      // Unsubscribe
      const success = await unsubscribeFromPush()
      if (success) {
        setIsSubscribed(false)
      }
    } else {
      // Subscribe
      const granted = await requestNotificationPermission()
      if (granted) {
        const subscribed = await subscribeToPush()
        setIsSubscribed(subscribed)
        setPermission('granted')
      } else {
        setPermission('denied')
      }
    }
    
    setIsLoading(false)
  }

  return (
    <div className="bg-white rounded-lg border border-ink-200 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isSubscribed ? 'bg-green-100' : 'bg-ink-100'
          }`}>
            {isSubscribed ? (
              <Bell size={20} className="text-green-600" />
            ) : (
              <BellOff size={20} className="text-ink-400" />
            )}
          </div>
          <div>
            <h3 className="font-ui font-semibold text-ink-900 mb-1">
              ब्लॉग सूचनाएं
            </h3>
            <p className="text-sm text-ink-600 mb-2">
              {isSubscribed 
                ? 'आप नए ब्लॉग की सूचनाएं प्राप्त कर रहे हैं'
                : 'नए ब्लॉग की सूचनाएं प्राप्त करने के लिए सक्षम करें'
              }
            </p>
            {permission === 'denied' && (
              <p className="text-xs text-crimson-600 bg-crimson-50 px-2 py-1 rounded">
                सूचनाएं ब्लॉक हैं। कृपया ब्राउज़र सेटिंग्स में अनुमति दें।
              </p>
            )}
          </div>
        </div>
        
        <button
          onClick={handleToggle}
          disabled={isLoading || permission === 'denied'}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isSubscribed ? 'bg-green-500' : 'bg-ink-300'
          } ${isLoading || permission === 'denied' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isSubscribed ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  )
}

export default NotificationSettings
