import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

let ttsModel: any = null;
let modelLoading = false;
let modelError: string | null = null;
const CACHE_DIR = '/tmp/tts-cache';

try { fs.mkdirSync(CACHE_DIR, { recursive: true }); } catch {}

async function initializeModel() {
  if (ttsModel || modelLoading) return;
  modelLoading = true;
  try {
    console.log('[TTS] Loading Kokoro model...');
    const start = Date.now();
    const { KokoroTTS } = await import('kokoro-js');
    ttsModel = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
      dtype: 'q8', device: 'cpu',
    });
    console.log(`[TTS] Model loaded in ${((Date.now() - start) / 1000).toFixed(1)}s`);
    modelLoading = false;
  } catch (error) {
    modelLoading = false;
    modelError = error instanceof Error ? error.message : String(error);
    console.error('[TTS] Model load failed:', error);
  }
}

function cacheKey(text: string, voice: string, speed: number) {
  const h = crypto.createHash('sha256').update(`${text}|${voice}|${speed}`).digest('hex').slice(0, 16);
  return path.join(CACHE_DIR, `${h}.wav`);
}

export function createTTSRouter() {
  const router = express.Router();
  initializeModel();

  router.get('/status', (_req, res) => {
    res.json({ ready: !!ttsModel, loading: modelLoading, error: modelError });
  });

  router.post('/generate', async (req, res) => {
    const { text, voice = 'af_heart', speed = 1 } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required' });
    }
    if (!ttsModel) {
      return res.status(503).json({ error: 'TTS model not ready', loading: modelLoading });
    }

    const cached = cacheKey(text.trim(), voice, speed);
    if (fs.existsSync(cached)) {
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('X-TTS-Cache', 'hit');
      return fs.createReadStream(cached).pipe(res);
    }

    try {
      const rawAudio = await ttsModel.generate(text.trim(), { voice, speed });
      const blob = rawAudio.toBlob() as Blob;
      const buffer = Buffer.from(await blob.arrayBuffer());

      // Cache to disk
      try { fs.writeFileSync(cached, buffer); } catch {}

      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('X-TTS-Cache', 'miss');
      res.send(buffer);
    } catch (error) {
      console.error('[TTS] Generate failed:', error);
      res.status(500).json({ error: 'TTS generation failed' });
    }
  });

  return router;
}
