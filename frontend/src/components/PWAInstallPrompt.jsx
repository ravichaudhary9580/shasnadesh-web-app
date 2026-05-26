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
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-ink-200 p-4 animate-fade-in">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-saffron-100 flex items-center justify-center">
              <Download size={16} className="text-saffron-600" />
            </div>
            <div>
              <h3 className="font-ui font-semibold text-ink-900 text-sm">
                Install Shasnadeshupdates.com
              </h3>
              <p className="text-xs text-ink-500">
                Install app for better experience
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-ink-400 hover:text-ink-600 transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>

        {isIOS ? (
          <div className="text-xs text-ink-600 mb-3">
            <p className="mb-1">To install on iOS:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Tap the Share button <span className="font-mono">⎋</span></li>
              <li>Scroll down and tap "Add to Home Screen"</li>
              <li>Tap "Add" in the top right</li>
            </ol>
          </div>
        ) : (
          <button
            onClick={handleInstallClick}
            className="w-full bg-saffron-500 hover:bg-saffron-600 text-white font-ui font-medium py-2 px-4 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Download size={14} />
            Install App
          </button>
        )}

        <div className="mt-3 pt-3 border-t border-ink-100">
          <p className="text-xs text-ink-400">
            Installed apps work offline and load faster
          </p>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;