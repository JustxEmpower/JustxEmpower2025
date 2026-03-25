import express from 'express';

/**
 * Simli session token proxy — keeps API key server-side.
 * Client calls POST /api/simli/token with { faceId } to get a session token.
 */
export function createSimliRouter() {
  const router = express.Router();

  router.post('/token', async (req, res) => {
    const apiKey = process.env.SIMLI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'SIMLI_API_KEY not configured' });
    }

    const { faceId, maxSessionLength = 600, maxIdleTime = 180 } = req.body;
    if (!faceId) {
      return res.status(400).json({ error: 'faceId required' });
    }

    try {
      const response = await fetch('https://api.simli.ai/compose/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-simli-api-key': apiKey,
        },
        body: JSON.stringify({
          faceId,
          maxSessionLength,
          maxIdleTime,
          handleSilence: true,
          audioInputFormat: 'pcm16',
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`[Simli] Token request failed: ${response.status} ${text}`);
        return res.status(response.status).json({ error: `Simli API error: ${response.status}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('[Simli] Token request error:', error);
      res.status(500).json({ error: 'Failed to get Simli session token' });
    }
  });

  router.get('/ice-servers', async (_req, res) => {
    const apiKey = process.env.SIMLI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'SIMLI_API_KEY not configured' });
    }

    try {
      const response = await fetch('https://api.simli.ai/compose/ice', {
        headers: { 'x-simli-api-key': apiKey },
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to get ICE servers' });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('[Simli] ICE servers error:', error);
      res.status(500).json({ error: 'Failed to get ICE servers' });
    }
  });

  // Create a face from an image URL
  router.post('/create-face', async (req, res) => {
    const apiKey = process.env.SIMLI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'SIMLI_API_KEY not configured' });
    }

    const { imageUrl, name } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl required' });
    }

    try {
      console.log(`[Simli] Creating face "${name}" from ${imageUrl}`);
      const response = await fetch('https://api.simli.ai/createFaceFromImageURL', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-simli-api-key': apiKey,
        },
        body: JSON.stringify({ imageUrl, name: name || 'avatar' }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`[Simli] Create face failed: ${response.status} ${text}`);
        return res.status(response.status).json({ error: text });
      }

      const data = await response.json();
      console.log(`[Simli] Face created:`, data);
      res.json(data);
    } catch (error) {
      console.error('[Simli] Create face error:', error);
      res.status(500).json({ error: 'Failed to create face' });
    }
  });

  // List faces on the account
  router.get('/faces', async (_req, res) => {
    const apiKey = process.env.SIMLI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'SIMLI_API_KEY not configured' });
    }

    try {
      const response = await fetch('https://api.simli.ai/faces', {
        headers: { 'x-simli-api-key': apiKey },
      });

      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({ error: text });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('[Simli] List faces error:', error);
      res.status(500).json({ error: 'Failed to list faces' });
    }
  });

  // Batch create faces for all guides from S3 avatar images
  router.post('/create-all-faces', async (req, res) => {
    const apiKey = process.env.SIMLI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'SIMLI_API_KEY not configured' });
    }

    // Use the deployed site's public assets for portrait images
    const SITE_BASE = process.env.SITE_URL || 'https://justxempower.com';
    const guides = ['kore', 'aoede', 'leda', 'theia', 'selene', 'zephyr'];
    const results: Record<string, any> = {};

    for (const guide of guides) {
      const imageUrl = `${SITE_BASE}/assets/avatars/${guide}-prime/portrait-${guide}.png`;
      try {
        console.log(`[Simli] Creating face for ${guide} from ${imageUrl}`);
        const response = await fetch('https://api.simli.ai/createFaceFromImageURL', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-simli-api-key': apiKey,
          },
          body: JSON.stringify({ imageUrl, name: `justxempower-${guide}` }),
        });

        if (response.ok) {
          results[guide] = await response.json();
          console.log(`[Simli] Face for ${guide}:`, results[guide]);
        } else {
          const text = await response.text();
          results[guide] = { error: `${response.status}: ${text}` };
          console.error(`[Simli] Face ${guide} failed: ${text}`);
        }
      } catch (error) {
        results[guide] = { error: String(error) };
      }
    }

    res.json({ results });
  });

  return router;
}
