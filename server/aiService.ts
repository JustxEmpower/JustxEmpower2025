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


/**
 * Generate article content from a topic
 */
export async function generateArticleContent(topic: string, tone?: string): Promise<string> {
  if (!genAI) {
    throw new Error("Gemini AI not initialized");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

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

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

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

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

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

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const blockTypes = `
Available block types and their props:
1. "hero" - Hero section with title, subtitle, background
   Props: { title: string, subtitle: string, backgroundType: "color"|"gradient"|"image", backgroundColor: string, backgroundGradient: string, backgroundImage: string, textAlign: "left"|"center"|"right", ctaText: string, ctaLink: string }

2. "text" - Text content block
   Props: { content: string (HTML), textAlign: "left"|"center"|"right" }

3. "image" - Image block
   Props: { src: string, alt: string, caption: string, aspectRatio: "auto"|"16:9"|"4:3"|"1:1"|"3:4" }

4. "two-column" - Two column layout
   Props: { leftContent: string (HTML), rightContent: string (HTML), leftWidth: number (1-11), gap: "sm"|"md"|"lg" }

5. "gallery" - Image gallery
   Props: { images: Array<{src: string, alt: string}>, columns: 2|3|4, gap: "sm"|"md"|"lg" }

6. "cta" - Call to action block
   Props: { title: string, description: string, buttonText: string, buttonLink: string, variant: "primary"|"secondary"|"outline" }

7. "testimonial" - Testimonial/quote block
   Props: { quote: string, author: string, role: string, avatar: string }

8. "features" - Features grid
   Props: { title: string, features: Array<{icon: string, title: string, description: string}>, columns: 2|3|4 }

9. "accordion" - FAQ/Accordion block
   Props: { title: string, items: Array<{question: string, answer: string}> }

10. "video" - Video embed block
    Props: { url: string, title: string, autoplay: boolean }

11. "spacer" - Vertical spacing
    Props: { height: "sm"|"md"|"lg"|"xl" }

12. "divider" - Horizontal divider
    Props: { style: "solid"|"dashed"|"dotted", color: string }
`;

  const prompt = `You are a web page designer for Just Empower, a women's empowerment and leadership organization.

Generate a page structure based on this description: "${description}"
Page type: ${pageType}

${blockTypes}

Brand guidelines:
- Colors: Use warm, earthy tones (amber, terracotta, sage green) with deep neutrals
- Tone: Empowering, sophisticated, warm, transformative
- Style: Clean, modern, with organic flowing elements

Return ONLY valid JSON in this exact format:
{
  "title": "Page Title Here",
  "blocks": [
    {
      "type": "hero",
      "props": { ... }
    },
    ...more blocks
  ]
}

Generate 4-8 blocks that create a cohesive, professional page. Use placeholder image URLs like "/placeholder/hero.jpg" for images.
Include appropriate content that matches the Just Empower brand voice - empowering, transformative, and sophisticated.`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate structure
    if (!parsed.title || !Array.isArray(parsed.blocks)) {
      throw new Error("Invalid response structure");
    }
    
    return parsed;
  } catch (error) {
    console.error("Failed to parse AI page generation response:", error);
    // Return a default structure
    return {
      title: "New Page",
      blocks: [
        {
          type: "hero",
          props: {
            title: "Welcome",
            subtitle: description,
            backgroundType: "gradient",
            backgroundGradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
            textAlign: "center"
          }
        },
        {
          type: "text",
          props: {
            content: "<p>Content will be added here based on your description.</p>",
            textAlign: "center"
          }
        }
      ]
    };
  }
}
