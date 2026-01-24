// S3 bucket URL for media files
// Primary bucket for new uploads
export const S3_MEDIA_BASE_URL = 'https://justxempower-assets.s3.us-east-1.amazonaws.com';
// Legacy bucket for older media
export const S3_LEGACY_BASE_URL = 'https://elasticbeanstalk-us-east-1-137738969420.s3.amazonaws.com';

// Known legacy files that exist in the Elastic Beanstalk bucket
const LEGACY_FILES = [
  'media/logo-white.png',
  'media/logo-black.png',
  'media/logo.png',
];

/**
 * Convert a local media path to S3 URL
 * @param path - Local path like "/media/11/image.jpg" or already an S3 URL
 * @returns Full S3 URL
 */
export function getMediaUrl(input: string | undefined | null | { url?: string }): string {
  if (!input) return '';
  
  // Ensure we have a string path
  let path: string;
  if (typeof input === 'string') {
    path = input;
  } else if (typeof input === 'object' && input?.url) {
    path = input.url;
  } else {
    return '';
  }
  
  // If already an absolute URL (S3 or other), check if it needs fixing
  if (path.startsWith('http://') || path.startsWith('https://')) {
    // Fix URLs with incorrect uploads/media path - should be just media/
    if (path.includes('/uploads/media/')) {
      return path.replace('/uploads/media/', '/media/');
    }
    return path;
  }
  
  // Convert local path to S3 URL
  // Remove leading slash if present
  let cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Fix uploads/media prefix - should be just media/
  if (cleanPath.startsWith('uploads/media/')) {
    cleanPath = cleanPath.replace('uploads/media/', 'media/');
  }
  
  // Check if it's a known legacy file
  if (LEGACY_FILES.includes(cleanPath)) {
    return `${S3_LEGACY_BASE_URL}/${cleanPath}`;
  }
  
  // Check if it's a legacy path format (media/11/..., media/12/..., etc.)
  // These are stored in the legacy Elastic Beanstalk bucket
  if (cleanPath.startsWith('media/1') || cleanPath.startsWith('media/2')) {
    return `${S3_LEGACY_BASE_URL}/${cleanPath}`;
  }
  
  // New uploads go to the primary bucket
  return `${S3_MEDIA_BASE_URL}/${cleanPath}`;
}

/**
 * Get video URL from S3
 * @param filename - Video filename
 * @returns Full S3 URL for the video
 */
export function getVideoUrl(filename: string): string {
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  return `${S3_LEGACY_BASE_URL}/media/videos/${filename}`;
}
