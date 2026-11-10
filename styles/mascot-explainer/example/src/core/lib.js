// Mascot Explainer engine: canvas, palette, math and drawing primitives.
// Every drawing function in the kit uses the shared `ctx` exported here (set once by main.js).
export const W = 1080, H = 1920, FPS = 30;
export let ctx = null;
export function setCtx(c) { ctx = c; }

// The style sheet palette. Only these (plus the mascot's own colours from mascot.json) appear on screen.
export const C = {
  paper: '#EEF1F6', grid: '#DCE3EE', gridBold: '#CBD4E3', ink: '#15172A', inkSoft: '#4A5070', mute: '#8A90A6',
  violet: '#5B3DF5', violetDark: '#3F25C9', violetLight: '#CFC6FF',
  lime: '#C8F53A', limeDark: '#93BF12', red: '#F23F43', redDark: '#C42A2E', redLight: '#FFD9DA',
  white: '#FFFFFF', line: '#E3E7EF', field: '#F5F7FB', sticky: '#EAFBAA', stickyShade: '#D3EE7E', mouth: '#5A1F2B', tongue: '#E86A7E',
};
export const FONT = { head: 'Inter', mono: 'FreeMono' };

// ---------- math ----------
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (t, a, b) => clamp((t - a) / ((b - a) || 1e-6));
export const eo = (t) => 1 - Math.pow(1 - t, 3);
export const eio = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const eob = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
export const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const TAU = Math.PI * 2;
export const rad = (d) => (d * Math.PI) / 180;

// ---------- primitives ----------
export function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
export function circle(x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = fill; ctx.fill(); }
export function ell(x, y, rx, ry, fill, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); ctx.fillStyle = fill; ctx.fill(); }
export function line(pts, color, w) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
}
/** fill + ink outline of the current path */
export function inked(fill, lw = 7, stroke = C.ink) { ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.stroke(); }
export function fillAll(color) { ctx.fillStyle = color; ctx.fillRect(-400, -400, W + 800, H + 800); }
/** the style's text: x, y = left/centre/right per align, baseline middle */
export function text(str, x, y, size, color = C.ink, { weight = 900, align = 'left', font = FONT.head, spacing = 0, maxW } = {}) {
  ctx.font = `${weight} ${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.letterSpacing = spacing + 'px';
  ctx.fillStyle = color;
  if (maxW) { const w = ctx.measureText(str).width; if (w > maxW) { ctx.save(); const k = maxW / w; const ox = align === 'center' ? x : align === 'right' ? x : x; ctx.translate(ox, y); ctx.scale(k, k); ctx.fillText(str, 0, 0); ctx.restore(); ctx.letterSpacing = '0px'; return maxW; } }
  ctx.fillText(str, x, y); const w = ctx.measureText(str).width; ctx.letterSpacing = '0px'; return w;
}
export function measure(str, size, { weight = 900, font = FONT.head, spacing = 0 } = {}) {
  ctx.font = `${weight} ${size}px ${font}`; ctx.letterSpacing = spacing + 'px'; const w = ctx.measureText(str).width; ctx.letterSpacing = '0px'; return w;
}
/** a box with the style's HARD offset shadow (no blur) and ink outline */
export function slab(x, y, w, h, r, fill, { shadow = 14, lw = 7, shadowCol = C.ink } = {}) {
  if (shadow) { rr(x + shadow, y + shadow, w, h, r); ctx.fillStyle = shadowCol; ctx.fill(); }
  rr(x, y, w, h, r); inked(fill, lw);
}
