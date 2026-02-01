import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  blur?: number;
  grayscale?: boolean;
}

interface ProcessedImage {
  buffer: Buffer;
  info: sharp.OutputInfo;
  format: string;
}

export class ImageService {
  private uploadDir: string;
  private cacheDir: string;

  constructor(uploadDir = './uploads', cacheDir = './cache/images') {
    this.uploadDir = uploadDir;
    this.cacheDir = cacheDir;
  }

  async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.uploadDir, { recursive: true });
    await fs.mkdir(this.cacheDir, { recursive: true });
  }

  async processImage(
    inputPath: string,
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage> {
    const {
      width,
      height,
      quality = 80,
      format = 'webp',
      fit = 'cover',
      blur,
      grayscale = false,
    } = options;

    let pipeline = sharp(inputPath);

    // Resize if dimensions specified
    if (width || height) {
      pipeline = pipeline.resize(width, height, {
        fit,
        withoutEnlargement: true,
      });
    }

    // Apply effects
    if (blur && blur > 0) {
      pipeline = pipeline.blur(blur);
    }

    if (grayscale) {
      pipeline = pipeline.grayscale();
    }

    // Convert format
    switch (format) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        break;
      case 'png':
        pipeline = pipeline.png({ quality, compressionLevel: 9 });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality });
        break;
    }

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

    return {
      buffer: data,
      info,
      format,
    };
  }

  async generateThumbnail(
    inputPath: string,
    size: number = 200
  ): Promise<Buffer> {
    const result = await this.processImage(inputPath, {
      width: size,
      height: size,
      fit: 'cover',
      format: 'webp',
      quality: 70,
    });
    return result.buffer;
  }

  async generateResponsiveSet(
    inputPath: string,
    sizes: number[] = [320, 640, 1024, 1920]
  ): Promise<Map<number, Buffer>> {
    const results = new Map<number, Buffer>();

    for (const width of sizes) {
      const result = await this.processImage(inputPath, {
        width,
        format: 'webp',
        quality: 80,
      });
      results.set(width, result.buffer);
    }

    return results;
  }

  async getImageMetadata(inputPath: string): Promise<sharp.Metadata> {
    return sharp(inputPath).metadata();
  }

  async optimizeForWeb(
    inputPath: string,
    maxWidth: number = 1920
  ): Promise<ProcessedImage> {
    const metadata = await this.getImageMetadata(inputPath);
    const width = metadata.width && metadata.width > maxWidth ? maxWidth : undefined;

    return this.processImage(inputPath, {
      width,
      format: 'webp',
      quality: 85,
    });
  }

  getCacheKey(
    filename: string,
    options: ImageProcessingOptions
  ): string {
    const optStr = JSON.stringify(options);
    const hash = Buffer.from(optStr).toString('base64url');
    const ext = options.format || 'webp';
    const basename = path.basename(filename, path.extname(filename));
    return `${basename}_${hash}.${ext}`;
  }

  async getCachedOrProcess(
    inputPath: string,
    options: ImageProcessingOptions
  ): Promise<Buffer> {
    await this.ensureDirectories();
    
    const cacheKey = this.getCacheKey(inputPath, options);
    const cachePath = path.join(this.cacheDir, cacheKey);

    try {
      // Check if cached version exists
      const cached = await fs.readFile(cachePath);
      return cached;
    } catch {
      // Process and cache
      const result = await this.processImage(inputPath, options);
      await fs.writeFile(cachePath, result.buffer);
      return result.buffer;
    }
  }
}

export const imageService = new ImageService();
export default imageService;
