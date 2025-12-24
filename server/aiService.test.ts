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

describe('AI Service - Content Suggestions', () => {
  it('should generate content suggestions based on existing articles', async () => {
    const { generateContentSuggestions } = await import('./aiService');
    
    const existingArticles = [
      { title: 'Leadership in 2025', content: 'Modern leadership approaches for sovereign leaders' },
      { title: 'Empowerment Strategies', content: 'Strategies for personal growth and transformation' }
    ];

    const result = await generateContentSuggestions(existingArticles);

    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    result.forEach(suggestion => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });
  }, 20000);

  it('should return properly structured suggestions', async () => {
    const { generateContentSuggestions } = await import('./aiService');
    
    const existingArticles = [
      { title: 'Test Article', content: 'Test content about empowerment' }
    ];

    const result = await generateContentSuggestions(existingArticles);

    expect(result).toBeInstanceOf(Array);
    result.forEach(suggestion => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });
  }, 20000);
});

describe('AI Service - Bulk Alt Text Generation', () => {
  it('should generate alt text for multiple images', async () => {
    const { generateBulkAltText } = await import('./aiService');
    
    const imageUrls = [
      'https://example.com/leadership-image.jpg',
      'https://example.com/empowerment-image.jpg'
    ];

    const result = await generateBulkAltText(imageUrls);

    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBe(imageUrls.length);
    
    result.forEach((item) => {
      expect(item).toHaveProperty('url');
      expect(item).toHaveProperty('altText');
      expect(typeof item.url).toBe('string');
      expect(typeof item.altText).toBe('string');
      expect(item.altText.length).toBeGreaterThan(0);
    });
  }, 20000);

  it('should handle empty image list', async () => {
    const { generateBulkAltText } = await import('./aiService');
    
    const result = await generateBulkAltText([]);

    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBe(0);
  });
});
