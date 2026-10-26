# Kai vs. Scrubby (English, 3D)

Original characters for @waswenn.exe1: Kai (an over-motivated fighter) and Scrubby (a kitchen sponge). ~54 s.

- `voice/lines.tsv` — dialogue; `who` is `n` narrator, `k` Kai, `s` Scrubby.
  `python3 voice/make_voices.py <models-dir>` uses Kokoro v1.0 (am_michael / am_onyx / am_puck pitched up)
  and adds missing words to the lexicon via Piper's espeak-ng.
- `assets/world.js` — kitchen set, both characters, aura / explosion / water effects and all camera shots.
- `build.py` — timing, mix, captions (one colour per speaker), counters, speed-line bursts, end card.

Render: `npx hyperframes render -o out.mp4`
