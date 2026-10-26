# Der Socken-Dieb (3D)

TikTok clip for @waswenn.exe1, 1080x1920, ~65 s, narrator only.

- `voice/lines.tsv` — the script (one line per narration beat). `python3 voice/make_voices.py <models-dir>`
  regenerates `voice/L*.wav` with Piper `de_DE-thorsten-high`.
- `assets/world.js` — Three.js world (Kevin's flat, the sock shop, the storage room) and every camera shot.
- `build.py` — places the lines, mixes `assets/vo.mp3`, writes timing, captions, counters, day cards and index.html.

Render: `npx hyperframes render -o out.mp4`
