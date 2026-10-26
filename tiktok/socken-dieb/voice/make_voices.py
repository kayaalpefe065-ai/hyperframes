"""Regenerates voice/L*.wav + voice/lines.json from voice/lines.tsv.

Usage: python3 voice/make_voices.py <models-dir>
Models (sherpa-onnx "tts-models" GitHub release): vits-piper-de_DE-thorsten-high,
vits-piper-de_DE-thorsten_emotional-medium, vits-coqui-de-css10.
Narrator only: Piper thorsten-high (the cat voice path is kept for other videos).
"""
import json
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).parent
sys.argv = [sys.argv[0], sys.argv[1]]
exec((HERE / "voices.py").read_text())

TRIM = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
out = {}
for row in (HERE / "lines.tsv").read_text().splitlines():
    if not row.strip():
        continue
    lid, who, text = row.split("\t")
    raw = str(HERE / f"raw_{lid}.wav")
    if who == "n":
        piper(text, raw, NARR_HIGH, 0.95)  # noqa: F821
        af = TRIM
    else:
        css10(text, raw, 1.0)  # noqa: F821
        af = TRIM + ",asetrate=22050*1.12,aresample=22050,atempo=1/1.12*1.04"
    dst = HERE / f"{lid}.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", af, str(dst)], check=True)
    pathlib.Path(raw).unlink()
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(dst)], capture_output=True, text=True).stdout)
    out[lid] = {"who": who, "text": text, "dur": round(d, 3)}
    print(lid, who, round(d, 2))
(HERE / "lines.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
