import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

let ttsModel: any = null;
let modelLoading = false;
let modelError: string | null = null;
const CACHE_DIR = '/tmp/tts-cache';
const PREVIEW_DIR = '/tmp/tts-previews';
let previewsReady = false;

try { fs.mkdirSync(CACHE_DIR, { recursive: true }); } catch {}
try { fs.mkdirSync(PREVIEW_DIR, { recursive: true }); } catch {}

const VOICES: Record<string,string> = {
  af_kore:'Kore. Contemplative and wise.', af_aoede:'Aoede. Reflective and artistic.',
  af_heart:'Heart. Warm and compassionate.', af_bella:'Bella. Gentle and soothing.',
  af_sarah:'Sarah. Clear and professional.', af_nova:'Nova. Bright and energetic.',
  af_jessica:'Jessica. Friendly and approachable.', af_nicole:'Nicole. Natural and expressive.',
  af_sky:'Sky. Ethereal and serene.', af_river:'River. Flowing and gentle.',
  af_alloy:'Alloy. Crisp and modern.', am_fenrir:'Fenrir. Deep and powerful.',
  am_puck:'Puck. Playful and clever.', am_adam:'Adam. Confident and steady.',
  am_echo:'Echo. Resonant and contemplative.', am_eric:'Eric. Warm and natural.',
  am_liam:'Liam. Friendly and clear.', am_michael:'Michael. Professional and calm.',
  am_onyx:'Onyx. Rich and sophisticated.', am_santa:'Santa. Warm and jolly.',
  bf_emma:'Emma. Sophisticated and refined.', bf_isabella:'Isabella. Elegant and poised.',
  bf_lily:'Lily. Gentle and sweet.', bf_alice:'Alice. Clear and articulate.',
  bm_daniel:'Daniel. Authoritative and distinguished.', bm_fable:'Fable. Whimsical and engaging.',
  bm_george:'George. Cultured and refined.', bm_lewis:'Lewis. Warm and genuine.',
};

async function initializeModel() {
  if (ttsModel || modelLoading) return;
  modelLoading = true;
  try {
    console.log('[TTS] Loading Kokoro model...');
    const start = Date.now();
    const { KokoroTTS } = await import('kokoro-js');
    ttsModel = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
      dtype: 'q4', device: 'cpu',
    });
    console.log(`[TTS] Model loaded in ${((Date.now() - start) / 1000).toFixed(1)}s`);
    modelLoading = false;
    preGenerate().catch(e => console.warn('[TTS] Preview pre-gen error:', e));
  } catch (error) {
    modelLoading = false;
    modelError = error instanceof Error ? error.message : String(error);
    console.error('[TTS] Model load failed:', error);
  }
}

async function preGenerate() {
  console.log('[TTS] Pre-generating voice previews...');
  for (const [id, desc] of Object.entries(VOICES)) {
    const file = path.join(PREVIEW_DIR, `${id}.wav`);
    if (fs.existsSync(file)) continue;
    try {
      const audio = await ttsModel.generate(`Hello, I am ${desc}`, { voice: id });
      const blob = audio.toBlob() as Blob;
      fs.writeFileSync(file, Buffer.from(await blob.arrayBuffer()));
      console.log(`[TTS] Preview: ${id} done`);
    } catch (e) { console.warn(`[TTS] Preview ${id} failed:`, e); }
  }
  previewsReady = true;
  console.log('[TTS] All previews ready');
}

function cacheKey(text: string, voice: string, speed: number) {
  const h = crypto.createHash('sha256').update(`${text}|${voice}|${speed}`).digest('hex').slice(0, 16);
  return path.join(CACHE_DIR, `${h}.wav`);
}

export function createTTSRouter() {
  const router = express.Router();
  initializeModel();

  router.get('/status', (_req, res) => {
    res.json({ ready: !!ttsModel, loading: modelLoading, error: modelError, previews: previewsReady });
  });

  router.get('/preview/:voiceId', (req, res) => {
    const file = path.join(PREVIEW_DIR, `${req.params.voiceId}.wav`);
    if (fs.existsSync(file)) {
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return fs.createReadStream(file).pipe(res);
    }
    res.status(404).json({ error: 'Preview not ready yet' });
  });

  router.post('/generate', async (req, res) => {
    const { text, voice = 'af_heart', speed = 1 } = req.body;
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text required' });
    if (!ttsModel) return res.status(503).json({ error: 'TTS not ready', loading: modelLoading });

    const cached = cacheKey(text.trim(), voice, speed);
    if (fs.existsSync(cached)) {
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('X-TTS-Cache', 'hit');
      return fs.createReadStream(cached).pipe(res);
    }

    try {
      const audio = await ttsModel.generate(text.trim(), { voice, speed });
      const blob = audio.toBlob() as Blob;
      const buf = Buffer.from(await blob.arrayBuffer());
      try { fs.writeFileSync(cached, buf); } catch {}
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('X-TTS-Cache', 'miss');
      res.send(buf);
    } catch (error) {
      console.error('[TTS] Generate failed:', error);
      res.status(500).json({ error: 'TTS generation failed' });
    }
  });

  return router;
}
