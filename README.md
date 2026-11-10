# Faceless Shorts: a free Claude skill

By [NestedBit](https://nestedbit.com) · [@nestedbit.ai](https://www.instagram.com/nestedbit.ai/) on Instagram

Narrated faceless shorts (YouTube Shorts, TikTok, Reels) made 100% in code on your own computer: script, AI voice,
word-synced captions, animation, sound effects and music, rendered to MP4. No AI video, no API keys, no extra credits: the only cost is the Claude plan you already have.

**Styles** (each has a style sheet, a style guide and a finished example video project)
1. **Deep Dive 3D** (flagship): Zack D. Films-like 3D "What happens if…?" explainers. Example: *What happens if you hold your breath?*
2. **Night File 3D**: unsolved mysteries and true crime in dark 3D rooms. Example: *The man who jumped out of a plane* (D.B. Cooper).
3. **Inside Out**: flat 2D x-ray explainers. Example: *What if you swallow gum?*
4. **Stick Story**: stick-figure survival steps. Example: *What if the power went out for 3 days?*
5. **Paper Atlas**: history in cut paper and maps. Example: *How one bakery burned down London*.
6. **Tall Tale 3D**: funny true stories, flat 2D cartoon people in a sunny 3D world. Example: *The girl who was mailed to grandma*.
7. **Mascot Explainer**: you as a flat cartoon mascot (drawn in code from one photo, lip-synced) presenting numbered steps. Example: *How to spot a fake email*.

**How it works**
script.json → Kokoro voice (local, free) → Whisper word timings (local, free) → shots drawn in code, each cut and caption
placed on its word → procedural sound + music → headless Chrome captures every frame → ffmpeg renders the MP4.
Claude checks a contact sheet of the whole video before you ever see it.
Optional: when you ask, Claude uploads the finished short to your YouTube channel through Zapier (it confirms title, visibility and category first).

**Needs:** a paid Claude plan with Claude Code (or Claude with a linked computer), Node.js 22+, ffmpeg, Google Chrome, Python 3.10+, ~1 GB for the
voice and Whisper models. Claude installs what's missing.

**Windows:** run the scripts in Git Bash (installed with Git for Windows; Claude Code uses it already).

**Install:**

```bash
git clone https://github.com/nestedbit/faceless-shorts ~/.claude/skills/faceless-shorts
```

No git? Click **Code → Download ZIP** above and unzip it to `~/.claude/skills/faceless-shorts/`.
Then ask Claude Code to run `bash scripts/setup.sh` (prints "All set") and `bash scripts/selftest.sh`
(prints "SELFTEST PASSED"). Start a new session and ask:
"Make a Deep Dive 3D short: what happens if you crack your knuckles?"

**Layout:** `SKILL.md` (what Claude follows) · `scripts/` (setup, selftest, new_video, voice, words, estimate) ·
`styles/<style>/` (`style-sheet.png`, `STYLE.md`, `example/` = a complete project that renders as-is).

**Licenses:** the code, stories, drawings and sound are original, MIT licensed ([LICENSE](LICENSE)) and free to use in your videos.
Bundled fonts keep their own licenses ([LICENSES/](LICENSES)): Inter and Caladea, SIL Open Font License 1.1; FreeMono
(GNU FreeFont), GPL-3.0 with the font exception, so using it in a video doesn't make the video GPL. three.js (3D styles): MIT. Installed on first use: Kokoro-82M (Apache-2.0) via kokoro-onnx (MIT), faster-whisper + Whisper small.en (MIT),
numpy, scipy.
