export function generateBlogSchema(blog) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": blog.title,
    "description": blog.excerpt || blog.title,
    "image": blog.thumbnail ? `https://shasnadeshupdates.com${blog.thumbnail}` : "https://shasnadeshupdates.com/logo512.png",
    "author": {
      "@type": "Organization",
      "name": "Shasnadesh Updates",
      "url": "https://shasnadeshupdates.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Shasnadesh Updates",
      "logo": {
        "@type": "ImageObject",
        "url": "https://shasnadeshupdates.com/logo512.png"
      }
    },
    "datePublished": blog.createdAt,
    "dateModified": blog.updatedAt || blog.createdAt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://shasnadeshupdates.com/blog/${blog.slug}`
    },
    "articleSection": blog.category,
    "keywords": blog.tags?.join(', '),
    "inLanguage": blog.category === 'hindi' ? 'hi' : 'en'
  };
}

export function generateWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Shasnadesh Updates",
    "alternateName": "शासनादेश अपडेट",
    "url": "https://shasnadeshupdates.com",
    "description": "भारत सरकार के नवीनतम आदेश, योजनाएं और अपडेट। Latest government orders, schemes and updates.",
    "inLanguage": ["hi", "en"],
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://shasnadeshupdates.com/?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };
}

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Shasnadesh Updates",
    "alternateName": "शासनादेश अपडेट",
    "url": "https://shasnadeshupdates.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://shasnadeshupdates.com/logo512.png",
      "width": 512,
      "height": 512
    },
    "description": "Trusted source for government orders and updates in India",
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "contact@shasnadeshupdates.com",
      "contactType": "Customer Service",
      "availableLanguage": ["Hindi", "English"]
    },
    "sameAs": [
      "https://www.facebook.com/shasnadeshupdates",
      "https://www.instagram.com/shasnadeshupdates",
      "https://twitter.com/shasnadeshupdates",
      "https://www.youtube.com/@shasnadeshupdates",
      "https://t.me/shasnadeshupdates"
    ]
  };
}

export function generateBreadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

export function injectSchema(schema) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify(schema);
  document.head.appendChild(script);
  return () => document.head.removeChild(script);
}
