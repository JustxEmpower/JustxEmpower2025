import { describe, it, expect, beforeAll } from 'vitest';
import { initializeGemini, chatWithAI, generateColorPalette } from './aiService';

describe('Gemini AI Integration', () => {
  beforeAll(() => {
    // Initialize Gemini with API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found in environment');
    }
    initializeGemini(apiKey);
  });

  it('should initialize Gemini AI client', () => {
    const apiKey = process.env.GEMINI_API_KEY;
    const client = initializeGemini(apiKey!);
    expect(client).toBeDefined();
  });

  it('should generate a response from chat AI', async () => {
    const response = await chatWithAI('Hello, can you help me?', []);
    expect(response).toBeDefined();
    expect(typeof response).toBe('string');
    expect(response.length).toBeGreaterThan(0);
  }, 15000); // 15 second timeout for API call

  it('should generate a color palette', async () => {
    const palette = await generateColorPalette('warm and earthy tones for a wellness brand');
    expect(palette).toBeDefined();
    expect(palette.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(palette.secondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(palette.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(palette.background).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(palette.text).toMatch(/^#[0-9A-Fa-f]{6}$/);
  }, 15000);
});
