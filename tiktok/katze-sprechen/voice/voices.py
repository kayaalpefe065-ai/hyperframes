"""Synthesize German lines: narrator (Piper thorsten-high / thorsten_emotional) or cat (CSS10 VITS via sherpa-onnx)."""
import subprocess, sys, pathlib, numpy as np, wave
M = pathlib.Path(sys.argv[1])
def piper(text, out, model, length=0.95, speaker=None):
    cmd = ["python3", "-m", "piper", "-m", str(model), "-f", out, "--length_scale", str(length), "--noise_scale", "0.7", "--noise_w", "0.85"]
    if speaker is not None: cmd += ["--speaker", str(speaker)]
    subprocess.run(cmd, input=text.encode(), check=True, capture_output=True)
_tts = None
def css10(text, out, speed=1.0):
    global _tts
    import sherpa_onnx as so
    if _tts is None:
        d = M / "vits-coqui-de-css10"
        _tts = so.OfflineTts(so.OfflineTtsConfig(model=so.OfflineTtsModelConfig(vits=so.OfflineTtsVitsModelConfig(model=str(d / "model.onnx"), tokens=str(d / "tokens.txt")), num_threads=4)))
    a = _tts.generate(text, sid=0, speed=speed)
    s = (np.clip(np.array(a.samples), -1, 1) * 32767).astype("<i2")
    w = wave.open(out, "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(a.sample_rate); w.writeframes(s.tobytes()); w.close()
NARR_HIGH = M / "vits-piper-de_DE-thorsten-high/de_DE-thorsten-high.onnx"
NARR_EMO = M / "vits-piper-de_DE-thorsten_emotional-medium/de_DE-thorsten_emotional-medium.onnx"
