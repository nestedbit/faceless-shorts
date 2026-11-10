// The mascot: a flat cartoon puppet of the creator, drawn in code (no image generator), rigged for acting.
// Its look comes from mascot.json (skin, hair, beard, glasses, outfit), so one file = one person, reused in every video.
//
//   M.setLook(json)                         once at boot (main.js does it)
//   const host = M.act([[t, 'pose', { mood, look, count, tilt }], ...])   a timeline of poses (film time)
//   M.mascot(x, y, s, t, host)              draw it: (x, y) = base of the neck, s = scale (s 1 ≈ head 270 px wide)
//   M.draw(x, y, s, state)                  draw one explicit state (the pose sheet, the style sheet)
//
// Arms: L = SCREEN-LEFT arm, R = SCREEN-RIGHT arm. [shoulder°, elbow°, hand]: 0° hangs down, 90° points out to its own
// side, 180° straight up, negative = across the body. Hands: 'open' 'fist' 'point' 'thumb' 'count' (count: n fingers).
import { ctx, C, clamp, lerp, seg, eob, eio, rnd, rad, TAU } from './lib.js';
import { talk, wordAt } from './lipsync.js';

export const DEFAULT_LOOK = {
  name: 'Default', skin: '#D9A07A', skinShade: '#C08560', hair: 'sidepart', hairCol: '#2A1F1A', beard: 'none', beardCol: null,
  glasses: 'round', glassesCol: '#15172A', outfit: 'hoodie', outfitCol: '#5B3DF5', outfitShade: '#4528D9', trim: '#C8F53A',
  browCol: null, blush: true, eyes: 'round', irisCol: null, eyeSize: 1, eyeH: 1, squint: 1, nose: 1, noseW: null, lidTop: 0, watch: null,
  faceW: 1, faceL: 0, jaw: 0, hairVol: 1, hairSides: 0, messy: false, beardJaw: 0, stacheW: 1, stubble: null, chinBeard: 1, beardSplit: 0, earSize: 1, bodyW: 1, faceShade: true, noseShade: true, neck: 1, neckL: 0, browW: 15, browArch: 0, lips: false, lipCol: null,
};
let LOOK = { ...DEFAULT_LOOK };
export function setLook(j) { LOOK = { ...DEFAULT_LOOK, ...(j || {}) }; return LOOK; }
export const getLook = () => LOOK;

export const POSES = {
  idle:        { L: [14, -52, 'open'], R: [14, -58, 'fist'], tilt: 0, look: [0, 0] },
  pointUp:     { L: [166, 4, 'point'], R: [14, -58, 'fist'], tilt: -0.05, look: [-0.4, -1], mood: 'happy' },
  pointAt:     { L: [136, 10, 'point'], R: [14, -58, 'fist'], tilt: -0.05, look: [-1, -0.6] },
  present:     { L: [72, 38, 'open'], R: [14, -58, 'fist'], tilt: -0.03, look: [-1, -0.3], mood: 'happy' },
  presentLeft: { L: [96, 18, 'open'], R: [20, -40, 'open'], tilt: 0.04, look: [-1, 0] },
  shrug:       { L: [42, 104, 'open'], R: [42, 104, 'open'], tilt: 0.09, look: [0.2, -0.2], mood: 'skeptical' },
  thumbsUp:    { L: [14, -52, 'open'], R: [40, 140, 'thumb'], tilt: 0.05, look: [0, 0], mood: 'happy' },
  count:       { L: [58, 122, 'count'], R: [14, -58, 'fist'], tilt: -0.04, look: [-0.6, -0.4] },
  wave:        { L: [14, -52, 'open'], R: [138, 22, 'open'], tilt: 0.06, look: [0, 0], mood: 'happy', wave: 'R' },
  stop:        { L: [62, 98, 'open'], R: [14, -58, 'fist'], tilt: -0.02, look: [0, 0], mood: 'serious' },
};
export const MOODS = ['neutral', 'happy', 'excited', 'surprised', 'skeptical', 'serious', 'worried', 'wink'];

// ---------- helpers ----------
export function mix(a, b, k) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
}
const INK = () => C.ink;
/** shapes with ONE merged outline: every part is first drawn fat in ink, then filled */
function shapes(list, fill, ol = 6) {
  for (const pass of [0, 1]) for (const p of list) {
    ctx.fillStyle = ctx.strokeStyle = pass ? (p.fill || fill) : INK(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (p.cap) { ctx.lineWidth = p.w + (pass ? 0 : ol * 2); ctx.beginPath(); ctx.moveTo(...p.cap[0]); for (const q of p.cap.slice(1)) ctx.lineTo(...q); ctx.stroke(); }
    else if (p.rr) { const [x, y, w, h, r] = p.rr; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); if (!pass) { ctx.lineWidth = ol * 2; ctx.stroke(); } }
    else if (p.ell) { const [x, y, rx, ry, rot = 0] = p.ell; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); ctx.fill(); if (!pass) { ctx.lineWidth = ol * 2; ctx.stroke(); } }
  }
}
const dirOf = (sgn, deg) => [sgn * Math.sin(rad(deg)), Math.cos(rad(deg))];

// ---------- hands (local: wrist at 0,0, +x along the forearm; m = which side the thumb is on) ----------
function hand(kind, m, n = 1) {
  const sk = LOOK.skin;
  if (kind === 'open') {
    const fingers = [[-0.34, 34], [-0.11, 40], [0.11, 39], [0.32, 31]].map(([a, l], i) => {
      const y0 = (i - 1.5) * 12 * m, x0 = 46; return { cap: [[x0, y0], [x0 + Math.cos(a * m) * l, y0 + Math.sin(a * m) * l]], w: 15 };
    }).reverse();
    shapes([...fingers, { cap: [[18, 18 * m], [36, 50 * m]], w: 16 }, { rr: [-4, -28, 58, 56, 24] }], sk);
  } else if (kind === 'point') {
    shapes([{ cap: [[40, 15 * m], [96, 15 * m]], w: 18 }, { rr: [-4, -27, 54, 54, 22] }], sk);
    shapes([{ cap: [[14, 22 * m], [34, 6 * m]], w: 14 }], sk, 4);
  } else if (kind === 'thumb') {
    shapes([{ cap: [[26, 20 * m], [82, 20 * m]], w: 22 }, { rr: [-4, -30, 58, 60, 24] }], sk);
    ctx.strokeStyle = INK(); ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (const x of [14, 27, 40]) { ctx.beginPath(); ctx.moveTo(x, -4 * m); ctx.lineTo(x, -22 * m); ctx.stroke(); }
  } else if (kind === 'count') {
    const ys = [15, 3, -9, -21].map((v) => v * m), list = [];
    for (let i = 0; i < Math.min(4, n); i++) list.push({ cap: [[38, ys[i]], [88 - Math.abs(i - 1) * 5, ys[i] * 1.15]], w: 14 });
    if (n >= 5) list.push({ cap: [[16, 22 * m], [40, 50 * m]], w: 15 });
    shapes([...list, { rr: [-4, -27, 52, 54, 22] }], sk);
    if (n < 5) shapes([{ cap: [[12, 22 * m], [30, 8 * m]], w: 13 }], sk, 4);
  } else {                                                           // fist
    shapes([{ rr: [-4, -29, 60, 58, 24] }], sk);
    shapes([{ cap: [[14, 24 * m], [38, 8 * m]], w: 16 }], sk, 4);
    ctx.strokeStyle = INK(); ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (const y of [-12, 4]) { ctx.beginPath(); ctx.moveTo(42, y * m); ctx.lineTo(54, y * m); ctx.stroke(); }
  }
}

// ---------- body ----------
const SH0 = 182, L1 = 160, L2 = 150, ARM0 = 54;
function torsoPath() {
  ctx.beginPath(); ctx.moveTo(-62, -8); ctx.lineTo(-150, 6); ctx.quadraticCurveTo(-214, 16, -222, 92); ctx.lineTo(-240, 620);
  ctx.lineTo(240, 620); ctx.lineTo(222, 92); ctx.quadraticCurveTo(214, 16, 150, 6); ctx.lineTo(62, -8); ctx.closePath();
}
function torso() {
  const o = LOOK.outfit, col = LOOK.outfitCol, sh = LOOK.outfitShade;
  if (o === 'hoodie') {                                              // hood lying behind the neck
    ctx.beginPath(); ctx.ellipse(0, -6, 132, 58, 0, Math.PI * 1.02, Math.PI * 1.98, false); ctx.lineTo(118, 30); ctx.quadraticCurveTo(0, 70, -118, 30); ctx.closePath();
    ctx.fillStyle = sh; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = INK(); ctx.stroke();
  }
  torsoPath(); ctx.fillStyle = col; ctx.fill();
  ctx.save(); torsoPath(); ctx.clip(); ctx.fillStyle = sh; ctx.beginPath(); ctx.moveTo(150, -20); ctx.quadraticCurveTo(190, 200, 140, 640); ctx.lineTo(300, 640); ctx.lineTo(300, -20); ctx.fill(); ctx.restore();
  torsoPath(); ctx.lineWidth = 8; ctx.strokeStyle = INK(); ctx.lineJoin = 'round'; ctx.stroke();
  const sk = LOOK.skin;
  if (o === 'tee' || o === 'hoodie') {
    ctx.beginPath(); ctx.moveTo(-60, -8); ctx.quadraticCurveTo(0, o === 'tee' ? 64 : 52, 60, -8); ctx.closePath(); ctx.fillStyle = sk; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-64, -8); ctx.quadraticCurveTo(0, o === 'tee' ? 72 : 60, 64, -8); ctx.strokeStyle = INK(); ctx.lineWidth = o === 'tee' ? 20 : 8; ctx.stroke();
    if (o === 'tee') { ctx.beginPath(); ctx.moveTo(-64, -8); ctx.quadraticCurveTo(0, 72, 64, -8); ctx.strokeStyle = sh; ctx.lineWidth = 9; ctx.stroke(); }
  }
  if (o === 'hoodie') {
    for (const sx of [-1, 1]) { const x0 = sx * 34; ctx.beginPath(); ctx.moveTo(x0, 34); ctx.quadraticCurveTo(x0 + sx * 6, 110, x0 - sx * 2, 168);
      ctx.strokeStyle = INK(); ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.stroke(); ctx.strokeStyle = LOOK.trim; ctx.lineWidth = 6; ctx.stroke();
      ctx.beginPath(); ctx.roundRect(x0 - sx * 2 - 8, 162, 16, 26, 6); ctx.fillStyle = LOOK.trim; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK(); ctx.stroke(); }
  }
  if (o === 'polo' || o === 'shirt') {
    ctx.beginPath(); ctx.moveTo(-50, -8); ctx.lineTo(0, 66); ctx.lineTo(50, -8); ctx.closePath(); ctx.fillStyle = sk; ctx.fill(); ctx.strokeStyle = INK(); ctx.lineWidth = 6; ctx.stroke();
    const cc = o === 'polo' ? col : (LOOK.trim || C.white);
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 6, 50); ctx.lineTo(sx * 70, -14); ctx.lineTo(sx * 92, 20); ctx.lineTo(sx * 46, 82); ctx.closePath(); ctx.fillStyle = cc; ctx.fill(); ctx.lineWidth = 7; ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(0, 66); ctx.lineTo(0, o === 'polo' ? 170 : 640); ctx.lineWidth = 6; ctx.stroke();
    for (const y of o === 'polo' ? [104, 146] : [110, 190, 270, 350]) { ctx.beginPath(); ctx.arc(-14, y, 7, 0, TAU); ctx.fillStyle = mix(col, '#FFFFFF', 0.6); ctx.fill(); ctx.lineWidth = 4; ctx.stroke(); }
  }
}
function arm(side, [a, e, kind], n, wave, t) {
  const sgn = side === 'L' ? -1 : 1, m = -sgn, bw = LOOK.bodyW || 1, ARM = ARM0 * (0.4 + 0.6 * bw), SH = SH0 * bw;
  if (wave) e += Math.sin(t * 13) * 18;
  const S = [sgn * SH, 50], d1 = dirOf(sgn, a), d2 = dirOf(sgn, a + e);
  const E = [S[0] + d1[0] * L1, S[1] + d1[1] * L1], Wr = [E[0] + d2[0] * L2, E[1] + d2[1] * L2];
  const short = LOOK.outfit === 'tee' || LOOK.outfit === 'polo';
  const sleeveEnd = short ? [S[0] + d1[0] * L1 * 0.58, S[1] + d1[1] * L1 * 0.58] : [Wr[0] - d2[0] * 18, Wr[1] - d2[1] * 18];
  shapes([{ cap: [S, E, Wr], w: ARM }], LOOK.skin, 6);
  const sleevePts = short ? [S, sleeveEnd] : [S, E, sleeveEnd];
  shapes([{ cap: sleevePts, w: ARM + 14 }], LOOK.outfitCol, 6);
  if (!short) {                                                      // cuff
    ctx.strokeStyle = LOOK.outfitShade; ctx.lineWidth = ARM + 2; ctx.lineCap = 'butt';
    const c0 = [sleeveEnd[0] - d2[0] * 16, sleeveEnd[1] - d2[1] * 16];
    ctx.beginPath(); ctx.moveTo(...c0); ctx.lineTo(...sleeveEnd); ctx.stroke(); ctx.lineCap = 'round';
  }
  if (LOOK.watch && side === 'R') {                                  // wristwatch on the screen-right wrist
    ctx.save(); ctx.translate(Wr[0] - d2[0] * 8, Wr[1] - d2[1] * 8); ctx.rotate(Math.atan2(d2[1], d2[0]));
    ctx.beginPath(); ctx.roundRect(-14, -ARM / 2 - 5, 26, ARM + 10, 8); ctx.fillStyle = LOOK.watch; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(-18, -16, 34, 32, 9); ctx.fillStyle = mix(LOOK.watch, '#FFFFFF', 0.25); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  ctx.save(); ctx.translate(...Wr); ctx.rotate(Math.atan2(d2[1], d2[0])); hand(kind, m, n); ctx.restore();
}

// ---------- head (local: head centre) ----------
// the lower face: jaw -1 = V-shaped (pointed chin) · 0 = tapered (default) · 1 = round, full · faceL = extra length (px)
function jawPts() {
  const j = LOOK.jaw || 0, d = LOOK.faceL || 0;
  const base = [132, 40, 118, 95, 80, 125, 55, 145, 25, 152, 0, 152];
  const tgt = j < 0 ? [132, 30, 112, 92, 62, 134, 40, 152, 16, 164, 0, 166] : [132, 72, 128, 116, 98, 140, 64, 156, 30, 160, 0, 160];
  const k = Math.abs(j), P = base.map((v, i) => v + (tgt[i] - v) * k), dy = [0.3, 0.7, 0.9, 1, 1, 1];
  for (let i = 0; i < 6; i++) P[i * 2 + 1] += d * dy[i];
  return P;                                                          // [c1x c1y c2x c2y ex ey  c3x c3y c4x c4y 0 chinY]
}
export const chinY = () => jawPts()[11];
function headPath() {
  const [a, b, c, d, e, f, g, h, i, j, , ch] = jawPts();
  ctx.beginPath(); ctx.moveTo(0, -150);
  ctx.bezierCurveTo(80, -150, 132, -110, 132, -30); ctx.bezierCurveTo(a, b, c, d, e, f); ctx.bezierCurveTo(g, h, i, j, 0, ch);
  ctx.bezierCurveTo(-i, j, -g, h, -e, f); ctx.bezierCurveTo(-c, d, -a, b, -132, -30); ctx.bezierCurveTo(-132, -110, -80, -150, 0, -150);
  ctx.closePath();
}
function hairPath(style) {
  const p = new Path2D();
  if (style === 'buzz' || style === 'bun') {
    p.moveTo(-134, -24); p.bezierCurveTo(-140, -140, -76, -162, 0, -162); p.bezierCurveTo(76, -162, 140, -140, 134, -24); p.lineTo(120, -24);
    p.bezierCurveTo(116, -70, 80, -104, 0, -104); p.bezierCurveTo(-80, -104, -116, -70, -120, -24); p.closePath();
  } else if (style === 'sidepart' || style === 'long') {
    p.moveTo(-138, style === 'long' ? 110 : -6); p.lineTo(-140, -60); p.bezierCurveTo(-146, -160, -80, -184, 0, -184); p.bezierCurveTo(90, -184, 150, -150, 142, -56);
    p.lineTo(138, style === 'long' ? 110 : -6); p.lineTo(style === 'long' ? 112 : 120, style === 'long' ? 110 : -6); p.lineTo(116, -70);
    p.bezierCurveTo(70, -86, 10, -120, -40, -112); p.bezierCurveTo(-80, -104, -100, -90, -116, -70); p.lineTo(style === 'long' ? -112 : -120, style === 'long' ? 110 : -6); p.closePath();
  } else if (style === 'swoop') {                                    // thick, side-swept fringe (low on screen-left); hairVol = taller dome + wider sides
    const k = Math.max(0, (LOOK.hairVol || 1) - 1), top = -206 - 260 * k, side = 158 + 90 * k, hs = LOOK.hairSides || 0, sb = 144 + 60 * k + 14 * hs, sy = -6 + 34 * hs;
    p.moveTo(-sb + 18 * hs, sy); p.quadraticCurveTo(-sb - 6 * hs, sy - 20 * hs, -side, -76); p.bezierCurveTo(-side - 12, -160 - 200 * k, -108 - 40 * k, top + 2, -10, top); p.bezierCurveTo(90 + 40 * k, top - 2, side + 10, -168 - 200 * k, side, -86);
    p.quadraticCurveTo(sb + 6 * hs, sy - 20 * hs, sb - 18 * hs, sy - 4); p.lineTo(127, sy - 4); p.lineTo(125, -92);
    if (LOOK.messy) {                                                // layered fringe: more, sharper locks
      p.quadraticCurveTo(116, -120, 96, -100); p.quadraticCurveTo(84, -124, 58, -98); p.quadraticCurveTo(44, -118, 18, -86);
      p.quadraticCurveTo(-4, -108, -28, -74); p.quadraticCurveTo(-50, -96, -76, -62); p.quadraticCurveTo(-96, -82, -114, -48);
    } else {
      p.quadraticCurveTo(108, -122, 76, -108); p.quadraticCurveTo(46, -118, 14, -88); p.quadraticCurveTo(-24, -98, -58, -68);
      p.quadraticCurveTo(-86, -78, -112, -52);
    }
    p.lineTo(-128, -42); p.lineTo(-131, sy); p.closePath();
  } else {                                                           // short / curly / afro front
    p.moveTo(-136, -8); p.lineTo(-138, -60); p.bezierCurveTo(-142, -152, -80, -178, 0, -178); p.bezierCurveTo(80, -178, 142, -152, 138, -60); p.lineTo(136, -8);
    p.lineTo(118, -8); p.lineTo(116, -76); p.bezierCurveTo(80, -96, 40, -84, 10, -100); p.bezierCurveTo(-30, -84, -80, -98, -116, -76); p.lineTo(-118, -8); p.closePath();
  }
  return p;
}
function hairBack(style) {
  const col = LOOK.hairCol;
  if (style === 'long') { ctx.beginPath(); ctx.roundRect(-168, -170, 336, 330, [150, 150, 60, 60]); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = INK(); ctx.stroke(); }
  if (style === 'afro') { const pts = 16; ctx.beginPath(); for (let i = 0; i <= pts * 4; i++) { const a = (i / (pts * 4)) * TAU, r = 196 + Math.sin(a * pts) * 10; ctx.lineTo(Math.cos(a) * r * 1.02, -60 + Math.sin(a) * r * 0.92); } ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = INK(); ctx.stroke(); }
  if (style === 'bun') { ctx.beginPath(); ctx.arc(0, -196, 52, 0, TAU); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = INK(); ctx.stroke(); }
}
function hairFront(style) {
  if (style === 'bald') { ctx.beginPath(); ctx.arc(-40, -96, 40, Math.PI * 1.1, Math.PI * 1.45); ctx.strokeStyle = mix(LOOK.skin, '#FFFFFF', 0.45); ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke(); return; }
  const col = LOOK.hairCol, p = hairPath(style === 'afro' ? 'short' : style);
  if (style === 'curly' || style === 'afro') {                     // bumpy edge: circles along the outline
    ctx.save(); ctx.clip(new Path2D('M-400 -400 H400 V-40 H-400 Z')); const bumps = [];
    for (let i = 0; i <= 13; i++) { const a = Math.PI * (1.02 + (i / 13) * 0.96); bumps.push([Math.cos(a) * 140, -70 + Math.sin(a) * 110]); }
    for (let i = 0; i <= 7; i++) bumps.push([-104 + i * 30, -92 + (i % 2) * 10]);
    for (const pass of [0, 1]) for (const [x, y] of bumps) { ctx.beginPath(); ctx.arc(x, y, pass ? 28 : 35, 0, TAU); ctx.fillStyle = pass ? col : INK(); ctx.fill(); }
    ctx.restore(); ctx.fillStyle = col; ctx.fill(p); return;
  }
  ctx.fillStyle = style === 'buzz' ? mix(col, LOOK.skin, 0.35) : col; ctx.fill(p); ctx.lineWidth = style === 'buzz' ? 5 : 7; ctx.strokeStyle = INK(); ctx.lineJoin = 'round'; ctx.stroke(p);
  if (style === 'swoop') {                                           // strands follow the sweep + a glossy streak
    ctx.save(); ctx.clip(p); ctx.lineCap = 'round';
    ctx.strokeStyle = mix(col, '#FFFFFF', 0.22); ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(96, -178); ctx.bezierCurveTo(40, -192, -50, -168, -98, -112); ctx.stroke();
    ctx.strokeStyle = INK(); ctx.lineWidth = 4.5;
    for (const [x0, y0, x1, y1] of [[132, -140, 14, -100], [92, -186, -60, -84], [20, -196, -118, -70]]) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2 + 10, Math.min(y0, y1) - 22, x1, y1); ctx.stroke(); }
    ctx.restore(); return;
  }
  if (style !== 'buzz') { ctx.beginPath(); ctx.moveTo(-70, -150); ctx.quadraticCurveTo(-20, -168, 40, -158); ctx.strokeStyle = mix(col, '#FFFFFF', 0.25); ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.stroke(); }
}
function beard(style) {
  if (!style || style === 'none') return;
  ctx.save(); const sy = (chinY() - 40) / 112, sx = 1 - Math.max(0, -(LOOK.jaw || 0)) * 0.12;
  ctx.translate(0, 40); ctx.scale(sx, sy); ctx.translate(0, -40); beardShapes(style); ctx.restore();
}
function faceClip() {                                                // inside beardShapes: undo the beard stretch, clip to the real face
  const bsx = 1 - Math.max(0, -(LOOK.jaw || 0)) * 0.12, bsy = (chinY() - 40) / 112;
  ctx.save(); ctx.translate(0, 40); ctx.scale(1 / bsx, 1 / bsy); ctx.translate(0, -40); headPath(); ctx.restore(); ctx.clip();
}
function beardShapes(style) {
  const bc = LOOK.beardCol || LOOK.hairCol;
  const jaw = () => { ctx.beginPath(); ctx.moveTo(-130, 0); ctx.bezierCurveTo(-126, 50, -116, 95, -80, 125); ctx.bezierCurveTo(-55, 145, -25, 152, 0, 152); ctx.bezierCurveTo(25, 152, 55, 145, 80, 125);
    ctx.bezierCurveTo(116, 95, 126, 50, 130, 0); ctx.lineTo(112, 4); ctx.bezierCurveTo(104, 50, 70, 60, 40, 60); ctx.quadraticCurveTo(0, 50, -40, 60); ctx.bezierCurveTo(-70, 60, -104, 50, -112, 4); ctx.closePath(); };
  const stache = () => { ctx.beginPath(); ctx.moveTo(-46, 74); ctx.quadraticCurveTo(-30, 50, 0, 58); ctx.quadraticCurveTo(30, 50, 46, 74); ctx.quadraticCurveTo(20, 66, 0, 70); ctx.quadraticCurveTo(-20, 66, -46, 74); ctx.closePath(); ctx.fillStyle = bc; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK(); ctx.stroke(); };
  if (style === 'stubble') { jaw(); ctx.fillStyle = mix(LOOK.skin, bc, LOOK.stubble ?? 0.28); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, 64, 44, 12, 0, 0, TAU); ctx.fill(); return; }
  if (style === 'full') { jaw(); ctx.fillStyle = bc; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK(); ctx.stroke(); stache(); return; }
  if (style === 'goatee') { ctx.beginPath(); ctx.ellipse(0, 128, 40, 28, 0, 0, TAU); ctx.fillStyle = bc; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK(); ctx.stroke(); stache(); return; }
  if (style === 'mustache') stache();
  if (style === 'circle') {                                          // jaw stubble + drooping mustache joined to a chin beard
    ctx.save(); faceClip(); jaw(); ctx.fillStyle = mix(LOOK.skin, bc, LOOK.stubble ?? 0.22); ctx.fill(); ctx.restore();
    const bj = LOOK.beardJaw || 0;
    if (bj > 0) { ctx.save(); faceClip(); ctx.beginPath(); ctx.moveTo(-134, 10); ctx.bezierCurveTo(-130, 80, -110, 120, -70, 140); ctx.quadraticCurveTo(0, 172, 70, 140);
      ctx.bezierCurveTo(110, 120, 130, 80, 134, 10); ctx.strokeStyle = bc; ctx.lineWidth = 50 * bj; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore(); }
    const split = LOOK.beardSplit || 0;                              // 0 joined · 1 gap at the mouth corners · 2 wider gap
    if (!split) { ctx.strokeStyle = bc; ctx.lineWidth = 9; ctx.lineCap = 'round';
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * 58, 90); ctx.quadraticCurveTo(sx * 62, 100, sx * 56, 110); ctx.stroke(); } }
    const cb = LOOK.chinBeard || 1; ctx.save(); ctx.translate(0, 112 + Math.max(0, split - 1) * 8); ctx.scale(cb, cb); ctx.translate(0, -112);
    ctx.beginPath(); ctx.moveTo(-58, 106); ctx.quadraticCurveTo(-64, 158, 0, 164); ctx.quadraticCurveTo(64, 158, 58, 106);
    ctx.quadraticCurveTo(30, 124, 0, 120); ctx.quadraticCurveTo(-30, 124, -58, 106); ctx.closePath(); ctx.fillStyle = bc; ctx.fill(); ctx.lineWidth = 5 / cb; ctx.strokeStyle = INK(); ctx.stroke(); ctx.restore();
    const sw = LOOK.stacheW || 1; ctx.save(); ctx.translate(0, 74); ctx.scale(sw, 1 + (sw - 1) * 0.9); ctx.translate(0, -74);
    const cy = 92 - Math.max(0, split - 1) * 8;                      // a wider split shortens the drooping corners
    ctx.beginPath(); ctx.moveTo(-60, cy); ctx.quadraticCurveTo(-52, 54, 0, 60); ctx.quadraticCurveTo(52, 54, 60, cy); ctx.quadraticCurveTo(48, 78, 28, 74);
    ctx.quadraticCurveTo(0, 70, -28, 74); ctx.quadraticCurveTo(-48, 78, -60, cy); ctx.closePath(); ctx.fillStyle = bc; ctx.fill(); ctx.lineWidth = 5 / sw; ctx.strokeStyle = INK(); ctx.stroke(); ctx.restore();
  }
}
const FACE = {                                                      // brows [raise, innerTilt, outerTilt] per side, eye lid, idle mouth
  neutral:   { bL: [0, 0, 0], bR: [0, 0, 0], lid: 0, mouth: 'soft' },
  happy:     { bL: [0.3, 0, 0], bR: [0.3, 0, 0], lid: 0.32, mouth: 'smile' },
  excited:   { bL: [0.8, -4, 0], bR: [0.8, -4, 0], lid: 0, wide: 1.1, mouth: 'grin' },
  surprised: { bL: [1, 0, 0], bR: [1, 0, 0], lid: 0, wide: 1.15, mouth: 'o' },
  skeptical: { bL: [1, 0, 4], bR: [-0.25, 8, -2], lid: 0, lidR: 0.3, mouth: 'smirk' },
  serious:   { bL: [-0.3, 12, -4], bR: [-0.3, 12, -4], lid: 0.15, mouth: 'flat' },
  worried:   { bL: [0.6, -14, 6], bR: [0.6, -14, 6], lid: 0, mouth: 'frown' },
  wink:      { bL: [0.3, 0, 0], bR: [0.5, 0, 0], lid: 0.3, winkR: true, mouth: 'smile' },
};
function almondEye(cx, look, open, lid, wide, lidTop) {
  // realistic-ish eye: almond shape, coloured iris, heavy upper lid line, thin lower lid
  const es = LOOK.eyeSize || 1, w = 30 * es * wide, h = 15 * es * wide * open * (LOOK.eyeH || 1), y0 = 0;
  if (open < 0.18) { ctx.beginPath(); ctx.moveTo(cx - w, y0); ctx.quadraticCurveTo(cx, y0 + 10, cx + w, y0); ctx.strokeStyle = INK(); ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.stroke(); return; }
  const top = () => { ctx.moveTo(cx - w, y0); ctx.quadraticCurveTo(cx - w * 0.1, y0 - h * 2.1, cx + w, y0); };
  const shape = () => { ctx.beginPath(); top(); ctx.quadraticCurveTo(cx + w * 0.05, y0 + h * 1.7, cx - w, y0); ctx.closePath(); };
  ctx.save(); shape(); ctx.fillStyle = '#F7F2EE'; ctx.fill(); ctx.clip();
  const ix = cx + look[0] * 9, iy = y0 - h * 0.15 + look[1] * 4, ir = 13.5 * es * (wide > 1.1 ? 0.9 : 1);
  ctx.beginPath(); ctx.arc(ix, iy, ir, 0, TAU); ctx.fillStyle = LOOK.irisCol || '#3B2417'; ctx.fill();
  ctx.beginPath(); ctx.arc(ix, iy, ir * 0.48, 0, TAU); ctx.fillStyle = INK(); ctx.fill();
  ctx.beginPath(); ctx.arc(ix - ir * 0.35, iy - ir * 0.4, ir * 0.24, 0, TAU); ctx.fillStyle = C.white; ctx.fill();
  if (lid > 0) { ctx.beginPath(); ctx.ellipse(cx, y0 + h * (2.6 - lid * 2.4), w * 1.3, h * 1.6, 0, 0, TAU); ctx.fillStyle = LOOK.skin; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK(); ctx.stroke(); }
  if (lidTop > 0) { const yl = y0 - h * 1.05 + h * 2 * lidTop; ctx.fillStyle = LOOK.skin; ctx.fillRect(cx - w - 4, y0 - h * 2.5, w * 2 + 8, yl - (y0 - h * 2.5));
    ctx.beginPath(); ctx.moveTo(cx - w, yl + 4); ctx.quadraticCurveTo(cx, yl - 4, cx + w, yl + 4); ctx.lineWidth = 4; ctx.strokeStyle = INK(); ctx.stroke(); }
  ctx.restore();
  ctx.beginPath(); top(); ctx.strokeStyle = INK(); ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - w * 0.85, y0 + h * 0.25); ctx.quadraticCurveTo(cx + w * 0.05, y0 + h * 1.7, cx + w * 0.9, y0 + h * 0.15); ctx.lineWidth = 3.5; ctx.stroke();
}
function eye(cx, look, open, lid, wide = 1, lidTop = 0) {
  if (LOOK.eyes === 'almond') return almondEye(cx, look, open, lid, wide, lidTop);
  const es = LOOK.eyeSize || 1, rx = 25 * wide * es, ry = 30 * wide * open * es;
  if (open < 0.18) { ctx.beginPath(); ctx.moveTo(cx - 24, -2); ctx.quadraticCurveTo(cx, 10, cx + 24, -2); ctx.strokeStyle = INK(); ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.stroke(); return; }
  ctx.save(); ctx.beginPath(); ctx.ellipse(cx, -2, rx, ry, 0, 0, TAU); ctx.fillStyle = C.white; ctx.fill(); ctx.clip();
  const px = cx + look[0] * 9, py = -2 + look[1] * 9 * open; ctx.beginPath(); ctx.arc(px, py, 12.5 * es * (wide > 1.1 ? 0.85 : 1), 0, TAU); ctx.fillStyle = INK(); ctx.fill();
  ctx.beginPath(); ctx.arc(px - 4, py - 5, 4, 0, TAU); ctx.fillStyle = C.white; ctx.fill();
  if (lid > 0) { ctx.beginPath(); ctx.ellipse(cx, -2 + ry * (1.9 - lid * 1.6), rx * 1.4, ry, 0, 0, TAU); ctx.fillStyle = LOOK.skin; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK(); ctx.stroke(); }
  if (lidTop > 0) { const yl = -2 - ry + 2 * ry * lidTop; ctx.fillStyle = LOOK.skin; ctx.fillRect(cx - rx - 4, -ry - 8, rx * 2 + 8, yl + ry + 6);
    ctx.beginPath(); ctx.moveTo(cx - rx, yl + 3); ctx.quadraticCurveTo(cx, yl - 5, cx + rx, yl + 3); ctx.lineWidth = 5; ctx.strokeStyle = INK(); ctx.stroke(); }
  ctx.restore(); ctx.beginPath(); ctx.ellipse(cx, -2, rx, ry, 0, 0, TAU); ctx.lineWidth = 5; ctx.strokeStyle = INK(); ctx.stroke();
}
function brow(cx, side, [raise, inner, outer]) {
  const y = -52 - raise * 16, xi = cx - side * 26, xo = cx + side * 28, arch = (LOOK.browArch || 0) * 12;
  ctx.beginPath(); ctx.moveTo(xi, y + inner); ctx.quadraticCurveTo(cx + side * 4 * (LOOK.browArch || 0), y - 6 - arch + (inner + outer) / 2, xo, y + outer + arch * 0.5);
  ctx.strokeStyle = LOOK.browCol || LOOK.hairCol; ctx.lineWidth = LOOK.browW || 15; ctx.lineCap = 'round'; ctx.stroke();
}
function mouth(shape, v, round, happy) {
  ctx.save(); ctx.translate(0, 84 + (LOOK.faceL || 0) * 0.5); ctx.strokeStyle = INK(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const curve = (x0, y0, cy, x1, y1, lw = 6) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(0, cy, x1, y1); ctx.lineWidth = lw; ctx.stroke(); };
  if (LOOK.lips && ['soft', 'smile', 'flat', 'smirk', 'frown'].includes(shape)) {   // full lips under the mouth line
    const lc = LOOK.lipCol || mix(LOOK.skin, '#B4525F', 0.4);
    ctx.beginPath(); ctx.moveTo(-26, 2); ctx.quadraticCurveTo(0, shape === 'smile' ? 30 : 22, 26, 2); ctx.quadraticCurveTo(0, shape === 'smile' ? 14 : 8, -26, 2); ctx.closePath(); ctx.fillStyle = lc; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-24, 0); ctx.quadraticCurveTo(-10, -8, 0, -4); ctx.quadraticCurveTo(10, -8, 24, 0); ctx.quadraticCurveTo(0, 4, -24, 0); ctx.closePath(); ctx.fillStyle = mix(lc, '#000000', 0.12); ctx.fill();
  }
  if (shape === 'soft') curve(-24, 0, 9, 24, 0);
  else if (shape === 'smile') { curve(-36, -6, 26, 36, -6); curve(-40, -10, -6, -33, -2, 4); curve(40, -10, -6, 33, -2, 4); }
  else if (shape === 'flat') curve(-22, 2, 2, 22, 2);
  else if (shape === 'smirk') { ctx.beginPath(); ctx.moveTo(-24, 6); ctx.quadraticCurveTo(4, 12, 30, -6); ctx.lineWidth = 6; ctx.stroke(); }
  else if (shape === 'frown') curve(-24, 10, -6, 24, 10);
  else {
    let hw, h; if (shape === 'grin') { hw = 46; h = 40; } else if (shape === 'o') { hw = 18; h = 40; } else { hw = 17 + 17 * v; h = 10 + 36 * v; }
    if (round && shape === 'open') { hw = 13 + 9 * v; h = 14 + 30 * v; }
    const up = happy ? 6 : 0;
    ctx.beginPath();
    if (shape === 'o' || (round && shape === 'open')) ctx.ellipse(0, h * 0.3, hw, h * 0.6, 0, 0, TAU);
    else { ctx.moveTo(-hw, -h * 0.18 - up); ctx.quadraticCurveTo(0, -h * 0.3, hw, -h * 0.18 - up); ctx.bezierCurveTo(hw, h * 0.5, hw * 0.55, h * 0.95, 0, h * 0.95); ctx.bezierCurveTo(-hw * 0.55, h * 0.95, -hw, h * 0.5, -hw, -h * 0.18 - up); ctx.closePath(); }
    ctx.fillStyle = C.mouth; ctx.fill();
    ctx.save(); ctx.clip();
    if (h > 22 && !(shape === 'o' || round)) { ctx.fillStyle = C.white; ctx.fillRect(-hw, -h * 0.4, hw * 2, h * 0.32); }
    ctx.beginPath(); ctx.ellipse(0, h * 0.95, hw * 0.75, h * 0.35, 0, 0, TAU); ctx.fillStyle = C.tongue; ctx.fill(); ctx.restore();
    ctx.lineWidth = 5.5; ctx.stroke();
  }
  ctx.restore();
}
function head(st) {
  const f = FACE[st.mood] || FACE.neutral, look = st.look || [0, 0], fw = LOOK.faceW || 1;
  const wide = (fn) => { ctx.save(); ctx.scale(fw, 1); fn(); ctx.restore(); };
  wide(() => hairBack(LOOK.hair));
  ctx.save(); ctx.scale(fw, 1);
  const ez = LOOK.earSize || 1;
  for (const sx of [-1, 1]) if (LOOK.hair !== 'long') { ctx.beginPath(); ctx.ellipse(sx * (124 + 6 * ez), 6, 25 * ez, 36 * ez, 0, 0, TAU); ctx.fillStyle = LOOK.skin; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = INK(); ctx.stroke();
    ctx.beginPath(); ctx.arc(sx * (126 + 6 * ez), 6, 12 * ez, sx < 0 ? -1.2 : Math.PI - 1.9, sx < 0 ? 1.9 : Math.PI + 1.2); ctx.strokeStyle = LOOK.skinShade; ctx.lineWidth = 6; ctx.stroke(); }
  headPath(); ctx.fillStyle = LOOK.skin; ctx.fill();
  if (LOOK.faceShade !== false) { ctx.save(); headPath(); ctx.clip(); ctx.beginPath(); ctx.ellipse(150, 40, 70, 190, 0.15, 0, TAU); ctx.fillStyle = LOOK.skinShade; ctx.fill(); ctx.restore(); }
  headPath(); ctx.lineWidth = 7; ctx.strokeStyle = INK(); ctx.stroke();
  beard(LOOK.beard); ctx.restore();
  if (LOOK.blush) for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * 80, 50, 20, 11, 0, 0, TAU); ctx.fillStyle = mix(LOOK.skin, '#FF6B7A', 0.32); ctx.fill(); }
  const open = 1 - (st.blink || 0);
  const lt = (LOOK.lidTop || 0) * ((f.wide || 1) > 1 ? 0.25 : 1), sq = LOOK.squint ?? 1;   // squint scales how much moods close the eyes from below
  eye(-50, look, open, f.lid * sq, f.wide, lt); eye(50, look, f.winkR ? 0 : open, (f.lidR ?? f.lid) * sq, f.wide, lt);
  brow(-50, -1, f.bL); brow(50, 1, f.bR);
  const nz = LOOK.nose || 1, nw = LOOK.noseW || nz, fl = LOOK.faceL || 0;   // nose = overall size, noseW = width only
  ctx.save(); ctx.translate(0, fl * 0.2);
  ctx.beginPath(); ctx.ellipse(2, 30, 15 * nw, 11 * nz, 0, 0, TAU); ctx.fillStyle = LOOK.noseShade === false ? mix(LOOK.skin, LOOK.skinShade, 0.35) : LOOK.skinShade; ctx.fill();
  ctx.beginPath(); ctx.moveTo(2 - 10 * nw, 30); ctx.quadraticCurveTo(2, 30 + 14 * nz, 2 + 12 * nw, 32); ctx.strokeStyle = INK(); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.stroke();
  if (nw > 1.25) for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(2 + sx * 13 * nw, 28 + 2 * nz, 7 * nz, sx < 0 ? Math.PI * 0.55 : Math.PI * 0.05, sx < 0 ? Math.PI * 0.95 : Math.PI * 0.45); ctx.stroke(); }
  ctx.restore();
  const v = st.talk || 0, round = st.word ? /oo|ou|o\b|u|w/i.test(st.word) && v > 0.3 : false;
  mouth(v > 0.12 ? 'open' : f.mouth, clamp((v - 0.12) / 0.8), round, st.mood === 'happy' || st.mood === 'excited');
  wide(() => hairFront(LOOK.hair));
  if (LOOK.glasses && LOOK.glasses !== 'none') {
    ctx.strokeStyle = LOOK.glassesCol || INK(); ctx.lineWidth = 7; ctx.lineCap = 'round';
    for (const sx of [-1, 1]) { ctx.beginPath(); if (LOOK.glasses === 'square') ctx.roundRect(sx * 52 - 42, -36, 84, 66, 16); else ctx.arc(sx * 51, -2, 40, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx * 92, -10); ctx.lineTo(sx * 128, -16); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-12, -8); ctx.quadraticCurveTo(0, -18, 12, -8); ctx.stroke();
  }
}

/** draw one explicit state. st: { L, R, tilt, lean, look, mood, talk, word, blink, count, wave } */
export function draw(x, y, s, st, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(st.lean || 0);
  const nk = LOOK.neck || 1, nl = LOOK.neckL || 0;
  ctx.beginPath(); ctx.roundRect(-54 * nk, -100 + nl, 108 * nk, 120 - nl, 22); ctx.fillStyle = LOOK.skin; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = INK(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, -84 + nl, 60 * nk, 28, 0, 0, TAU); ctx.fillStyle = LOOK.skinShade; ctx.fill();
  ctx.save(); ctx.scale(LOOK.bodyW || 1, 1); torso(); ctx.restore();
  ctx.save(); ctx.translate(0, -80 + nl); ctx.rotate(st.tilt || 0); ctx.translate(0, -135 - (st.nod || 0));
  head(st); ctx.restore();
  arm('L', st.L, st.count, st.wave === 'L', t); arm('R', st.R, st.count, st.wave === 'R', t);
  ctx.restore();
}

/** just the head (close-ups, the pose sheet). (x, y) = head centre */
export function drawHead(x, y, s, st) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); head({ look: [0, 0], blink: 0, ...st }); ctx.restore(); }
/** just a hand at (x, y), pointing along `angle` (rad); m = thumb side (1 or -1) */
export function drawHand(x, y, s, kind, n = 1, angle = -Math.PI / 2, m = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(angle); ctx.translate(-30, 0); hand(kind, m, n); ctx.restore(); }

// ---------- acting over time ----------
const BLEND = 0.3;
export function blinkAt(t) {
  const P = 3.1, k = Math.floor(t / P), tb = k * P + 0.4 + rnd(k + 3) * 1.8, u = (t - tb) / 0.15;
  return u >= 0 && u <= 1 ? Math.sin(Math.PI * u) : 0;
}
/** keys: [[t, poseName, { mood, look, count, tilt, lean }], ...]. Returns (t) => state (arms blend over 0.3 s, snappy). */
export function act(keys) {
  const K = keys.map(([t, pose, o = {}]) => ({ t, pose, ...POSES[pose], ...o, mood: o.mood || POSES[pose]?.mood || 'neutral' })).sort((a, b) => a.t - b.t);
  K.forEach((k) => { if (!POSES[k.pose]) throw new Error(`mascot: no pose "${k.pose}" (${Object.keys(POSES).join(' ')})`); });
  return (t) => {
    let i = K.length - 1; while (i > 0 && K[i].t > t) i--;
    const cur = K[i], prev = K[Math.max(0, i - 1)], u = i === 0 ? 1 : eob(seg(t, cur.t, cur.t + BLEND)), ue = eio(seg(t, cur.t, cur.t + BLEND));
    const armMix = (A, B) => [lerp(A[0], B[0], u), lerp(A[1], B[1], u), ue > 0.4 ? B[2] : A[2]];
    const v = talk(t), w = wordAt(t);
    return {
      L: armMix(prev.L, cur.L), R: armMix(prev.R, cur.R), tilt: lerp(prev.tilt || 0, cur.tilt || 0, ue) + Math.sin(t * 1.7) * 0.015 + v * 0.02 * Math.sin(t * 9),
      look: [lerp(prev.look[0], cur.look[0], ue), lerp(prev.look[1], cur.look[1], ue)], lean: lerp(prev.lean || 0, cur.lean || 0, ue),
      mood: cur.mood, count: ue > 0.4 ? cur.count : prev.count, wave: cur.wave, talk: v, word: w ? w.w : null,
      blink: blinkAt(t), nod: v * 7 + Math.sin(t * 2.3) * 2,
    };
  };
}
/** draw the mascot at film time t following an act() timeline */
export function mascot(x, y, s, t, actor, extra = {}) { draw(x, y + Math.sin(t * 2.2) * 3 * s, s, { ...actor(t), ...extra }, t); }
