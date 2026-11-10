---
name: faceless-shorts
description: Make Mascot Explainer reels / YouTube Shorts / TikToks fully in code on the user's computer - the creator as a flat cartoon mascot drawn in code from one photo (rigged, lip-synced to the voice) presenting numbered how-to steps on cards, with number tiles that slam into a corner badge, a live checklist, word-by-word headline captions and a sound on every hit. Free local AI voice and word timing, no extra cost beyond the Claude plan. Use whenever someone wants a mascot / cartoon-me / avatar explainer reel, a how-to or "N quick tips" reel, a faceless explainer short with their own cartoon host, even from just a topic. Can also upload the finished short to the user's YouTube channel through Zapier when they ask.
---

# Faceless Shorts

You make a finished vertical short from a topic: script, voice, word-synced captions, animated shots, sound and
music, rendered to MP4. **Everything is code**: canvas drawing, headless Chrome capture, ffmpeg, a local Kokoro voice,
local Whisper word timing, numpy sound. No AI images or video, no API keys, no extra credits.
`SKILL` = the folder this file is in. Projects live in `~/faceless-shorts/<short-name>/`.

One style: **Mascot Explainer** (`mascot-explainer`). YOU as a flat cartoon mascot (drawn in code from one photo,
rigged, lip-synced) presenting "N quick steps": one card at a time, number tiles that slam into a corner badge, a live
checklist, word-by-word headline captions, camera shake + a sound on every hit. 30-45 s · 9:16. Best for how-to, tips,
"N steps to…", tech / money / productivity explainers where the creator is the brand.

The style = `styles/mascot-explainer/style-sheet.png` (the look in one image, drawn by its own code) + `STYLE.md` (the
rules + the engine manual) + `example/` (a complete project that renders as-is). **Read STYLE.md in full before planning.**

## 0. First use on a computer
`bash SKILL/scripts/setup.sh` until it prints **All set** (checks Node 22+, ffmpeg, Chrome; builds `~/.faceless-shorts/venv`;
downloads the Kokoro voice ~340 MB and Whisper small.en ~0.5 GB). Install anything missing the free, official way, and ask
before anything that needs a password. Then `bash SKILL/scripts/selftest.sh` must print **SELFTEST PASSED**: open the
contact sheet and clip it names and look at them.

## 1. Intake (ONE message, defaults filled in)
Ask only what's unknown, all at once: topic (or "you pick 3 ideas"), a link to a short whose format they like (optional),
length (default ~30 s), voice (`SKILL/scripts/py SKILL/scripts/voice.py --list`; default `am_michael`), voiceover mode:
**AI voice** (default) · **their own recording** (they record after seeing the script; `words.py --audio`) ·
**captions-only** (no voice yet; `estimate.py`), music (built-in bed · none · their own royalty-free file), end line / handle, and one clear
front-facing photo of them (optional) and an outfit, or the name of a mascot saved in `~/faceless-shorts/_mascots/`.
"Just go" = the defaults.

## 2. The plan (ONE screen, then wait)
Show: title · the full narration, one line per cut, with its caption chunks (`1. Look at the | real *sender address`) · the shot list,
one line each (what we see, what moves, which word it lands on) · new components you'll add to the kit, if any · facts and
their sources. Ask **"Build it?"** and wait.

**Script rules.** Write it the way a person actually talks to a friend: full, flowing sentences with connecting words
("Well,", "where", "but", "so", "which means"), not a list of short caption-like statements. ~90-110 words for 35 s.
**A line is a CUT, not a sentence**: split each sentence into 1-3 lines at natural pauses (commas, "and", "where"), so
the picture changes every 1.5-3.5 s while the voice keeps flowing (voice.py speaks each whole sentence in one pass).
Shape: a hook with a real, sourced number, a one-line promise, 3-6 steps that start "One, …", one clear ending action.
Write numbers as they're said ("seven"). Read it out loud in your head: if it sounds like captions, rewrite it.
Original writing only: take a format you like, never another creator's script or shots. Every fact is checked against a
reliable source (list them in `script.json` "sources"). 

## 3. Build
1. `bash SKILL/scripts/new_video.sh mascot-explainer <short-name>` copies the example into `~/faceless-shorts/<short-name>/`.
2. Write `script.json` (lines + caps + gaps; see STYLE.md). Make the mascot first (`mascot.json`,
   STYLE.md §2), render its pose sheet and get the user's OK on it before writing any shots.
3. Timing: `SKILL/scripts/py SKILL/scripts/voice.py <proj>` then `SKILL/scripts/py SKILL/scripts/words.py <proj>`
   (own recording: `words.py <proj> --audio their.m4a`; captions-only: `estimate.py <proj>`).
4. Rewrite `src/shots.js`: one shot per line (or two for long lines), each placed with `cut(i)` and its key moments on
   words with `Wd('word', line)`. Reuse the kit (`src/core/kit.js`); add new components there, in the style's look.
5. In the project: `node tools/capture.mjs check` (must say CHECK OK) → `node tools/capture.mjs cues` →
   `SKILL/scripts/py tools/mix.py .` → QA (section 4) → `node tools/capture.mjs video renders/<name>.mp4`.
   Iterating on one shot: `node tools/capture.mjs frames review/f "4.2,4.6"` and look.

## 4. QA: never show a frame you haven't looked at
`node tools/capture.mjs sheet review/all.jpg 0.5 10` (a frame every 0.5 s, time-stamped) and read the whole sheet, then key
frames full size. For every frame ask:
- **Does it make sense?** One card at a time; the mascot's pose fits the line; props move with whatever holds them.
  Nothing appears before its cause.
- **Does it match the narration at that moment?** The picture changes just before its line; reveals land on their word.
- **Is anything colliding?** Arms, stamps and bursts never cross the headline, the card, the badge, the checklist or each other by accident.
- **Captions:** 1-4 words, at most one violet accent word, spelled right, never shown before the word is said.
- **Style sheet:** only the palette, flat shapes, hard ink shadows, red only for danger.
- **Sound:** voice clear over the music; effects soft (no harsh ticks or beeps).
Fix, re-render the sheet, re-check. Tell the user what you caught and fixed.

## 5. Deliver
Open the MP4 for the user. Also give: a share copy if > 35 MB (`ffmpeg -i in.mp4 -c:v libx264 -crf 21 -preset slow -c:a aac
-b:a 160k -movflags +faststart share.mp4`), the best cover frame (`capture.mjs frames`), a title, a caption and 5-8 hashtags.
For own-recording mode, also give them the script with each line's timing to read against. Offer one round of precise changes
and re-render only what changed.

## 5b. Publish to YouTube via Zapier (only when the user asks to upload)
All calls are Code Mode tools: run them inside `execute` as `tools.zapier.*` (do not call them as normal tools). Validated once in a real upload; the values below are exact.

1. **Connect.** If `list_zapier_skills` has a saved skill for uploading, use it. Otherwise make sure the YouTube app is enabled:
   `discover_zapier_actions({ app: "YouTube" })` → `enable_zapier_action({ selected_api: "YouTubeV4CLIAPI", app_display_name: "YouTube", action: "upload_video" })`.
   If no connection exists yet, `manage_zapier_connections({ selected_api: "YouTubeV4CLIAPI" })` returns a connect URL for the user.
2. **Host the file.** The action's `video` / `thumbnail` params need a URL Zapier's servers can fetch; a local path is silently wrong.
   Put the MP4 on a temp host, in this order (all tested 2026-11-03; on Windows use `curl.exe`):
   - a. **litterbox** (1 h to 72 h expiry, up to 1 GB): `curl -F "reqtype=fileupload" -F "time=1h" -F "fileToUpload=@renders/<name>.mp4" https://litterbox.catbox.moe/resources/internals/api.php` → returns the direct URL as plain text.
   - b. **uguu.se** (about 3 h expiry, good for shorts under 35 MB): `curl -F "files[]=@renders/<name>.mp4" https://uguu.se/upload` → returns JSON; use `files[0].url` (the `d.uguu.se/...` link).
   - c. **catbox** (permanent, no expiry): same call as (a) without `-F "time=1h"`. Public forever, so only with the user's OK.
   - Skip these (verified broken 2026-11-03, don't waste retries): 0x0.st (uploads disabled), tmpfiles.org (link is a viewer page, not the raw file), gofile.io (raw download needs an account token), file.io (curl API redirects to its web app), bashupload.com, temp.sh (dead).
   - **Always verify** the URL before using it: `curl -sSI <url>` must return 200/206 with a video content-type. Never trust a host's JSON without checking.
   - Tell the user this puts their video on a public temp host that expires by itself.
3. **Confirm first.** This writes to the user's real channel, so confirm before executing: title, visibility (private / unlisted / public) and category.
   Resolve `category_id` with `inspect_zapier_actions({ tool_name: "youtube_upload_video", enum_property: "category_id" })` if needed.
   Education = 27 (default for how-to reels), Comedy = 23, Howto & Style = 26.
4. **Upload.**
   `execute_zapier_write_action({ selected_api: "YouTubeV4CLIAPI", action: "upload_video", tool_name: "youtube_upload_video", params: { video: "<temp URL>", title, description (end it with #shorts), tags: [5-8 hashtags without #], category_id: "27", privacy_status, made_for_kids: false, embeddable: true, notify_subscribers: true, default_language: "en", license: "youtube" } })`
5. **Report.** The result contains `id`; the link is `https://www.youtube.com/watch?v=<id>`. A vertical video of 60 s or less becomes a Short automatically (no extra field).
   Open the local file for the user (`tools.browser.preview({ path: "renders/<name>.mp4" })`) and give the YouTube URL in text. The in-app browser often fails to load youtube.com with ERR_ABORTED; that is not a failed upload.
6. **Thumbnails.** Unlisted uploads don't take a custom thumbnail through this action; offer the saved cover frame if the user later makes the video public.

## Never
Generate images or video with AI; spend the user's money or credits; upload to YouTube or any host without the user asking and confirming; copy another creator's script, shots or frames;
overwrite a user's project without asking; ship a frame you haven't looked at.
