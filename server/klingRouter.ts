/**
 * klingRouter.ts
 *
 * Server-side proxy for PiAPI Kling Avatar API.
 * Keeps the API key server-side only — client calls /api/kling/*
 *
 * Endpoints:
 *   POST /api/kling/task       → Create a Kling task (video gen, lip sync, avatar)
 *   GET  /api/kling/task/:id   → Poll task status / get result
 *   POST /api/kling/upload     → Upload audio blob, return a public URL for Kling
 */

import { Router, Request, Response } from 'express';
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';

const PIAPI_BASE = 'https://api.piapi.ai/api/v1';
function getPiapiKey(): string {
  return process.env.PIAPI_KLING_API_KEY || process.env.KLING_API_KEY || '';
}

export function createKlingRouter(): Router {
  const router = Router();

  // ── Middleware: check API key is configured ──────────────────────────
  router.use((_req: Request, res: Response, next) => {
    if (!getPiapiKey()) {
      console.error('[Kling] PIAPI_KLING_API_KEY not set in environment');
      return res.status(500).json({
        error: 'Kling API not configured. Set PIAPI_KLING_API_KEY in .env',
      });
    }
    next();
  });

  // ── POST /api/kling/task — Create a new Kling task ──────────────────
  router.post('/task', async (req: Request, res: Response) => {
    try {
      const body = req.body;

      // Validate required fields
      if (!body.model || !body.task_type || !body.input) {
        return res.status(400).json({
          error: 'Missing required fields: model, task_type, input',
        });
      }

      // Allowlist task types
      const allowedTypes = ['video_generation', 'lip_sync', 'extend_video', 'effects', 'omni'];
      if (!allowedTypes.includes(body.task_type)) {
        return res.status(400).json({
          error: `Invalid task_type. Allowed: ${allowedTypes.join(', ')}`,
        });
      }

      console.log(`[Kling] Creating task: ${body.task_type}`, {
        hasImage: !!body.input.image_url,
        hasAudio: !!body.input.local_dubbing_url,
        hasTTS: !!body.input.tts_text,
        mode: body.input.mode || 'std',
      });

      const response = await fetch(`${PIAPI_BASE}/task`, {
        method: 'POST',
        headers: {
          'X-API-Key': getPiapiKey(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[Kling] Task creation failed:', data);
        return res.status(response.status).json(data);
      }

      console.log(`[Kling] Task created: ${data.data?.task_id} (${data.data?.status})`);
      return res.json(data);
    } catch (err: any) {
      console.error('[Kling] Task creation error:', err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/kling/task/:taskId — Poll task status ──────────────────
  router.get('/task/:taskId', async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;

      if (!taskId) {
        return res.status(400).json({ error: 'Missing taskId' });
      }

      const response = await fetch(`${PIAPI_BASE}/task/${taskId}`, {
        method: 'GET',
        headers: {
          'X-API-Key': getPiapiKey(),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`[Kling] Poll failed for ${taskId}:`, data);
        return res.status(response.status).json(data);
      }

      const status = data.data?.status;
      const hasVideo = !!(data.data?.output?.video || data.data?.output?.video_url);

      if (status === 'Completed') {
        console.log(`[Kling] Task ${taskId}: Completed ✅ (video: ${hasVideo})`);
      } else if (status === 'Failed') {
        console.error(`[Kling] Task ${taskId}: Failed ❌`, data.data?.error);
      }

      return res.json(data);
    } catch (err: any) {
      console.error('[Kling] Poll error:', err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/kling/upload — Upload audio for lip-sync ──────────────
  // Accepts a base64 audio blob, saves to public/uploads, returns URL.
  // Kling needs a publicly accessible URL for the audio file.
  router.post('/upload', async (req: Request, res: Response) => {
    try {
      const { audio, format = 'mp3' } = req.body;

      if (!audio) {
        return res.status(400).json({ error: 'Missing audio data (base64)' });
      }

      // Validate format
      const allowedFormats = ['mp3', 'wav', 'flac', 'ogg'];
      if (!allowedFormats.includes(format)) {
        return res.status(400).json({
          error: `Invalid format. Allowed: ${allowedFormats.join(', ')}`,
        });
      }

      // Save to public uploads directory
      const uploadsDir = path.resolve('public/uploads/kling-audio');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `avatar-audio-${nanoid(12)}.${format}`;
      const filepath = path.join(uploadsDir, filename);

      // Decode base64 and write
      const buffer = Buffer.from(audio, 'base64');

      // Safety: max 20MB
      if (buffer.length > 20 * 1024 * 1024) {
        return res.status(400).json({ error: 'Audio too large (max 20MB)' });
      }

      fs.writeFileSync(filepath, buffer);

      // Return a public URL (relative to server origin)
      const publicUrl = `/uploads/kling-audio/${filename}`;

      console.log(`[Kling] Audio uploaded: ${filename} (${(buffer.length / 1024).toFixed(1)}KB)`);

      return res.json({
        success: true,
        url: publicUrl,
        filename,
        size: buffer.length,
      });
    } catch (err: any) {
      console.error('[Kling] Upload error:', err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/kling/voices — List available Kling TTS voices ─────────
  router.get('/voices', async (_req: Request, res: Response) => {
    // Static mapping of recommended voices for Living Codex guides
    // Full list at: klingai.com/api/lip/sync/ttsList
    const voices = {
      recommended: {
        kore: { timbre: 'Gentle Lady', description: 'Warm, wise counselor' },
        aoede: { timbre: 'Storyteller', description: 'Creative, expressive' },
        leda: { timbre: 'Sweet Lady', description: 'Nurturing, compassionate' },
        theia: { timbre: 'Calm Lady', description: 'Grounded, soothing' },
        selene: { timbre: 'Intellectual Lady', description: 'Scholarly, clear' },
        zephyr: { timbre: 'Commercial Lady', description: 'Warm, energetic' },
      },
      available: [
        'Gentle Lady', 'Sweet Lady', 'Calm Lady', 'Intellectual Lady',
        'Commercial Lady', 'Storyteller', 'Narrator', 'Rock',
        'Warm Man', 'Professional Man',
      ],
    };

    return res.json(voices);
  });

  return router;
}
