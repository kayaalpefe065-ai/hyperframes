"""Regenerates voice/L*.wav + voice/lines.json from voice/lines.tsv (English narrator).

Usage: python3 voice/make_voices.py <models-dir>
Model: kokoro-multi-lang-v1_0 (sherpa-onnx "tts-models" GitHub release), voice am_michael (sid 16), speed 1.1.
"""
import json
import pathlib
import subprocess
import sys
import wave

import numpy as np
import sherpa_onnx as so

HERE = pathlib.Path(__file__).parent
D = pathlib.Path(sys.argv[1]) / "kokoro-multi-lang-v1_0"
SID = 16  # am_michael
# names Kokoro's US lexicon lacks
EXTRA_LEXICON = {"kevin": "k ˈ ɛ v ɪ n", "kevin's": "k ˈ ɛ v ɪ n z"}
lex = D / "lexicon-us-en.txt"
known = {line.split(" ", 1)[0] for line in lex.read_text().splitlines() if line}
with lex.open("a") as f:
    for word, ph in EXTRA_LEXICON.items():
        if word not in known:
            f.write(f"{word} {ph}\n")
tts = so.OfflineTts(
    so.OfflineTtsConfig(
        model=so.OfflineTtsModelConfig(
            kokoro=so.OfflineTtsKokoroModelConfig(
                model=str(D / "model.onnx"),
                voices=str(D / "voices.bin"),
                tokens=str(D / "tokens.txt"),
                data_dir=str(D / "espeak-ng-data"),
                lexicon=str(D / "lexicon-us-en.txt"),
                dict_dir=str(D / "dict"),
            ),
            num_threads=4,
        )
    )
)
TRIM = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
out = {}
for row in (HERE / "lines.tsv").read_text().splitlines():
    if not row.strip():
        continue
    lid, who, text = row.split("\t")
    a = tts.generate(text, sid=SID, speed=1.1)
    raw = HERE / f"raw_{lid}.wav"
    w = wave.open(str(raw), "wb")
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(a.sample_rate)
    w.writeframes((np.clip(np.array(a.samples), -1, 1) * 32767).astype("<i2").tobytes())
    w.close()
    dst = HERE / f"{lid}.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", TRIM, str(dst)], check=True)
    raw.unlink()
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(dst)], capture_output=True, text=True).stdout)
    out[lid] = {"who": who, "text": text, "dur": round(d, 3)}
    print(lid, round(d, 2))
(HERE / "lines.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
