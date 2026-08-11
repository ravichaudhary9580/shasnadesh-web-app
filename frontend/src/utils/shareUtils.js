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

  const shareUrl = decodeURIComponent(`${origin}/blog/${blog.slug}`);
  const shareTitle = blog.title || 'Shasnadesh Updates';
  const rawExcerpt = blog.excerpt || blog.title || 'Check out this post on Shasnadesh Updates';
  const shareText = rawExcerpt.length > 120 ? rawExcerpt.substring(0, 120) + '...' : rawExcerpt;

  const shareData = {
    title: shareTitle,
    text: shareText,
    url: shareUrl
  };

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      // Native Web Share API with Title, Text & URL.
      // Mobile OS share sheet & apps (WhatsApp, Telegram, Twitter, iMessage, Facebook)
      // automatically fetch and render the thumbnail image preview from the page's og:image meta tag.
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