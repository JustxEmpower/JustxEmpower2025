import React, { useState, useMemo, useCallback } from 'react';
import { KOKORO_VOICE_CATALOG, getRecommendedVoices, getVoiceById, type KokoroVoice } from './KokoroTTSService';

interface VoiceOrbProps { color: string; glow: string; size?: number; active?: boolean; speaking?: boolean; onClick?: () => void; }

export const VoiceOrb: React.FC<VoiceOrbProps> = ({ color, glow, size = 48, active = false, speaking = false, onClick }) => (
  <div onClick={onClick} style={{
    width: size, height: size, borderRadius: '50%', cursor: onClick ? 'pointer' : 'default',
    background: `radial-gradient(circle at 35% 35%, ${color}, ${color}80)`,
    boxShadow: active ? `0 0 ${size*.6}px ${glow}, 0 0 ${size*1.2}px ${glow}` : `0 0 ${size*.3}px ${glow}`,
    border: active ? `2px solid ${color}` : '2px solid transparent',
    animation: speaking ? 'voPulse .6s ease-in-out infinite' : active ? 'voGlow 3s ease-in-out infinite' : 'none',
    transition: 'all 0.3s ease',
  }} />
);

interface VSBProps { voiceId: string; onClick: () => void; speaking?: boolean; }
export const VoiceSettingsButton: React.FC<VSBProps> = ({ voiceId, onClick, speaking }) => {
  const voice = getVoiceById(voiceId);
  if (!voice) return null;
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-white/10 transition-colors" title={`Voice: ${voice.name}`}>
      <VoiceOrb color={voice.orbColor} glow={voice.orbGlow} size={16} active speaking={speaking} />
      <span className="text-xs text-white/50">{voice.name}</span>
    </button>
  );
};

interface VoiceSelectorProps { isOpen: boolean; onClose: () => void; currentVoice: string; onSelectVoice: (id: string) => void; guideName: string; onPreview?: (id: string) => void; }

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ isOpen, onClose, currentVoice, onSelectVoice, guideName, onPreview }) => {
  const [filter, setFilter] = useState<'all'|'recommended'|'female'|'male'>('recommended');
  const [previewing, setPreviewing] = useState<string|null>(null);
  const recommended = useMemo(() => getRecommendedVoices(guideName), [guideName]);
  const voices = useMemo(() => {
    if (filter === 'recommended') return recommended;
    if (filter === 'female') return KOKORO_VOICE_CATALOG.filter(v => v.gender === 'female');
    if (filter === 'male') return KOKORO_VOICE_CATALOG.filter(v => v.gender === 'male');
    return KOKORO_VOICE_CATALOG;
  }, [filter, recommended]);

  const preview = useCallback((v: KokoroVoice) => { setPreviewing(v.id); onPreview?.(v.id); setTimeout(() => setPreviewing(null), 3000); }, [onPreview]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <style>{`@keyframes voPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}@keyframes voGlow{0%,100%{opacity:.8}50%{opacity:1}}`}</style>
      <div className="relative w-full max-w-lg mx-4 max-h-[80vh] bg-gray-950 border border-white/10 rounded-2xl overflow-hidden" style={{animation:'voGlow .2s ease-out'}}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div><h2 className="text-lg font-semibold text-white">Voice Settings</h2><p className="text-xs text-white/40 mt-0.5">Choose a voice for {guideName}</p></div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl p-1">✕</button>
        </div>
        <div className="flex gap-2 px-5 py-3 border-b border-white/5">
          {(['recommended','all','female','male'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs capitalize transition-colors ${filter===f?'bg-white/15 text-white':'text-white/40 hover:text-white/70'}`}>{f}</button>
          ))}
        </div>
        <div className="overflow-y-auto max-h-[55vh] p-4 grid grid-cols-2 gap-3">
          {voices.map(v => (
            <div key={v.id} onClick={() => { onSelectVoice(v.id); onClose(); }}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${v.id===currentVoice?'bg-white/10 ring-1 ring-white/20':'bg-white/5 hover:bg-white/8'}`}>
              <VoiceOrb color={v.orbColor} glow={v.orbGlow} size={36} active={v.id===currentVoice} speaking={previewing===v.id} />
              <div className="min-w-0">
                <p className="text-sm text-white font-medium truncate">{v.name}</p>
                <p className="text-[10px] text-white/30 truncate">{v.style}</p>
                <p className="text-[10px] text-white/20">{v.accent} · {v.gender}</p>
              </div>
              {v.id !== currentVoice && onPreview && (
                <button onClick={e => { e.stopPropagation(); preview(v); }} className="ml-auto text-white/30 hover:text-white/60 text-xs">▶</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VoiceSelector;
