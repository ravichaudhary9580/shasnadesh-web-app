/**
 * Convert S3 URL to proxy URL for images
 * @param {string} s3Url - The S3 URL (e.g., https://bucket.s3.region.amazonaws.com/key)
 * @returns {string} - Proxy URL or original URL if not S3
 */
export function getImageUrl(s3Url) {
  // Just return the S3 URL directly - bucket will be made public
  return s3Url;
}

/**
 * Check if URL needs proxy
 * @param {string} url - The URL to check
 * @returns {boolean} - True if it's an S3 URL
 */
export function isS3Url(url) {
  return url && url.includes('.s3.') && url.includes('amazonaws.com');
}