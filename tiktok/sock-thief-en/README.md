# The Sock Thief (English, 3D)

English version of `../socken-dieb`, 1080x1920, ~69 s, narrator only.

- `voice/lines.tsv` — the English script. `python3 voice/make_voices.py <models-dir>` regenerates
  `voice/L*.wav` with Kokoro v1.0 (sherpa-onnx), voice `am_michael`, speed 1.1.
- `assets/world.js`, `build.py` — same world and direction as the German version, English signs, counters and cards.

Render: `npx hyperframes render -o out.mp4`
