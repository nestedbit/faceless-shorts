// Mascot Explainer kit: the component zoo. Flat shapes, ink outlines, HARD offset shadows (never blur), one violet
// accent, lime for highlights and checks, red only for danger. All functions draw on the shared ctx.
import { ctx, C, W, H, FONT, clamp, lerp, seg, eo, eio, eob, rnd, rad, TAU, rr, inked, text, measure, slab, line } from './lib.js';

// ---------- layout (1080x1920, Instagram/TikTok safe zones) ----------
export const LAY = {
  label: [70, 232],                                   // mono label, top left
  card: { x: 80, y: 545, w: 920, h: 600 },            // the one card in the middle
  centre: [540, 845],                                 // where step tiles slam
  badge: [960, 318],                                  // the current step, top right
  sticky: { x: 44, y: 1172, w: 324, h: 286 },         // checklist, bottom left
  mascot: [800, 1545, 0.92],                          // base of the neck, scale: bottom right
};
// keep key content between y 230 and 1480; the caption is the headline (y 270-470); nothing important x > 1000

/** a reveal helper: 0..1 over `dur` seconds from `at` (shot-local time) */
export const pop = (lt, at, dur = 0.32) => seg(lt, at, at + dur);

// ---------- backgrounds ----------
export function paper() {
  ctx.fillStyle = C.paper; ctx.fillRect(-400, -400, W + 800, H + 800);
  ctx.lineWidth = 2;
  for (let x = -360; x <= W + 360; x += 60) { ctx.strokeStyle = (x / 60) % 4 === 0 ? C.gridBold : C.grid; ctx.beginPath(); ctx.moveTo(x, -400); ctx.lineTo(x, H + 400); ctx.stroke(); }
  for (let y = -360; y <= H + 360; y += 60) { ctx.strokeStyle = (y / 60) % 4 === 0 ? C.gridBold : C.grid; ctx.beginPath(); ctx.moveTo(-400, y); ctx.lineTo(W + 400, y); ctx.stroke(); }
}

// ---------- labels, tiles, badges, stamps ----------
export function label(str, x = LAY.label[0], y = LAY.label[1], a = 1) {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = C.violet; ctx.fillRect(x, y - 9, 18, 18);
  text(str.toUpperCase(), x + 32, y + 1, 30, C.inkSoft, { font: FONT.mono, weight: 700, spacing: 1 }); ctx.restore();
}
/** the big numbered tile (step numbers) at (x, y) centre */
export function tile(n, x, y, s = 1, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  slab(-150, -150, 300, 300, 44, C.violet, { shadow: 20, lw: 9 });
  text('STEP', -118, -112, 30, C.lime, { font: FONT.mono, weight: 700, spacing: 2 });
  text(String(n), 0, 22, 236, C.white, { align: 'center' });
  ctx.restore();
}
/** the step tile's life: slams in at `slam` (shot-local), holds, then flies to the badge corner. Returns true once landed. */
export function stepTile(n, lt, slam) {
  if (lt < slam) return false;
  const u = seg(lt, slam, slam + 0.14), f = eio(seg(lt, slam + 0.55, slam + 0.9));
  if (f >= 1) return true;
  const [cx, cy] = LAY.centre, [bx, by] = LAY.badge;
  tile(n, lerp(cx, bx, f), lerp(cy, by, f) - Math.sin(f * Math.PI) * 120, lerp(lerp(2.3, 1, eo(u)), 0.4, f), lerp(lerp(-0.3, -0.05, eo(u)), 0, f));
  return false;
}
export function badge(n, x = LAY.badge[0], y = LAY.badge[1], s = 1, done = false) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.arc(8, 8, 62, 0, TAU); ctx.fillStyle = C.ink; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, 62, 0, TAU); inked(done ? C.lime : C.violet, 7);
  if (done) checkMark(0, 4, 1.1, 1, C.ink); else text(String(n), 0, 5, 78, C.white, { align: 'center' });
  ctx.restore();
}
/** a rubber stamp: letters slam one by one, then the box. Returns the time it finishes (shot-local). */
export function stamp(str, x, y, lt, at, { rot = -0.09, size = 110, color = C.red, step = 0.035 } = {}) {
  if (lt < at) return at + str.length * step + 0.15;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const w = measure(str, size, { spacing: 4 }), x0 = -w / 2;
  ctx.font = `900 ${size}px ${FONT.head}`; ctx.letterSpacing = '4px'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  let cx = x0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i], cw = ctx.measureText(ch).width + 4, u = seg(lt, at + i * step, at + i * step + 0.1);
    if (u > 0) { ctx.save(); ctx.translate(cx + cw / 2, 0); const k = lerp(2.4, 1, eo(u)); ctx.scale(k, k); ctx.globalAlpha = clamp(u * 3); ctx.fillStyle = color; ctx.fillText(ch, -cw / 2 + 2, 4); ctx.restore(); }
    cx += cw;
  }
  ctx.letterSpacing = '0px';
  const b = seg(lt, at + str.length * step, at + str.length * step + 0.12);
  if (b > 0) { const k = lerp(1.25, 1, eo(b)); ctx.scale(k, k); ctx.globalAlpha = clamp(b * 3); rr(x0 - 34, -size * 0.66, w + 68, size * 1.32, 22); ctx.lineWidth = 12; ctx.strokeStyle = color; ctx.stroke(); }
  ctx.restore();
  return at + str.length * step + 0.12;
}

// ---------- the card ----------
/** the white card: pops in with a bounce over 0.32 s from `at`; inside(w, h) draws in card-local coords (clipped) */
export function card(lt, at, inside, { box = LAY.card, rot = 0, fill = C.white } = {}) {
  const u = pop(lt, at, 0.34); if (u <= 0) return;
  const { x, y, w, h } = box, k = lerp(0.6, 1, eob(u));
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot + (1 - eo(u)) * -0.06); ctx.scale(k, k); ctx.translate(-w / 2, -h / 2); ctx.globalAlpha = clamp(u * 4);
  slab(0, 0, w, h, 30, fill, { shadow: 18, lw: 8 });
  ctx.save(); rr(0, 0, w, h, 30); ctx.clip(); inside(w, h); ctx.restore();
  rr(0, 0, w, h, 30); ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.restore();
}
/** a card's title strip: mono label on a light band */
export function cardHead(w, str, { col = C.field, dot = C.violet } = {}) {
  ctx.fillStyle = col; ctx.fillRect(0, 0, w, 92); ctx.fillStyle = C.ink; ctx.fillRect(0, 92, w, 6);
  ctx.beginPath(); ctx.arc(46, 46, 13, 0, TAU); ctx.fillStyle = dot; ctx.fill();
  text(str.toUpperCase(), 76, 48, 30, C.ink, { font: FONT.mono, weight: 700, spacing: 1 });
}

// ---------- sticky checklist ----------
/** items: [{ txt, at, done }] in FILM time (at = becomes current, done = gets its tick). t = film time, inAt = slides in */
export function sticky(items, t, inAt, { box = LAY.sticky, title = 'CHECKLIST' } = {}) {
  const u = seg(t, inAt, inAt + 0.4); if (u <= 0) return;
  const { x, y, w, h } = box;
  ctx.save(); ctx.translate(lerp(-w - 80, 0, eob(u)), 0); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(-0.035); ctx.translate(-w / 2, -h / 2);
  ctx.beginPath(); ctx.moveTo(10, 10); ctx.lineTo(w + 10, 10); ctx.lineTo(w + 10, h - 40); ctx.lineTo(w - 30, h + 10); ctx.lineTo(10, h + 10); ctx.closePath(); ctx.fillStyle = C.ink; ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h - 50); ctx.lineTo(w - 50, h); ctx.lineTo(0, h); ctx.closePath(); inked(C.sticky, 6);
  ctx.beginPath(); ctx.moveTo(w, h - 50); ctx.lineTo(w - 50, h - 50); ctx.lineTo(w - 50, h); ctx.closePath(); inked(C.stickyShade, 6);
  ctx.fillStyle = C.violetLight; ctx.globalAlpha = 0.9; ctx.fillRect(w / 2 - 60, -18, 120, 34); ctx.globalAlpha = 1;
  text(title, 24, 40, 24, C.inkSoft, { font: FONT.mono, weight: 700, spacing: 2 });
  items.forEach((it, i) => {
    const yy = 92 + i * 50, cur = t >= it.at && !(t >= it.done), dn = t >= it.done;
    rr(24, yy - 17, 34, 34, 8); inked(dn ? C.lime : C.white, 5);
    if (dn) checkMark(41, yy + 1, 0.42, eo(seg(t, it.done, it.done + 0.25)), C.ink);
    text(it.txt, 74, yy + 2, 32, cur ? C.violet : dn ? C.inkSoft : C.ink, { weight: cur ? 900 : 800 });
    if (cur) { const p = 0.5 + 0.5 * Math.sin(t * 8); ctx.fillStyle = C.violet; ctx.beginPath(); ctx.moveTo(4 - p * 4, yy - 9); ctx.lineTo(16 - p * 4, yy + 1); ctx.lineTo(4 - p * 4, yy + 11); ctx.fill(); }
    if (dn) { const sw = measure(it.txt, 32, { weight: 800 }); line([[72, yy + 3], [72 + sw * eo(seg(t, it.done + 0.1, it.done + 0.35)), yy + 3]], C.inkSoft, 4); }
  });
  ctx.restore();
}

// ---------- marks ----------
export function checkMark(x, y, s, k = 1, col = C.ink) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const pts = [[-30, 2], [-8, 24], [32, -22]], L1 = Math.hypot(22, 22), L2 = Math.hypot(40, 46), d = k * (L1 + L2);
  ctx.beginPath(); ctx.moveTo(...pts[0]);
  if (d <= L1) ctx.lineTo(lerp(-30, -8, d / L1), lerp(2, 24, d / L1)); else { ctx.lineTo(...pts[1]); const e = (d - L1) / L2; ctx.lineTo(lerp(-8, 32, e), lerp(24, -22, e)); }
  ctx.strokeStyle = col; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
}
/** green-lime "good" disc with a tick, k = 0..1 (pops) */
export function good(x, y, s, k) {
  if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(s * lerp(0.4, 1, eob(clamp(k * 1.6))), s * lerp(0.4, 1, eob(clamp(k * 1.6))));
  ctx.beginPath(); ctx.arc(5, 5, 50, 0, TAU); ctx.fillStyle = C.ink; ctx.fill(); ctx.beginPath(); ctx.arc(0, 0, 50, 0, TAU); inked(C.lime, 6);
  checkMark(0, 2, 0.95, clamp(k * 1.6 - 0.3)); ctx.restore();
}
/** red "bad" disc with an X, slams in */
export function bad(x, y, s, k) {
  if (k <= 0) return; const sc = s * lerp(2, 1, eo(clamp(k * 2)));
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.globalAlpha = clamp(k * 4);
  ctx.beginPath(); ctx.arc(5, 5, 50, 0, TAU); ctx.fillStyle = C.ink; ctx.fill(); ctx.beginPath(); ctx.arc(0, 0, 50, 0, TAU); inked(C.red, 6);
  line([[-20, -20], [20, 20]], C.white, 14); line([[20, -20], [-20, 20]], C.white, 14); ctx.restore();
}
/** red chip (small rounded tag) */
export function chip(str, x, y, { col = C.red, fg = C.white, size = 30, k = 1, rot = -0.04 } = {}) {
  if (k <= 0) return; const w = measure(str, size, { font: FONT.mono, weight: 700, spacing: 1 }) + 36;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); const sc = lerp(0.5, 1, eob(clamp(k))); ctx.scale(sc, sc);
  slab(-w / 2, -size * 0.8, w, size * 1.6, size * 0.8, col, { shadow: 6, lw: 5 });
  text(str, 0, 2, size, fg, { align: 'center', font: FONT.mono, weight: 700, spacing: 1 }); ctx.restore();
}
/** a marker swipe behind something: x, y = left/middle, w, h; k = 0..1 */
export function marker(x, y, w, h, k, col = C.lime) {
  if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.transform(1, 0, -0.15, 1, 0, 0); ctx.fillStyle = col;
  ctx.beginPath(); ctx.roundRect(-6, -h / 2, (w + 12) * eo(clamp(k)), h, 8); ctx.fill(); ctx.restore();
}
/** impact burst (lime strokes) around x, y: k = 0..1 */
export function burst(x, y, r, k, col = C.lime) {
  if (k <= 0 || k >= 1) return;
  for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU + 0.3, r0 = r * lerp(0.7, 1.1, eo(k)), r1 = r0 + r * 0.45 * (1 - k); line([[x + Math.cos(a) * r0, y + Math.sin(a) * r0], [x + Math.cos(a) * r1, y + Math.sin(a) * r1]], col, 12 * (1 - k) + 2); }
}

// ---------- UI pieces (drawn inside cards) ----------
export function avatar(x, y, r, initials, col = C.violet) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); inked(col, 6); text(initials, x, y + 3, r * 0.9, C.white, { align: 'center' });
}
/** a mono URL / address pill. hl = [from, to] char range painted lime (k = 0..1), bad = red underline on that range */
export function urlPill(x, y, w, str, { size = 34, hl, k = 1, bad: isBad = false, icon = true, fill = C.field } = {}) {
  rr(x, y - 36, w, 72, 36); inked(fill, 5);
  let tx = x + 30;
  if (icon) { lock(x + 42, y, 0.5); tx = x + 74; }
  ctx.font = `700 ${size}px ${FONT.mono}`; ctx.letterSpacing = '0px';
  const full = ctx.measureText(str).width, sc = Math.min(1, (w - (tx - x) - 26) / full);
  ctx.save(); ctx.translate(tx, y); ctx.scale(sc, 1);
  if (hl) { const a = ctx.measureText(str.slice(0, hl[0])).width, b = ctx.measureText(str.slice(0, hl[1])).width; marker(a, 2, b - a, size * 1.1, k, isBad ? C.redLight : C.lime);
    if (isBad && k > 0.5) line([[a, size * 0.62], [a + (b - a) * eo(seg(k, 0.5, 1)), size * 0.62]], C.red, 6); }
  ctx.fillStyle = C.ink; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillText(str, 0, 2); ctx.restore();
}
export function lock(x, y, s = 1, col = C.ink) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = col; ctx.lineWidth = 9;
  ctx.beginPath(); ctx.arc(0, -10, 18, Math.PI, 0); ctx.lineTo(18, 4); ctx.moveTo(-18, 4); ctx.lineTo(-18, -10); ctx.stroke();
  rr(-28, 0, 56, 42, 10); ctx.fillStyle = col; ctx.fill(); ctx.restore();
}
export function button(x, y, w, h, str, { col = C.violet, fg = C.white, press = 0, size = 44 } = {}) {
  const d = 10 * (1 - press);
  rr(x + 10, y + 10, w, h, h / 2); ctx.fillStyle = C.ink; ctx.fill();
  rr(x + 10 - d, y + 10 - d, w, h, h / 2); inked(col, 6); text(str, x + 10 - d + w / 2, y + 10 - d + h / 2 + 2, size, fg, { align: 'center' });
}
/** mouse pointer, tip at x, y */
export function cursor(x, y, s = 1, press = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (1 - press * 0.12), s * (1 - press * 0.12));
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 78); ctx.lineTo(20, 60); ctx.lineTo(34, 92); ctx.lineTo(48, 86); ctx.lineTo(34, 55); ctx.lineTo(60, 54); ctx.closePath();
  ctx.save(); ctx.translate(6, 6); ctx.fillStyle = C.ink; ctx.fill(); ctx.restore(); inked(C.white, 6); ctx.restore();
}
/** dark tooltip / status bar with mono text; tail points up at (x, y - 0) */
export function tooltip(x, y, str, { size = 30, k = 1, maxW = 800 } = {}) {
  if (k <= 0) return; ctx.font = `700 ${size}px ${FONT.mono}`; const w = Math.min(maxW, ctx.measureText(str).width + 44);
  ctx.save(); ctx.translate(x, y); const sc = lerp(0.6, 1, eob(clamp(k))); ctx.scale(sc, sc); ctx.globalAlpha = clamp(k * 3);
  ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(0, -18); ctx.lineTo(16, 0); ctx.fillStyle = C.ink; ctx.fill();
  rr(-w / 2, 0, w, size * 1.9, 16); ctx.fillStyle = C.ink; ctx.fill();
  text(str, 0, size * 0.95, size, C.white, { align: 'center', font: FONT.mono, weight: 700, maxW: w - 30 }); ctx.restore();
}
/** a form field: label above, box, value typed by k (0..1); secret = dots; caret blinks while typing */
export function field(x, y, w, labelTxt, value, { k = 1, secret = false, t = 0, active = false, h = 84, size = 40 } = {}) {
  text(labelTxt.toUpperCase(), x + 4, y - 26, 24, C.inkSoft, { font: FONT.mono, weight: 700, spacing: 1 });
  rr(x, y, w, h, 16); inked(C.white, active ? 7 : 5, active ? C.violet : C.ink);
  const n = Math.floor(value.length * clamp(k) + 1e-6), shown = secret ? '•'.repeat(n) : value.slice(0, n);
  const tw = text(shown, x + 26, y + h / 2 + 2, size, C.ink, { weight: 800 });
  if (active && (k < 1 || Math.sin(t * 9) > 0)) { ctx.fillStyle = C.violet; ctx.fillRect(x + 30 + tw, y + 18, 5, h - 36); }
}
/** count-up number with thousands separators */
export function counter(x, y, value, size, col = C.violet, align = 'left') {
  return text(Math.round(value).toLocaleString('en-US'), x, y, size, col, { align, spacing: -3 });
}
/** a countdown ring: frac 0..1 left, label in the middle */
export function timer(x, y, r, frac, str, col = C.red) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); inked(C.white, 7);
  ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r - 14, -Math.PI / 2, -Math.PI / 2 + TAU * frac); ctx.closePath(); ctx.fillStyle = C.redLight; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r - 14, -Math.PI / 2, -Math.PI / 2 + TAU * frac); ctx.strokeStyle = col; ctx.lineWidth = 14; ctx.stroke();
  text(str, x, y + 3, r * 0.3, C.ink, { align: 'center', font: FONT.mono, weight: 700 });
}
/** a fishing hook with bait hanging from it; swing = rad */
export function hook(x, y, len, swing, bait) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(swing);
  line([[0, -400], [0, len]], C.ink, 6);
  ctx.beginPath(); ctx.moveTo(0, len); ctx.lineTo(0, len + 90); ctx.arc(-42, len + 90, 42, 0, Math.PI * 0.95); ctx.strokeStyle = C.ink; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-84, len + 92); ctx.lineTo(-96, len + 58); ctx.lineTo(-74, len + 74); ctx.fillStyle = C.ink; ctx.fill();
  ctx.beginPath(); ctx.arc(0, len, 12, 0, TAU); ctx.fillStyle = C.ink; ctx.fill();
  if (bait) { ctx.translate(-42, len + 132); bait(); }
  ctx.restore();
}
/** paper plane (share) icon */
export function plane(x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-90, 0); ctx.lineTo(100, -70); ctx.lineTo(40, 80); ctx.lineTo(10, 20); ctx.closePath();
  ctx.save(); ctx.translate(10, 10); ctx.fillStyle = C.ink; ctx.fill(); ctx.restore(); inked(C.white, 7);
  ctx.beginPath(); ctx.moveTo(10, 20); ctx.lineTo(100, -70); ctx.moveTo(10, 20); ctx.lineTo(0, 70); ctx.lineTo(40, 80); ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(10, 20); ctx.lineTo(0, 70); ctx.lineTo(28, 46); ctx.closePath(); ctx.fillStyle = C.violetLight; ctx.fill(); ctx.stroke();
  ctx.restore();
}
/** chat bubble (incoming message) */
export function bubble(x, y, w, h, str, { col = C.field, size = 38, k = 1, from = '' } = {}) {
  if (k <= 0) return; ctx.save(); ctx.translate(x, y + h); const sc = lerp(0.5, 1, eob(clamp(k))); ctx.scale(sc, sc); ctx.translate(0, -h);
  ctx.beginPath(); ctx.roundRect(0, 0, w, h, 30); ctx.moveTo(30, h - 10); ctx.lineTo(-10, h + 24); ctx.lineTo(70, h - 10); inked(col, 6);
  if (from) text(from.toUpperCase(), 30, 36, 22, C.inkSoft, { font: FONT.mono, weight: 700, spacing: 1 });
  text(str, 30, from ? h / 2 + 16 : h / 2, size, C.ink, { weight: 800, maxW: w - 60 }); ctx.restore();
}
