import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Image, Grid, Play } from 'lucide-react';
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
  const displayMode = String(content.displayMode || 'grid');
  const autoPlay = content.autoPlay === true;
  const autoPlayInterval = Number(content.autoPlayInterval) || 5000;
  const showDots = content.showDots !== false;
  const showArrows = content.showArrows !== false;

  const btn = (active: boolean) => `flex-1 py-2 text-sm rounded border ${active ? 'bg-amber-500 text-white' : 'bg-neutral-100'}`;
  const modeBtn = (mode: string, active: boolean) => `flex-1 py-3 text-sm rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${active ? 'bg-amber-500 text-white border-amber-600' : 'bg-neutral-100 border-neutral-200 hover:border-amber-300'}`;

  return (
    <div className="space-y-4">
      {/* Display Mode Toggle */}
      <div>
        <Label className="mb-2 block">Display Mode</Label>
        <div className="flex gap-2">
          <button className={modeBtn('grid', displayMode === 'grid')} onClick={() => onChange('displayMode', 'grid')}>
            <Grid className="w-5 h-5" />
            <span>Grid</span>
          </button>
          <button className={modeBtn('carousel', displayMode === 'carousel')} onClick={() => onChange('displayMode', 'carousel')}>
            <Play className="w-5 h-5" />
            <span>Carousel</span>
          </button>
        </div>
      </div>

      <div><Label>Title</Label><Input value={title} onChange={e => onChange('title', e.target.value)} /></div>
      
      {/* Grid-specific options */}
      {displayMode === 'grid' && (
        <>
          <div><Label>Columns</Label><div className="flex gap-1">{[2,3,4,5,6].map(n => <button key={n} className={btn(columns===n)} onClick={() => onChange('columns', n)}>{n}</button>)}</div></div>
          <div><Label>Gap</Label><div className="flex gap-1">{[2,4,6,8].map(n => <button key={n} className={btn(gap===n)} onClick={() => onChange('gap', n)}>{n}</button>)}</div></div>
          <div className="flex justify-between"><Label>Lightbox</Label><Switch checked={lightbox} onCheckedChange={v => onChange('lightbox', v)} /></div>
        </>
      )}

      {/* Carousel-specific options */}
      {displayMode === 'carousel' && (
        <>
          <div className="flex justify-between items-center">
            <Label>Show Arrows</Label>
            <Switch checked={showArrows} onCheckedChange={v => onChange('showArrows', v)} />
          </div>
          <div className="flex justify-between items-center">
            <Label>Show Dots</Label>
            <Switch checked={showDots} onCheckedChange={v => onChange('showDots', v)} />
          </div>
          <div className="flex justify-between items-center">
            <Label>Auto Play</Label>
            <Switch checked={autoPlay} onCheckedChange={v => onChange('autoPlay', v)} />
          </div>
          {autoPlay && (
            <div>
              <Label>Interval (seconds)</Label>
              <div className="flex gap-1 mt-1">
                {[3, 5, 7, 10].map(n => (
                  <button 
                    key={n} 
                    className={btn(autoPlayInterval === n * 1000)} 
                    onClick={() => onChange('autoPlayInterval', n * 1000)}
                  >
                    {n}s
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex items-center justify-between">
        <Label>Images ({images.length})</Label>
        <Button size="sm" onClick={() => { setPickIdx(images.length); setPickerOpen(true); }}><Plus className="w-3 h-3 mr-1" /> Add</Button>
      </div>
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
