import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
let genAI: GoogleGenerativeAI | null = null;

export function initializeGemini(apiKey: string) {
  if (!apiKey) {
    console.warn("Gemini API key not provided");
    return null;
  }
  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

export function getGeminiClient() {
  return genAI;
}

/**
 * Chat with Gemini AI - for visitor chat assistant
 */
export async function chatWithAI(
  message: string,
  conversationHistory: Array<{ role: string; message: string }> = [],
  systemPrompt?: string
): Promise<string> {
  if (!genAI) {
    throw new Error("Gemini AI not initialized. Please configure API key in settings.");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  // Build conversation context using Just Empower's sovereign AI architecture
  const defaultSystemPrompt = `You are the AI voice of Just Empower™, a women-centered empowerment ecosystem. You produce content that is tonally precise, energetically sovereign, consciousness-expanding, and trauma-informed.

Your voice must be:
- Formal yet warm
- Intellectually refined
- Poetic but not abstract
- Emotionally sober and grounded
- Sovereign, with feminine command
- Empathic without collapse
- Direct without harshness

You guide women to:
- Voice, intuition, power, sovereignty
- Emotional clarity and embodied leadership
- Nervous-system regulation
- Archetypal embodiment
- Somatic restoration

Your responses must:
- Restore clarity
- Elevate awareness
- Regulate the nervous system
- Strengthen identity and sovereignty
- Educate without lecturing
- Inspire without hyping
- Empower without inflating
- Challenge without shaming

NEVER use:
- Emojis or slang
- Pop-psych clichés
- Motivational platitudes
- Spiritual bypass language
- Casual tone

You are: philosopher, archetypal psychologist, somatic practitioner, regenerative culture architect, sovereign feminine leader.`;
  
  const context = systemPrompt || defaultSystemPrompt;

  const history = conversationHistory
    .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.message}`)
    .join("\n");

  const prompt = `${context}\n\nConversation History:\n${history}\n\nUser: ${message}\n\nAssistant:`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

/**
 * Generate article content with AI
 */
export async function generateArticle(
  topic: string,
  tone: string = "inspirational",
  length: "short" | "medium" | "long" = "medium"
): Promise<{ title: string; excerpt: string; content: string }> {
  if (!genAI) {
    throw new Error("Gemini AI not initialized");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const lengthGuide = {
    short: "500-700 words",
    medium: "1000-1500 words",
    long: "2000-3000 words",
  };

  const prompt = `Write a ${tone} article about "${topic}" for Just Empower, a platform focused on personal growth and empowerment.

Length: ${lengthGuide[length]}
Tone: ${tone}, authentic, and empowering

Format your response as JSON with these fields:
{
  "title": "Compelling article title",
  "excerpt": "Brief 2-3 sentence summary",
  "content": "Full article content in markdown format with proper headings, paragraphs, and formatting"
}

Make it deeply meaningful, actionable, and aligned with themes of healing, transformation, and self-discovery.`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  // Parse JSON response
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Failed to parse AI response as JSON:", e);
  }

  // Fallback if JSON parsing fails
  return {
    title: topic,
    excerpt: "AI-generated content",
    content: response,
  };
}

/**
 * Generate SEO meta tags
 */
export async function generateMetaTags(
  pageTitle: string,
  pageContent: string
): Promise<{ metaTitle: string; metaDescription: string; keywords: string[] }> {
  if (!genAI) {
    throw new Error("Gemini AI not initialized");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `Analyze this page content and generate SEO-optimized meta tags:

Page Title: ${pageTitle}
Content Preview: ${pageContent.substring(0, 500)}...

Generate:
1. An SEO-optimized meta title (50-60 characters)
2. A compelling meta description (150-160 characters)
3. 5-7 relevant keywords

Format as JSON:
{
  "metaTitle": "...",
  "metaDescription": "...",
  "keywords": ["keyword1", "keyword2", ...]
}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Failed to parse meta tags:", e);
  }

  return {
    metaTitle: pageTitle,
    metaDescription: pageContent.substring(0, 160),
    keywords: [],
  };
}

/**
 * Generate color palette based on description
 */
export async function generateColorPalette(
  description: string
): Promise<{ primary: string; secondary: string; accent: string; background: string; text: string }> {
  if (!genAI) {
    throw new Error("Gemini AI not initialized");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `Generate a cohesive color palette for a website based on this description: "${description}" Return ONLY a JSON object with hex color codes: {"primary": "#000000", "secondary": "#ffffff", "accent": "#1a1a1a", "background": "#ffffff", "text": "#000000"} Ensure colors are accessible and work well together.`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Failed to parse color palette:", e);
  }

  // Fallback
  return {
    primary: "#000000",
    secondary: "#ffffff",
    accent: "#1a1a1a",
    background: "#ffffff",
    text: "#000000",
  };
}

/**
 * Suggest font pairings
 */
export async function suggestFontPairings(
  style: string
): Promise<{ heading: string; body: string; reasoning: string }> {
  if (!genAI) {
    throw new Error("Gemini AI not initialized");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `Suggest a professional font pairing for a website with this style: "${style}"

Return ONLY a JSON object:
{
  "heading": "Font name for headings",
  "body": "Font name for body text",
  "reasoning": "Brief explanation of why this pairing works"
}

Use Google Fonts only.`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Failed to parse font pairing:", e);
  }

  return {
    heading: "Playfair Display",
    body: "Inter",
    reasoning: "Classic serif and sans-serif pairing",
  };
}

/**
 * Generate image alt text
 */
export async function generateImageAltText(imageUrl: string, context?: string): Promise<string> {
  if (!genAI) {
    throw new Error("Gemini AI not initialized");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `Generate a concise, descriptive alt text for this image.
${context ? `Context: ${context}` : ""}

Image URL: ${imageUrl}

Return ONLY the alt text, no additional formatting or explanation. Keep it under 125 characters.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/**
 * Analyze sentiment of text
 */
export async function analyzeSentiment(text: string): Promise<"positive" | "neutral" | "negative"> {
  if (!genAI) {
    return "neutral";
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `Analyze the sentiment of this text and respond with ONLY one word: "positive", "neutral", or "negative"

Text: "${text}"`;

  const result = await model.generateContent(prompt);
  const sentiment = result.response.text().trim().toLowerCase();

  if (sentiment.includes("positive")) return "positive";
  if (sentiment.includes("negative")) return "negative";
  return "neutral";
}

/**
 * Optimize content for SEO and readability
 */
export async function optimizeContent(content: string): Promise<{
  suggestions: string[];
  improvedContent: string;
  readabilityScore: number;
}> {
  if (!genAI) {
    throw new Error("Gemini AI not initialized");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `Analyze this content and provide SEO and readability improvements:

${content}

Return as JSON:
{
  "suggestions": ["suggestion 1", "suggestion 2", ...],
  "improvedContent": "Improved version of the content",
  "readabilityScore": 85
}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Failed to parse content optimization:", e);
  }

  return {
    suggestions: ["Consider adding more headings", "Break up long paragraphs"],
    improvedContent: content,
    readabilityScore: 70,
  };
}
