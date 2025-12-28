// S3 bucket URL for media files
export const S3_MEDIA_BASE_URL = 'https://elasticbeanstalk-us-east-1-137738969420.s3.amazonaws.com';

/**
 * Convert a local media path to S3 URL
 * @param path - Local path like "/media/11/image.jpg" or already an S3 URL
 * @returns Full S3 URL
 */
export function getMediaUrl(path: string | undefined | null): string {
  if (!path) return '';
  
  // If already an absolute URL (S3 or other), return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Convert local path to S3 URL
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
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
  return `${S3_MEDIA_BASE_URL}/media/videos/${filename}`;
}
