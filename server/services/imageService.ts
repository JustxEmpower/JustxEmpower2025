/**
 * Image Service - Server-side image processing with Sharp
 * 
 * Provides image optimization, resizing, format conversion, and transformations.
 * 
 * @version 1.0
 * @date January 2026
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

interface ProcessOptions {
  width?: number;
  height?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  blur?: number;
  grayscale?: boolean;
}

interface ProcessResult {
  buffer: Buffer;
  format: string;
  info: {
    width: number;
    height: number;
    size: number;
  };
}

export class ImageService {
  private cacheDir: string;

  constructor(cacheDir?: string) {
    this.cacheDir = cacheDir || path.join(process.cwd(), '.image-cache');
    this.ensureCacheDir();
  }

  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error('[ImageService] Failed to create cache directory:', error);
    }
  }

  /**
   * Process an image with the given options
   */
  async processImage(inputPath: string, options: ProcessOptions): Promise<ProcessResult> {
    let pipeline = sharp(inputPath);

    // Apply resize if dimensions specified
    if (options.width || options.height) {
      pipeline = pipeline.resize({
        width: options.width,
        height: options.height,
        fit: options.fit || 'cover',
        withoutEnlargement: true,
      });
    }

    // Apply blur if specified
    if (options.blur) {
      pipeline = pipeline.blur(options.blur);
    }

    // Apply grayscale if specified
    if (options.grayscale) {
      pipeline = pipeline.grayscale();
    }

    // Convert format if specified
    const format = options.format || 'webp';
    const quality = options.quality || 80;

    switch (format) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        break;
      case 'png':
        pipeline = pipeline.png({ compressionLevel: 9 });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality });
        break;
      case 'webp':
      default:
        pipeline = pipeline.webp({ quality });
        break;
    }

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

    return {
      buffer: data,
      format,
      info: {
        width: info.width,
        height: info.height,
        size: info.size,
      },
    };
  }

  /**
   * Generate a thumbnail for an image
   */
  async generateThumbnail(inputPath: string, size: number = 150): Promise<string> {
    const ext = path.extname(inputPath);
    const basename = path.basename(inputPath, ext);
    const outputPath = path.join(this.cacheDir, `${basename}_thumb_${size}.webp`);

    await sharp(inputPath)
      .resize(size, size, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(outputPath);

    return outputPath;
  }

  /**
   * Generate responsive image set
   */
  async generateResponsiveSet(
    inputPath: string,
    sizes: number[] = [320, 640, 1024, 1920]
  ): Promise<Array<{ width: number; path: string }>> {
    const ext = path.extname(inputPath);
    const basename = path.basename(inputPath, ext);
    const results: Array<{ width: number; path: string }> = [];

    for (const width of sizes) {
      const outputPath = path.join(this.cacheDir, `${basename}_${width}w.webp`);
      
      await sharp(inputPath)
        .resize(width, undefined, { withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);

      results.push({ width, path: outputPath });
    }

    return results;
  }

  /**
   * Get image metadata
   */
  async getImageMetadata(inputPath: string): Promise<sharp.Metadata> {
    return sharp(inputPath).metadata();
  }

  /**
   * Optimize image for web
   */
  async optimizeForWeb(inputPath: string, quality: number = 80): Promise<string> {
    const ext = path.extname(inputPath);
    const basename = path.basename(inputPath, ext);
    const outputPath = path.join(this.cacheDir, `${basename}_optimized.webp`);

    await sharp(inputPath)
      .webp({ quality, effort: 6 })
      .toFile(outputPath);

    return outputPath;
  }

  /**
   * Generate cache key for an image request
   */
  getCacheKey(inputPath: string, options: ProcessOptions): string {
    const hash = JSON.stringify({ inputPath, options });
    return Buffer.from(hash).toString('base64').replace(/[/+=]/g, '_');
  }

  /**
   * Get cached image or process and cache
   */
  async getCachedOrProcess(
    inputPath: string,
    options: ProcessOptions
  ): Promise<ProcessResult> {
    const cacheKey = this.getCacheKey(inputPath, options);
    const cachePath = path.join(this.cacheDir, `${cacheKey}.cache`);

    try {
      const cached = await fs.readFile(cachePath);
      const metadata = JSON.parse(await fs.readFile(`${cachePath}.meta`, 'utf-8'));
      return {
        buffer: cached,
        format: metadata.format,
        info: metadata.info,
      };
    } catch {
      // Cache miss, process image
      const result = await this.processImage(inputPath, options);
      
      // Save to cache
      await fs.writeFile(cachePath, result.buffer);
      await fs.writeFile(
        `${cachePath}.meta`,
        JSON.stringify({ format: result.format, info: result.info })
      );

      return result;
    }
  }
}
