/**
 * Image Service - Server-side image processing with Sharp
 * 
 * Provides comprehensive image manipulation including:
 * - Optimization, resizing, format conversion
 * - Flip (horizontal/vertical), rotate, crop
 * - Color adjustments, filters, overlays
 * - Responsive image generation
 * 
 * Based on Sharp (https://github.com/lovell/sharp) for high-performance image processing
 * 
 * @version 2.0
 * @date February 2026
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
  // Transform options
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  rotate?: number; // degrees (0, 90, 180, 270 or any angle)
  // Crop options
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  // Color adjustments
  brightness?: number; // 0.5 = 50% darker, 1.5 = 50% brighter
  saturation?: number; // 0 = grayscale, 1 = normal, 2 = double saturation
  contrast?: number; // contrast multiplier
  // Effects
  sharpen?: boolean;
  tint?: string; // hex color for tinting
  negate?: boolean;
  normalize?: boolean;
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
   * Process an image with the given options - Full Sharp capabilities
   */
  async processImage(inputPath: string, options: ProcessOptions): Promise<ProcessResult> {
    let pipeline = sharp(inputPath);

    // Apply rotation first (before other transforms)
    if (options.rotate !== undefined && options.rotate !== 0) {
      pipeline = pipeline.rotate(options.rotate, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
    }

    // Apply flip transformations
    if (options.flipHorizontal) {
      pipeline = pipeline.flop(); // Horizontal flip (mirror)
    }
    if (options.flipVertical) {
      pipeline = pipeline.flip(); // Vertical flip
    }

    // Apply crop/extract if specified
    if (options.cropX !== undefined && options.cropY !== undefined && 
        options.cropWidth !== undefined && options.cropHeight !== undefined) {
      pipeline = pipeline.extract({
        left: Math.round(options.cropX),
        top: Math.round(options.cropY),
        width: Math.round(options.cropWidth),
        height: Math.round(options.cropHeight),
      });
    }

    // Apply resize if dimensions specified
    if (options.width || options.height) {
      pipeline = pipeline.resize({
        width: options.width,
        height: options.height,
        fit: options.fit || 'cover',
        withoutEnlargement: true,
      });
    }

    // Apply color adjustments using modulate
    if (options.brightness !== undefined || options.saturation !== undefined) {
      pipeline = pipeline.modulate({
        brightness: options.brightness,
        saturation: options.saturation,
      });
    }

    // Apply linear contrast adjustment
    if (options.contrast !== undefined && options.contrast !== 1) {
      const a = options.contrast;
      const b = 128 * (1 - options.contrast);
      pipeline = pipeline.linear(a, b);
    }

    // Apply normalize (auto-levels)
    if (options.normalize) {
      pipeline = pipeline.normalize();
    }

    // Apply negate (invert colors)
    if (options.negate) {
      pipeline = pipeline.negate();
    }

    // Apply tint
    if (options.tint) {
      pipeline = pipeline.tint(options.tint);
    }

    // Apply blur if specified
    if (options.blur) {
      pipeline = pipeline.blur(options.blur);
    }

    // Apply sharpen
    if (options.sharpen) {
      pipeline = pipeline.sharpen();
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
   * Process image from buffer (for client-side uploads)
   */
  async processImageBuffer(inputBuffer: Buffer, options: ProcessOptions): Promise<ProcessResult> {
    let pipeline = sharp(inputBuffer);

    // Apply rotation first
    if (options.rotate !== undefined && options.rotate !== 0) {
      pipeline = pipeline.rotate(options.rotate, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
    }

    // Apply flip transformations
    if (options.flipHorizontal) {
      pipeline = pipeline.flop();
    }
    if (options.flipVertical) {
      pipeline = pipeline.flip();
    }

    // Apply crop
    if (options.cropX !== undefined && options.cropY !== undefined && 
        options.cropWidth !== undefined && options.cropHeight !== undefined) {
      pipeline = pipeline.extract({
        left: Math.round(options.cropX),
        top: Math.round(options.cropY),
        width: Math.round(options.cropWidth),
        height: Math.round(options.cropHeight),
      });
    }

    // Apply resize
    if (options.width || options.height) {
      pipeline = pipeline.resize({
        width: options.width,
        height: options.height,
        fit: options.fit || 'cover',
        withoutEnlargement: true,
      });
    }

    // Color adjustments
    if (options.brightness !== undefined || options.saturation !== undefined) {
      pipeline = pipeline.modulate({
        brightness: options.brightness,
        saturation: options.saturation,
      });
    }

    if (options.contrast !== undefined && options.contrast !== 1) {
      const a = options.contrast;
      const b = 128 * (1 - options.contrast);
      pipeline = pipeline.linear(a, b);
    }

    if (options.normalize) pipeline = pipeline.normalize();
    if (options.negate) pipeline = pipeline.negate();
    if (options.tint) pipeline = pipeline.tint(options.tint);
    if (options.blur) pipeline = pipeline.blur(options.blur);
    if (options.sharpen) pipeline = pipeline.sharpen();
    if (options.grayscale) pipeline = pipeline.grayscale();

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
   * Quick transform operations (flip, rotate) - returns base64 for immediate preview
   */
  async quickTransform(
    inputBuffer: Buffer,
    transform: { flipH?: boolean; flipV?: boolean; rotate?: number }
  ): Promise<string> {
    let pipeline = sharp(inputBuffer);

    if (transform.rotate) {
      pipeline = pipeline.rotate(transform.rotate, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
    }
    if (transform.flipH) {
      pipeline = pipeline.flop();
    }
    if (transform.flipV) {
      pipeline = pipeline.flip();
    }

    const buffer = await pipeline.webp({ quality: 90 }).toBuffer();
    return `data:image/webp;base64,${buffer.toString('base64')}`;
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
