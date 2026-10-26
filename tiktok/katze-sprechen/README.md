# Was wäre, wenn deine Katze sprechen könnte? (3D)

TikTok clip for @waswenn.exe1, 1080x1920, ~54 s.

- `assets/world.js` — the Three.js world (house, Kevin, Lisa, the cat) and every camera shot.
  Each frame is drawn from the seek time only.
- `build.py` — reads `voice/lines.json` + `voice/L*.wav`, places the lines, mixes `assets/vo.mp3`,
  and writes `assets/timing.js`, `index.html` and the caption / counter / card compositions.
- Voices: Piper (`de-thorsten-low` narrator, `de-kerstin-low` pitched up for the cat).
  Swap in better recordings by replacing `voice/L*.wav` (same ids) and re-running `python3 build.py`.

Render: `npx hyperframes render -o out.mp4`
