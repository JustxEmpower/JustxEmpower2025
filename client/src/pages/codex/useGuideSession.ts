/**
 * Custom hook for managing guide sessions and Gemini API interactions
 * Handles message streaming, transcript management, and session lifecycle
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  GuideSession,
  GuideMessage,
  GuideType,
  SessionMode,
  CodexPhase,
  EscalationFlag,
} from './types';

interface UseGuideSessionConfig {
  guideType: GuideType;
  mode: SessionMode;
  userId: string;
  apiKey: string;
  currentPhase: CodexPhase;
  archetypeAlignment: string[];
}

interface UseGuideSessionReturn {
  session: GuideSession | null;
  messages: GuideMessage[];
  isLoading: boolean;
  isRecording: boolean;
  transcript: string;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  saveInsight: (messageId: string) => void;
  endSession: () => GuideSession | null;
  clearError: () => void;
}

/**
 * Main hook for managing guide sessions
 */
export const useGuideSession = (config: UseGuideSessionConfig): UseGuideSessionReturn => {
  const [session, setSession] = useState<GuideSession | null>(null);
  const [messages, setMessages] = useState<GuideMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize session
  useEffect(() => {
    const newSession: GuideSession = {
      id: `session-${Date.now()}`,
      userId: config.userId,
      guideType: config.guideType,
      mode: config.mode,
      startTime: new Date(),
      messages: [],
      savedInsights: [],
    };
    setSession(newSession);
  }, [config.guideType, config.mode, config.userId]);

  // Send message to Gemini API
  const sendMessage = useCallback(
    async (content: string) => {
      if (!session || !config.apiKey) {
        setError('Session not initialized or API key missing');
        return;
      }

      try {
        setError(null);
        setIsLoading(true);

        // Add user message
        const userMessage: GuideMessage = {
          id: `msg-${Date.now()}`,
          role: 'user',
          content,
          timestamp: new Date(),
          guideType: config.guideType,
        };

        setMessages((prev) => [...prev, userMessage]);

        // Build system prompt based on guide type
        const systemPrompt = buildSystemPrompt(config.guideType, config.currentPhase, config.archetypeAlignment);

        // Call Gemini API
        const response = await callGeminiApi({
          apiKey: config.apiKey,
          userMessage: content,
          systemPrompt,
          previousMessages: messages,
          phase: config.currentPhase,
          archetype: config.archetypeAlignment[0],
        });

        // Add guide response
        const guideMessage: GuideMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'guide',
          content: response.guideMessage,
          timestamp: new Date(),
          guideType: config.guideType,
          canSave: true,
          metadata: response.metadata,
        };

        setMessages((prev) => [...prev, guideMessage]);

        // Check for escalation flags
        if (response.escalationFlag) {
          const flag: EscalationFlag = {
            id: `flag-${Date.now()}`,
            sessionId: session.id,
            type: 'safety_concern',
            severity: 'high',
            timestamp: new Date(),
            message: response.escalationReason || 'Content requires attention',
            recommendedAction: 'Review with facilitator',
          };
          // TODO: Call onEscalation callback
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get guide response';
        setError(errorMessage);
        console.error('Guide API error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [session, config, messages]
  );

  // Start voice recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      console.error('Recording error:', err);
    }
  }, []);

  // Stop voice recording and transcribe
  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return;

    return new Promise<void>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          audioChunksRef.current = [];

          // Transcribe audio to text
          const transcribedText = await transcribeAudio(audioBlob, config.apiKey);
          setTranscript(transcribedText);

          // Optionally auto-send if configured
          // await sendMessage(transcribedText);

          setIsRecording(false);
          resolve();
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to transcribe audio';
          setError(errorMessage);
          setIsRecording(false);
          resolve();
        }
      };

      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    });
  }, [config.apiKey]);

  // Save message as insight
  const saveInsight = useCallback((messageId: string) => {
    if (!session) return;

    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, canSave: false } : msg))
    );

    setSession((prev) =>
      prev
        ? { ...prev, savedInsights: [...prev.savedInsights, messageId] }
        : null
    );
  }, [session]);

  // End session
  const endSession = useCallback((): GuideSession | null => {
    if (!session) return null;

    const endedSession: GuideSession = {
      ...session,
      endTime: new Date(),
      messages,
      durationMinutes: Math.round((new Date().getTime() - session.startTime.getTime()) / 60000),
    };

    setSession(null);
    setMessages([]);
    setIsRecording(false);
    setTranscript('');

    return endedSession;
  }, [session, messages]);

  const clearError = useCallback(() => setError(null), []);

  return {
    session,
    messages,
    isLoading,
    isRecording,
    transcript,
    error,
    sendMessage,
    startRecording,
    stopRecording,
    saveInsight,
    endSession,
    clearError,
  };
};

// ============================================================================
// API INTEGRATION
// ============================================================================

/**
 * Build system prompt based on guide type and context
 */
function buildSystemPrompt(
  guideType: GuideType,
  phase: CodexPhase,
  archetypes: string[]
): string {
  const basePrompt = `You are a sacred guide in the Living Codex ecosystem.
    The user is currently in the "${phase}" phase of their journey.
    Their archetypal alignment includes: ${archetypes.join(', ')}.

    Speak with wisdom, compassion, and depth. Honor the user's process.
    Avoid clinical language—use poetic, metaphorical language when appropriate.
    Listen deeply to what is beneath their words.`;

  const guideSpecific: Record<GuideType, string> = {
    codex: `${basePrompt}
      You are the Codex Guide. Help them navigate the pathways and phases of the Living Codex.
      Explain modules, phases, and progression with clarity and reverence.`,

    archetype: `${basePrompt}
      You are the Archetype Companion. Explore their archetypal patterns, shadows, and gifts.
      Help them understand how their archetypes shape their experience.`,

    journal: `${basePrompt}
      You are the Journal Facilitator. Offer reflective prompts and deepen their journal practice.
      Ask questions that illuminate their truth.`,

    support: `${basePrompt}
      You are Nervous System Support. Offer trauma-informed somatic guidance and grounding.
      Be prepared for vulnerable disclosures and respond with care.`,

    resources: `${basePrompt}
      You are the Resource Navigator. Help them find practices, tools, and learning materials.
      Recommend resources aligned with their phase and archetype.`,

    community: `${basePrompt}
      You are the Community Connector. Share about circles, calls, and collective wisdom.
      Help them feel held by community while respecting boundaries.`,
  };

  return guideSpecific[guideType];
}

/**
 * Call Gemini API (Google's generative AI)
 */
async function callGeminiApi({
  apiKey,
  userMessage,
  systemPrompt,
  previousMessages,
  phase,
  archetype,
}: {
  apiKey: string;
  userMessage: string;
  systemPrompt: string;
  previousMessages: GuideMessage[];
  phase: CodexPhase;
  archetype?: string;
}): Promise<{
  guideMessage: string;
  canSave: boolean;
  metadata?: Record<string, any>;
  escalationFlag?: boolean;
  escalationReason?: string;
}> {
  try {
    // Build message history
    const contents = previousMessages
      .slice(-10) // Last 10 messages for context
      .map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }))
      .concat([
        {
          role: 'user',
          parts: [{ text: userMessage }],
        },
      ]);

    // Call Google Generative AI API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system: {
          instructions: systemPrompt,
        },
        contents: contents,
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.8,
          topP: 0.95,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_UNSPECIFIED',
            threshold: 'BLOCK_NONE',
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('No content in API response');
    }

    return {
      guideMessage: content,
      canSave: true,
      metadata: {
        model: 'gemini-1.5-flash',
        phase,
        archetype,
      },
      escalationFlag: false,
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

/**
 * Transcribe audio blob using Google Speech-to-Text API
 */
async function transcribeAudio(audioBlob: Blob, apiKey: string): Promise<string> {
  try {
    const base64Audio = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(audioBlob);
    });

    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'en-US',
          },
          audio: {
            content: base64Audio,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Speech API error: ${response.statusText}`);
    }

    const data = await response.json();
    const transcript = data.results
      ?.map((result: any) => result.alternatives?.[0]?.transcript)
      .join(' ') || '';

    return transcript;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}

export default useGuideSession;
