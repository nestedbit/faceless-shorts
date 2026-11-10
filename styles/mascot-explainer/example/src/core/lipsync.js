// Lip-sync for $0: the mascot's mouth follows the loudness of data/narration.wav (Kokoro, or your own recording via
// words.py --audio). No narration yet (captions-only)? It falls back to the word timings: the mouth opens on each word's
// syllables. talk(t) = how open the mouth is (0..1) · wordAt(t) = the word being said (for round "o" shapes).
import { T } from './timing.js';
import { clamp } from './lib.js';

const HOP = 0.01;                       // 10 ms envelope frames
let env = null;                          // Float32Array, 0..1

function parseWav(buf) {
  const dv = new DataView(buf); if (dv.getUint32(0, false) !== 0x52494646) throw new Error('not a wav');
  let p = 12, fmt = null, data = null;
  while (p + 8 <= dv.byteLength) {
    const id = String.fromCharCode(dv.getUint8(p), dv.getUint8(p + 1), dv.getUint8(p + 2), dv.getUint8(p + 3)), size = dv.getUint32(p + 4, true);
    if (id === 'fmt ') fmt = { code: dv.getUint16(p + 8, true), ch: dv.getUint16(p + 10, true), sr: dv.getUint32(p + 12, true), bits: dv.getUint16(p + 22, true) };
    if (id === 'data') { data = { off: p + 8, size: Math.min(size, dv.byteLength - p - 8) }; break; }
    p += 8 + size + (size & 1);
  }
  if (!fmt || !data) throw new Error('bad wav');
  const bps = fmt.bits / 8, n = Math.floor(data.size / (bps * fmt.ch)), out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const o = data.off + i * bps * fmt.ch;
    out[i] = fmt.code === 3 ? dv.getFloat32(o, true) : fmt.bits === 16 ? dv.getInt16(o, true) / 32768 : fmt.bits === 24 ? ((dv.getUint8(o) | (dv.getUint8(o + 1) << 8) | (dv.getInt8(o + 2) << 16)) / 8388608) : dv.getInt32(o, true) / 2147483648;
  }
  return { sr: fmt.sr, x: out };
}

export async function loadLipsync() {
  try {
    const r = await fetch('data/narration.wav', { cache: 'no-store' }); if (!r.ok) return false;
    const { sr, x } = parseWav(await r.arrayBuffer()), hop = Math.round(sr * HOP), n = Math.floor(x.length / hop);
    const raw = new Float32Array(n);
    for (let f = 0; f < n; f++) { let s = 0; for (let i = f * hop; i < (f + 1) * hop; i++) s += x[i] * x[i]; raw[f] = Math.sqrt(s / hop); }
    const voiced = Array.from(raw).filter((v) => v > 0.01).sort((a, b) => a - b), ref = voiced[Math.floor(voiced.length * 0.9)] || 1;
    env = new Float32Array(n); let y = 0;
    for (let f = 0; f < n; f++) { const v = clamp((raw[f] / ref - 0.08) * 1.15); y = v > y ? y + (v - y) * 0.7 : y + (v - y) * 0.35; env[f] = y; }
    return true;
  } catch (e) { console.warn('lipsync: using word timings', e); env = null; return false; }
}

const vowelGroups = (w) => Math.max(1, (String(w).toLowerCase().match(/[aeiouy]+/g) || []).length);
export function wordAt(t) { return T.words.find((w) => t >= w.s - 0.02 && t <= Math.max(w.e, w.s + 0.12)) || null; }

/** mouth openness 0..1 at film time t */
export function talk(t) {
  if (env) { const f = t / HOP, i = Math.floor(f); if (i < 0 || i >= env.length - 1) return 0; return env[i] + (env[i + 1] - env[i]) * (f - i); }
  const w = wordAt(t); if (!w) return 0;
  const d = Math.max(0.12, w.e - w.s), syl = d / vowelGroups(w.w), p = (t - w.s) / syl;
  return 0.2 + 0.65 * Math.abs(Math.sin(Math.PI * p));
}
