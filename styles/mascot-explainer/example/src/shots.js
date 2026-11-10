// HOW TO SPOT A FAKE EMAIL: the shot list (the only file that changes per video, with script.json and mascot.json).
// A shot: { id, at, cam: [cx, cy], zoom, note, draw(lt, d, t) }  · lt = time in shot, d = shot length, t = film time.
// It runs until the next shot's `at`; the last one ends at T.dur. Cut = L(i) - 0.08 (picture changes just before the line).
// Sound: cue(t, type, { gain, dur }). Camera shake: hit(t, power) (also plays a 'hit' unless you pass another sound or null).
// The mascot is ONE timeline for the whole film (host), so it never jumps between cuts; every shot draws it.
import { ctx, C, clamp, lerp, seg, eo, eio, eob, text, FONT } from './core/lib.js';
import { L, Wd, T } from './core/timing.js';
import * as K from './core/kit.js';
import * as M from './core/mascot.js';

export function buildShots() {
  const S = [], CUES = [], HITS = [];
  const add = (o) => (S.push(o), o);
  const cue = (t, type, o = {}) => CUES.push({ t: +t.toFixed(3), type, ...o });
  const hit = (t, p = 1, sound = 'hit') => { HITS.push({ t, p }); if (sound) cue(t, sound); };
  const cut = (i) => (i === 0 ? 0 : L(i) - 0.08);
  const STEP_LINES = [2, 4, 6, 8];
  const cutStep = (i) => Wd(['one', 'two', 'three', 'four'][STEP_LINES.indexOf(i)], i) - 0.03;   // step lines cut ON the tile slam

  // ── the film's beats (film time) ─────────────────────────────────────────
  const STEP = [Wd('one', 2), Wd('two', 4), Wd('three', 6), Wd('four', 8)];
  const LAND = STEP.map((s) => s + 0.9);                                  // the tile reaches the badge corner
  const ALL_DONE = Wd('scam', 9);
  const items = [['Sender', 0], ['Links', 1], ['Pressure', 2], ['Passwords', 3]]
    .map(([txt, i]) => ({ txt, at: STEP[i], done: i < 3 ? STEP[i + 1] : ALL_DONE }));
  const stickyIn = Wd('quick', 1);

  const host = M.act([
    [0, 'idle', { mood: 'happy' }],
    [Wd('fbi', 0), 'pointAt', { mood: 'surprised' }],
    [Wd('complaints', 0), 'shrug', { mood: 'worried' }],
    [Wd('here', 1), 'present', { mood: 'happy' }],
    [Wd('four', 1), 'count', { count: 4, mood: 'happy' }],
    [STEP[0], 'pointUp', { mood: 'happy' }],
    [Wd('sender', 2), 'pointAt'],
    [Wd('not', 2), 'stop', { mood: 'serious' }],
    [Wd('anyone', 3), 'shrug', { mood: 'skeptical' }],
    [STEP[1], 'count', { count: 2, mood: 'happy' }],
    [Wd('link', 4), 'pointAt'],
    [Wd('make', 5), 'present'],
    [Wd('does', 5), 'shrug', { mood: 'skeptical' }],
    [STEP[2], 'count', { count: 3 }],
    [Wd('pressure', 6), 'pointAt', { mood: 'worried' }],
    [Wd('lose', 6), 'shrug', { mood: 'worried' }],
    [Wd('panic', 7), 'stop', { mood: 'serious' }],
    [Wd('want', 7), 'pointAt', { mood: 'skeptical' }],
    [STEP[3], 'count', { count: 4 }],
    [Wd('never', 8), 'stop', { mood: 'serious' }],
    [Wd('code', 8), 'pointAt'],
    [Wd('anyone', 9), 'presentLeft', { mood: 'skeptical' }],
    [Wd('scam', 9), 'stop', { mood: 'serious' }],
    [Wd('send', 10), 'wave', { mood: 'happy' }],
    [Wd('clicks', 10), 'thumbsUp', { mood: 'excited' }],
  ]);
  const [MX, MY, MS] = K.LAY.mascot;
  const mascot = (t) => M.mascot(MX, MY, MS, t, host);

  /** the persistent frame: label, sticky checklist, step badge */
  function hud(t) {
    const step = STEP.filter((s) => t >= s).length;
    K.label(step ? `Check ${step} of 4` : 'Spot a fake email');
    K.sticky(items, t, stickyIn);
    if (step && t >= LAND[step - 1]) K.badge(step, undefined, undefined, 1 + 0.25 * (1 - eo(seg(t, LAND[step - 1], LAND[step - 1] + 0.2))), t >= ALL_DONE + 0.3);
  }
  const lands = (n) => { cue(STEP[n], 'hit'); HITS.push({ t: STEP[n], p: 1 }); cue(STEP[n] - 0.35, 'riser', { dur: 0.35 }); cue(LAND[n], 'lock'); };

  // ── 1 · HOOK: the number counts up ──────────────────────────────────────
  {
    const st = cut(0), a = Wd('fbi', 0), land = Wd('thousand', 0) + 0.35, ph = Wd('phishing', 0), cmp = Wd('complaints', 0);
    add({ id: 'S01', at: st, cam: [540, 840], note: 'FBI counter climbs to 193,407, #1 REPORTED stamp',
      draw(lt, d, t) {
        K.paper(); hud(t);
        K.card(lt, 0.2, (w) => {
          K.cardHead(w, 'FBI · IC3 report · 2024');
          const v = 193407 * eo(seg(t, a, land));
          K.counter(w / 2, 280, v, 168, t >= land ? C.violet : C.ink, 'center');
          K.burst(w / 2, 280, 330, seg(t, land, land + 0.4));
          const p = K.pop(t, ph, 0.25);
          if (p > 0) { ctx.save(); ctx.globalAlpha = clamp(p * 3); text('phishing complaints', w / 2, 410 + (1 - eo(p)) * 30, 56, C.ink, { align: 'center', weight: 800 }); ctx.restore(); }
        });
        K.stamp('#1 REPORTED', 745, 1070, t, cmp, { size: 64, rot: -0.1 });
        mascot(t);
      } });
    cue(0.2, 'pop', { gain: 0.6 }); cue(a, 'riser', { dur: land - a }); hit(land, 0.8); cue(ph, 'pop', { gain: 0.5 });
    hit(cmp + 11 * 0.035 + 0.12, 0.5, 'slam');
  }

  // ── 2 · PROMISE: the inbox, one fake, four checks ───────────────────────
  {
    const st = cut(1), fake = Wd('fake', 1), four = Wd('four', 1);
    const rows = [['M', 'Mom', 'Dinner on Sunday?', C.limeDark], ['YB', 'Your Bank', 'URGENT: verify your account', C.violet], ['T', 'Team', 'Notes from today', C.inkSoft], ['S', 'Shop', 'Your order has shipped', C.mute]];
    add({ id: 'S02', at: st, cam: [540, 860], note: 'inbox rows pop, the fake one flagged on "fake", 4 CHECKS stamp on "four", sticky slides in',
      draw(lt, d, t) {
        K.paper(); hud(t);
        K.card(lt, 0.05, (w) => {
          K.cardHead(w, 'Inbox · 4 new');
          rows.forEach(([ini, from, subj, col], i) => {
            const p = K.pop(lt, 0.15 + i * 0.09, 0.25); if (p <= 0) return;
            const y = 120 + i * 118;
            ctx.save(); ctx.globalAlpha = clamp(p * 3); ctx.translate((1 - eo(p)) * 60, 0);
            if (i === 1) { const k = K.pop(t, fake, 0.25); ctx.fillStyle = C.redLight; ctx.fillRect(0, y - 4, w * eo(k), 112); }
            K.avatar(70, y + 52, 36, ini, col);
            text(from, 130, y + 34, 38, C.ink, { weight: 900 }); text(subj, 130, y + 78, 28, C.inkSoft, { font: FONT.mono, weight: 700, maxW: 620 });
            ctx.fillStyle = C.line; ctx.fillRect(30, y + 110, w - 60, 3); ctx.restore();
          });
          K.chip('FAKE?', w - 120, 120 + 118 + 40, { k: K.pop(t, fake + 0.12, 0.3), rot: 0.06 });
        });
        K.stamp('4 CHECKS', 700, 1085, t, four, { size: 76, color: C.violet, rot: -0.08 });
        mascot(t);
      } });
    cue(st, 'whoosh'); for (let i = 0; i < 4; i++) cue(st + 0.15 + i * 0.09, 'pop', { gain: 0.35 });
    cue(fake + 0.12, 'pop'); hit(four + 8 * 0.035 + 0.12, 0.6, 'slam'); cue(stickyIn, 'slide', { dur: 0.4, gain: 0.6 });
  }

  // ── 3 · CHECK 1: the real sender address ────────────────────────────────
  {
    const st = cutStep(2), cardAt = LAND[0] - st - 0.15, addr = Wd('address', 2), nm = Wd('name', 2);
    add({ id: 'S03', at: st, cam: [540, 820], note: 'tile 1, NAME vs ADDRESS, lime on the fake domain, NOT PROOF on "name"',
      draw(lt, d, t) {
        K.paper(); hud(t);
        K.card(lt, cardAt, (w) => {
          K.cardHead(w, 'Message details');
          text('NAME', 50, 150, 26, C.inkSoft, { font: FONT.mono, weight: 700, spacing: 2 });
          K.avatar(90, 225, 40, 'YB', C.violet); text('Your Bank', 152, 228, 66, C.ink);
          text('ADDRESS', 50, 340, 26, C.inkSoft, { font: FONT.mono, weight: 700, spacing: 2 });
          K.urlPill(40, 412, w - 80, 'security@y0urbank-help.net', { size: 40, icon: false, hl: [9, 26], k: K.pop(t, addr, 0.35), bad: true });
          K.chip('CHECK THIS', 620, 510, { col: C.lime, fg: C.ink, k: K.pop(t, addr + 0.25, 0.3), rot: -0.05 });
          K.chip('NOT PROOF', 700, 226, { k: K.pop(t, nm, 0.3), rot: 0.05 });
        });
        mascot(t); K.stepTile(1, lt, STEP[0] - st);
      } });
    cue(st, 'whoosh'); lands(0); cue(st + cardAt, 'pop', { gain: 0.6 }); cue(addr, 'click'); cue(addr + 0.25, 'pop'); cue(nm, 'pop');
  }

  // ── 4 · anyone can type a name ──────────────────────────────────────────
  {
    const st = cut(3), call = Wd('call', 3), them = Wd('themselves', 3), bank = Wd('bank', 3);
    add({ id: 'S04', at: st, cam: [540, 820], note: 'display-name field typed "Your Bank", inbox preview + FAKE on "bank"',
      draw(lt, d, t) {
        K.paper(); hud(t);
        K.card(lt, 0.05, (w) => {
          K.cardHead(w, 'Email settings');
          K.field(50, 190, w - 100, 'Display name', 'Your Bank', { k: seg(t, call, them + 0.35), active: t < bank, t });
          text('anyone can type anything here', 54, 315, 28, C.inkSoft, { font: FONT.mono, weight: 700 });
          const p = K.pop(t, bank, 0.3);
          if (p > 0) { ctx.save(); ctx.globalAlpha = clamp(p * 3); ctx.translate(0, (1 - eob(p)) * 40);
            ctx.fillStyle = C.field; ctx.fillRect(30, 380, w - 60, 150); K.avatar(100, 455, 40, 'YB', C.violet);
            text('Your Bank', 165, 432, 44, C.ink); text('looks legit in your inbox', 165, 482, 26, C.inkSoft, { font: FONT.mono, weight: 700 }); ctx.restore(); }
          K.chip('FAKE', w - 130, 455, { k: K.pop(t, bank + 0.15, 0.3), rot: -0.08, size: 40 });
        });
        mascot(t);
      } });
    cue(st, 'whoosh'); cue(call, 'type', { dur: them + 0.35 - call }); cue(bank, 'pop'); hit(bank + 0.15, 0.6, 'slam');
  }

  // ── 5 · CHECK 2: hover before you click ─────────────────────────────────
  {
    const st = cutStep(4), cardAt = LAND[1] - st - 0.15, link = Wd('link', 4), click = Wd('click', 4);
    add({ id: 'S05', at: st, cam: [540, 820], note: 'tile 2, cursor hovers the button, real URL tooltip, red X on "click"',
      draw(lt, d, t) {
        K.paper(); hud(t);
        K.card(lt, cardAt, (w) => {
          K.cardHead(w, 'Your Bank');
          text('Your account is on hold.', 50, 165, 50, C.ink, { maxW: w - 100 });
          text('Confirm your details to keep using it.', 50, 225, 28, C.inkSoft, { font: FONT.mono, weight: 700, maxW: w - 100 });
          const over = t >= link - 0.05;
          K.button(220, 290, 460, 110, 'Verify account', { col: over ? C.violetDark : C.violet });
          K.tooltip(460, 440, 'http://yourbank.verify-id.co/login', { k: K.pop(t, link, 0.25), size: 32 });
          const m = eio(seg(t, LAND[1] - 0.1, link)), cx = lerp(820, 520, m), cy = lerp(560, 345, m);
          K.cursor(cx, cy, 1.1);
          K.bad(740, 345, 0.8, K.pop(t, click, 0.3));
        });
        mascot(t); K.stepTile(2, lt, STEP[1] - st);
      } });
    cue(st, 'whoosh'); lands(1); cue(st + cardAt, 'pop', { gain: 0.6 }); cue(LAND[1] - 0.1, 'slide', { dur: link - LAND[1] + 0.1, gain: 0.5 });
    cue(link, 'pop'); hit(click, 0.7, 'slam');
  }

  // ── 6 · where it says vs where it goes ──────────────────────────────────
  {
    const st = cut(5), goes = Wd('goes', 5), says = Wd('says', 5), does = Wd('does', 5);
    add({ id: 'S06', at: st, cam: [540, 820], note: 'BUTTON SAYS vs LINK GOES TO, red X + NO MATCH on "does"',
      draw(lt, d, t) {
        K.paper(); hud(t);
        K.card(lt, 0.05, (w) => {
          K.cardHead(w, 'Link check');
          text('BUTTON SAYS', 50, 160, 26, C.inkSoft, { font: FONT.mono, weight: 700, spacing: 2 });
          K.urlPill(40, 232, w - 80, 'yourbank.com', { size: 40, hl: [0, 12], k: K.pop(t, says, 0.3) });
          const p = K.pop(t, goes, 0.3);
          if (p > 0) { ctx.save(); ctx.globalAlpha = clamp(p * 3); ctx.translate(0, (1 - eob(p)) * 40);
            text('LINK GOES TO', 50, 350, 26, C.inkSoft, { font: FONT.mono, weight: 700, spacing: 2 });
            K.urlPill(40, 422, w - 80, 'yourbank.verify-id.co/login', { size: 40, hl: [9, 21], k: K.pop(t, does, 0.3), bad: true }); ctx.restore(); }
          K.bad(w - 95, 422, 0.75, K.pop(t, does, 0.3));
          K.chip('NO MATCH', w - 210, 530, { k: K.pop(t, does + 0.15, 0.3) });
        });
        mascot(t);
      } });
    cue(st, 'whoosh'); cue(goes, 'pop'); cue(says, 'click'); hit(does, 0.8, 'slam'); cue(does + 0.15, 'pop');
  }

  // ── 7 · CHECK 3: pressure ───────────────────────────────────────────────
  {
    const st = cutStep(6), cardAt = LAND[2] - st - 0.15, pr = Wd('pressure', 6), act = Wd('act', 6), lose = Wd('lose', 6);
    add({ id: 'S07', at: st, cam: [540, 820], note: 'tile 3, URGENT email, countdown ticking, ACT NOW button pulses, shake on "lose"',
      draw(lt, d, t) {
        K.paper(); hud(t);
        K.card(lt, cardAt, (w) => {
          K.cardHead(w, 'Your Bank · urgent', { col: C.redLight, dot: C.red });
          text('Account closes in', 50, 170, 56, C.ink);
          const left = 24 * 3600 - 1 - Math.max(0, t - pr) * 1, hh = Math.floor(left / 3600), mm = Math.floor((left % 3600) / 60), ss = Math.floor(left % 60);
          K.timer(w - 175, 360, 125, left / (24 * 3600), `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`);
          const sh = t > lose ? Math.sin(t * 60) * 8 * Math.max(0, 1 - (t - lose) * 2) : 0;
          if (t > lose - 0.05) text('or lose your account', 52 + sh, 260, 36, C.red, { weight: 900 });
          const a = K.pop(t, act, 0.3);
          if (a > 0) { const pulse = 1 + 0.05 * Math.sin((t - act) * 10); ctx.save(); ctx.translate(250, 445); ctx.scale(lerp(0.5, 1, eob(a)) * pulse, lerp(0.5, 1, eob(a)) * pulse); K.button(-200, -55, 400, 110, 'ACT NOW', { col: C.red }); ctx.restore(); }
        });
        mascot(t); K.stepTile(3, lt, STEP[2] - st);
      } });
    cue(st, 'whoosh'); lands(2); cue(st + cardAt, 'pop', { gain: 0.6 }); cue(pr, 'alarm', { dur: L(7) - pr - 0.2, gain: 0.5 }); cue(act, 'pop'); hit(lose, 0.6, 'thud');
  }

  // ── 8 · that panic is the bait ──────────────────────────────────────────
  {
    const st = cut(7), panic = Wd('panic', 7), want = Wd('what', 7);
    add({ id: 'S08', at: st, cam: [540, 800], note: 'ACT NOW hangs on a fishing hook, IT\'S BAIT stamp on "what they want"',
      draw(lt, d, t) {
        K.paper(); hud(t);
        K.card(lt, 0.05, (w) => {
          K.cardHead(w, 'Phishing = fishing');
          const jig = t > panic ? Math.sin((t - panic) * 18) * 0.06 * Math.max(0, 1 - (t - panic) * 1.2) : 0;
          K.hook(w / 2 + 40, 60, 150 + Math.sin(t * 2) * 10, Math.sin(t * 2.2) * 0.06 + jig, () => K.button(-170, 0, 340, 100, 'ACT NOW', { col: C.red, size: 42 }));
        });
        K.stamp("IT'S BAIT", 560, 1060, t, want, { size: 88, rot: -0.07 });
        mascot(t);
      } });
    cue(st, 'whoosh'); cue(panic, 'boing', { gain: 0.5 }); hit(want + 9 * 0.035 + 0.12, 0.8, 'slam');
  }

  // ── 9 · CHECK 4: never send a password or a code ────────────────────────
  {
    const st = cutStep(8), cardAt = LAND[3] - st - 0.15, pw = Wd('password', 8), code = Wd('code', 8), em = Wd('by', 8);
    add({ id: 'S09', at: st, cam: [540, 820], note: 'tile 4, password dots + login code typed, NEVER stamp on "by email"',
      draw(lt, d, t) {
        K.paper(); hud(t);
        K.card(lt, cardAt, (w) => {
          K.cardHead(w, 'Confirm your identity');
          K.field(50, 175, w - 100, 'Password', 'hunter2-sunday', { k: seg(t, pw, pw + 0.7), secret: true, active: t < code, t });
          K.field(50, 355, w - 100, 'Login code (6 digits)', '481 203', { k: seg(t, code, code + 0.5), active: t >= code, t, size: 52 });
          K.lock(w - 110, 217, 0.7, C.inkSoft);
        });
        K.stamp('NEVER', 560, 1040, t, em, { size: 130, rot: -0.08 });
        mascot(t); K.stepTile(4, lt, STEP[3] - st);
      } });
    cue(st, 'whoosh'); lands(3); cue(st + cardAt, 'pop', { gain: 0.6 }); cue(pw, 'type', { dur: 0.7 }); cue(code, 'type', { dur: 0.5 });
    hit(em + 5 * 0.035 + 0.12, 1, 'slam');
  }

  // ── 10 · anyone who asks is running a scam ──────────────────────────────
  {
    const st = cut(9), asks = Wd('anyone', 9), scam = Wd('scam', 9);
    add({ id: 'S10', at: st, cam: [540, 820], note: 'chat bubble asks for the code, SCAM stamp + last tick on "scam"',
      draw(lt, d, t) {
        K.paper(); hud(t);
        K.card(lt, 0.05, (w) => {
          K.cardHead(w, 'Messages');
          K.bubble(60, 140, 720, 170, 'Please reply with your 6-digit code', { from: 'Your Bank', k: K.pop(t, asks, 0.3), size: 36 });
          const r = K.pop(t, asks + 0.45, 0.3);
          if (r > 0) { ctx.save(); ctx.globalAlpha = clamp(r * 3); text('typing…', w - 70, 400, 30, C.mute, { align: 'right', font: FONT.mono, weight: 700 }); ctx.restore(); }
        });
        K.stamp('SCAM', 600, 1010, t, scam, { size: 150, rot: -0.1 });
        mascot(t);
      } });
    cue(st, 'whoosh'); cue(asks, 'pop'); hit(scam + 4 * 0.035 + 0.12, 1, 'slam'); cue(ALL_DONE, 'tick'); cue(ALL_DONE + 0.3, 'lock');
  }

  // ── 11 · CTA: send it to that friend ────────────────────────────────────
  {
    const st = cut(10), send = Wd('send', 10), friend = Wd('friend', 10), every = Wd('every', 10);
    add({ id: 'S11', at: st, cam: [540, 860], zoom: 0.06, note: 'paper plane launches on "send", friend chip, lime tick on "every link"',
      draw(lt, d, t) {
        K.paper(); hud(t);
        K.card(lt, 0.05, (w) => {
          text('Send this to', w / 2, 120, 70, C.ink, { align: 'center' });
          const f = seg(t, send, send + 1.2), px = lerp(170, w + 160, eio(f)), py = 300 - Math.sin(f * Math.PI) * 120;
          if (f < 1) K.plane(px, py, 0.9, -0.15 + f * 0.3);
          const p = K.pop(t, friend, 0.3);
          if (p > 0) { ctx.save(); ctx.translate(w / 2, 420); ctx.scale(lerp(0.5, 1, eob(p)), lerp(0.5, 1, eob(p))); K.avatar(-300, 0, 52, ':)', C.limeDark);
            K.urlPill(-230, 0, 560, 'the friend who clicks everything', { icon: false, size: 30, fill: C.white }); ctx.restore(); }
          K.good(w - 100, 120, 0.9, K.pop(t, every, 0.35));
        });
        mascot(t);
      } });
    cue(st, 'whoosh'); cue(send, 'zip'); cue(friend, 'pop'); cue(every, 'sparkle', { dur: 0.8 }); hit(every, 0.4, 'tick');
  }

  return { shots: S, cues: CUES, hits: HITS };
}
