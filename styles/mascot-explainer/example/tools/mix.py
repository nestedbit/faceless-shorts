"""Mascot Explainer soundtrack: narration + techy procedural sound effects + a barely-there music bed, all made here with
numpy, mastered to -14 LUFS (script.json "loudness" overrides). No samples, no AI audio, no downloads, no credits.

  python3 tools/mix.py [project=.]          → data/mix.wav (48 kHz stereo)

Reads data/cues.json (node tools/capture.mjs cues), data/narration.wav if it exists (voice.py or words.py --audio),
and script.json "music": "pulse" (soft techy beat, this style's default) · "bed" (the gentle score) · "none" · "audio/your-track.mp3" (your own royalty-free
track, any format ffmpeg reads). The music ducks under the voice.

Sound rules (STYLE.md): every visible hit has a sound, hits are the loudest effects, whooshes sit quieter, nothing above
~5 kHz, no harsh beeps. Music sits about 20 dB under the voice.
Cue types: hit riser lock click tick type whoosh slide pop plop gulp boing bubbles sizzle sparkle thud slam tock zip alarm
(+ gain, dur)
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np
from scipy import signal
from scipy.io import wavfile

P = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
SR = 48000
rng = np.random.default_rng(11)
cj = json.loads((P / 'data/cues.json').read_text())
script = json.loads((P / 'script.json').read_text())
DUR = float(cj['duration'])
N = int(DUR * SR) + SR // 10


def lp(x, f, o=2): b, a = signal.butter(o, min(f, SR / 2 - 100) / (SR / 2), 'low'); return signal.lfilter(b, a, x)
def hp(x, f, o=2): b, a = signal.butter(o, f / (SR / 2), 'high'); return signal.lfilter(b, a, x)
def bp(x, f0, f1, o=2): b, a = signal.butter(o, [f0 / (SR / 2), f1 / (SR / 2)], 'band'); return signal.lfilter(b, a, x)
def db(x): return 10 ** (x / 20)
def tt(d): return np.arange(int(d * SR)) / SR
def env(n, a=0.005, r=None):
    """attack a seconds then exponential release over the rest"""
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    rest = n - na; e[na:] = np.exp(-np.linspace(0, r or 5, rest)) if rest > 0 else 1; return e
def sweep(f0, f1, d, shape='exp'):
    t = tt(d); f = f0 * (f1 / f0) ** (t / d) if shape == 'exp' else f0 + (f1 - f0) * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR)
def noise(d): return rng.standard_normal(int(d * SR))


# ---------- the effects ----------
def whoosh(d=0.38, **_):
    n = noise(d); lo, hi = lp(n, 500), lp(n, 2200)
    k = np.sin(np.pi * np.linspace(0, 1, len(n))); x = (lo * (1 - k) + hi * k) * k ** 1.5
    return x / (np.abs(x).max() + 1e-9) * 0.5
def slide(d=1.0, **_):
    n = lp(noise(d), 700); e = np.sin(np.pi * np.linspace(0, 1, len(n))) ** 2
    return n / (np.abs(n).max() + 1e-9) * e * 0.35 + sweep(260, 120, d) * e * 0.08
def pop(**_): x = sweep(560, 240, 0.11) * env(int(0.11 * SR), 0.002, 6); return lp(x, 3000) * 0.7
def plop(**_): x = sweep(700, 180, 0.14) * env(int(0.14 * SR), 0.002, 5); return lp(x, 2500) * 0.6
def gulp(**_):
    a = sweep(320, 140, 0.16) * env(int(0.16 * SR), 0.01, 4); b = sweep(240, 90, 0.2) * env(int(0.2 * SR), 0.01, 4)
    x = np.concatenate([a, np.zeros(int(0.04 * SR)), b]); return lp(x, 1800) * 0.8
def boing(**_):
    d = 0.42; t = tt(d); f = 200 * (1 + 0.6 * t / d) * (1 + 0.08 * np.sin(2 * np.pi * 18 * t))
    return lp(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.004, 4), 2000) * 0.55
def bubbles(d=2.0, **_):
    x = np.zeros(int(d * SR))
    for _ in range(int(d * 7)):
        st = rng.integers(0, max(1, len(x) - int(0.08 * SR))); f = rng.uniform(380, 900); b = sweep(f, f * 1.6, 0.06) * env(int(0.06 * SR), 0.003, 5)
        x[st:st + len(b)] += b * rng.uniform(0.2, 0.5)
    return lp(x, 2500) * 0.5
def sizzle(d=1.0, **_):
    n = bp(noise(d), 1800, 4500); crack = (rng.random(len(n)) < 0.002).astype(float); crack = lp(crack, 300) * 40
    e = np.minimum(1, np.linspace(0, 6, len(n))) * np.linspace(1, 0.2, len(n)); return n * (0.4 + crack) * e * 0.12
def sparkle(d=1.2, **_):
    notes = [784, 880, 1047, 1175, 1319, 1568]; x = np.zeros(int(d * SR) + SR // 2)
    for k, f in enumerate(notes):
        st = int(k * d / len(notes) * SR); n = int(0.4 * SR); t = tt(0.4)
        x[st:st + n] += (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * env(n, 0.004, 6) * 0.22
    return lp(x, 4500)
def thud(**_):
    d = 0.35; t = tt(d); x = np.sin(2 * np.pi * (70 + 40 * np.exp(-t * 30)) * t) * env(len(t), 0.002, 7)
    return x * 0.9 + lp(noise(d), 220) * env(len(t), 0.001, 12) * 0.3
def slam(**_):
    d = 0.5; t = tt(d); x = np.sin(2 * np.pi * (60 + 60 * np.exp(-t * 25)) * t) * env(len(t), 0.002, 6)
    return np.tanh(1.6 * (x + lp(noise(d), 1200) * env(len(t), 0.001, 10) * 0.6)) * 0.9
def tock(**_): d = 0.09; t = tt(d); return (np.sin(2 * np.pi * 420 * t) + 0.3 * np.sin(2 * np.pi * 840 * t)) * env(len(t), 0.001, 9) * 0.35
def zip_(**_):
    d = 0.32; n = bp(noise(d), 400, 3000); k = np.linspace(0, 1, len(n))
    return (n / (np.abs(n).max() + 1e-9) * 0.35 + sweep(300, 1100, d) * 0.12) * np.sin(np.pi * k) ** 1.2
def alarm(d=2.0, **_):
    x = np.zeros(int(d * SR)); one = np.sin(2 * np.pi * 150 * tt(0.22)) * env(int(0.22 * SR), 0.02, 5)
    for st in np.arange(0, d - 0.25, 0.5): i = int(st * SR); x[i:i + len(one)] += one
    return lp(x, 900) * 0.55

def inhale(d=1.0, **_):
    n = bp(noise(d), 300, 2600); k = np.linspace(0, 1, len(n)); e = np.sin(np.pi * np.minimum(1, k * 1.15)) ** 1.5 * (0.6 + 0.4 * k)
    return n / (np.abs(n).max() + 1e-9) * e * 0.5
def heartbeat(**_):
    one = lambda d, f: np.sin(2 * np.pi * f * tt(d)) * env(int(d * SR), 0.004, 7)
    x = np.concatenate([one(0.16, 58), np.zeros(int(0.09 * SR)), one(0.2, 52) * 0.75]); return lp(x, 300) * 1.0

# ---------- Mascot Explainer effects: techy, premium, still soft ----------
def hit(**_):
    """deep impact for tiles, counters, stamps: sub drop + a short body thump"""
    d = 0.75; t = tt(d); sub = np.sin(2 * np.pi * np.cumsum(42 + 80 * np.exp(-t * 16)) / SR) * env(len(t), 0.002, 4.5)
    body = lp(noise(d), 900) * env(len(t), 0.001, 16) * 0.55
    return np.tanh(1.8 * (sub + body)) * 0.9
def click(**_):
    """soft UI click"""
    d = 0.06; t = tt(d); x = np.sin(2 * np.pi * 1350 * t) * env(len(t), 0.0005, 16) + lp(noise(d), 3000) * env(len(t), 0.0005, 30) * 0.5
    return lp(x, 4200) * 0.6
def lock(**_):
    """badge locks into its corner: two quick clicks + a low thunk"""
    d = 0.3; x = np.zeros(int(d * SR)); a = click(); i = int(0.045 * SR)
    x[:len(a)] += a; x[i:i + len(a)] += a * 0.8
    t = tt(0.16); th = np.sin(2 * np.pi * np.cumsum(120 - 50 * t / 0.16) / SR) * env(len(t), 0.002, 7); x[i:i + len(th)] += th * 0.7
    return x
def riser(d=0.5, **_):
    """a short rising build that lands on a hit"""
    t = tt(d); k = t / d; n = noise(d)
    x = (lp(n, 500) * (1 - k) + lp(n, 3500) * k) * k ** 2 * 0.6 + sweep(160, 640, d) * k ** 2 * 0.3
    return x
def tick(**_):
    """checklist tick: a bright, round pluck"""
    t = tt(0.22); return (np.sin(2 * np.pi * 988 * t) + 0.4 * np.sin(2 * np.pi * 1482 * t)) * env(len(t), 0.002, 9) * 0.5
def type_(d=0.6, **_):
    """soft keyboard typing"""
    c = click(); x = np.zeros(int(d * SR) + len(c)); s = 0.0
    while s < d: i = int(s * SR); x[i:i + len(c)] += c * rng.uniform(0.4, 0.8); s += rng.uniform(0.055, 0.1)
    return lp(x, 3500)

FX = dict(hit=hit, click=click, lock=lock, riser=riser, tick=tick, type=type_, inhale=inhale, heartbeat=heartbeat, whoosh=whoosh, slide=slide, pop=pop, plop=plop, gulp=gulp, boing=boing, bubbles=bubbles, sizzle=sizzle,
          sparkle=sparkle, thud=thud, slam=slam, tock=tock, zip=zip_, alarm=alarm)
LEVEL = dict(hit=-8, click=-19, lock=-15, riser=-21, tick=-16, type=-24, inhale=-15, heartbeat=-8, whoosh=-21, slide=-19, pop=-14, plop=-15, gulp=-11, boing=-15, bubbles=-21, sizzle=-18, sparkle=-17,
             thud=-11, slam=-9, tock=-18, zip=-14, alarm=-17)


# ---------- the music bed: soft pad + plucked arpeggio, 100 BPM, I–vi–IV–V ----------
def music_bed():
    bpm = 100; beat = 60 / bpm; bar = beat * 4
    chords = [[261.6, 329.6, 392.0], [220.0, 261.6, 329.6], [174.6, 220.0, 261.6], [196.0, 246.9, 293.7]]
    x = np.zeros(N)
    nb = int(np.ceil(DUR / bar)) + 1
    for b in range(nb):
        ch = chords[b % 4]; st = int(b * bar * SR); n = int(bar * SR)
        if st >= N: break
        t = tt(bar); e = np.minimum(1, t / 0.4) * np.minimum(1, (bar - t) / 0.4)
        pad = sum(np.sin(2 * np.pi * f / 2 * t) + 0.25 * np.sin(2 * np.pi * f * t) for f in ch) * e * 0.10
        x[st:st + n] += pad[:max(0, min(n, N - st))]
        for k in range(8):                                                       # eighth-note pluck arpeggio
            f = ch[[0, 1, 2, 1, 2, 0, 1, 2][k]] * (2 if k % 4 == 2 else 1); ps = st + int(k * beat / 2 * SR); pn = int(0.5 * SR)
            if ps + pn >= N: continue
            pt = tt(0.5); pl = (np.sin(2 * np.pi * f * pt) + 0.35 * np.sin(4 * np.pi * f * pt)) * env(pn, 0.003, 7) * 0.12
            x[ps:ps + pn] += pl
    x = lp(x, 3200)
    fade = np.ones(N); fo = int(1.2 * SR); fade[-fo:] = np.linspace(1, 0, fo)
    return x / (np.abs(x).max() + 1e-9) * fade

def music_tension():
    """low drone + slow minor pulse, for mysterious / tense explainers (script.json "music": "tension")"""
    t = np.arange(N) / SR; x = np.zeros(N)
    for f, g in [(55, 0.5), (82.4, 0.3), (110, 0.2), (130.8, 0.12)]: x += np.sin(2 * np.pi * f * t + np.sin(t * 0.3) * 0.5) * g
    x *= 0.55 + 0.45 * np.sin(2 * np.pi * t / 8) ** 2
    beat = 60 / 84; ping = lambda f: (np.sin(2 * np.pi * f * tt(1.2)) + 0.3 * np.sin(4 * np.pi * f * tt(1.2))) * env(int(1.2 * SR), 0.01, 5)
    seq = [220.0, 261.6, 196.0, 174.6]
    for k in range(int(DUR / (beat * 2))):
        i = int(k * beat * 2 * SR); pg = ping(seq[(k // 2) % 4]) * 0.35
        if i + len(pg) < N: x[i:i + len(pg)] += pg
    x = lp(x, 2200); fade = np.ones(N); fo = int(1.5 * SR); fade[-fo:] = np.linspace(1, 0, fo); fi = int(0.8 * SR); fade[:fi] *= np.linspace(0, 1, fi)
    return x / (np.abs(x).max() + 1e-9) * fade

def music_pulse():
    """soft techy pulse, 112 BPM: round kick, off-beat chord plucks, sub bass. Am7 - Fmaj7 - C - G (two bars each)"""
    bpm = 112; beat = 60 / bpm; x = np.zeros(N)
    chords = [[220.0, 261.6, 329.6, 392.0], [174.6, 220.0, 261.6, 329.6], [261.6, 329.6, 392.0, 493.9], [196.0, 246.9, 293.7, 392.0]]
    kt = tt(0.28); kick = np.sin(2 * np.pi * np.cumsum(48 + 70 * np.exp(-kt * 28)) / SR) * env(len(kt), 0.002, 8)
    for b in range(int(DUR / beat) + 2):
        st = int(b * beat * SR)
        if st >= N: break
        ch = chords[(b // 8) % 4]
        n = min(len(kick), N - st); x[st:st + n] += kick[:n] * 0.9
        o = st + int(beat / 2 * SR); stt = tt(0.2); stab = sum(np.sin(2 * np.pi * f * stt) for f in ch) * env(len(stt), 0.003, 9) * 0.16
        n = min(len(stab), N - o)
        if n > 0: x[o:o + n] += stab[:n]
        bt = tt(beat); bass = np.sin(2 * np.pi * ch[0] / 2 * bt) * np.minimum(1, bt / 0.02) * np.exp(-bt * 2.5) * 0.35
        n = min(len(bass), N - st); x[st:st + n] += bass[:n]
    x = lp(x, 3000); fade = np.ones(N); fo = int(1.2 * SR); fade[-fo:] = np.linspace(1, 0, fo); fi = int(0.5 * SR); fade[:fi] *= np.linspace(0, 1, fi)
    return x / (np.abs(x).max() + 1e-9) * fade

def load_audio(f):
    out = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(f), '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    a = np.frombuffer(out, dtype=np.float32).reshape(-1, 2).astype(np.float64); return a


mix = np.zeros((N, 2))
# voice
vf = P / 'data/narration.wav'
voice = None
if vf.exists():
    v = load_audio(vf)[:N]; voice = np.zeros((N, 2)); voice[:len(v)] = v
    rms = np.sqrt(np.mean(voice ** 2) + 1e-12); voice *= db(-19) / rms
    mix += voice
# music
mus = script.get('music', 'pulse')
if mus and mus != 'none':
    m = music_pulse() if mus == 'pulse' else music_bed() if mus == 'bed' else music_tension() if mus == 'tension' else None
    if m is None:
        a = load_audio(P / mus)[:N]; m = np.zeros(N); m[:len(a)] = a.mean(1); m /= np.abs(m).max() + 1e-9
    m = np.stack([m, m], 1) * db(-30 if voice is not None else -22)               # ~20 dB under the voice once ducked
    if voice is not None:                                                        # duck under the voice
        lev = np.abs(voice.mean(1)); lev = signal.lfilter([1 - 0.9995], [1, -0.9995], lev); lev /= lev.max() + 1e-9
        m *= (1 - 0.55 * np.clip(lev * 3, 0, 1))[:, None]
    mix += m
# effects
for c in cj['cues']:
    fn = FX.get(c['type'])
    if not fn: print('unknown cue type, skipped:', c['type']); continue
    x = fn(**({'d': c['dur']} if c.get('dur') else {}))
    x = lp(x, 5000) * db(LEVEL[c['type']]) * c.get('gain', 1.0) / (np.abs(x).max() + 1e-9) * 0.9
    i = int(c['t'] * SR); n = min(len(x), N - i)
    if n > 0 and i >= 0: pan = c.get('pan', 0.0); mix[i:i + n, 0] += x[:n] * (1 - max(0, pan)); mix[i:i + n, 1] += x[:n] * (1 + min(0, pan))
# master: gentle soft-clip, then loudness to the target (default -14 LUFS, Instagram / TikTok / Shorts) with a
# look-ahead peak limiter at -1 dBFS. Loudness is measured by ffmpeg's EBU R128 meter.
import re, tempfile
from scipy.ndimage import minimum_filter1d
mix = np.tanh(mix * 1.2) / 1.2
mix *= db(-1) / (np.abs(mix).max() + 1e-9)

def measure(x):
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f: tmp = f.name
    wavfile.write(tmp, SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))
    out = subprocess.run(['ffmpeg', '-nostats', '-i', tmp, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    Path(tmp).unlink(missing_ok=True); summ = out[out.rfind('Summary:'):]
    return float(re.search(r'I:\s+(-?[\d.]+) LUFS', summ).group(1)), float(re.search(r'Peak:\s+(-?[\d.]+|-inf) dBFS', summ).group(1))

def limit(x, ceil=db(-1.0)):
    need = np.minimum(1.0, ceil / np.maximum(np.abs(x).max(1), 1e-9))
    need = minimum_filter1d(need, size=int(0.01 * SR) | 1)                    # +-5 ms look-around
    rel = 1 - np.exp(-1 / (0.08 * SR)); g = np.empty_like(need); cur = 1.0
    for i, v in enumerate(need): cur = v if v < cur else cur + (1 - cur) * rel; g[i] = cur
    return np.clip(x * g[:, None], -ceil, ceil)

target = float(script.get('loudness', -14))
for _ in range(3):
    I, pk = measure(mix)
    if abs(I - target) < 0.3: break
    mix = limit(mix * db(target - I))
I, pk = measure(mix)
wavfile.write(P / 'data/mix.wav', SR, (mix * 32767).astype(np.int16))
print(f"data/mix.wav: {DUR:.2f} s · voice: {'yes' if voice is not None else 'NO (captions-only)'} · music: {mus} · {len(cj['cues'])} cues · {I:.1f} LUFS, peak {pk:.1f} dBFS")
