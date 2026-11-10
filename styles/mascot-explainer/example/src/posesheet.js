// The mascot approval sheet (1080x1920): every pose, every mood, the talking mouth and the hands, drawn from mascot.json.
// Show it to the user before building any shots:  QS='&poses=1' node tools/capture.mjs frames review/poses 0
// Big close-up for the likeness check:             QS='&poses=1&portrait=1' node tools/capture.mjs frames review/portrait 0
// Lettered A/B/C variants (variants.json: [{ "label": "rounder face", "patch": { "faceW": 1.08 } }, ...]):
//                                                   QS='&poses=1&variants=1' node tools/capture.mjs frames review/variants 0
// Outfit choices (shows the torso):                 QS='&poses=1&variants=1&body=1' …
// Eye check (neutral + happy, both talking):        QS='&poses=1&variants=1&faces=1' …
import { ctx, C, W, H, text, rr } from './core/lib.js';
import * as M from './core/mascot.js';

function cellBox(x, y, w, h, label) {
  rr(x, y, w, h, 22); ctx.fillStyle = C.white; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.line; ctx.stroke();
  text(label, x + 18, y + 30, 22, C.inkSoft, { font: 'FreeMono', weight: 700 });
}
export function drawPoseSheet() {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  const L = M.getLook();
  text('MASCOT · ' + String(L.name || 'Default').toUpperCase(), 40, 62, 56, C.ink);
  text(`${L.hair} hair · ${L.beard || 'no'} beard · ${L.glasses || 'no'} glasses · ${L.outfit}`, 40, 112, 24, C.inkSoft, { font: 'FreeMono', weight: 700 });
  const names = Object.keys(M.POSES), cw = 330, ch = 360, gx = 30, gy = 150, gap = 15;
  names.forEach((p, i) => {
    const x = gx + (i % 3) * (cw + gap), y = gy + Math.floor(i / 3) * (ch + gap);
    cellBox(x, y, cw, ch, p);
    ctx.save(); rr(x, y, cw, ch, 22); ctx.clip();
    const P = M.POSES[p];
    M.draw(x + cw / 2, y + ch - 100, 0.36, { ...P, mood: P.mood || 'neutral', count: 3, blink: 0, talk: 0 }, 0.3);
    ctx.restore();
  });
  // talking mouth + hands in the last two cells of the grid
  let x = gx + (10 % 3) * (cw + gap), y = gy + 3 * (ch + gap);
  cellBox(x, y, cw, ch, 'talking');
  const talks = [[0, 'quiet'], [0.35, 'small'], [0.8, 'wide'], [0.7, 'oo']].map(([v, lab], k) => [v, lab, x + 85 + (k % 2) * 160, y + 125 + Math.floor(k / 2) * 160]);
  talks.forEach(([v, lab, hx, hy]) => M.drawHead(hx, hy, 0.38, { mood: 'happy', talk: v, word: lab === 'oo' ? 'you' : 'and' }));
  talks.forEach(([v, lab, hx, hy]) => { rr(hx - 34, hy + 62, 68, 24, 8); ctx.fillStyle = C.white; ctx.fill(); text(lab, hx, hy + 75, 18, C.inkSoft, { align: 'center', font: 'FreeMono', weight: 700 }); });
  x = gx + 2 * (cw + gap); cellBox(x, y, cw, ch, 'hands');
  [['open'], ['fist'], ['point'], ['thumb'], ['count', 2], ['count', 5]].forEach(([k, n], j) => {
    const hx = x + 70 + (j % 3) * 95, hy = y + 150 + Math.floor(j / 3) * 130;
    M.drawHand(hx, hy, 0.8, k, n, -Math.PI / 2, -1); text(k + (n ? n : ''), hx, hy + 58, 16, C.inkSoft, { align: 'center', font: 'FreeMono', weight: 700 });
  });
  // moods
  y = gy + 4 * (ch + gap) - 10; text('MOODS', 40, y + 20, 26, C.ink);
  M.MOODS.forEach((m, k) => {
    const hx = 72 + k * 133, hy = y + 120;
    M.drawHead(hx, hy, 0.36, { mood: m, look: [0, 0] }); text(m, hx, hy + 78, 17, C.inkSoft, { align: 'center', font: 'FreeMono', weight: 700 });
  });
}

/** a big close-up (head ~510 px wide): the likeness check against the user's photo */
export function drawPortrait() {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  const L = M.getLook();
  text('MASCOT · ' + String(L.name || 'Default').toUpperCase() + ' · CLOSE-UP', 40, 62, 44, C.ink);
  M.draw(540, 1240, 1.9, { ...M.POSES.idle, mood: 'neutral', blink: 0, talk: 0 });
  M.drawHead(230, 330, 0.55, { mood: 'happy' }); M.drawHead(850, 330, 0.55, { mood: 'neutral', talk: 0.7, word: 'and' });
}

/** lettered likeness variants, side by side: variants = [{ label, patch }] (patch = mascot.json fields to try) */
export function drawVariants(variants, body = false, faces = false) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
  const base = { ...M.getLook() };
  text('MASCOT · ' + String(base.name || 'Default').toUpperCase() + ' · PICK A LETTER', 40, 62, 44, C.ink);
  const cols = 2, cw = 520, ch = Math.min(600, Math.floor(1740 / Math.ceil(variants.length / cols)));
  variants.forEach((v, i) => {
    const x = 20 + (i % cols) * (cw + 20), y = 120 + Math.floor(i / cols) * ch;
    cellBox(x, y, cw, ch - 16, '');
    M.setLook({ ...base, ...v.patch });
    ctx.save(); rr(x, y, cw, ch - 16, 22); ctx.clip();                  // head + shoulders, so neck and body changes show too
    if (faces) { const sc = Math.min(0.68, ch / 820);                 // eye check: neutral + happy-talking, as it plays in a reel
      M.drawHead(x + cw * 0.26, y + ch * 0.5, sc, { mood: 'neutral', talk: 0.5, word: 'and' }); M.drawHead(x + cw * 0.74, y + ch * 0.5, sc, { mood: 'happy', talk: 0.6, word: 'and' });
      text('neutral', x + cw * 0.26, y + ch * 0.5 + 225 * sc, 20, C.inkSoft, { align: 'center', font: 'FreeMono', weight: 700 }); text('happy', x + cw * 0.74, y + ch * 0.5 + 225 * sc, 20, C.inkSoft, { align: 'center', font: 'FreeMono', weight: 700 }); }
    else if (body) M.draw(x + cw / 2, y + ch * 0.52, Math.min(0.62, ch / 900), { ...M.POSES.present, L: [40, 30, 'open'], mood: 'happy', blink: 0, talk: 0 });   // outfit check: torso + arms
    else M.draw(x + cw / 2, y + ch - 110, Math.min(0.92, ch / 640), { ...M.POSES.idle, mood: 'neutral', blink: 0, talk: 0 });
    ctx.restore();
    rr(x + cw / 2 - 200, y + ch - 84, 400, 52, 14); ctx.fillStyle = C.white; ctx.fill();
    text(String.fromCharCode(65 + i), x + 22, y + 44, 52, C.violet);
    text(v.label, x + cw / 2, y + ch - 52, 26, C.ink, { align: 'center', weight: 800, maxW: cw - 40 });
  });
  M.setLook(base);
}
