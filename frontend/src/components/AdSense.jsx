import { useEffect, useRef } from 'react';

/**
 * Reusable Google AdSense Component for React SPA
 */
export default function AdSense({
  adClient = process.env.REACT_APP_ADSENSE_CLIENT || 'ca-pub-8129172226402333',
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  className = '',
  style = { display: 'block' }
}) {
  const adRef = useRef(null);

  useEffect(() => {
    if (adRef.current) {
      // Check if this ins element has already been processed by Google AdSense
      const isAlreadyProcessed = 
        adRef.current.getAttribute('data-ad-status') === 'filled' ||
        adRef.current.getAttribute('data-adsbygoogle-status') === 'done';

      if (!isAlreadyProcessed) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
          // Suppress benign TagError when element was already processed by Google Auto Ads
          if (!e?.message?.includes('already have ads')) {
            console.warn('AdSense display warning:', e?.message || e);
          }
        }
      }
    }
  }, []);

  return (
    <div className={`my-6 overflow-hidden text-center min-h-[90px] ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={style}
        data-ad-client={adClient}
        {...(adSlot ? { 'data-ad-slot': adSlot } : {})}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
      />
    </div>
  );
}
