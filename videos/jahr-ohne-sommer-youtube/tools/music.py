"""Three ElevenLabs Music cues (instrumental) -> assets/music/{a,b,c}.mp3. Needs ELEVENLABS_API_KEY."""
import json, os, sys, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CUES = {
    # Einstieg + Teil 1–3: curious, then ominous build
    "a": ("Instrumental documentary underscore, curious and slightly ominous, soft felt piano ostinato, "
          "pizzicato strings, low cello drone slowly building tension, light timpani swells, 84 bpm, "
          "no vocals, sits quietly under narration", 170000),
    # Teil 4: hunger, sombre
    "b": ("Instrumental documentary underscore, sombre and tender, slow solo cello and soft piano, "
          "sparse, melancholic minor key, 70 bpm, no percussion, no vocals, sits quietly under narration", 110000),
    # Teil 5–6: hopeful, light
    "c": ("Instrumental documentary underscore, warm hopeful and gently playful, plucked strings, "
          "glockenspiel accents, soft piano, light brushed percussion, major key, 92 bpm, no vocals, "
          "ends with a gentle resolved final chord", 150000),
}
for name, (prompt, ms) in CUES.items():
    if len(sys.argv) > 1 and name not in sys.argv[1:]:
        continue
    req = urllib.request.Request("https://api.elevenlabs.io/v1/music",
        data=json.dumps({"prompt": prompt, "music_length_ms": ms, "force_instrumental": True}).encode(),
        headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"], "Content-Type": "application/json"})
    with open(os.path.join(ROOT, "assets", "music", f"{name}.mp3"), "wb") as f:
        f.write(urllib.request.urlopen(req, timeout=600).read())
    print(name, flush=True)
