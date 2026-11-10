// Captions = the HEADLINE, top left: sentence case, Inter Black, ink on paper, ONE violet word with a lime marker swipe.
// Words appear ONE AT A TIME, exactly when they're spoken (never early). A chunk stays until the next chunk starts.
// Each script line has "caps": "1. Look at the | real *sender address, | not just the *name"
//   "|" = next chunk (1-4 words), "*" = the accent word (at most one per chunk). Without "caps" lines are auto-chunked.
// Display words map onto the chunk's spoken words in order (so "200,000" for "two hundred thousand" appears with "two").
import { ctx, C, FONT, clamp, lerp, seg, eob, eo } from './lib.js';
import { T, lineWords } from './timing.js';

export const CAP = { x: 70, y: 318, size: 92, lh: 100, maxW: 790, maxLines: 2 };
let caps = [];
const nm = (w) => String(w).toLowerCase().replace(/[^a-z0-9']+/g, '');

function autoChunks(text) {
  const ws = text.split(/\s+/).filter(Boolean), out = [];
  for (let i = 0; i < ws.length;) { const n = ws.length - i === 4 ? 2 : Math.min(3, ws.length - i); out.push(ws.slice(i, i + n).join(' ')); i += n; }
  return out;
}

export function buildCaptions(script) {
  caps = [];
  script.lines.forEach((ln, i) => {
    const chunks = (ln.caps ? ln.caps.split('|') : autoChunks(ln.text)).map((s) => s.trim()).filter(Boolean);
    const ws = lineWords(i); if (!ws.length) return;
    const counts = chunks.map((c) => c.split(/\s+/).length), N = counts.reduce((a, b) => a + b, 0);
    let acc = 0, from = 0; const starts = [];
    chunks.forEach((c, j) => {
      const first = nm(c.split(/\s+/)[0].replace('*', ''));
      let idx = j === 0 ? 0 : ws.findIndex((w, k) => k > from && first && (nm(w.w) === first || (first.length > 2 && nm(w.w).startsWith(first))));
      if (idx < 0) idx = Math.max(from + (j ? 1 : 0), Math.min(ws.length - 1, Math.round(acc * ws.length / N)));
      acc += counts[j]; from = idx; starts.push(idx);
    });
    chunks.forEach((c, j) => {
      const a = starts[j], b = j < chunks.length - 1 ? starts[j + 1] : ws.length, span = Math.max(1, b - a);
      const words = c.split(/\s+/).map((w, k, all) => {
        const si = a + Math.min(span - 1, Math.floor((k * span) / all.length));
        return { txt: w.replace('*', ''), hi: w.startsWith('*'), s: ws[si].s };
      });
      caps.push({ line: i, s: words[0].s, words });
    });
  });
  caps.forEach((c, k) => {
    const next = caps[k + 1], lineEnd = T.lines[c.line].end;
    c.e = next ? (next.s - lineEnd > 0.7 && next.line !== c.line ? lineEnd + 0.35 : next.s) : T.dur;
  });
  return caps;
}
export const captionList = () => caps;

/** draw a caption chunk (words with .txt .hi and appear time .s) at film time t; also used by the style sheet */
export function drawHeadline(words, t, { x = CAP.x, y = CAP.y, size = CAP.size, lh = CAP.lh, maxW = CAP.maxW, color = C.ink } = {}) {
  ctx.font = `900 ${size}px ${FONT.head}`; ctx.letterSpacing = '-2px';
  const sp = size * 0.27;
  words.forEach((w) => (w.w = ctx.measureText(w.txt).width));
  // greedy wrap; shrink until it fits in maxLines
  let sc = 1, lines;
  for (let tries = 0; tries < 8; tries++) {
    lines = [[]]; let lw = 0;
    for (const w of words) { const add = (lines.at(-1).length ? sp : 0) + w.w; if (lw + add > maxW / sc && lines.at(-1).length) { lines.push([w]); lw = w.w; } else { lines.at(-1).push(w); lw += add; } }
    if (lines.length <= CAP.maxLines) break; sc *= 0.9;
  }
  ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  lines.forEach((ln, li) => {
    let cx = 0; const cy = li * lh;
    for (const w of ln) {
      const lt = t - w.s;
      if (lt >= 0) {
        const k = lt < 0.16 ? eob(seg(lt, 0, 0.16)) : 1;
        if (w.hi) {                                        // lime marker swipe behind the accent word
          const m = eo(seg(lt, 0.04, 0.22)), mh = size * 0.5;
          ctx.save(); ctx.translate(cx - 8, cy + size * 0.08); ctx.transform(1, 0, -0.18, 1, 0, 0);
          ctx.fillStyle = C.lime; ctx.beginPath(); ctx.roundRect(0, -mh / 2, (w.w + 16) * m, mh, 8); ctx.fill(); ctx.restore();
        }
        ctx.save(); ctx.translate(cx, cy + (1 - k) * size * 0.35); ctx.globalAlpha = clamp(lt / 0.06);
        ctx.fillStyle = w.hi ? C.violet : color; ctx.fillText(w.txt, 0, 0); ctx.restore();
      }
      cx += w.w + sp;
    }
  });
  ctx.restore(); ctx.letterSpacing = '0px';
}

export function drawCaption(t) {
  const c = caps.find((c) => t >= c.s && t < c.e); if (!c) return;
  drawHeadline(c.words, t);
}
