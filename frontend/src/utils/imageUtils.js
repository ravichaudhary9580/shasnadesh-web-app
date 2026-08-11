/**
 * Convert image path to full URL
 * @param {string} imagePath - The image path (relative or absolute)
 * @returns {string} - Full URL for the image
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return 'https://shasnadeshupdates.com/logo512.png';
  
  // Normalize backslashes
  const cleanPath = imagePath.replace(/\\/g, '/');

  // If it's already a full URL, return it
  if (cleanPath.startsWith('http')) {
    return cleanPath;
  }
  
  // For relative paths starting with /uploads/ or uploads/, assume they're on the backend
  if (cleanPath.startsWith('/uploads/') || cleanPath.startsWith('uploads/')) {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://shasnadesh-web-app.vercel.app';
    const formattedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    return `${backendUrl.replace(/\/$/, '')}${formattedPath}`;
  }
  
  // For other relative paths, assume they're relative to site origin
  const baseUrl = typeof window !== 'undefined' && window.location?.origin 
    ? window.location.origin 
    : 'https://shasnadeshupdates.com';
  return cleanPath.startsWith('/') ? `${baseUrl}${cleanPath}` : `${baseUrl}/${cleanPath}`;
}

/**
 * Check if URL is an S3 URL
 * @param {string} url - The URL to check
 * @returns {boolean} - True if it's an S3 URL
 */
export function isS3Url(url) {
  return url && url.includes('.s3.') && url.includes('amazonaws.com');
}