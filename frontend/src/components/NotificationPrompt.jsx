import React, { useState, useEffect } from 'react';
import { Bell, BellRing, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  requestNotificationPermission,
  subscribeToPush,
  checkSubscriptionStatus
} from '../services/pushNotification';

const NotificationPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check browser compatibility
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return;
    }

    // Don't show if already denied
    if (Notification.permission === 'denied') {
      return;
    }

    const checkStatus = async () => {
      // If already granted, verify background subscription
      if (Notification.permission === 'granted') {
        const isSubscribed = await checkSubscriptionStatus();
        if (!isSubscribed) {
          // Silently resubscribe if permission was already given
          await subscribeToPush();
        }
        return;
      }

      // Check if dismissed recently (3 days cooldown)
      const dismissedAt = localStorage.getItem('notification_prompt_dismissed_at');
      if (dismissedAt) {
        const diffDays = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
        if (diffDays < 3) return;
      }

      // Show prompt smoothly after 3.5 seconds of user browsing
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3500);

      return () => clearTimeout(timer);
    };

    checkStatus();
  }, []);

  const handleAllow = async () => {
    setLoading(true);
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        const success = await subscribeToPush();
        if (success) {
          toast.success('नोटिफिकेशन सफलतापूर्वक चालू हो गया!', {
            duration: 3500,
            style: {
              background: '#26201a',
              color: '#faf8f5',
              border: '1px solid #e8920a',
              fontFamily: "'DM Sans', sans-serif"
            }
          });
        }
      }
      setShowPrompt(false);
    } catch (err) {
      console.error('Notification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('notification_prompt_dismissed_at', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div
      role="region"
      aria-label="Notification Permission Prompt"
      className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:max-w-md z-50 animate-bounce-in"
    >
      <div className="relative bg-white dark:bg-ink-900 border border-saffron-300 dark:border-saffron-600/40 rounded-2xl shadow-2xl p-4 sm:p-5 overflow-hidden">
        {/* Subtle background accent glow */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-saffron-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 p-1 rounded-full hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          {/* Pulsing Bell Icon */}
          <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-tr from-saffron-500 to-amber-400 text-white flex items-center justify-center shadow-md shadow-saffron-500/20">
            <BellRing size={22} className="animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-hindi font-bold text-ink-900 dark:text-ink-100 text-base leading-snug">
              नए शासनादेश की तुरंत सूचना पाएं!
            </h4>
            <p className="font-hindi text-xs sm:text-sm text-ink-600 dark:text-ink-300 mt-1 leading-relaxed">
              सरकारी आदेश, नियम और महत्वपूर्ण अपडेट्स सबसे पहले अपने फोन पर पाने के लिए Notification चालू करें।
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center justify-end gap-2.5 pt-2 border-t border-ink-100 dark:border-ink-800">
          <button
            onClick={handleDismiss}
            className="px-3.5 py-1.5 rounded-lg text-xs font-ui font-medium text-ink-500 hover:text-ink-800 dark:hover:text-ink-200 transition-colors"
          >
            बाद में (Later)
          </button>
          
          <button
            onClick={handleAllow}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-saffron-500 to-amber-500 hover:from-saffron-600 hover:to-amber-600 text-white font-ui font-semibold text-xs shadow-md shadow-saffron-500/30 hover:shadow-lg transition-all active:scale-95 disabled:opacity-75"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>चालू हो रहा है...</span>
              </>
            ) : (
              <>
                <Bell size={14} />
                <span>चालू करें (Allow)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPrompt;
