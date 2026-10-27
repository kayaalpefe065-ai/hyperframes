"""Regenerates the spoken meme effects (voice/X*.wav) from voice/lines.tsv.

Usage: python3 voice/make_voices.py <models-dir>
Model: kokoro-multi-lang-v1_0 (sherpa-onnx "tts-models" GitHub release).
n = narrator am_michael, k = Kai am_onyx, s = Scrubby am_puck pitched up 35 %.
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
# who -> (speaker id, speed, pitch factor)
VOICES = {"k": (17, 0.85, 0.82)}  # am_onyx, slower and deeper
# names Kokoro's US lexicon lacks
EXTRA_LEXICON = {"kevin": "k ˈ ɛ v ɪ n", "kevin's": "k ˈ ɛ v ɪ n z", "kai": "k ˈ a ɪ", "scrubby": "s k ɹ ˈ ʌ b i"}
lex = D / "lexicon-us-en.txt"
known = {line.split(" ", 1)[0] for line in lex.read_text().splitlines() if line}


def espeak_ipa(word):
    """IPA for words the lexicon lacks (plurals, past tense, shouts), via Piper's bundled espeak-ng."""
    import os

    import piper
    from piper.phonemize_espeak import EspeakPhonemizer

    ph = EspeakPhonemizer(os.path.join(os.path.dirname(piper.__file__), "espeak-ng-data"))
    tokens = {line.split(" ")[0] for line in (D / "tokens.txt").read_text().splitlines() if line}
    return " ".join(c for c in ph.phonemize("en-us", word)[0] if c in tokens and c != " ")


for row in (HERE / "lines.tsv").read_text().splitlines():
    for w in row.split("\t")[-1].split():
        w = w.strip(".,!?:;\"").lower()
        if w and w not in known and w not in EXTRA_LEXICON:
            EXTRA_LEXICON[w] = espeak_ipa(w)
with lex.open("a") as f:
    for word, ph in EXTRA_LEXICON.items():
        if word not in known:
            f.write(f"{word} {ph}\n")
            print("lexicon +", word, ph)
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
    sid, speed, pitch = VOICES[who]
    a = tts.generate(text, sid=sid, speed=speed)
    raw = HERE / f"raw_{lid}.wav"
    w = wave.open(str(raw), "wb")
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(a.sample_rate)
    w.writeframes((np.clip(np.array(a.samples), -1, 1) * 32767).astype("<i2").tobytes())
    w.close()
    dst = HERE / f"{lid}.wav"
    af = TRIM
    if pitch != 1.0:
        af += f",asetrate={a.sample_rate}*{pitch},aresample={a.sample_rate},atempo={1 / pitch:.4f}"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", af, str(dst)], check=True)
    raw.unlink()
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(dst)], capture_output=True, text=True).stdout)
    out[lid] = {"who": who, "text": text, "dur": round(d, 3)}
    print(lid, round(d, 2))
(HERE / "lines.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
