import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Image } from 'lucide-react';
import MediaPicker from '@/components/MediaPicker';

interface Props {
  content: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export function JEGallerySettingsPanel({ content, onChange }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickIdx, setPickIdx] = useState<number>(-1);

  const title = String(content.title || '');
  const columns = Number(content.columns) || 3;
  const gap = Number(content.gap) || 4;
  const lightbox = content.lightbox !== false;
  const images = Array.isArray(content.images) ? content.images : [];

  const btn = (active: boolean) => `flex-1 py-2 text-sm rounded border ${active ? 'bg-amber-500 text-white' : 'bg-neutral-100'}`;

  return (
    <div className="space-y-4">
      <div><Label>Title</Label><Input value={title} onChange={e => onChange('title', e.target.value)} /></div>
      <div><Label>Columns</Label><div className="flex gap-1">{[2,3,4,5,6].map(n => <button key={n} className={btn(columns===n)} onClick={() => onChange('columns', n)}>{n}</button>)}</div></div>
      <div><Label>Gap</Label><div className="flex gap-1">{[2,4,6,8].map(n => <button key={n} className={btn(gap===n)} onClick={() => onChange('gap', n)}>{n}</button>)}</div></div>
      <div className="flex justify-between"><Label>Lightbox</Label><Switch checked={lightbox} onCheckedChange={v => onChange('lightbox', v)} /></div>
      <div><Label>Images ({images.length})</Label><Button size="sm" onClick={() => { setPickIdx(images.length); setPickerOpen(true); }}><Plus className="w-3 h-3" /></Button></div>
      <div className="grid grid-cols-3 gap-2">{images.map((img: any, i: number) => (
        <div key={i} className="relative aspect-square bg-neutral-200 rounded overflow-hidden group">
          {img?.url && <img src={img.url} className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1">
            <Button size="sm" variant="ghost" className="text-white" onClick={() => { setPickIdx(i); setPickerOpen(true); }}><Image className="w-4 h-4" /></Button>
            <Button size="sm" variant="ghost" className="text-red-400" onClick={() => onChange('images', images.filter((_: any, j: number) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
          </div>
        </div>
      ))}</div>
      <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={url => { const newImgs = [...images]; if (pickIdx >= images.length) newImgs.push({ url, alt: '', caption: '' }); else newImgs[pickIdx] = { ...newImgs[pickIdx], url }; onChange('images', newImgs); setPickerOpen(false); }} mediaType="image" />
    </div>
  );
}
