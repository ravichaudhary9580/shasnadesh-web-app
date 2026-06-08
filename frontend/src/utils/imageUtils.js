/**
 * Convert image path to full URL
 * @param {string} imagePath - The image path (relative or absolute)
 * @returns {string} - Full URL for the image
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return '';
  
  // If it's already a full URL, return it
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // For relative paths starting with /uploads/, assume they're on the backend
  if (imagePath.startsWith('/uploads/')) {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    return `${backendUrl}${imagePath}`;
  }
  
  // For other relative paths, assume they're relative to current origin
  const baseUrl = window.location.origin;
  return `${baseUrl}${imagePath}`;
}

/**
 * Check if URL is an S3 URL
 * @param {string} url - The URL to check
 * @returns {boolean} - True if it's an S3 URL
 */
export function isS3Url(url) {
  return url && url.includes('.s3.') && url.includes('amazonaws.com');
}