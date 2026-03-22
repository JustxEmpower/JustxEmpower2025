const Q_START = /^(what|where|when|why|how|who|which|do|does|did|is|are|was|were|have|has|can|could|would|should|shall|will|may|might|isn't|aren't|don't|doesn't|won't|wouldn't|couldn't|tell me)\b/i;
const Q_EMBED = /\b(what do you|how do you|what does|how does|what would|can you|could you|would you|do you|are you|have you|what if|what about|how about)\b/i;

function fixPunctuation(s: string): string {
  const t = s.trim();
  if (!t) return t;
  const last = t[t.length - 1];
  if (last === '?' || last === '!') return t;
  const body = last === '.' ? t.slice(0, -1).trim() : t;
  if (Q_START.test(body) || Q_EMBED.test(body)) return body + '?';
  if (last === '.') return t;
  return t + '.';
}

function cleanForSpeech(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-•#]+\s*/gm, '')
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function splitSentences(text: string): string[] {
  const cleaned = cleanForSpeech(text);
  const raw = cleaned.match(/[^.!?]+[.!?]+[\s]*/g) || [cleaned];
  return raw.map(s => fixPunctuation(s)).filter(s => s.length > 0);
}

export async function fetchAudio(sentence: string, voice: string, speed = 1, signal?: AbortSignal): Promise<Blob> {
  const res = await fetch('/api/tts/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: sentence, voice, speed }),
    signal,
  });
  if (!res.ok) throw new Error(`TTS ${res.status}`);
  return res.blob();
}
