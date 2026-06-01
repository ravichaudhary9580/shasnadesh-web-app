import { useEffect } from 'react';

export default function SEO({ 
  title = 'Shasnadesh Updates - सरकारी आदेश और अपडेट',
  description = 'भारत सरकार के नवीनतम आदेश, योजनाएं और अपडेट। Latest government orders, schemes and updates in Hindi and English.',
  keywords = 'सरकारी आदेश, government orders, sarkari yojana, govt schemes, india updates, सरकारी योजना',
  image = 'https://shasnadeshupdates.com/logo512.png',
  url = 'https://shasnadeshupdates.com',
  type = 'website',
  author = 'Shasnadesh Updates',
  publishedTime,
  modifiedTime,
  category,
  tags = []
}) {
  useEffect(() => {
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

    // Basic meta tags
    setMeta('description', description);
    setMeta('keywords', keywords);
    setMeta('author', author);

    // Open Graph
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:image', image, true);
    setMeta('og:url', url, true);
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
      tags.forEach(tag => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', 'article:tag');
        meta.setAttribute('content', tag);
        document.head.appendChild(meta);
      });
    }

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

    // Alternate language
    let alternateLang = document.querySelector('link[rel="alternate"][hreflang="hi"]');
    if (!alternateLang) {
      alternateLang = document.createElement('link');
      alternateLang.setAttribute('rel', 'alternate');
      alternateLang.setAttribute('hreflang', 'hi');
      document.head.appendChild(alternateLang);
    }
    alternateLang.setAttribute('href', url);

  }, [title, description, keywords, image, url, type, author, publishedTime, modifiedTime, category, tags]);

  return null;
}
