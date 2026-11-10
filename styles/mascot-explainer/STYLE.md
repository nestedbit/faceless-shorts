# Mascot Explainer: you, as a cartoon, explaining "N quick steps", 9:16

Punchy, friendly, a bit techy. A flat cartoon **mascot of the creator** (drawn in code from one photo, rigged like a
puppet) stands bottom right and presents one white card at a time. The headline at the top IS the caption, revealed
word by word as it's spoken. Every step gets a big number tile that slams in, then flies to a corner badge, and a sticky
checklist bottom left ticks it off. Every hit shakes the camera and makes a sound. Faceless in the sense that it never
needs your real face on camera, but it is still *you*.
Example: `example/` = **HOW TO SPOT A FAKE EMAIL** (38 s, 11 shots, 4 checks). Sheet: `style-sheet.png`.

## 1. The look (rules from the sheet: do not break them)
- **Palette:** paper `#EEF1F6` with a faint blue grid · ink `#15172A` · violet `#5B3DF5` (the ONE accent: key words,
  tiles, badge) · lime `#C8F53A` (marker swipes, checks, highlights) · red `#F23F43` (danger only: fake, scam, X,
  stamps) · white cards · sticky note `#EAFBAA`. Derived shades live in `lib.js` `C`.
- **Hard shadows only.** Cards, tiles, badges, buttons and chips sit on a solid ink shadow offset down-right. No blur,
  no gradients, no glow. (Blur on shadowed cards makes ugly boxes; don't.)
- **Type:** Inter Black for headlines, tiles and stamps · Inter ExtraBold for UI text · FreeMono Bold for small labels,
  URLs and addresses. Headline: sentence case, ink, the accent word violet on a lime marker swipe.
- **Layout (fixed, inside Instagram / TikTok safe zones):** mono label top left (y 232) · headline under it (y 270-470,
  max 2 lines, x 70-860) · step badge top right · ONE card in the middle (x 80-1000, y 545-1145) · sticky checklist
  bottom left · mascot bottom right, head around y 1200-1480. Nothing important right of x 1000 or below y 1500 (the
  app's buttons and caption cover it).
- **Real proof in the cards:** show the actual thing (an inbox, a URL, a settings field, a chart, a terminal, a number
  from a named report), drawn in code. Never a stock-photo vibe, never an AI image.

## 2. The mascot (`mascot.json` + `src/core/mascot.js`)
One file = one person, reused in every video. Make it ONCE per creator:
1. Ask for one clear, front-facing photo (optional; without one, use the default mascot or describe the person).
2. Look at the photo and fill `mascot.json`: `skin`, `skinShade` (a darker tone of the skin), `hair` (`short` · `curly`
   · `buzz` · `long` · `bun` · `afro` · `sidepart` · `swoop` (thick side-swept fringe) · `bald`), `hairCol`, `beard`
   (`none` · `stubble` · `full` · `goatee` · `mustache` · `circle` (drooping mustache + chin beard + jaw stubble)), `beardCol`, `glasses` (`none` · `round` · `square`), `outfit` (`tee` · `polo` · `hoodie` · `shirt`),
   `outfitCol`, `outfitShade`, `trim` (drawstrings / shirt collar), `browCol`, `blush`, `name`, and the likeness dials
   `eyes` (`round` big cartoon whites · `almond` smaller, wider, coloured iris, lid line), `irisCol`, `eyeH` (0.8-1.5, how open the
   almond eyes are), `squint` (0-1, how much happy / serious moods close the eyes; keep it low with `lidTop`, or the
   eyes look half-shut while talking), `eyeSize` (0.8-1.1), `nose` (1-1.4, overall size), `noseW` (1-1.8, width only), `lidTop` (0-0.4, heavier upper lids = calmer look), `watch` (a colour, on the
   screen-right wrist), `faceW` (1-1.12, wider face), `faceL` (0-30 px, longer lower face), `jaw` (-1 V-shaped … 0 tapered … 1
   round, full jaw; the beard, mouth and nose follow the chin), `hairVol` (1-1.15,
   taller + wider `swoop`), `messy` (layered fringe with more locks), `beardJaw` (0-1, `circle` beard running up the jaw),
   `browW` (brow thickness, default 15), `browArch` (0-1), `stacheW` (1-1.3, wider
   mustache), `stubble` (0-0.3, how much cheek stubble darkens the lower face), `hairSides` (0-1, `swoop` hair over the
   ears), `lips` (true = visible lips on closed mouths), `lipCol`, `chinBeard` (0.7-1.2), `beardSplit` (0 mustache joined to the
   chin beard · 1 small gap · 2 wider gap), `earSize`
   (0.7-1.2), `neck` (1-1.4, thicker), `neckL` (0-20 px, shorter neck), `bodyW` (0.75-1.1, slimmer or
   broader torso, shoulders and arms). `faceShade` / `noseShade` (false = no side
   shadow on the cheek / a softer nose). Black hair or a black tee: lift the black a little (`#29232D`, `#26272F`) so ink strands and
   outlines still read.
   Something the options can't show (a fade, a headscarf, earrings, a cap)? Add it to `mascot.js` in the same look:
   flat fill, one darker shade, ink outline 6-8 px.
3. Render the approval sheet and SHOW it to the user before any shots:
   `QS='&poses=1' node tools/capture.mjs frames review/poses 0` → `review/poses/t0.00.jpg` (10 poses, 8 moods,
   talking mouths, hands), and the big close-up for likeness: `QS='&poses=1&portrait=1' node tools/capture.mjs frames
   review/portrait 0`. Compare the close-up with the photo side by side: hair shape and fringe direction, facial hair,
   eye size and lids, nose, skin tone.
   **When the user says "still off" without saying what, don't guess one change at a time:** write `variants.json`
   (`[{ "label": "B · rounder face", "patch": { "faceW": 1.08, "jaw": 0.85 } }, …]`, first entry `{}` = now), render
   `QS='&poses=1&variants=1' node tools/capture.mjs frames review/variants 0`, put it beside their photo, and let them pick letters. Outfit choices: add `&body=1` (zooms out to the torso). Eye checks: `&faces=1` (neutral + happy, both talking). Take notes in plain words ("lighter skin", "fuller beard", "brown polo") and re-render until
   they say it's them. It usually takes 2-3 rounds.
4. Save the approved file for next time: `mkdir -p ~/faceless-shorts/_mascots && cp mascot.json ~/faceless-shorts/_mascots/<name>.json`.
   New video: `new_video.sh mascot-explainer <name>` then `cp ~/faceless-shorts/_mascots/<name>.json <proj>/mascot.json`
   (and any custom `mascot.js` additions).

**Acting API.** One timeline for the whole film (so the mascot never jumps on a cut):
```js
const host = M.act([[t, 'pose', { mood, look: [x, y], count, tilt, lean }], ...]);   // film times, usually Wd('word', line)
M.mascot(x, y, s, t, host);              // in every shot; K.LAY.mascot = [800, 1545, 0.92]
```
- **Poses:** `idle` `pointUp` `pointAt` (up-left, at the card) `present` (open palm at the card) `presentLeft` `shrug`
  `thumbsUp` `count` (`count: 1-5` fingers, use it on "One / Two / Three") `wave` `stop` (palm up: "never", "hold on").
  Arms blend over 0.3 s with a little overshoot. `L` / `R` = SCREEN-left / screen-right arm; the screen-left arm reaches
  toward the card. Arms are `[shoulder°, elbow°, hand]`: 0° hangs down, 90° out to its side, 180° up, negative = across
  the body. Add new poses to `POSES` and check them on the pose sheet.
- **Moods:** `neutral` `happy` `excited` `surprised` `skeptical` `serious` `worried` `wink` (brows, lids, idle mouth).
- **Lip-sync is automatic:** the mouth follows the loudness of `data/narration.wav` (rounder on "o/u/w" words), with
  blinks every ~3 s. Captions-only projects fall back to the word timings.
- New pose on EVERY line, chosen for what's being said: count on numbers, point at the card on the reveal, shrug or
  skeptical on the myth, stop on "never", thumbs up or wave on the ending.

## 3. Format
- **1080x1920, 30 fps, 30-45 s.** Lead 0.45 s, outro 1.0 s. Kokoro `am_michael` x1.05 (or `af_heart`, `am_puck`).
- **Shape:** hook with a real number or a claim they can see (count it up on a card) → promise ("here's how to X in N
  quick checks") → **3-6 numbered steps**, each "One, ..." with its own card → a short reason/twist per step if needed →
  the ending: one clear action ("Send this to the friend who…", or "Comment KEYWORD and I'll send you X" ONLY if the
  user really has that automation). ~100-115 words.
- **One line = one cut.** Step lines start with the spoken number ("Two, hover over…") and cut ON the tile slam
  (`cutStep`). Other lines cut 0.08 s before the line. Shots 1.5-4 s.
- **Write numbers as said** ("twenty twenty-four"), show them as digits in `caps` ("2024").

## 4. Captions = the headline
`{ "text": "One, look at the real sender address, not just the name,", "caps": "1. Look at the | real *sender address, | not just the *name" }`
- `|` = next chunk (1-4 words), `*` = the accent word (max one per chunk). Display words map onto the chunk's spoken
  words in order, so each word appears **exactly when it's said** (never before), pops up, and the accent word gets
  its marker swipe. The chunk stays until the next one.
- The first chunk of a step line starts with the digit ("1.", "2.", "And 4.") so it lands with the spoken number.

## 5. Engine map (`example/`)
| file | gives you |
|---|---|
| `script.json` | title, voice, speed, lead, outro, gap, music (`pulse` · `bed` · `none` · `audio/x.mp3`), `loudness` (-14), sources, lines |
| `mascot.json` | the creator's mascot look (section 2) |
| `src/shots.js` | **the per-video file**: beats, the mascot timeline, `hud()`, the shot list, cues and hits |
| `src/core/mascot.js` | the puppet: `setLook`, `act`, `mascot`, `draw`, `drawHead`, `drawHand`, `POSES`, `MOODS` |
| `src/core/kit.js` | the component zoo (below) + `LAY` (the fixed layout) |
| `src/core/captions.js` | headline captions (`CAP`, `drawHeadline(words, t)`) |
| `src/core/lipsync.js` | `talk(t)` mouth openness from the narration, `wordAt(t)` |
| `src/core/lib.js` | `W H FPS`, palette `C`, `FONT`, `clamp lerp seg eo eio eob rnd rad`, `rr inked text measure slab line` |
| `src/core/timing.js` | `L(i)`, `Le(i)`, `Wd(word, line)` (throws if the word isn't in that line), `T.dur` |
| `src/main.js` | boot, camera (small punch-in on cuts + slow push), **camera shake from `hit()`**, fades, `?poses=1` sheet |
| `src/posesheet.js` | the mascot approval sheet |
| `tools/capture.mjs` | `check` · `cues` · `sheet` · `frames` · `video [start end] [--draft]` · `preview` |
| `tools/mix.py` | voice + music (~20 dB under the voice, ducked) + effects → `data/mix.wav`, mastered to -14 LUFS / -1 dBFS peak |

## 6. The component zoo (`kit.js`, `import * as K`)
**Frame** `K.paper()` · `K.label(text)` · `K.sticky(items, t, inAt)` (items `{ txt, at, done }` in film time: current
item violet with an arrow, done items ticked and struck) · `K.badge(n, x, y, s, done)` · `K.LAY` positions.
**Steps** `K.stepTile(n, lt, slamAt)` (slams 2.3x → 1 at the centre, holds 0.55 s, flies to the badge in 0.35 s; draw
it LAST in the shot) · `K.tile(n, x, y, s, rot)`.
**Card** `K.card(lt, at, (w, h) => { … }, { box, rot })` pops in with a bounce; draw inside in card coords (0..920,
0..600), clipped · `K.cardHead(w, 'Title', { col, dot })` · `K.pop(lt, at, dur)` → 0..1 for your own reveals.
**Marks** `K.stamp(text, x, y, t, at, { size, color, rot })` (letters slam one by one, then the box; returns its end
time) · `K.good(x, y, s, k)` lime tick disc · `K.bad(x, y, s, k)` red X disc · `K.chip(text, x, y, { col, fg, k })` ·
`K.marker(x, y, w, h, k)` · `K.burst(x, y, r, k)` · `K.checkMark(x, y, s, k)`.
**UI** `K.urlPill(x, y, w, text, { hl: [from, to], k, bad, icon })` (addresses / URLs, part highlighted) ·
`K.button(x, y, w, h, text, { col, press })` · `K.cursor(x, y, s, press)` · `K.tooltip(x, y, text, { k })` ·
`K.field(x, y, w, label, value, { k, secret, active, t })` (typed) · `K.counter(x, y, value, size)` ·
`K.timer(x, y, r, frac, text)` · `K.avatar(x, y, r, initials, col)` · `K.bubble(x, y, w, h, text, { from, k })` ·
`K.lock(x, y, s)` · `K.hook(x, y, len, swing, bait)` · `K.plane(x, y, s, rot)`.
New topic = new card contents (a terminal, a chart, a phone screen…): add them to kit.js in the same look and check
them full size.

## 7. A shot
```js
const st = cutStep(4), cardAt = LAND[1] - st - 0.15, link = Wd('link', 4), click = Wd('click', 4);
add({ id: 'S05', at: st, cam: [540, 820], note: 'tile 2, cursor hovers the button, real URL on "link", X on "click"',
  draw(lt, d, t) {                                  // pure function of time
    K.paper(); hud(t);                              // grid, label, sticky, badge
    K.card(lt, cardAt, (w) => {
      K.cardHead(w, 'Your Bank');
      K.button(220, 290, 460, 110, 'Verify account');
      K.tooltip(460, 440, 'http://yourbank.verify-id.co/login', { k: K.pop(t, link, 0.25) });
      K.bad(740, 345, 0.8, K.pop(t, click, 0.3));
    });
    mascot(t); K.stepTile(2, lt, STEP[1] - st);     // the tile goes on top of everything
  } });
cue(st, 'whoosh'); lands(1); cue(link, 'pop'); hit(click, 0.7, 'slam');
```
`hit(t, power, sound)` = camera shake (power 0.4 small … 1 big) + a sound (default `hit`; pass `'slam'`, `'thud'`,
`'tick'` or `null`). `lands(n)` = riser → hit on the slam + `lock` when the tile reaches the badge.

**Sound cues** `cue(t, type, { gain, dur })`: `hit` (deep impact: tiles, big numbers) · `slam` (stamps, X) · `riser`
(dur, a build into a hit) · `lock` (badge lands) · `click` (UI) · `tick` (checklist) · `type` (dur, typing) · `pop`
(card / chip appears) · `whoosh` (every cut, quieter than hits) · `slide` (dur) · `zip` · `sparkle` (dur) · `thud` ·
`boing` · `alarm` (dur, low pulse for urgency) · `tock` · `plop`. Every move you see should have a sound you hear.

## 8. QA pitfalls (check these first)
- **A word on screen before it's said** → `caps` chunks must start on real spoken words; check the `capture.mjs check`
  caption list. Step chunks start with the digit, not the next word.
- **A stamp on a line's last word disappears before it can be read** → stamps need ~0.5 s fully visible: start them a
  word earlier ("what they want" → on "what"), or keep the letter step at 0.035 s.
- **Blank paper before a step** → step shots cut ON the tile slam (`cutStep`), not 0.08 s before the line.
- **Pointing arm crosses the sticky note** → `pointAt` / `present` clear it by ~30 px at `LAY.mascot`; if you move the
  mascot, re-check every pose in the sheet.
- **Mascot looks wrong on a pose** → fix the pose numbers on the pose sheet first, never inside a shot.
- **Whisper gives a word 0 s length** (e.g. "hover" 16.92-16.92) → harmless for reveals, but don't key a big hit on it;
  check it against the audio.
- **Music too loud** → it should be barely there: `-30 dB` + ducking in `mix.py`. Listen on a phone speaker: Claude can
  measure sound, not hear it, so ask the user to listen before you call it done.
