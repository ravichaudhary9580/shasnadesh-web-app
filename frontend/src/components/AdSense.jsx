import { useEffect } from 'react';

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
  useEffect(() => {
    try {
      if (window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error('AdSense display error:', e);
    }
  }, []);

  return (
    <div className={`my-6 overflow-hidden text-center min-h-[90px] ${className}`}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
      />
    </div>
  );
}
