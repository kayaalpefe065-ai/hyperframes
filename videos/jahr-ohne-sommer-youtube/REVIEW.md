# Review – 1816: Das Jahr ohne Sommer (YouTube-Fassung)

## Aufbau

- Storyline A „Die Kette“: Einstieg + 6 Kapitel, 51 Sprecherszenen + 6 Kapitelkarten, 6:30 min, 1920×1080, 30 fps.
- Alles wird aus `tools/` generiert: `voice.py` (ElevenLabs „Will“), `transcribe.sh` + `align.py` (Wort-Timings),
  `music.py` (3 ElevenLabs-Music-Cues), `images.py` (Wikimedia Commons, mit `assets/img/credits.json`),
  `scenes_a–d.py` + `kit.py` (Szenen), `build.py` (index.html, Untertitel, `captions.srt`, Kapitelmarken),
  `thumbnail.py` (Thumbnail), `youtube.py` (YOUTUBE.md). Änderungen in den Python-Dateien machen, dann `python3 -I tools/build.py`.

## Kreative Entscheidungen

- Look aus einem Medium: Papier, Tusche-Strichmännchen, die Linien werden gezeichnet und „kochen“ (Line-Boil 12 fps);
  echte Bilder werden als mit Klebeband aufgeklebte Fotos eingebunden.
- Jedes Bild-Element erscheint auf dem Wort, das es nennt (Wort-Timings aus Whisper, auf den Skripttext ausgerichtet).
- Musik: neugierig/bedrohlich (Einstieg–Teil 2), traurig (Teil 3–4), hoffnungsvoll (Teil 5–6), Crossfades an den Kapitelkarten.
- Nicht gebaut: Storyline B (Bauern-Tagebuch) und C (Weltreise des Schleiers), siehe STORYLINES.md.

## Geprüft

- `hyperframes check`: siehe unten. Snapshots jeder Szene bei ~80 % ihrer Laufzeit angesehen; Layoutfehler korrigiert.
- Ton wurde gemessen, nicht gehört.

## Schwächste Stellen

- Einige Kartenszenen (s36 Auswanderungsrouten) sind Skizzen ohne echte Küstenlinien.
- Das Pferd in s42 ist sehr einfach gezeichnet.
- Die Kamera nutzt oft ein leichtes Heranzoomen; mit mehr Zeit: mehr Übergänge durch Objekte.
