/* eslint-disable no-unused-vars */
/**
 * Check if browser supports sharing
 * @returns {boolean}
 */
export function canShareFiles() {
  return typeof navigator !== 'undefined' && navigator.share && navigator.canShare;
}

/**
 * Share a blog post with title, excerpt, URL, and thumbnail image preview across mobile & web browsers.
 * @param {Object} blog - The blog object containing title, excerpt, slug, thumbnail
 * @param {string} origin - Optional site origin (defaults to window.location.origin)
 * @returns {Promise<boolean>} - Resolves true if shared via native share, false if copied to clipboard
 */
export async function shareBlog(blog, origin = typeof window !== 'undefined' ? window.location.origin : '') {
  if (!blog) return false;

  const siteOrigin = (origin || 'https://shasnadeshupdates.com').replace(/^https?:\/\/www\./i, 'https://');
  const cleanSlug = encodeURIComponent((blog.slug || '').trim().replace(/^\/+|\/+$/g, ''));
  const shareUrl = `${siteOrigin}/blog/${cleanSlug}`;
  const fullTitle = (blog.title || 'Shasnadesh Updates').trim();

  // Only share title & url without extra text
  // WhatsApp, Telegram, etc. will show the rich preview card automatically from the link
  const shareData = {
    title: fullTitle,
    url: shareUrl
  };

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (err) {
      if (err.name === 'AbortError') {
        return true; // User cancelled the share dialog
      }
      console.warn('Native share failed, falling back to clipboard copy:', err.message);
    }
  }

  // Desktop / Fallback: Copy link to clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(shareUrl);
    return false;
  }

  return false;
}