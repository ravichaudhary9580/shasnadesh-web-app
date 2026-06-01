import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || 
                   window.navigator.standalone || 
                   document.referrer.includes('android-app://'));

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    // Handle appinstalled event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    if (isStandalone) {
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal in localStorage to not show again for some time
    localStorage.setItem('pwaPromptDismissed', Date.now().toString());
  };

  // Don't show if already in standalone mode or if user recently dismissed
  if (isStandalone || !showPrompt) {
    return null;
  }

  // Check if user dismissed recently (within 7 days)
  const lastDismissed = localStorage.getItem('pwaPromptDismissed');
  if (lastDismissed) {
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - parseInt(lastDismissed) < sevenDays) {
      return null;
    }
  }

  return (
    <div className="fixed top-12 inset-x-0 z-40 sm:top-auto sm:bottom-4 sm:right-4 sm:inset-x-auto sm:max-w-sm">
      <div className="bg-white border-b border-ink-200 sm:border sm:rounded-lg shadow-sm sm:shadow-lg px-3 py-2.5 sm:p-4 animate-fade-in">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-saffron-100 flex items-center justify-center flex-shrink-0">
            <Download size={14} className="text-saffron-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-ui font-semibold text-ink-900 text-xs sm:text-sm leading-tight truncate">
              Download Shasnadeshupdates.com
            </h3>
            <p className="text-[11px] sm:text-xs text-ink-500 leading-tight truncate">
              Get the app for faster updates
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {isIOS ? (
              <span className="text-[10px] sm:text-xs text-ink-600 leading-tight max-w-[42vw] sm:max-w-none">
                Share → Add to Home Screen
              </span>
            ) : (
              <button
                onClick={handleInstallClick}
                className="bg-saffron-500 hover:bg-saffron-600 text-white font-ui font-medium py-1.5 px-2.5 rounded-md text-xs transition-colors flex items-center gap-1"
              >
                <Download size={12} />
                Install
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="text-ink-400 hover:text-ink-600 transition-colors"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;