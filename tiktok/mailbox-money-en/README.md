# Money in the Mailbox (English, blocky 3D)

Blocky plastic look (own characters, no Roblox assets), narrator only, ~70 s.

- `voice/lines.tsv` — script; `python3 voice/make_voices.py <models-dir>` (Kokoro v1.0, am_michael).
- `assets/world.js` — street, houses, mailbox, money, island, snow, blocky characters and every camera shot.
  `assets/RoundedBoxGeometry.js` is three.js' MIT example geometry with its import pointed at the local build.
- `build.py` — timing, mix, top captions in 2–3 word groups with keywords in caps, mailbox counter, cards, end card.

Render: `npx hyperframes render -o out.mp4`
