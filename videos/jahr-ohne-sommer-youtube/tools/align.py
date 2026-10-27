"""Align SCRIPT.md words to whisper word timings (tools/words/NN.json) -> tools/aligned.json.

Each scene gets [{"text": script word, "start": s, "end": e}] in seconds from the start of its take.
Whisper writes numbers as digits ("1816") where the script spells them out, so tokens are compared
after normalising both sides; unmatched script words get times interpolated from their neighbours.
"""
import difflib, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NUM = {
    "achtzehnhundertsechzehn": "1816", "achtzehnhundertfünfzehn": "1815", "achtzehnhundertsiebzehn": "1817",
    "neunzehnhunderteinundneunzig": "1991", "zehntausend": "10000", "elftausend": "11000", "viertausend": "4000",
    "tausend": "1000", "sechzig": "60", "vierzig": "40", "hundert": "100", "fünften": "5", "zehnten": "10",
}
def norm(w):
    w = w.lower().strip(".,:;!?…–-\"„“'")
    w = NUM.get(w, w)
    return re.sub(r"[^0-9a-zäöüß]", "", w)

def scene_rows():
    script = open(os.path.join(ROOT, "SCRIPT.md"), encoding="utf-8").read().split("## Bilder")[0]
    return re.findall(r"^\|\s*(\d{2})\s*\|\s*(.+?)\s*\|$", script, re.M)

def align(text, words):
    sw = [w for w in text.replace("…", " ").split() if norm(w)]
    ww = [w for w in words if norm(w["text"])]
    a, b = [norm(w) for w in sw], [norm(w["text"]) for w in ww]
    out = [None] * len(sw)
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if tag == "equal" or (tag == "replace" and i2 - i1 == j2 - j1):
            for k in range(i2 - i1):
                out[i1 + k] = (ww[j1 + k]["start"], ww[j1 + k]["end"])
        elif tag == "replace":  # n script words <-> m whisper words: spread the span evenly
            s, e = ww[j1]["start"], ww[j2 - 1]["end"]
            for k in range(i2 - i1):
                out[i1 + k] = (s + (e - s) * k / (i2 - i1), s + (e - s) * (k + 1) / (i2 - i1))
    for i in range(len(out)):  # interpolate leftovers
        if out[i] is None:
            prev = next((out[j][1] for j in range(i - 1, -1, -1) if out[j]), 0.0)
            nxt = next((out[j][0] for j in range(i + 1, len(out)) if out[j]), prev + 0.4)
            out[i] = (prev, max(prev + 0.05, nxt))
    return [{"text": w, "start": round(s, 3), "end": round(e, 3)} for w, (s, e) in zip(sw, out)]

if __name__ == "__main__":
    res = {}
    for sid, text in scene_rows():
        d = json.load(open(os.path.join(ROOT, "tools", "words", f"{sid}.json")))
        words = d if isinstance(d, list) else d["words"]
        res[sid] = align(text, words)
        heard = " ".join(w["text"] for w in words)
        ratio = difflib.SequenceMatcher(None, [norm(w) for w in text.split()], [norm(w["text"]) for w in words]).ratio()
        if ratio < 0.85:
            print(f"CHECK {sid} ({ratio:.2f}): {heard}")
    json.dump(res, open(os.path.join(ROOT, "tools", "aligned.json"), "w"), ensure_ascii=False, indent=0)
    print("aligned", len(res))
