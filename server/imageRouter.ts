/**
 * Image Router - Sharp-based image processing API
 * 
 * Provides endpoints for image optimization, resizing, and transformations.
 * Uses the ImageService for server-side processing with Sharp.
 * 
 * @version 1.0
 * @date January 2026
 */

import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from './_core/trpc';
import { TRPCError } from '@trpc/server';
import { ImageService } from './services/imageService';

const imageService = new ImageService();

const ImageFormatEnum = z.enum(['jpeg', 'png', 'webp', 'avif']);

const ProcessOptionsSchema = z.object({
  width: z.number().min(1).max(4000).optional(),
  height: z.number().min(1).max(4000).optional(),
  format: ImageFormatEnum.optional(),
  quality: z.number().min(1).max(100).optional(),
  fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).optional(),
  blur: z.number().min(0.3).max(100).optional(),
  grayscale: z.boolean().optional(),
});

export const imageRouter = router({
  process: protectedProcedure
    .input(z.object({
      inputPath: z.string(),
      options: ProcessOptionsSchema,
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await imageService.processImage(input.inputPath, input.options);
        return { 
          success: true, 
          format: result.format,
          width: result.info.width,
          height: result.info.height,
          size: result.info.size,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

  thumbnail: protectedProcedure
    .input(z.object({
      inputPath: z.string(),
      size: z.number().min(16).max(500).default(150),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await imageService.generateThumbnail(input.inputPath, input.size);
        return { success: true, thumbnailPath: result };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Thumbnail generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

  responsive: protectedProcedure
    .input(z.object({
      inputPath: z.string(),
      sizes: z.array(z.number().min(100).max(3000)).default([320, 640, 1024, 1920]),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await imageService.generateResponsiveSet(input.inputPath, input.sizes);
        return { success: true, images: result };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Responsive set generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

  metadata: publicProcedure
    .input(z.object({ path: z.string() }))
    .query(async ({ input }) => {
      try {
        const metadata = await imageService.getImageMetadata(input.path);
        return metadata;
      } catch (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Could not read image metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

  optimize: protectedProcedure
    .input(z.object({
      inputPath: z.string(),
      quality: z.number().min(1).max(100).default(80),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await imageService.optimizeForWeb(input.inputPath, input.quality);
        return { success: true, optimizedPath: result };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Image optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

});

export type ImageRouter = typeof imageRouter;
