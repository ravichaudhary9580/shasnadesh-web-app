import { getImageUrl } from './imageUtils';

/**
 * Prepare image file for sharing
 * @param {string} imagePath - The image path/URL
 * @returns {Promise<File|null>} - Returns a File object if successful, null otherwise
 */
export async function prepareImageForShare(imagePath) {
  if (!imagePath) return null;
  
  try {
    const imageUrl = getImageUrl(imagePath);
    
    // Fetch the image (CORS should be configured on S3)
    const response = await fetch(imageUrl, {
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    // Check if blob is a valid image
    if (!blob.type.startsWith('image/')) {
      throw new Error('Not a valid image file');
    }
    
    // Create a File object for sharing
    const fileExtension = blob.type.split('/')[1] || 'jpg';
    const fileName = `blog-thumbnail.${fileExtension}`;
    
    return new File([blob], fileName, { type: blob.type });
  } catch (error) {
    console.warn('Cannot prepare image for sharing:', error.message);
    return null;
  }
}

/**
 * Check if browser supports sharing files
 * @returns {boolean}
 */
export function canShareFiles() {
  return navigator.share && navigator.canShare && navigator.canShare({ files: [] });
}