import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode
    const inStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone || 
                         document.referrer.includes('android-app://');
    setIsStandalone(inStandalone);

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    // Check if already downloaded/installed previously
    const hasDownloaded = localStorage.getItem('appDownloaded') === 'true';

    if (!inStandalone && !hasDownloaded) {
      setShowPrompt(true);
    } else {
      setShowPrompt(false);
    }

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!inStandalone && !hasDownloaded) {
        setShowPrompt(true);
      }
    };

    // Handle appinstalled event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      localStorage.setItem('appDownloaded', 'true');
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDownloadClick = () => {
    localStorage.setItem('appDownloaded', 'true');
    setShowPrompt(false);
  };

  // eslint-disable-next-line no-unused-vars
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      localStorage.setItem('appDownloaded', 'true');
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  // Don't show if already in standalone mode or downloaded or prompt hidden
  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed top-12 inset-x-0 z-40 sm:top-auto sm:bottom-4 sm:right-4 sm:inset-x-auto sm:max-w-sm">
      <div className="bg-white border-b border-ink-200 sm:border sm:rounded-lg shadow-sm sm:shadow-lg px-3 py-2.5 sm:p-4 animate-fade-in">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-saffron-100 flex items-center justify-center flex-shrink-0">
            <Download size={14} className="text-saffron-600" />
          </div>
          <div className="min-w-0 flex-1">
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
              <>
                {/* 
                <button
                  onClick={handleInstallClick}
                  className="bg-saffron-500 hover:bg-saffron-600 text-white font-ui font-medium py-1.5 px-2.5 rounded-md text-xs transition-colors flex items-center gap-1"
                >
                  <Download size={12} />
                  Install
                </button>
                */}
                <a
                  href="https://play.google.com/store/apps/details?id=app.vercel.shasnadeshupdates.twa" 
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleDownloadClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-ui font-medium py-1.5 px-2.5 rounded-md text-xs transition-colors flex items-center gap-1 whitespace-nowrap"
                >
                  <Download size={12} />
                  Download App
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;