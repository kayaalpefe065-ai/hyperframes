"""Synthesise one ElevenLabs "Will" take per scene from SCRIPT.md into assets/voice/NN.mp3.

Usage: python3 -I tools/voice.py [scene ids...]   (needs ELEVENLABS_API_KEY)
"""
import json, os, re, subprocess, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICE = "bIHbv24MWmeRgasZH58o"  # ElevenLabs "Will"
script = open(os.path.join(ROOT, "SCRIPT.md"), encoding="utf-8").read().split("## Bilder")[0]
rows = re.findall(r"^\|\s*(\d{2})\s*\|\s*(.+?)\s*\|$", script, re.M)
texts = [t for _, t in rows]
only = set(sys.argv[1:])
for i, (sid, text) in enumerate(rows):
    if only and sid not in only:
        continue
    body = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "language_code": "de",
        "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.25, "speed": 1.06},
        "previous_text": " ".join(texts[max(0, i - 3):i]) or None,
        "next_text": " ".join(texts[i + 1:i + 3]) or None,
    }
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128",
        data=json.dumps(body).encode(),
        headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"], "Content-Type": "application/json"},
    )
    raw = os.path.join(ROOT, "assets", "voice", f"{sid}.raw.mp3")
    with open(raw, "wb") as f:
        f.write(urllib.request.urlopen(req, timeout=120).read())
    out = os.path.join(ROOT, "assets", "voice", f"{sid}.mp3")
    trim = "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", raw, "-af", trim, "-b:a", "128k", out], check=True)
    os.remove(raw)
    print(sid, flush=True)
