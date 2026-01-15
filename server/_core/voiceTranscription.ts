/**
 * Voice Transcription - Enhanced with Gemini
 *
 * Provides audio transcription using Google Gemini's multimodal capabilities.
 * 
 * Features:
 * - Audio file transcription via Gemini
 * - Multi-language support (30+ languages)
 * - Speaker diarization hints
 * - Audio summarization
 * - Sentiment analysis of speech
 *
 * Example usage:
 * ```tsx
 * const result = await transcribeAudio({ audioUrl: "https://..." });
 * console.log(result.text); // Full transcription
 * ```
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// ============================================================================
// Types
// ============================================================================

export type TranscribeOptions = {
  audioUrl: string;
  language?: string;
  prompt?: string;
  includeSummary?: boolean;
  speakerHints?: string[];
};

export type TranscriptionSegment = {
  id: number;
  start: number;
  end: number;
  text: string;
  speaker?: string;
  confidence?: number;
};

export type TranscriptionResponse = {
  task: "transcribe";
  language: string;
  duration: number;
  text: string;
  segments: TranscriptionSegment[];
  summary?: string;
  speakers?: string[];
};

export type TranscriptionError = {
  error: string;
  code: "FILE_TOO_LARGE" | "INVALID_FORMAT" | "TRANSCRIPTION_FAILED" | "UPLOAD_FAILED" | "SERVICE_ERROR";
  details?: string;
};

// ============================================================================
// Gemini Client
// ============================================================================

let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI | null {
  if (genAI) return genAI;
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[Voice] GEMINI_API_KEY not configured");
    return null;
  }
  
  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

// ============================================================================
// Language Support
// ============================================================================

const SUPPORTED_LANGUAGES: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'nl': 'Dutch',
  'pl': 'Polish',
  'tr': 'Turkish',
  'sv': 'Swedish',
  'da': 'Danish',
  'no': 'Norwegian',
  'fi': 'Finnish',
  'he': 'Hebrew',
  'th': 'Thai',
  'vi': 'Vietnamese',
  'id': 'Indonesian',
  'ms': 'Malay',
  'fil': 'Filipino',
  'uk': 'Ukrainian',
  'cs': 'Czech',
  'el': 'Greek',
  'ro': 'Romanian',
  'hu': 'Hungarian',
};

function getLanguageName(langCode: string): string {
  return SUPPORTED_LANGUAGES[langCode] || langCode;
}

function getFileExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/wave': 'wav',
    'audio/ogg': 'ogg',
    'audio/m4a': 'm4a',
    'audio/mp4': 'm4a',
    'audio/flac': 'flac',
    'audio/aac': 'aac',
  };
  return mimeToExt[mimeType] || 'audio';
}

// ============================================================================
// Main Transcription Function
// ============================================================================

/**
 * Transcribe audio to text using Gemini AI
 * 
 * @param options - Audio URL and options
 * @returns Transcription result or error
 */
export async function transcribeAudio(
  options: TranscribeOptions
): Promise<TranscriptionResponse | TranscriptionError> {
  const client = getGeminiClient();
  
  if (!client) {
    return {
      error: "Voice transcription service is not configured",
      code: "SERVICE_ERROR",
      details: "GEMINI_API_KEY is not set"
    };
  }

  try {
    // Step 1: Download audio from URL
    let audioBuffer: Buffer;
    let mimeType: string;
    
    try {
      const response = await fetch(options.audioUrl);
      if (!response.ok) {
        return {
          error: "Failed to download audio file",
          code: "INVALID_FORMAT",
          details: `HTTP ${response.status}: ${response.statusText}`
        };
      }
      
      audioBuffer = Buffer.from(await response.arrayBuffer());
      mimeType = response.headers.get('content-type') || 'audio/mpeg';
      
      // Check file size (20MB limit for Gemini)
      const sizeMB = audioBuffer.length / (1024 * 1024);
      if (sizeMB > 20) {
        return {
          error: "Audio file exceeds maximum size limit",
          code: "FILE_TOO_LARGE",
          details: `File size is ${sizeMB.toFixed(2)}MB, maximum allowed is 20MB`
        };
      }
    } catch (error) {
      return {
        error: "Failed to fetch audio file",
        code: "SERVICE_ERROR",
        details: error instanceof Error ? error.message : "Unknown error"
      };
    }

    // Step 2: Prepare Gemini request
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const base64Audio = audioBuffer.toString("base64");
    
    const languageHint = options.language 
      ? `The audio is in ${getLanguageName(options.language)}.`
      : "Detect the language automatically.";
    
    const speakerHint = options.speakerHints?.length
      ? `Expected speakers: ${options.speakerHints.join(", ")}.`
      : "";

    const summaryRequest = options.includeSummary
      ? "Also provide a brief summary of the content."
      : "";

    const prompt = `Transcribe this audio file accurately.
${languageHint}
${speakerHint}
${options.prompt || ""}
${summaryRequest}

Respond in JSON format:
{
  "text": "full transcription text",
  "language": "detected language code (e.g., en, es)",
  "duration": estimated duration in seconds,
  "segments": [
    { "id": 0, "start": 0, "end": 5, "text": "segment text", "speaker": "Speaker 1" }
  ],
  "summary": "brief summary if requested",
  "speakers": ["Speaker 1", "Speaker 2"]
}`;

    // Step 3: Call Gemini
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Audio,
          mimeType,
        },
      },
    ]);

    const responseText = result.response.text();
    
    // Step 4: Parse response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // If no JSON, treat the whole response as plain text transcription
      return {
        task: "transcribe",
        language: options.language || "en",
        duration: 0,
        text: responseText.trim(),
        segments: [{ id: 0, start: 0, end: 0, text: responseText.trim() }],
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      task: "transcribe",
      language: parsed.language || options.language || "en",
      duration: parsed.duration || 0,
      text: parsed.text || responseText,
      segments: parsed.segments || [{ id: 0, start: 0, end: 0, text: parsed.text }],
      summary: parsed.summary,
      speakers: parsed.speakers,
    };

  } catch (error) {
    console.error("[Voice] Transcription error:", error);
    return {
      error: "Voice transcription failed",
      code: "TRANSCRIPTION_FAILED",
      details: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
}

// ============================================================================
// Additional Audio Analysis Functions
// ============================================================================

/**
 * Analyze audio for sentiment and emotion
 */
export async function analyzeAudioSentiment(
  audioUrl: string
): Promise<{ sentiment: string; emotions: string[]; confidence: number } | null> {
  const client = getGeminiClient();
  if (!client) return null;

  try {
    const response = await fetch(audioUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    const mimeType = response.headers.get('content-type') || 'audio/mpeg';

    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const result = await model.generateContent([
      `Analyze the sentiment and emotions in this audio. Respond in JSON:
{
  "sentiment": "positive/negative/neutral",
  "emotions": ["calm", "excited", "anxious", etc.],
  "confidence": 0-100
}`,
      { inlineData: { data: buffer.toString("base64"), mimeType } },
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error("[Voice] Sentiment analysis error:", error);
    return null;
  }
}

/**
 * Generate a summary of audio content
 */
export async function summarizeAudio(
  audioUrl: string,
  maxLength: number = 200
): Promise<string | null> {
  const client = getGeminiClient();
  if (!client) return null;

  try {
    const response = await fetch(audioUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    const mimeType = response.headers.get('content-type') || 'audio/mpeg';

    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const result = await model.generateContent([
      `Summarize this audio in ${maxLength} characters or less. Be concise and capture the key points.`,
      { inlineData: { data: buffer.toString("base64"), mimeType } },
    ]);

    return result.response.text().trim();
  } catch (error) {
    console.error("[Voice] Summarization error:", error);
    return null;
  }
}

/**
 * Detect language from audio
 */
export async function detectAudioLanguage(
  audioUrl: string
): Promise<{ language: string; languageName: string; confidence: number } | null> {
  const client = getGeminiClient();
  if (!client) return null;

  try {
    const response = await fetch(audioUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    const mimeType = response.headers.get('content-type') || 'audio/mpeg';

    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const result = await model.generateContent([
      `Detect the language spoken in this audio. Respond in JSON:
{
  "language": "ISO 639-1 code (e.g., en, es, fr)",
  "languageName": "Full language name",
  "confidence": 0-100
}`,
      { inlineData: { data: buffer.toString("base64"), mimeType } },
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error("[Voice] Language detection error:", error);
    return null;
  }
}

// ============================================================================
// Exports
// ============================================================================

export {
  SUPPORTED_LANGUAGES,
  getLanguageName,
  getFileExtension,
};
