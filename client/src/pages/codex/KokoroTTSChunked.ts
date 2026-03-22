export function splitSentences(text: string): string[] {
  const raw = text.match(/[^.!?]+[.!?]+[\s]*/g) || [text];
  return raw.map(s => s.trim()).filter(s => s.length > 0);
}

export async function fetchAudio(sentence: string, voice: string, signal?: AbortSignal): Promise<Blob> {
  const res = await fetch('/api/tts/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: sentence, voice, speed: 1 }),
    signal,
  });
  if (!res.ok) throw new Error(`TTS ${res.status}`);
  return res.blob();
}
