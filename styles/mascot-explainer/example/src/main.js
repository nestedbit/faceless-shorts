// Boot: fonts → script + timing + lip-sync + mascot.json → captions → shots. Then draw(t) renders film time t (pure).
// window.OP is the API tools/capture.mjs drives: ready, bootError, duration(), draw(t), frame(t, q), cues(), shots().
// ?poses=1 (QS='&poses=1' node tools/capture.mjs frames review/poses 0) renders the mascot's pose sheet instead;
// add &portrait=1 for a big close-up (the likeness check).
import { W, H, setCtx, ctx, clamp, eo, eio } from './core/lib.js';
import { T, loadTiming } from './core/timing.js';
import { buildCaptions, drawCaption, captionList } from './core/captions.js';
import { loadLipsync } from './core/lipsync.js';
import * as M from './core/mascot.js';

const cv = document.getElementById('cv');
setCtx(cv.getContext('2d'));
const OP = (window.OP = { ready: false });
const q = new URLSearchParams(location.search);

/** camera shake from every hit(t, power) the shots registered: fast, decaying, deterministic */
function shakeAt(t) {
  let dx = 0, dy = 0, r = 0;
  for (const h of OP._hits) {
    const u = t - h.t; if (u < 0 || u > 0.7) continue;
    const k = h.p * Math.exp(-u * 8);
    dx += k * 24 * Math.sin(u * 62 + h.t * 7); dy += k * 18 * Math.cos(u * 51 + h.t * 3); r += k * 0.012 * Math.sin(u * 44 + h.t);
  }
  return [dx, dy, r];
}

function draw(t) {
  t = clamp(t, 0, T.dur - 1e-4);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.letterSpacing = '0px';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const S = OP._shots; let i = S.length - 1; while (i > 0 && S[i].at > t) i--;
  const sh = S[i], end = i < S.length - 1 ? S[i + 1].at : T.dur, d = end - sh.at, lt = t - sh.at;
  // camera: a small punch-in on the cut + a slow push across the shot + shake on hits
  const punch = 1 + 0.07 * (1 - eo(clamp(lt / 0.28)));
  const drift = 1 + (sh.zoom ?? 0.035) * eio(clamp(lt / d));
  const [cx, cy] = sh.cam || [540, 900], [sx, sy, sr] = shakeAt(t);
  ctx.save(); ctx.translate(cx + sx, cy + sy); ctx.rotate(sr); ctx.scale(punch * drift, punch * drift); ctx.translate(-cx, -cy);
  sh.draw(lt, d, t);
  ctx.restore();
  ctx.globalAlpha = 1; ctx.letterSpacing = '0px';
  if (!sh.noCaption) drawCaption(t);
  const fade = Math.min(clamp(t / 0.25), clamp((T.dur - t) / 0.35));
  if (fade < 1) { ctx.fillStyle = '#000'; ctx.globalAlpha = 1 - fade; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
}

(async () => {
  try {
    await Promise.all(['900 100px Inter', '800 100px Inter', '700 100px FreeMono'].map((f) => document.fonts.load(f)));
    const look = await fetch('mascot.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
    M.setLook(look);
    if (q.has('poses')) {                                             // the mascot approval sheet
      const { drawPoseSheet, drawPortrait, drawVariants } = await import('./posesheet.js');
      const variants = q.has('variants') ? await fetch('variants.json', { cache: 'no-store' }).then((r) => r.json()) : null;
      const sheet = variants ? () => drawVariants(variants, q.has('body'), q.has('faces')) : q.has('portrait') ? drawPortrait : drawPoseSheet;
      T.dur = 1; OP.duration = () => 1; OP.draw = () => sheet(); OP.frame = (t, qq = 0.92) => { sheet(); return cv.toDataURL('image/jpeg', qq); };
      OP.shots = () => []; OP.captions = () => []; OP.cues = () => []; OP.ready = true; sheet(); return;
    }
    const script = await (await fetch('script.json', { cache: 'no-store' })).json();
    await loadTiming(); await loadLipsync();
    buildCaptions(script);
    const { buildShots } = await import('./shots.js');
    const { shots, cues, hits = [] } = buildShots();
    shots.sort((a, b) => a.at - b.at);
    OP._shots = shots; OP._hits = hits; OP.script = script;
    OP.duration = () => T.dur;
    OP.draw = draw;
    OP.frame = (t, qq = 0.92) => { draw(t); return cv.toDataURL('image/jpeg', qq); };
    OP.shots = () => shots.map((s, i) => ({ id: s.id, at: +s.at.toFixed(3), end: +(i < shots.length - 1 ? shots[i + 1].at : T.dur).toFixed(3), note: s.note || '' }));
    OP.captions = () => captionList().map((c) => ({ s: +c.s.toFixed(3), e: +c.e.toFixed(3), text: c.words.map((w) => (w.hi ? '*' : '') + w.txt).join(' ') }));
    OP.cues = () => cues.slice().sort((a, b) => a.t - b.t);
    OP.ready = true;
    if (!q.has('capture')) {                                          // preview: play in real time, ?t=12.3 holds a frame
      if (q.has('t')) draw(+q.get('t'));
      else {
        const audio = new Audio('data/mix.wav'); let t0 = null;
        const btn = document.getElementById('play'); btn.hidden = false;
        btn.onclick = () => { btn.hidden = true; t0 = performance.now(); audio.currentTime = 0; audio.play().catch(() => {}); };
        const loop = (now) => { const t = t0 == null ? 0 : (now - t0) / 1000; draw(t0 == null ? 0 : t); if (t0 != null && t > T.dur) { t0 = null; btn.hidden = false; } requestAnimationFrame(loop); };
        requestAnimationFrame(loop);
      }
    }
  } catch (e) { OP.bootError = String(e && e.stack || e); console.error(e); }
})();
