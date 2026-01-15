import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { nanoid } from 'nanoid';

const execAsync = promisify(exec);

interface ConversionResult {
  success: boolean;
  outputBuffer?: Buffer;
  outputMimeType?: string;
  outputExtension?: string;
  error?: string;
}

/**
 * Supported conversion formats
 */
export const SUPPORTED_CONVERSIONS = {
  // Image conversions - all image types can be converted to all other image types
  'image/jpeg': ['image/png', 'image/webp', 'image/heic', 'image/heif', 'image/tiff', 'image/bmp'],
  'image/png': ['image/jpeg', 'image/webp', 'image/heic', 'image/heif', 'image/tiff', 'image/bmp'],
  'image/webp': ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/tiff', 'image/bmp'],
  'image/heic': ['image/jpeg', 'image/png', 'image/webp', 'image/heif', 'image/tiff', 'image/bmp'],
  'image/heif': ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/tiff', 'image/bmp'],
  'image/tiff': ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/bmp'],
  'image/bmp': ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/tiff'],
  
  // Video conversions
  'video/quicktime': ['video/mp4', 'video/webm'],  // MOV
  'video/x-msvideo': ['video/mp4', 'video/webm'],  // AVI
  'video/x-ms-wmv': ['video/mp4', 'video/webm'],   // WMV
  'video/x-flv': ['video/mp4', 'video/webm'],      // FLV
  'video/webm': ['video/mp4'],
  'video/mp4': ['video/webm'],
  
  // Audio conversions
  'audio/wav': ['audio/mpeg', 'audio/ogg'],
  'audio/x-wav': ['audio/mpeg', 'audio/ogg'],
  'audio/aiff': ['audio/mpeg', 'audio/ogg'],
  'audio/ogg': ['audio/mpeg'],
  'audio/mpeg': ['audio/ogg'],
};

/**
 * Get file extension from mime type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'image/tiff': 'tiff',
    'image/bmp': 'bmp',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'video/x-ms-wmv': 'wmv',
    'video/x-flv': 'flv',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/aiff': 'aiff',
  };
  return mimeToExt[mimeType] || 'bin';
}

/**
 * Check if a conversion is supported
 */
export function isConversionSupported(inputMimeType: string, outputMimeType: string): boolean {
  const supported = SUPPORTED_CONVERSIONS[inputMimeType as keyof typeof SUPPORTED_CONVERSIONS];
  return supported ? supported.includes(outputMimeType) : false;
}

/**
 * Get available output formats for a given input mime type
 */
export function getAvailableOutputFormats(inputMimeType: string): string[] {
  return SUPPORTED_CONVERSIONS[inputMimeType as keyof typeof SUPPORTED_CONVERSIONS] || [];
}

/**
 * Convert media file from one format to another using ffmpeg
 */
export async function convertMedia(
  inputBuffer: Buffer,
  inputMimeType: string,
  outputMimeType: string
): Promise<ConversionResult> {
  // Validate conversion is supported
  if (!isConversionSupported(inputMimeType, outputMimeType)) {
    return {
      success: false,
      error: `Conversion from ${inputMimeType} to ${outputMimeType} is not supported`,
    };
  }

  const tempDir = join(tmpdir(), 'media-conversion');
  const inputId = nanoid();
  const outputId = nanoid();
  
  const inputExt = getExtensionFromMimeType(inputMimeType);
  const outputExt = getExtensionFromMimeType(outputMimeType);
  
  const inputPath = join(tempDir, `${inputId}.${inputExt}`);
  const outputPath = join(tempDir, `${outputId}.${outputExt}`);

  try {
    // Ensure temp directory exists
    await mkdir(tempDir, { recursive: true });

    // Write input buffer to temp file
    await writeFile(inputPath, inputBuffer);

    // Build ffmpeg command based on conversion type
    let ffmpegCmd: string;
    
    if (outputMimeType.startsWith('image/')) {
      // Image conversion
      if (outputMimeType === 'image/jpeg') {
        ffmpegCmd = `ffmpeg -y -i "${inputPath}" -q:v 2 "${outputPath}"`;
      } else if (outputMimeType === 'image/png') {
        ffmpegCmd = `ffmpeg -y -i "${inputPath}" "${outputPath}"`;
      } else {
        ffmpegCmd = `ffmpeg -y -i "${inputPath}" "${outputPath}"`;
      }
    } else if (outputMimeType.startsWith('video/')) {
      // Video conversion
      if (outputMimeType === 'video/mp4') {
        // H.264 codec for maximum compatibility
        ffmpegCmd = `ffmpeg -y -i "${inputPath}" -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -movflags +faststart "${outputPath}"`;
      } else if (outputMimeType === 'video/webm') {
        // VP9 codec for WebM
        ffmpegCmd = `ffmpeg -y -i "${inputPath}" -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus -b:a 128k "${outputPath}"`;
      } else {
        ffmpegCmd = `ffmpeg -y -i "${inputPath}" "${outputPath}"`;
      }
    } else if (outputMimeType.startsWith('audio/')) {
      // Audio conversion
      if (outputMimeType === 'audio/mpeg') {
        ffmpegCmd = `ffmpeg -y -i "${inputPath}" -c:a libmp3lame -b:a 192k "${outputPath}"`;
      } else if (outputMimeType === 'audio/ogg') {
        ffmpegCmd = `ffmpeg -y -i "${inputPath}" -c:a libvorbis -q:a 4 "${outputPath}"`;
      } else {
        ffmpegCmd = `ffmpeg -y -i "${inputPath}" "${outputPath}"`;
      }
    } else {
      return {
        success: false,
        error: `Unsupported output format: ${outputMimeType}`,
      };
    }

    // Execute ffmpeg
    await execAsync(ffmpegCmd, { timeout: 300000 }); // 5 minute timeout

    // Read output file
    const outputBuffer = await readFile(outputPath);

    // Clean up temp files
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});

    return {
      success: true,
      outputBuffer,
      outputMimeType,
      outputExtension: outputExt,
    };
  } catch (error) {
    // Clean up temp files on error
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});

    console.error('Media conversion error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Conversion failed',
    };
  }
}

/**
 * Generate video thumbnail using ffmpeg
 */
export async function generateVideoThumbnail(
  inputBuffer: Buffer,
  inputMimeType: string,
  timestamp: number = 1 // seconds
): Promise<ConversionResult> {
  const tempDir = join(tmpdir(), 'media-conversion');
  const inputId = nanoid();
  const outputId = nanoid();
  
  const inputExt = getExtensionFromMimeType(inputMimeType);
  const inputPath = join(tempDir, `${inputId}.${inputExt}`);
  const outputPath = join(tempDir, `${outputId}.jpg`);

  try {
    await mkdir(tempDir, { recursive: true });
    await writeFile(inputPath, inputBuffer);

    // Generate thumbnail at specified timestamp
    const ffmpegCmd = `ffmpeg -y -i "${inputPath}" -ss ${timestamp} -vframes 1 -q:v 2 "${outputPath}"`;
    await execAsync(ffmpegCmd, { timeout: 60000 }); // 1 minute timeout

    const outputBuffer = await readFile(outputPath);

    // Clean up
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});

    return {
      success: true,
      outputBuffer,
      outputMimeType: 'image/jpeg',
      outputExtension: 'jpg',
    };
  } catch (error) {
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});

    console.error('Thumbnail generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Thumbnail generation failed',
    };
  }
}
