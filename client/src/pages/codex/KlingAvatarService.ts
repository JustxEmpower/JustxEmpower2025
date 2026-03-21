/**
 * KlingAvatarService.ts
 *
 * Kling AI Avatar integration for Living Codex™ holographic guide system.
 * Uses PiAPI's Kling API to generate lifelike talking avatar videos from:
 *   - A portrait image (LoRA-generated founder or diverse preset)
 *   - Audio input (Kokoro TTS output or pre-recorded)
 *
 * Two avatar display modes:
 *   1. ORB — holographic energy orb (procedural Three.js)
 *   2. LIFELIKE — Kling AI video avatar (lip-synced, 1080p/48fps)
 *
 * Architecture:
 *   Client → Server proxy (/api/kling/*) → PiAPI (api.piapi.ai)
 *   API key is stored server-side only, never exposed to browser.
 *
 * @module codex/KlingAvatarService
 */

// ============================================================================
// Types
// ============================================================================

export type AvatarDisplayMode = 'orb' | 'lifelike';

export type KlingTaskStatus = 'Completed' | 'Processing' | 'Pending' | 'Failed' | 'Staged';

export type KlingMode = 'std' | 'pro';

export interface KlingTaskResponse {
  task_id: string;
  status: KlingTaskStatus;
  output?: {
    video?: string;
    video_url?: string;
  };
  error?: {
    code: number;
    message: string;
  };
  meta?: {
    created_at: string;
    started_at: string;
    ended_at: string;
    usage?: {
      type: string;
      frozen: number;
      consume: number;
    };
  };
}

export interface LipSyncRequest {
  /** URL to portrait image (hosted, publicly accessible) */
  imageUrl: string;
  /** Audio file URL (mp3/wav/flac/ogg, <20MB, <60s) */
  audioUrl?: string;
  /** Text for Kling's built-in TTS (alternative to audioUrl) */
  ttsText?: string;
  /** Voice timbre for Kling TTS */
  ttsTimbre?: string;
  /** Speech speed for Kling TTS (0.8–2.0, default 1) */
  ttsSpeed?: number;
  /** Quality mode */
  mode?: KlingMode;
}

export interface AvatarVideoRequest {
  /** URL to portrait image */
  imageUrl: string;
  /** Audio file URL for lip-sync */
  audioUrl?: string;
  /** Text for Kling TTS */
  ttsText?: string;
  /** Voice timbre */
  ttsTimbre?: string;
  /** Quality mode */
  mode?: KlingMode;
  /** Optional text prompt for scene/style guidance */
  prompt?: string;
}

export interface IdleVideoRequest {
  /** URL to portrait image */
  imageUrl: string;
  /** Prompt describing subtle idle motion */
  prompt: string;
  /** Video duration in seconds */
  duration?: 5 | 10;
  /** Quality mode */
  mode?: KlingMode;
}

/** Cached video entry for a guide */
export interface CachedAvatarVideo {
  guideId: string;
  type: 'idle' | 'speaking' | 'listening';
  videoUrl: string;
  createdAt: number;
  expiresAt: number;
}

// ============================================================================
// Guide Video Prompts (for idle/ambient animations)
// ============================================================================

export const GUIDE_IDLE_PROMPTS: Record<string, string> = {
  kore: 'A woman standing calmly in a sacred temple space, gentle breathing, soft natural head sway, warm golden ambient light, serene wise expression, subtle blink, photorealistic',
  aoede: 'A woman standing in a creative studio with mirrors, gentle breathing, soft natural head movement, purple-violet ambient light, inspired thoughtful expression, subtle blink, photorealistic',
  leda: 'A woman sitting in a warm garden alcove, gentle breathing, soft natural movement, golden hour light, compassionate gentle expression, subtle blink, photorealistic',
  theia: 'A woman standing among ancient mossy stones in a misty forest, gentle breathing, soft natural sway, diffused green forest light, grounded peaceful expression, subtle blink, photorealistic',
  selene: 'A woman standing in a grand library, gentle breathing, soft natural head tilt, warm lamp light, scholarly contemplative expression, subtle blink, photorealistic',
  zephyr: 'A woman standing on a sunset terrace, gentle breathing, soft natural movement, golden sunset light, warm welcoming expression, subtle blink, photorealistic',
};

export const GUIDE_LISTENING_PROMPTS: Record<string, string> = {
  kore: 'A woman listening attentively with slight head nods, warm golden light, engaged wise expression, gentle micro-expressions, photorealistic',
  aoede: 'A woman listening with creative curiosity, slight head tilts, purple studio light, intrigued artistic expression, photorealistic',
  leda: 'A woman listening with deep compassion, gentle nodding, warm garden light, nurturing empathetic expression, photorealistic',
  theia: 'A woman listening with grounded presence, steady gaze, soft forest light, healing attentive expression, photorealistic',
  selene: 'A woman listening thoughtfully, slight eyebrow raise, warm library light, scholarly engaged expression, photorealistic',
  zephyr: 'A woman listening with warm encouragement, gentle smiling nods, sunset light, welcoming supportive expression, photorealistic',
};

// ============================================================================
// Kling TTS Voice Catalog (for built-in Kling TTS)
// ============================================================================

export const KLING_TTS_VOICES: Record<string, { timbre: string; description: string }> = {
  kore: { timbre: 'Gentle Lady', description: 'Warm, wise counselor voice' },
  aoede: { timbre: 'Storyteller', description: 'Creative, expressive artist voice' },
  leda: { timbre: 'Sweet Lady', description: 'Nurturing, compassionate companion voice' },
  theia: { timbre: 'Calm Lady', description: 'Grounded, soothing healer voice' },
  selene: { timbre: 'Intellectual Lady', description: 'Scholarly, clear librarian voice' },
  zephyr: { timbre: 'Commercial Lady', description: 'Warm, energetic connector voice' },
};

// ============================================================================
// Service Class
// ============================================================================

/**
 * KlingAvatarService
 *
 * Manages all communication with the server-side Kling proxy.
 * Handles task creation, polling, caching, and video lifecycle.
 */
export class KlingAvatarService {
  private cache: Map<string, CachedAvatarVideo> = new Map();
  private activePolls: Map<string, AbortController> = new Map();
  private baseUrl: string;

  /** Cache TTL: 30 minutes for idle videos, 10 minutes for speaking videos */
  private static IDLE_CACHE_TTL = 30 * 60 * 1000;
  private static SPEAKING_CACHE_TTL = 10 * 60 * 1000;

  /** Polling interval: 3 seconds */
  private static POLL_INTERVAL = 3000;

  /** Max polling duration: 5 minutes */
  private static MAX_POLL_DURATION = 5 * 60 * 1000;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  // --------------------------------------------------------------------------
  // Core API Methods (call server proxy)
  // --------------------------------------------------------------------------

  /**
   * Generate a lip-synced talking avatar video.
   * The portrait image + audio/TTS → Kling produces a lifelike video.
   */
  async generateSpeakingVideo(request: LipSyncRequest): Promise<string> {
    const taskId = await this.createLipSyncTask(request);
    return this.pollUntilComplete(taskId);
  }

  /**
   * Generate an idle/ambient animation loop from a portrait.
   * Used for when the guide is waiting, not speaking.
   */
  async generateIdleVideo(guideId: string, imageUrl: string, mode: KlingMode = 'std'): Promise<string> {
    // Check cache first
    const cacheKey = `idle-${guideId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.videoUrl;
    }

    const prompt = GUIDE_IDLE_PROMPTS[guideId] || GUIDE_IDLE_PROMPTS.kore;
    const taskId = await this.createIdleVideoTask({ imageUrl, prompt, duration: 10, mode });
    const videoUrl = await this.pollUntilComplete(taskId);

    // Cache the idle video
    this.cache.set(cacheKey, {
      guideId,
      type: 'idle',
      videoUrl,
      createdAt: Date.now(),
      expiresAt: Date.now() + KlingAvatarService.IDLE_CACHE_TTL,
    });

    return videoUrl;
  }

  /**
   * Generate a listening animation from a portrait.
   */
  async generateListeningVideo(guideId: string, imageUrl: string, mode: KlingMode = 'std'): Promise<string> {
    const cacheKey = `listening-${guideId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.videoUrl;
    }

    const prompt = GUIDE_LISTENING_PROMPTS[guideId] || GUIDE_LISTENING_PROMPTS.kore;
    const taskId = await this.createIdleVideoTask({ imageUrl, prompt, duration: 10, mode });
    const videoUrl = await this.pollUntilComplete(taskId);

    this.cache.set(cacheKey, {
      guideId,
      type: 'listening',
      videoUrl,
      createdAt: Date.now(),
      expiresAt: Date.now() + KlingAvatarService.IDLE_CACHE_TTL,
    });

    return videoUrl;
  }

  /**
   * Pre-warm cache by generating idle + listening videos for a guide.
   * Call this when a guide is selected, before the user starts interacting.
   */
  async prewarmGuide(guideId: string, imageUrl: string, mode: KlingMode = 'std'): Promise<void> {
    await Promise.all([
      this.generateIdleVideo(guideId, imageUrl, mode),
      this.generateListeningVideo(guideId, imageUrl, mode),
    ]);
  }

  // --------------------------------------------------------------------------
  // Task Creation (server proxy calls)
  // --------------------------------------------------------------------------

  private async createLipSyncTask(request: LipSyncRequest): Promise<string> {
    const body: Record<string, unknown> = {
      model: 'kling',
      task_type: 'lip_sync',
      input: {
        image_url: request.imageUrl,
        ...(request.audioUrl ? { local_dubbing_url: request.audioUrl } : {}),
        ...(request.ttsText ? { tts_text: request.ttsText } : {}),
        ...(request.ttsTimbre ? { tts_timbre: request.ttsTimbre } : {}),
        ...(request.ttsSpeed ? { tts_speed: request.ttsSpeed } : {}),
      },
      config: {
        service_mode: 'public',
      },
    };

    const response = await fetch(`${this.baseUrl}/api/kling/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Kling task creation failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.code !== 200 || !data.data?.task_id) {
      throw new Error(`Kling API error: ${data.message || 'Unknown error'}`);
    }

    return data.data.task_id;
  }

  private async createIdleVideoTask(request: IdleVideoRequest): Promise<string> {
    const body: Record<string, unknown> = {
      model: 'kling',
      task_type: 'video_generation',
      input: {
        prompt: request.prompt,
        image_url: request.imageUrl,
        duration: request.duration || 10,
        mode: request.mode || 'std',
        version: '2.6',
        cfg_scale: '0.5',
        negative_prompt: 'blurry, distorted face, extra limbs, deformed, ugly, cartoon, anime, nsfw',
      },
      config: {
        service_mode: 'public',
      },
    };

    const response = await fetch(`${this.baseUrl}/api/kling/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Kling task creation failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.code !== 200 || !data.data?.task_id) {
      throw new Error(`Kling API error: ${data.message || 'Unknown error'}`);
    }

    return data.data.task_id;
  }

  private async createAvatarVideoTask(request: AvatarVideoRequest): Promise<string> {
    const body: Record<string, unknown> = {
      model: 'kling',
      task_type: 'lip_sync',
      input: {
        image_url: request.imageUrl,
        ...(request.audioUrl ? { local_dubbing_url: request.audioUrl } : {}),
        ...(request.ttsText ? { tts_text: request.ttsText } : {}),
        ...(request.ttsTimbre ? { tts_timbre: request.ttsTimbre } : {}),
        ...(request.prompt ? { prompt: request.prompt } : {}),
      },
      config: {
        service_mode: 'public',
      },
    };

    const response = await fetch(`${this.baseUrl}/api/kling/task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Kling avatar task failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.code !== 200 || !data.data?.task_id) {
      throw new Error(`Kling API error: ${data.message || 'Unknown error'}`);
    }

    return data.data.task_id;
  }

  // --------------------------------------------------------------------------
  // Task Polling
  // --------------------------------------------------------------------------

  private async pollUntilComplete(taskId: string): Promise<string> {
    const controller = new AbortController();
    this.activePolls.set(taskId, controller);
    const startTime = Date.now();

    try {
      while (!controller.signal.aborted) {
        if (Date.now() - startTime > KlingAvatarService.MAX_POLL_DURATION) {
          throw new Error(`Kling task ${taskId} timed out after 5 minutes`);
        }

        const response = await fetch(`${this.baseUrl}/api/kling/task/${taskId}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Kling poll failed: ${response.status}`);
        }

        const data = await response.json();
        const task: KlingTaskResponse = data.data;

        switch (task.status) {
          case 'Completed': {
            const videoUrl = task.output?.video || task.output?.video_url;
            if (!videoUrl) {
              throw new Error('Kling task completed but no video URL in output');
            }
            return videoUrl;
          }
          case 'Failed':
            throw new Error(`Kling task failed: ${task.error?.message || 'Unknown error'}`);
          case 'Processing':
          case 'Pending':
          case 'Staged':
            // Keep polling
            break;
        }

        await new Promise((resolve) => setTimeout(resolve, KlingAvatarService.POLL_INTERVAL));
      }
      throw new Error('Polling aborted');
    } finally {
      this.activePolls.delete(taskId);
    }
  }

  // --------------------------------------------------------------------------
  // Lifecycle
  // --------------------------------------------------------------------------

  /** Cancel all active polling operations */
  cancelAll(): void {
    for (const [taskId, controller] of this.activePolls) {
      controller.abort();
    }
    this.activePolls.clear();
  }

  /** Clear the video cache */
  clearCache(): void {
    this.cache.clear();
  }

  /** Get cache stats */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

let _instance: KlingAvatarService | null = null;

export function getKlingAvatarService(baseUrl?: string): KlingAvatarService {
  if (!_instance) {
    _instance = new KlingAvatarService(baseUrl);
  }
  return _instance;
}

export default KlingAvatarService;
