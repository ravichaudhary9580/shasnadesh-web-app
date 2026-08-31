import { useEffect } from 'react';

/**
 * Normalizes any input URL to a strict canonical format:
 * 1. Uses https://shasnadeshupdates.com domain
 * 2. Removes query parameters (?category=..., ?ssr=true, ?fbclid=...)
 * 3. Removes hash fragments (#...)
 * 4. Removes trailing slashes from sub-paths (/blog/slug/ -> /blog/slug)
 * 5. Leaves homepage as https://shasnadeshupdates.com/
 */
function normalizeCanonicalUrl(inputUrl) {
  if (!inputUrl) return 'https://shasnadeshupdates.com/';
  try {
    const parsed = new URL(inputUrl, 'https://shasnadeshupdates.com');
    const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
    return `https://shasnadeshupdates.com${pathname === '/' ? '/' : pathname}`;
  } catch (e) {
    return 'https://shasnadeshupdates.com/';
  }
}

export default function SEO({ 
  title = 'Shasnadesh Updates - सरकारी आदेश और अपडेट',
  description = 'भारत सरकार के नवीनतम आदेश, योजनाएं और अपडेट। Latest government orders, schemes and updates in Hindi and English.',
  keywords = 'सरकारी आदेश, government orders, sarkari yojana, govt schemes, india updates, सरकारी योजना',
  image = 'https://shasnadeshupdates.com/logo512.png',
  url = 'https://shasnadeshupdates.com/',
  type = 'website',
  author = 'Shasnadesh Updates',
  publishedTime,
  modifiedTime,
  category,
  tags = [],
  noindex = false
}) {
  useEffect(() => {
    // Strictly normalized canonical URL
    const canonicalUrl = normalizeCanonicalUrl(url);

    // Update title
    document.title = title;

    // Helper to set meta tag
    const setMeta = (name, content, isProperty = false) => {
      if (!content) return;
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Robots / Indexing control
    if (noindex) {
      setMeta('robots', 'noindex, nofollow');
      setMeta('googlebot', 'noindex, nofollow');
    } else {
      setMeta('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
      setMeta('googlebot', 'index, follow');
    }

    // Basic meta tags
    setMeta('description', description);
    setMeta('keywords', keywords);
    setMeta('author', author);

    // Open Graph
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:image', image, true);
    setMeta('og:image:secure_url', image, true);
    setMeta('og:image:width', '1200', true);
    setMeta('og:image:height', '630', true);
    setMeta('og:url', canonicalUrl, true);
    setMeta('og:type', type, true);
    setMeta('og:site_name', 'Shasnadesh Updates', true);
    setMeta('og:locale', 'hi_IN', true);
    setMeta('og:locale:alternate', 'en_US', true);

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image);
    setMeta('twitter:site', '@shasnadesh');

    // Article specific
    if (type === 'article') {
      setMeta('article:published_time', publishedTime, true);
      setMeta('article:modified_time', modifiedTime, true);
      setMeta('article:author', author, true);
      if (category) setMeta('article:section', category, true);
      
      // Clean previous tags
      document.querySelectorAll('meta[property="article:tag"]').forEach(el => el.remove());
      tags.forEach(tag => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'article:tag');
        meta.setAttribute('content', tag);
        document.head.appendChild(meta);
      });
    }

    // Canonical URL (Strict single link)
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    // Alternate language (Strict single link matching canonical)
    let alternateLangHi = document.querySelector('link[rel="alternate"][hreflang="hi"]');
    if (!alternateLangHi) {
      alternateLangHi = document.createElement('link');
      alternateLangHi.setAttribute('rel', 'alternate');
      alternateLangHi.setAttribute('hreflang', 'hi');
      document.head.appendChild(alternateLangHi);
    }
    alternateLangHi.setAttribute('href', canonicalUrl);

    let alternateLangDefault = document.querySelector('link[rel="alternate"][hreflang="x-default"]');
    if (!alternateLangDefault) {
      alternateLangDefault = document.createElement('link');
      alternateLangDefault.setAttribute('rel', 'alternate');
      alternateLangDefault.setAttribute('hreflang', 'x-default');
      document.head.appendChild(alternateLangDefault);
    }
    alternateLangDefault.setAttribute('href', canonicalUrl);

  }, [title, description, keywords, image, url, type, author, publishedTime, modifiedTime, category, tags, noindex]);

  return null;
}
