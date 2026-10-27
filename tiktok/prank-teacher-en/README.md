# POV: when you prank your teacher (blocky 3D, v2)

Meme format: fixed POV title, no narration, absurd escalation (teacher turns into a cow, banana phone,
a cop on a horse through the wall, rocket to the moon). ~28 s. Add a trending sound in TikTok.

- `assets/world.js` — classroom (posters, shelf, lockers, windows, halloween corner), courtroom, moon,
  avatars, slime/poof/brick/rocket effects and every shot (beats in `build.py`).
- `build.py` — beat times, overlay (title, banana phone call, stamp, speech bubble, end card), sound effects.
- Sounds: hyperframes SFX, LibreOffice gallery sounds (cow, horse, explosion, laser, falling, space, drama,
  gong, applause), `assets/vine-boom.mp3` (impact pitched down with echo), spoken "Bruh / Noooo / What?"
  from Kokoro (`voice/make_voices.py`).

Render: `npx hyperframes render -o out.mp4`
