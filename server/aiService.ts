import { GoogleGenerativeAI } from "@google/generative-ai";
import { VertexAI } from "@google-cloud/vertexai";
import { GoogleAuth } from 'google-auth-library';
import dns from 'dns';

// Force IPv4 for all DNS lookups - fixes IPv6 "Network is unreachable" on EC2
// This is needed because EC2 VPC doesn't have IPv6 connectivity to Google APIs
dns.setDefaultResultOrder('ipv4first');

// Initialize Gemini AI
let genAI: GoogleGenerativeAI | null = null;
let vertexAI: VertexAI | null = null;
let googleAuth: GoogleAuth | null = null;

export function initializeGemini(apiKey: string) {
  if (!apiKey) {
    console.warn("Gemini API key not provided");
    return null;
  }
  genAI = new GoogleGenerativeAI(apiKey);
  
  // Initialize Vertex AI for Imagen (requires GOOGLE_CLOUD_PROJECT env var)
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  if (projectId) {
    try {
      vertexAI = new VertexAI({ project: projectId, location: 'us-central1' });
      googleAuth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
      console.log('Vertex AI initialized for project:', projectId);
    } catch (e) {
      console.warn('Vertex AI initialization failed:', e);
    }
  }
  
  return genAI;
}

export function getGeminiClient() {
  return genAI;
}

/**
 * Load Gemini API key from database (aiSettings table) and initialize if needed
 */
export async function ensureGeminiFromDatabase(): Promise<boolean> {
  if (genAI) return true; // Already initialized
  
  try {
    // Dynamic import to avoid circular dependency
    const { getDb } = await import('./db');
    const schema = await import('../drizzle/schema');
    
    const db = await getDb();
    if (!db) return false;
    
    // Get from aiSettings table
    const [aiSetting] = await db.select().from(schema.aiSettings).limit(1);
    
    if (aiSetting?.geminiApiKey) {
      initializeGemini(aiSetting.geminiApiKey);
      return true;
    }
    
    // Fallback to environment variable
    const envKey = process.env.GEMINI_API_KEY;
    if (envKey) {
      initializeGemini(envKey);
      return true;
    }
    
    return false;
  } catch (e) {
    console.warn('Failed to load Gemini API key from database:', e);
    // Try environment variable as fallback
    const envKey = process.env.GEMINI_API_KEY;
    if (envKey) {
      initializeGemini(envKey);
      return true;
    }
    return false;
  }
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

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Build conversation context using Just Empower's sovereign AI architecture
  const defaultSystemPrompt = `You are the AI voice of Just Empower, a women-centered empowerment ecosystem. You produce content that is tonally precise, energetically sovereign, consciousness-expanding, and trauma-informed.

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
- Pop-psych cliches
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

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    // Fetch the image and convert to base64
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    
    // Determine image MIME type from URL or default to jpeg
    let mimeType = 'image/jpeg';
    if (imageUrl.endsWith('.png')) mimeType = 'image/png';
    else if (imageUrl.endsWith('.webp')) mimeType = 'image/webp';
    else if (imageUrl.endsWith('.gif')) mimeType = 'image/gif';

    const prompt = `Generate a concise, descriptive alt text for this image that would be helpful for screen readers and accessibility.
${context ? `Context: ${context}` : ""}

Return ONLY the alt text, no additional formatting or explanation. Keep it under 125 characters and focus on what's visually important in the image.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      }
    ]);
    
    return result.response.text().trim();
  } catch (error) {
    console.error('Error generating image alt text:', error);
    // Fallback to URL-based generation if image fetch fails
    const fallbackPrompt = `Based on this image URL, generate a descriptive alt text: ${imageUrl}
${context ? `Context: ${context}` : ""}
Keep it under 125 characters.`;
    const result = await model.generateContent(fallbackPrompt);
    return result.response.text().trim();
  }
}

/**
 * Analyze sentiment of text
 */
export async function analyzeSentiment(text: string): Promise<"positive" | "neutral" | "negative"> {
  if (!genAI) {
    return "neutral";
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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


/**
 * Generate article content from a topic
 */
export async function generateArticleContent(topic: string, tone?: string): Promise<string> {
  if (!genAI) {
    throw new Error("Gemini AI not initialized");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Ensure topic is ASCII-only by replacing non-ASCII characters
  const cleanTopic = topic.replace(/[^\x00-\x7F]/g, '');
  const cleanTone = tone ? tone.replace(/[^\x00-\x7F]/g, '') : undefined;

  const prompt = `Write a comprehensive blog article about "${cleanTopic}". ${cleanTone ? `Use a ${cleanTone} tone.` : 'Use a professional, engaging tone aligned with Just Empower voice: formal yet warm, intellectually refined, poetic but not abstract.'} 

Include:
- An engaging introduction that hooks the reader
- 3-4 main sections with descriptive subheadings
- Practical insights and actionable takeaways
- A compelling conclusion

Format in HTML with proper tags (<h2> for main sections, <h3> for subsections, <p> for paragraphs, <ul>/<li> for lists).`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Generate SEO meta description
 */
export async function generateMetaDescription(title: string, content: string): Promise<string> {
  if (!genAI) {
    throw new Error("Gemini AI not initialized");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const contentSummary = content.replace(/<[^>]*>/g, '').substring(0, 500);
  const prompt = `Write a compelling SEO meta description (150-160 characters) for a webpage with title "${title}". 

Content summary: ${contentSummary}...

Make it engaging, include relevant keywords, and ensure it's exactly 150-160 characters. Return ONLY the meta description text, no quotes or extra formatting.`;

  const result = await model.generateContent(prompt);
  const description = result.response.text().trim().replace(/"/g, '').replace(/\n/g, ' ');
  
  // Ensure it's within the 150-160 character range
  if (description.length > 160) {
    return description.substring(0, 157) + '...';
  }
  
  return description;
}

/**
 * Generate SEO metadata for a page using AI
 */
export async function generatePageSeo(title: string, slug: string): Promise<{ metaTitle: string; metaDescription: string }> {
  if (!genAI) {
    throw new Error("Gemini AI not initialized");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `Generate SEO metadata for a webpage about Just Empower, a women's empowerment and leadership organization.

Page Title: "${title}"
Page URL Slug: "${slug}"

Generate:
1. An SEO-optimized meta title (50-60 characters) that includes relevant keywords
2. A compelling meta description (150-160 characters) that encourages clicks

Context: Just Empower focuses on women's empowerment, leadership development, feminine wisdom, personal growth, and transformational coaching.

Respond in this exact JSON format:
{"metaTitle": "your title here", "metaDescription": "your description here"}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        metaTitle: parsed.metaTitle || title,
        metaDescription: parsed.metaDescription || `Learn about ${title} at Just Empower.`,
      };
    }
  } catch (error) {
    console.error("Error generating page SEO:", error);
  }

  // Fallback if AI fails
  return {
    metaTitle: `${title} | Just Empower`,
    metaDescription: `Discover ${title} at Just Empower - empowering women through leadership, wisdom, and transformational growth.`,
  };
}

/**
 * Extract topic from conversation message using Gemini AI
 */
export async function extractTopicFromMessage(message: string): Promise<string> {
  if (!genAI) {
    return "general";
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `Analyze this user message and extract the main topic in 1-2 words. Choose from these categories if applicable: leadership, empowerment, coaching, wellness, personal-growth, relationships, career, spirituality, trauma-healing, feminine-power, or use a brief custom topic.

Message: "${message}"

Respond with ONLY the topic (lowercase, hyphenated if 2 words). Example responses: "leadership", "personal-growth", "career-advice"`;

    const result = await model.generateContent(prompt);
    const topic = result.response.text().trim().toLowerCase();
    
    // Validate and clean the topic
    const cleanTopic = topic
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 50);
    
    return cleanTopic || "general";
  } catch (error) {
    console.error("Error extracting topic:", error);
    return "general";
  }
}


/**
 * Generate content suggestions based on existing articles
 * Analyzes themes and trends to suggest related topics
 */
export async function generateContentSuggestions(existingArticles: { title: string; content: string }[]): Promise<string[]> {
  if (!genAI) {
    throw new Error("Gemini AI is not initialized");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Prepare article summaries for analysis
    const articleSummaries = existingArticles
      .map((article, index) => `${index + 1}. ${article.title}`)
      .join('\n');

    const prompt = `You are a content strategist for Just Empower, a platform focused on women's empowerment, leadership, and personal transformation.

Analyze these existing articles:
${articleSummaries}

Based on the themes and topics covered, suggest 5 new article ideas that would:
1. Complement and expand on existing content
2. Fill gaps in the content strategy
3. Resonate with an audience interested in empowerment, healing, and leadership
4. Be timely and relevant to current trends

Format your response as a numbered list with just the article titles, one per line.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Parse the response into an array of suggestions
    const suggestions = response
      .split('\n')
      .filter(line => line.trim().match(/^\d+\./))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(suggestion => suggestion.length > 0)
      .slice(0, 5);

    return suggestions.length > 0 ? suggestions : [
      "The Power of Authentic Leadership",
      "Healing Through Community Connection",
      "Redefining Success on Your Own Terms",
      "The Art of Setting Boundaries",
      "Finding Your Voice in a Noisy World"
    ];
  } catch (error) {
    console.error("Error generating content suggestions:", error);
    // Return fallback suggestions
    return [
      "The Power of Authentic Leadership",
      "Healing Through Community Connection",
      "Redefining Success on Your Own Terms",
      "The Art of Setting Boundaries",
      "Finding Your Voice in a Noisy World"
    ];
  }
}

/**
 * Generate bulk alt text for multiple images
 * Processes images in parallel for efficiency
 */
export async function generateBulkAltText(imageUrls: string[]): Promise<{ url: string; altText: string }[]> {
  if (!genAI) {
    throw new Error("Gemini AI is not initialized");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Process images in batches of 5 to avoid rate limits
    const batchSize = 5;
    const results: { url: string; altText: string }[] = [];

    for (let i = 0; i < imageUrls.length; i += batchSize) {
      const batch = imageUrls.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (url) => {
        try {
          const prompt = `Generate a concise, descriptive alt text for this image. 
Focus on:
- What is visible in the image
- The mood or emotion conveyed
- Relevant context for accessibility
- Keep it under 125 characters

Respond with ONLY the alt text, no quotes or extra formatting.`;

          const imagePart = {
            inlineData: {
              data: await fetchImageAsBase64(url),
              mimeType: "image/jpeg"
            }
          };

          const result = await model.generateContent([prompt, imagePart]);
          const altText = result.response.text().trim().replace(/^["']|["']$/g, '');

          return { url, altText };
        } catch (error) {
          console.error(`Error generating alt text for ${url}:`, error);
          return { url, altText: "Image" };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add a small delay between batches
      if (i + batchSize < imageUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  } catch (error) {
    console.error("Error generating bulk alt text:", error);
    return imageUrls.map(url => ({ url, altText: "Image" }));
  }
}

/**
 * Helper function to fetch image and convert to base64
 */
async function fetchImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return base64;
}


/**
 * Generate page blocks based on a description
 * Returns an array of block configurations for the Page Builder
 */
export async function generatePageBlocks(
  description: string,
  pageType: 'landing' | 'about' | 'services' | 'contact' | 'blog' | 'custom' = 'custom'
): Promise<{
  title: string;
  blocks: Array<{
    type: string;
    props: Record<string, unknown>;
  }>;
}> {
  if (!genAI) {
    throw new Error("Gemini AI not initialized");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Comprehensive JE block types - ONLY JE BLOCKS
  const jeBlockTypes = `
IMPORTANT: You MUST ONLY use JE (Just Empower) block types. Do NOT use generic blocks.

Available JE Block Types:

=== HERO BLOCKS ===
1. "je-hero-video" - Full-screen video hero
   Props: { videoUrl: string, posterImage: string, title: string, subtitle: string, description: string, ctaText: string, ctaLink: string, overlayOpacity: number (0-100), textAlignment: "left"|"center"|"right", minHeight: string }

2. "je-hero-image" - Full-screen image hero
   Props: { imageUrl: string, title: string, subtitle: string, description: string, ctaText: string, ctaLink: string, overlayOpacity: number, textAlignment: string, minHeight: string }

3. "je-hero-split" - Split hero with image and content
   Props: { imageUrl: string, imagePosition: "left"|"right", title: string, subtitle: string, description: string, ctaText: string, ctaLink: string }

=== CONTENT BLOCKS ===
4. "je-section-standard" - Standard content section
   Props: { title: string, subtitle: string, content: string, backgroundColor: string, textAlignment: string }

5. "je-pillars" - Three foundational pillars
   Props: { title: string, pillars: [{ icon: "heart"|"compass"|"crown", title: string, description: string }] }

6. "je-principles" - Numbered principles
   Props: { title: string, principles: [{ number: string, title: string, description: string }] }

7. "je-heading" - Elegant heading
   Props: { text: string, level: "h1"|"h2"|"h3"|"h4", label: string, alignment: string }

8. "je-paragraph" - Styled paragraph
   Props: { content: string, alignment: string, maxWidth: string, fontSize: "sm"|"base"|"lg"|"xl" }

9. "je-blockquote" - Elegant quote
   Props: { quote: string, author: string, role: string, style: "simple"|"decorative"|"large" }

10. "je-two-column" - Two column layout
    Props: { imageUrl: string, imagePosition: "left"|"right", title: string, content: string, ctaText: string, ctaLink: string }

=== MEDIA BLOCKS ===
11. "je-image" - Image with JE styling
    Props: { src: string, alt: string, caption: string, aspectRatio: string }

12. "je-video" - Video player
    Props: { src: string, poster: string, title: string, autoplay: boolean }

13. "je-gallery" - Image gallery
    Props: { images: [{ src: string, alt: string, caption: string }], layout: "grid"|"masonry", columns: number }

14. "je-carousel" - Content carousel
    Props: { items: [{ imageUrl: string, title: string, description: string, link: string }], autoplay: boolean }

=== INTERACTIVE BLOCKS ===
15. "je-button" - Styled button
    Props: { text: string, link: string, variant: "primary"|"secondary"|"outline", size: "sm"|"md"|"lg", alignment: string }

16. "je-offerings-grid" - Offerings grid
    Props: { title: string, offerings: [{ title: string, description: string, imageUrl: string, link: string }], columns: number }

17. "je-testimonial" - Testimonial
    Props: { quote: string, author: string, role: string, avatar: string, style: "card"|"simple"|"featured" }

18. "je-newsletter" - Newsletter signup
    Props: { title: string, description: string, buttonText: string, backgroundColor: string }

19. "je-community-section" - Community section
    Props: { title: string, description: string, backgroundImage: string, ctaText: string, ctaLink: string }

20. "je-faq" - FAQ accordion
    Props: { title: string, items: [{ question: string, answer: string }] }

21. "je-contact-form" - Contact form
    Props: { title: string, description: string, fields: ["name", "email", "message"], submitText: string }

22. "je-team-member" - Team profile
    Props: { name: string, role: string, bio: string, imageUrl: string }

23. "je-footer" - Site footer
    Props: { tagline: string, copyright: string }

=== UTILITY BLOCKS ===
24. "je-divider" - Decorative divider
    Props: { style: "line"|"dots"|"ornament", color: string }

25. "je-spacer" - Vertical spacing
    Props: { height: "sm"|"md"|"lg"|"xl" }
`;

  const pageTypeGuidelines: Record<string, string> = {
    landing: "Include: je-hero-image/video, je-pillars or je-principles, je-offerings-grid, je-testimonial, je-newsletter, je-footer",
    about: "Include: je-hero-image, je-two-column for story, je-principles, je-team-member, je-blockquote, je-footer",
    services: "Include: je-hero-image, je-offerings-grid, je-two-column, je-testimonial, je-faq, je-newsletter, je-footer",
    contact: "Include: je-hero-image (minimal), je-contact-form, je-two-column with info, je-faq, je-footer",
    blog: "Include: je-hero-image, je-heading, je-paragraph blocks, je-blockquote, je-image, je-newsletter, je-footer",
    custom: "Analyze description and select appropriate JE blocks. Always start with hero and end with je-footer."
  };

  const prompt = `You are a web page designer for Just Empower, a premium women's empowerment organization.

USER REQUEST: "${description}"
PAGE TYPE: ${pageType}

${jeBlockTypes}

GUIDELINES FOR ${pageType.toUpperCase()} PAGE:
${pageTypeGuidelines[pageType]}

BRAND VOICE:
- Empowering, sophisticated, warm, transformative
- Colors: amber #D4A574, terracotta #C4A77D, sage #8B9A7D, cream #FAF8F5, charcoal #2D2D2D

CRITICAL RULES:
1. ONLY use JE block types (je-hero-video, je-hero-image, je-paragraph, etc.)
2. NEVER use generic blocks like "hero", "text", "cta"
3. Start with a hero block, end with je-footer
4. Generate 5-10 blocks
5. Use "" for imageUrl (leave empty, user will add their own)
6. Be PRECISE - match the user's specific requests exactly
7. Write compelling, on-brand content

Return ONLY valid JSON:
{
  "title": "Page Title",
  "blocks": [
    { "type": "je-hero-image", "props": { ... } },
    ...more JE blocks
  ]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.title || !Array.isArray(parsed.blocks)) {
      throw new Error("Invalid response structure");
    }
    
    // Filter to only JE blocks
    const validatedBlocks = parsed.blocks.filter((block: { type: string }) => {
      if (!block.type.startsWith('je-')) {
        console.warn(`Filtered out non-JE block: ${block.type}`);
        return false;
      }
      return true;
    });
    
    if (validatedBlocks.length === 0) {
      throw new Error("No valid JE blocks generated");
    }
    
    return { title: parsed.title, blocks: validatedBlocks };
  } catch (error) {
    console.error("Failed to parse AI page generation response:", error);
    return {
      title: "New Page",
      blocks: [
        {
          type: "je-hero-image",
          props: {
            imageUrl: "",
            title: "Welcome",
            subtitle: "Just Empower",
            description: description,
            ctaText: "Learn More",
            ctaLink: "/about",
            overlayOpacity: 40,
            textAlignment: "center",
            minHeight: "80vh"
          }
        },
        {
          type: "je-paragraph",
          props: {
            content: "Content will be added here based on your description.",
            alignment: "center",
            maxWidth: "65ch",
            fontSize: "lg"
          }
        },
        {
          type: "je-newsletter",
          props: {
            title: "Stay Connected",
            description: "Join our community.",
            buttonText: "Subscribe",
            backgroundColor: "#FAF8F5"
          }
        },
        {
          type: "je-footer",
          props: {
            tagline: "Where Empowerment Becomes Embodiment",
            copyright: "© 2025 Just Empower. All rights reserved."
          }
        }
      ]
    };
  }
}

/**
 * AI Code Assistant - Gemini-powered code editing features
 */
export async function codeAssistant(
  action: "explain" | "fix" | "improve" | "generate" | "refactor" | "comment" | "test" | "chat",
  code: string,
  context?: {
    fileName?: string;
    language?: string;
    selection?: string;
    prompt?: string;
    conversationHistory?: Array<{ role: string; content: string }>;
  }
): Promise<string> {
  // Lazy initialize Gemini if not already done
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key not configured. Please set GEMINI_API_KEY in environment.");
    }
    initializeGemini(apiKey);
  }
  
  if (!genAI) {
    throw new Error("Failed to initialize Gemini AI.");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const lang = context?.language || "TypeScript React";
  const fileName = context?.fileName || "unknown";

  const systemPrompts: Record<string, string> = {
    explain: `You are an expert code explainer. Analyze the following ${lang} code and provide a clear, concise explanation of what it does. Break down complex parts, explain the logic flow, and highlight any important patterns or techniques used. Be thorough but accessible.`,
    
    fix: `You are an expert ${lang} debugger. Analyze the following code for bugs, errors, or issues. Identify problems and provide the corrected code with explanations of what was wrong and how you fixed it. Return the complete fixed code.`,
    
    improve: `You are an expert ${lang} code reviewer. Analyze the following code and suggest improvements for:
- Performance optimization
- Code readability
- Best practices
- Error handling
- Type safety
Provide the improved code with explanations of the changes.`,
    
    generate: `You are an expert ${lang} developer. Generate code based on the user's request. Write clean, well-structured, production-ready code. Include proper TypeScript types, error handling, and follow React best practices. The code should be complete and immediately usable.`,
    
    refactor: `You are an expert ${lang} refactoring specialist. Refactor the following code to:
- Improve structure and organization
- Extract reusable functions/components
- Reduce complexity
- Improve maintainability
- Follow SOLID principles
Provide the refactored code with explanations.`,
    
    comment: `You are an expert code documenter. Add comprehensive JSDoc comments and inline comments to the following ${lang} code. Explain what each function, component, and complex logic block does. Make the code self-documenting.`,
    
    test: `You are an expert ${lang} test writer. Generate comprehensive unit tests for the following code using Jest and React Testing Library (if applicable). Cover edge cases, error states, and common use cases. Write production-ready tests.`,
    
    chat: `You are an expert ${lang} developer assistant. You help with coding questions, debugging, best practices, and implementation guidance. Be concise, practical, and provide code examples when helpful. You're working in the context of a React/TypeScript web application.`
  };

  const systemPrompt = systemPrompts[action] || systemPrompts.chat;
  
  let userMessage = "";
  
  if (action === "chat") {
    const history = context?.conversationHistory
      ?.map(msg => `${msg.role}: ${msg.content}`)
      .join("\n") || "";
    userMessage = `${history ? `Previous conversation:\n${history}\n\n` : ""}User question: ${context?.prompt || code}

${code ? `Current code context (${fileName}):\n\`\`\`${lang}\n${code}\n\`\`\`` : ""}`;
  } else if (action === "generate") {
    userMessage = `Request: ${context?.prompt || "Generate code"}

${code ? `Existing code context:\n\`\`\`${lang}\n${code}\n\`\`\`` : ""}

Generate the requested code.`;
  } else {
    const targetCode = context?.selection || code;
    userMessage = `File: ${fileName}

\`\`\`${lang}
${targetCode}
\`\`\`

${context?.prompt ? `Additional context: ${context.prompt}` : ""}`;
  }

  const result = await model.generateContent(`${systemPrompt}\n\n${userMessage}`);
  const response = result.response;
  return response.text();
}

/**
 * Generate AI video loop from image or prompt
 * Uses Veo model for video generation
 */
export async function generateVideoLoop(
  sourceImageUrl?: string,
  prompt?: string,
  duration: number = 4
): Promise<{ videoData: string; mimeType: string; description: string }> {
  if (!genAI) {
    throw new Error("Gemini AI not initialized");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    let finalPrompt = prompt || "";

    // If source image provided, analyze it first
    if (sourceImageUrl) {
      const response = await fetch(sourceImageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Image = buffer.toString('base64');
      
      let mimeType = 'image/jpeg';
      if (sourceImageUrl.endsWith('.png')) mimeType = 'image/png';
      else if (sourceImageUrl.endsWith('.webp')) mimeType = 'image/webp';

      // Analyze image to create video prompt
      const analysisPrompt = `Analyze this image and create a prompt for generating a seamless looping video animation based on it.
      
Describe:
1. What elements could be animated (clouds moving, water flowing, leaves rustling, etc.)
2. The mood and atmosphere
3. Suggested camera movement if any

Create a detailed video generation prompt that would result in a beautiful, calming loop perfect for a website background.`;

      const analysisResult = await model.generateContent([
        analysisPrompt,
        { inlineData: { data: base64Image, mimeType } }
      ]);
      
      finalPrompt = analysisResult.response.text().trim();
    }

    if (!finalPrompt) {
      finalPrompt = "A serene, calming nature scene with gentle movement. Soft light, peaceful atmosphere. Perfect for website background. Seamless loop.";
    }

    // Try to use Vertex AI for video generation
    if (vertexAI) {
      try {
        // Note: Video generation via Vertex AI may require specific model access
        const veoModel = vertexAI.preview.getGenerativeModel({
          model: "videogeneration@001",
        });
        
        const videoResult = await veoModel.generateContent({
          contents: [{ role: "user", parts: [{ text: `Create a ${duration} second seamless looping video: ${finalPrompt}` }] }],
        });
        
        const videoResponse = videoResult.response;
        const candidates = videoResponse.candidates;
        
        if (candidates && candidates[0]?.content?.parts) {
          for (const part of candidates[0].content.parts) {
            if ('inlineData' in part && part.inlineData) {
              return {
                videoData: part.inlineData.data,
                mimeType: part.inlineData.mimeType || 'video/mp4',
                description: finalPrompt
              };
            }
          }
        }
        
        throw new Error("No video generated");
      } catch (veoError: any) {
        console.log("Vertex AI video generation error:", veoError.message);
        throw new Error(`Video generation failed: ${veoError.message}. Prompt: "${finalPrompt.substring(0, 200)}..."`);
      }
    } else {
      throw new Error(`Vertex AI not configured. Set GOOGLE_CLOUD_PROJECT env var. Generated prompt: "${finalPrompt.substring(0, 200)}..."`);
    }
  } catch (error: any) {
    console.error('Error generating video loop:', error);
    throw new Error(error.message || "Failed to generate video loop");
  }
}

/**
 * Generate AI image variation based on source image
 * Uses Gemini to analyze the image and create a prompt, then generates a new image
 */
export async function generateImageVariation(
  sourceImageUrl: string, 
  style?: string,
  prompt?: string
): Promise<{ imageData: string; mimeType: string; description: string }> {
  if (!genAI) {
    throw new Error("Gemini AI not initialized");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    // Fetch the source image
    const response = await fetch(sourceImageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    
    let mimeType = 'image/jpeg';
    if (sourceImageUrl.endsWith('.png')) mimeType = 'image/png';
    else if (sourceImageUrl.endsWith('.webp')) mimeType = 'image/webp';

    // First, analyze the image to create a detailed description
    const analysisPrompt = `Analyze this image in detail. Describe:
1. The main subject and composition
2. Colors, lighting, and mood
3. Style and artistic elements
4. Any text or symbols visible

Provide a detailed description that could be used to recreate a similar image.`;

    const analysisResult = await model.generateContent([
      analysisPrompt,
      { inlineData: { data: base64Image, mimeType } }
    ]);
    
    const imageDescription = analysisResult.response.text().trim();

    // Create an enhanced prompt for image generation
    const styleModifier = style ? `Style: ${style}. ` : "";
    const userPrompt = prompt ? `Additional requirements: ${prompt}. ` : "";
    
    const generationPrompt = `Based on this description, create a detailed image generation prompt:

Original image description: ${imageDescription}

${styleModifier}${userPrompt}

Create a new, unique variation that maintains the essence but adds creative interpretation. 
Return ONLY the image generation prompt, nothing else.`;

    const promptResult = await model.generateContent(generationPrompt);
    const finalPrompt = promptResult.response.text().trim();

    // Use Vertex AI Imagen REST API for image generation
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    if (projectId && googleAuth) {
      try {
        const client = await googleAuth.getClient();
        const accessToken = await client.getAccessToken();
        
        const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/imagen-3.0-generate-001:predict`;
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instances: [{ prompt: finalPrompt }],
            parameters: {
              sampleCount: 1,
              aspectRatio: "1:1",
              personGeneration: "allow_adult",
            }
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Imagen API error: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        
        if (result.predictions && result.predictions[0]?.bytesBase64Encoded) {
          return {
            imageData: result.predictions[0].bytesBase64Encoded,
            mimeType: result.predictions[0].mimeType || 'image/png',
            description: finalPrompt
          };
        }
        
        throw new Error("No image generated from Imagen model");
      } catch (imagenError: any) {
        console.log("Vertex AI Imagen error:", imagenError.message);
        throw new Error(`Image generation failed: ${imagenError.message}. Prompt: "${finalPrompt.substring(0, 150)}..."`);
      }
    } else {
      throw new Error(`Vertex AI not configured. Set GOOGLE_CLOUD_PROJECT env var and ensure service account credentials. Generated prompt: "${finalPrompt.substring(0, 150)}..."`);
    }
  } catch (error: any) {
    console.error('Error generating image variation:', error);
    throw new Error(error.message || "Failed to generate image variation");
  }
}
