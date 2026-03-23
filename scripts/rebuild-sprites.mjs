#!/usr/bin/env node
/**
 * Rebuild viseme-index.json + viseme-sprite.png from existing frames.
 * Usage: node scripts/rebuild-sprites.mjs
 */
import fs from 'fs/promises';
import { existsSync, readdirSync } from 'fs';
import sharp from 'sharp';

const ATLAS_SCRIPT = `Perhaps you should know, this beautiful journey through healing really does give every part of your heart something deeply meaningful. Sometimes, before we choose, we need to let five calm breaths open the way. Remember, you are so much stronger than zero doubt could say. My favorite truth is simply this: believe in yourself, today and always.`;
const FRAME_RATE = 30;
const CELL_W = 256;
const CELL_H = 256;
const SPRITE_COLS = 5;
const SPRITE_ROWS = 3;
const VISEME_ORDER = ['sil','PP','FF','TH','DD','kk','CH','SS','nn','RR','aa','E','I','O','U'];
const PHONEME_TO_VISEME = {
  P:'PP',B:'PP',M:'PP',F:'FF',V:'FF',TH:'TH',DH:'TH',T:'DD',D:'DD',N:'nn',L:'nn',
  K:'kk',G:'kk',NG:'kk',CH:'CH',JH:'CH',SH:'CH',ZH:'CH',Y:'CH',S:'SS',Z:'SS',
  R:'RR',ER:'RR',HH:'sil',W:'U',AA:'aa',AE:'aa',AH:'aa',EH:'E',EY:'E',
  IH:'I',IY:'I',IX:'I',AO:'O',OW:'O',OY:'O',UH:'U',UW:'U',AW:'aa',AY:'aa',
};
const GUIDES = ['aoede','leda','selene','zephyr'];

function wordToPhonemes(word) {
  const w = word.toLowerCase().replace(/[^a-z']/g, '');
  if (!w) return [];
  const phonemes = [];
  let i = 0;
  while (i < w.length) {
    const r = w.slice(i);
    if (r.startsWith('th')) { phonemes.push(['TH',1.0]); i+=2; continue; }
    if (r.startsWith('sh')) { phonemes.push(['SH',1.0]); i+=2; continue; }
    if (r.startsWith('ch')) { phonemes.push(['CH',1.0]); i+=2; continue; }
    if (r.startsWith('ph')) { phonemes.push(['F',1.0]); i+=2; continue; }
    if (r.startsWith('wh')) { phonemes.push(['W',0.8]); i+=2; continue; }
    if (r.startsWith('ng')) { phonemes.push(['NG',0.8]); i+=2; continue; }
    if (r.startsWith('ck')) { phonemes.push(['K',0.8]); i+=2; continue; }
    if (r.startsWith('oo')) { phonemes.push(['UW',1.4]); i+=2; continue; }
    if (r.startsWith('ee')) { phonemes.push(['IY',1.4]); i+=2; continue; }
    if (r.startsWith('ea')) { phonemes.push(['IY',1.3]); i+=2; continue; }
    if (r.startsWith('ou')) { phonemes.push(['AW',1.3]); i+=2; continue; }
    if (r.startsWith('ow') && i+2<w.length) { phonemes.push(['AW',1.3]); i+=2; continue; }
    if (r.startsWith('ow')) { phonemes.push(['OW',1.3]); i+=2; continue; }
    if (r.startsWith('ai')||r.startsWith('ay')) { phonemes.push(['EY',1.3]); i+=2; continue; }
    if (r.startsWith('ie')) { phonemes.push(['IY',1.3]); i+=2; continue; }
    if (r.startsWith('oa')) { phonemes.push(['OW',1.3]); i+=2; continue; }
    const c = w[i];
    switch(c) {
      case 'a': phonemes.push(['AE',1.2]); break;
      case 'e': if(i===w.length-1){i++;continue;} phonemes.push(['EH',1.0]); break;
      case 'i': phonemes.push(['IH',1.0]); break;
      case 'o': phonemes.push(['AO',1.2]); break;
      case 'u': phonemes.push(['AH',1.0]); break;
      case 'y': if(i>0){phonemes.push(['IY',1.0]);}else{phonemes.push(['Y',0.6]);} break;
      case 'b': phonemes.push(['B',0.8]); break;
      case 'c': phonemes.push(['K',0.8]); break;
      case 'd': phonemes.push(['D',0.8]); break;
      case 'f': phonemes.push(['F',1.0]); break;
      case 'g': phonemes.push(['G',0.8]); break;
      case 'h': phonemes.push(['HH',0.5]); break;
      case 'j': phonemes.push(['JH',1.0]); break;
      case 'k': phonemes.push(['K',0.8]); break;
      case 'l': phonemes.push(['L',0.8]); break;
      case 'm': phonemes.push(['M',1.0]); break;
      case 'n': phonemes.push(['N',0.8]); break;
      case 'p': phonemes.push(['P',0.8]); break;
      case 'q': phonemes.push(['K',0.8]); break;
      case 'r': phonemes.push(['R',0.8]); break;
      case 's': phonemes.push(['S',1.0]); break;
      case 't': phonemes.push(['T',0.8]); break;
      case 'v': phonemes.push(['V',1.0]); break;
      case 'w': phonemes.push(['W',0.8]); break;
      case 'x': phonemes.push(['K',0.5],['S',0.5]); break;
      case 'z': phonemes.push(['Z',1.0]); break;
      default: break;
    }
    i++;
  }
  return phonemes;
}

function buildProportionalTimeline(text, totalFrames, fps) {
  const words = text.toLowerCase().replace(/[^a-z\s']/g,'').split(/\s+/).filter(Boolean);
  const duration = totalFrames / fps;
  const timeline = [];
  const allPhonemes = words.map(w => ({word:w, phonemes:wordToPhonemes(w)}));
  const totalWeight = allPhonemes.reduce((sum,{phonemes})=>sum+phonemes.reduce((s,[,d])=>s+d,0)+0.3,0);
  let currentTime = 0.2;
  for (const {word,phonemes} of allPhonemes) {
    if (!phonemes.length) continue;
    const wordWeight = phonemes.reduce((s,[,d])=>s+d,0);
    const wordDuration = (wordWeight/totalWeight)*(duration-0.4);
    let phoneStart = currentTime;
    for (const [phoneme,relDur] of phonemes) {
      const phoneDuration = (relDur/wordWeight)*wordDuration;
      const phoneEnd = phoneStart+phoneDuration;
      const peakTime = phoneStart+phoneDuration*0.4;
      const viseme = PHONEME_TO_VISEME[phoneme]||'sil';
      const peakFrame = Math.max(1,Math.min(totalFrames,Math.round(peakTime*fps)+1));
      timeline.push({viseme,phoneme,word,startTime:phoneStart,endTime:phoneEnd,peakTime,peakFrame});
      phoneStart = phoneEnd;
    }
    const gapDuration = (0.3/totalWeight)*(duration-0.4);
    currentTime = phoneStart+gapDuration;
    timeline.push({viseme:'sil',phoneme:'SIL',word:'',startTime:phoneStart,endTime:currentTime,peakTime:phoneStart+gapDuration*0.5,peakFrame:Math.round((phoneStart+gapDuration*0.5)*fps)+1});
  }
  return timeline;
}

function selectBestFrames(timeline) {
  const occ = {};
  for (const e of timeline) { if(!occ[e.viseme]) occ[e.viseme]=[]; occ[e.viseme].push(e); }
  const best = {};
  for (const v of VISEME_ORDER) {
    const o = occ[v]||[];
    if (!o.length) { best[v]={bestFrame:1,count:0,peakTime:0,word:''}; continue; }
    const b = o.reduce((a,b)=>(b.endTime-b.startTime)>(a.endTime-a.startTime)?b:a);
    best[v]={bestFrame:b.peakFrame,count:o.length,peakTime:b.peakTime,word:b.word,phoneme:b.phoneme,allFrames:o.map(x=>x.peakFrame)};
  }
  return best;
}

function buildVisemeIndex(bestFrames, timeline, totalFrames, fps, guideId) {
  const index = {};
  for (const v of VISEME_ORDER) {
    const d = bestFrames[v];
    index[v] = {bestFrame:d.bestFrame,frames:d.allFrames||[d.bestFrame],timestamp:d.peakTime,occurrences:d.count,sourceWord:d.word||'',sourcePhoneme:d.phoneme||''};
  }
  index._amplitudeBands = {
    silent:{viseme:'sil',threshold:0.02},whisper:{viseme:'PP',threshold:0.08},
    soft:{viseme:'E',threshold:0.18},moderate:{viseme:'nn',threshold:0.30},
    normal:{viseme:'aa',threshold:0.45},strong:{viseme:'O',threshold:0.65},
    loud:{viseme:'aa',threshold:0.80},peak:{viseme:'aa',threshold:1.00},
  };
  index._emotionModifiers = {
    joy:{openness:1.3,width:1.2,speed:1.15},concern:{openness:0.7,width:0.9,speed:0.85},
    curiosity:{openness:1.1,width:1.0,speed:1.05},calm:{openness:0.8,width:0.95,speed:0.75},
    listening:{openness:0.5,width:0.85,speed:0.6},empathy:{openness:0.9,width:0.95,speed:0.8},
    celebration:{openness:1.4,width:1.3,speed:1.3},neutral:{openness:1.0,width:1.0,speed:1.0},
  };
  index._meta = {
    guideId, frameCount:totalFrames, fps, duration:totalFrames/fps,
    atlasScript:ATLAS_SCRIPT, lipsyncEngine:'latentsync-colab',
    alignmentMethod:'proportional', generatedAt:new Date().toISOString(),
  };
  index._timeline = timeline.map(t=>({v:t.viseme,t:Math.round(t.peakTime*1000)/1000,f:t.peakFrame,w:t.word}));
  return index;
}

async function generateSpriteSheet(framesDir, bestFrames, outputPath) {
  const composites = [];
  for (let i=0; i<VISEME_ORDER.length; i++) {
    const v = VISEME_ORDER[i];
    const frameNum = bestFrames[v]?.bestFrame||1;
    const padded = String(frameNum).padStart(4,'0');
    let framePath = `${framesDir}/frame_${padded}.jpg`;
    if (!existsSync(framePath)) { framePath=`${framesDir}/frame_0001.jpg`; if(!existsSync(framePath)) continue; }
    const col = i%SPRITE_COLS;
    const row = Math.floor(i/SPRITE_COLS);
    composites.push({
      input: await sharp(framePath).resize(CELL_W,CELL_H,{fit:'cover'}).toBuffer(),
      left: col*CELL_W, top: row*CELL_H,
    });
  }
  await sharp({create:{width:SPRITE_COLS*CELL_W,height:SPRITE_ROWS*CELL_H,channels:3,background:{r:0,g:0,b:0}}})
    .composite(composites).png().toFile(outputPath);
  const stat = await fs.stat(outputPath);
  return stat.size;
}

async function main() {
  for (const guide of GUIDES) {
    const base = `public/assets/avatars/atlas/${guide}`;
    const framesDir = `${base}/frames`;
    if (!existsSync(framesDir)) { console.log(`❌ ${guide}: no frames dir`); continue; }

    const frameCount = readdirSync(framesDir).filter(f=>f.endsWith('.jpg')).length;
    console.log(`\n── ${guide.toUpperCase()} (${frameCount} frames) ──`);

    // Build timeline + select best frames
    const timeline = buildProportionalTimeline(ATLAS_SCRIPT, frameCount, FRAME_RATE);
    const bestFrames = selectBestFrames(timeline);

    for (const v of VISEME_ORDER) {
      const d = bestFrames[v];
      console.log(`  ${v.padEnd(3)} → frame ${String(d.bestFrame).padStart(4)} (${d.count}×, "${d.word}")`);
    }

    // Write viseme-index.json
    const index = buildVisemeIndex(bestFrames, timeline, frameCount, FRAME_RATE, guide);
    await fs.writeFile(`${base}/viseme-index.json`, JSON.stringify(index, null, 2));
    console.log(`  ✅ viseme-index.json`);

    // Generate sprite sheet
    const size = await generateSpriteSheet(framesDir, bestFrames, `${base}/viseme-sprite.png`);
    console.log(`  ✅ viseme-sprite.png (${(size/1024).toFixed(0)}KB)`);

    // Clean up frames (keep only best + neighbors)
    const keep = new Set();
    for (const d of Object.values(bestFrames)) {
      if (d.bestFrame) { keep.add(d.bestFrame); keep.add(Math.max(1,d.bestFrame-1)); keep.add(Math.min(frameCount,d.bestFrame+1)); }
    }
    let deleted = 0;
    for (let i=1; i<=frameCount; i++) {
      if (!keep.has(i)) {
        const p = String(i).padStart(4,'0');
        try { await fs.unlink(`${framesDir}/frame_${p}.jpg`); deleted++; } catch {}
      }
    }
    console.log(`  🧹 Cleaned ${deleted} temp frames (kept ${keep.size})`);
  }
  console.log('\n✅ All sprites rebuilt!');
}

main().catch(e => { console.error(e); process.exit(1); });
