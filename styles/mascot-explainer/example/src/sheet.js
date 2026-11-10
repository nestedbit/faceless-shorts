// The Mascot Explainer style sheet, drawn with the style's own kit and mascot (so it always matches what renders).
import { ctx, C, text } from './core/lib.js';
import { startBoard, panel, frame, cell, small, swatches, rules } from './core/board.js';
import { drawHeadline } from './core/captions.js';
import * as K from './core/kit.js';
import * as M from './core/mascot.js';

const cv = document.getElementById('cv');
await Promise.all(['900 40px Inter', '800 40px Inter', '700 40px FreeMono'].map((f) => document.fonts.load(f)));
M.setLook(await fetch('mascot.json').then((r) => r.json()).catch(() => ({})));
startBoard(cv, { title: 'MASCOT EXPLAINER: VIDEO STYLE SHEET', accent: C.lime });

// 1 · hero frame
let b = panel(20, 80, 600, 520, 1, 'HERO FRAME');
frame(b.x + 6, b.y, 240, () => {
  K.paper(); K.label('Check 2 of 4');
  drawHeadline([{ txt: '2.', s: 0 }, { txt: 'Hover', hi: true, s: 0 }, { txt: 'over', s: 0 }, { txt: 'the', s: 0 }, { txt: 'link', s: 0 }], 5);
  K.card(5, 0, (w) => {
    K.cardHead(w, 'Your Bank'); text('Your account is on hold.', 50, 165, 50, C.ink);
    K.button(220, 290, 460, 110, 'Verify account', { col: C.violetDark }); K.tooltip(460, 440, 'http://yourbank.verify-id.co/login', { size: 32 }); K.cursor(520, 345, 1.1);
  });
  K.sticky([{ txt: 'Sender', at: 0, done: 1 }, { txt: 'Links', at: 2, done: 99 }, { txt: 'Pressure', at: 99, done: 99 }, { txt: 'Passwords', at: 99, done: 99 }], 5, 0);
  K.badge(2); M.draw(...K.LAY.mascot, { ...M.POSES.pointAt, mood: 'happy', talk: 0.5, word: 'link' });
});
small('YOU, AS A FLAT\nCARTOON MASCOT', b.x + 270, b.y + 40, 'left', 17);
small('ONE CARD, ONE\nIDEA AT A TIME', b.x + 270, b.y + 120, 'left', 17);
small('HEADLINE = CAPTION,\nWORD BY WORD', b.x + 270, b.y + 200, 'left', 17);
small('NUMBER TILES +\nA LIVE CHECKLIST', b.x + 270, b.y + 280, 'left', 17);
small('EVERY HIT: SHAKE\n+ A SOUND', b.x + 270, b.y + 360, 'left', 17);

// 2 · palette + the mascot
b = panel(630, 80, 640, 520, 2, 'PALETTE + MASCOT');
const yy = swatches(b, [['PAPER', C.paper], ['INK', C.ink], ['VIOLET', C.violet], ['LIME', C.lime], ['DANGER', C.red], ['CARD', C.white], ['NOTE', C.sticky]]);
small('VIOLET = THE ONE ACCENT. LIME = HIGHLIGHTS + CHECKS.', b.x + 4, yy + 14, 'left', 15, '#E6E7EA');
small('RED ONLY FOR DANGER. HARD SHADOWS, NEVER BLUR.', b.x + 4, yy + 42, 'left', 15, '#E6E7EA');
ctx.fillStyle = C.paper; ctx.beginPath(); ctx.roundRect(b.x, yy + 70, b.w, b.h - (yy + 70 - b.y), 14); ctx.fill();
ctx.save(); ctx.beginPath(); ctx.roundRect(b.x, yy + 70, b.w, b.h - (yy + 70 - b.y), 14); ctx.clip();
['idle', 'pointAt', 'count', 'thumbsUp', 'shrug'].forEach((p, i) => cell(b.x + 62 + i * 124, yy + 236, 0.26, () => M.draw(0, 0, 1, { ...M.POSES[p], count: 3, mood: M.POSES[p].mood || 'neutral' }), null));
ctx.restore();
['IDLE', 'POINT', 'COUNT', 'THUMBS', 'SHRUG'].forEach((l, i) => small(l, b.x + 62 + i * 124, yy + 92, 'center', 13, '#3A3640'));

// 3 · components
b = panel(1280, 80, 620, 520, 3, 'COMPONENTS');
ctx.fillStyle = C.paper; ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 14); ctx.fill();
cell(b.x + 90, b.y + 100, 0.4, () => K.tile(1, 0, 0), 'STEP TILE', 100);
cell(b.x + 230, b.y + 100, 0.55, () => K.badge(3, 0, 0), 'BADGE', 100);
cell(b.x + 420, b.y + 100, 0.45, () => K.stamp('SCAM', 0, 0, 9, 0, { size: 110 }), 'STAMP', 100);
cell(b.x + 90, b.y + 240, 0.6, () => { K.good(-50, 0, 0.8, 1); K.bad(55, 0, 0.8, 1); }, 'YES / NO', 60);
cell(b.x + 300, b.y + 240, 0.5, () => { K.chip('NOT PROOF', 0, -40); K.chip('CHECK THIS', 0, 50, { col: C.lime, fg: C.ink }); }, 'CHIPS', 100);
cell(b.x + 500, b.y + 240, 0.5, () => { K.button(-180, -60, 300, 100, 'Verify', {}); K.cursor(40, -10, 1); }, 'BUTTON', 100);
cell(b.x + 290, b.y + 372, 0.5, () => K.urlPill(-420, 0, 840, 'security@y0urbank-help.net', { size: 40, icon: false, hl: [9, 26], k: 1, bad: true }), 'URL / ADDRESS PILL', 44);

// 4 · the card + checklist
b = panel(20, 610, 760, 456, 4, 'CARD + CHECKLIST');
ctx.fillStyle = C.paper; ctx.fillRect(b.x, b.y, b.w, b.h - 10);
cell(b.x + 250, b.y + 190, 0.42, () => K.card(5, 0, (w) => { K.cardHead(w, 'Link check'); text('BUTTON SAYS', 50, 160, 26, C.inkSoft, { font: 'FreeMono', weight: 700 }); K.urlPill(40, 232, w - 80, 'yourbank.com', { size: 40, hl: [0, 12], k: 1 });
  text('LINK GOES TO', 50, 350, 26, C.inkSoft, { font: 'FreeMono', weight: 700 }); K.urlPill(40, 422, w - 80, 'yourbank.verify-id.co/login', { size: 40, hl: [9, 21], k: 1, bad: true }); K.bad(w - 95, 422, 0.75, 1); }, { box: { x: -460, y: -300, w: 920, h: 600 } }), null);
cell(b.x + 620, b.y + 190, 0.62, () => K.sticky([{ txt: 'Sender', at: 0, done: 1 }, { txt: 'Links', at: 1, done: 2 }, { txt: 'Pressure', at: 2, done: 99 }, { txt: 'Passwords', at: 99, done: 99 }], 5, 0, { box: { x: -162, y: -143, w: 324, h: 286 } }), null);
small('WHITE CARD · INK OUTLINE · HARD SHADOW · POPS WITH A BOUNCE', b.x + b.w / 2, b.y + b.h - 26, 'center', 14, '#5A5560');

// 5 · captions
b = panel(790, 610, 520, 456, 5, 'CAPTIONS');
ctx.fillStyle = C.paper; ctx.fillRect(b.x, b.y, b.w, b.h - 10);
[[[{ txt: 'real' }, { txt: 'sender', hi: 1 }, { txt: 'address,' }], 60], [[{ txt: 'That' }, { txt: 'panic', hi: 1 }], 160], [[{ txt: 'is' }, { txt: 'running' }, { txt: 'a' }, { txt: 'scam', hi: 1 }], 260]]
  .forEach(([w, y]) => cell(b.x + 24, b.y + y, 0.5, () => drawHeadline(w.map((x) => ({ ...x, s: 0 })), 5, { x: 0, y: 0, maxW: 1800 }), null));
small('TOP LEFT · WORD BY WORD · ONE VIOLET WORD', b.x + b.w / 2, b.y + b.h - 26, 'center', 14, '#5A5560');

// 6 · rules
b = panel(1320, 610, 580, 456, 6, 'RULES');
rules(b, ['THE MASCOT IS YOU: DRAWN IN CODE.', 'NEW POSE ON EVERY LINE.', 'NEVER SHOW A WORD BEFORE IT\'S SAID.', 'STEP = TILE SLAMS, FLIES TO BADGE.', 'EVERY HIT: SHAKE + A SOUND.', 'MUSIC ~20 DB UNDER THE VOICE.', 'MASTER AT -14 LUFS.'], b.y + 26, 17, 52);
window.SHEET_READY = true;
