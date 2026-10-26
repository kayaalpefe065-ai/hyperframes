"""Builds "Der Socken-Dieb" (3D, narrator only).

Inputs : voice/L*.wav + voice/lines.json (Piper lines, see README.md)
Outputs: assets/vo.mp3, assets/timing.js, index.html, compositions/*.html

Run: python3 build.py
"""

import json
import math
import pathlib
import struct
import subprocess
import wave

ROOT = pathlib.Path(__file__).parent
VOICE = ROOT / "voice"
W, H = 1080, 1920
HANDLE = "@waswenn.exe1"

LINES = json.loads((VOICE / "lines.json").read_text())
# silence before each line (room for actions, cuts and day cards)
PRE = {"L1": 0.3, "L2": 0.8, "L3": 0.7, "L4": 0.4, "L5": 0.8, "L6": 0.3, "L7": 0.3, "L8": 1.0,
       "L9": 0.6, "L10": 1.0, "L11": 1.2, "L12": 0.9, "L13": 0.5, "L14": 0.6, "L15": 0.6, "L16": 0.6}
TAIL = 3.4


def layout():
    t, out = 0.0, {}
    for lid, info in LINES.items():
        t += PRE[lid]
        out[lid] = {"s": round(t, 3), "e": round(t + info["dur"], 3)}
        t += info["dur"]
    return out, round(t + TAIL, 2)


TIMES, TOTAL = layout()
S = lambda i: TIMES[i]["s"]  # noqa: E731
E = lambda i: TIMES[i]["e"]  # noqa: E731
DAY = {
    "w1": S("L2") - 0.8,
    "m1": S("L3") - 0.7,
    "pol": S("L5") - 0.8,
    "d40": S("L8") - 1.0,
    "n3": S("L10") - 1.0,
    "morn": S("L11") - 1.2,
    "shop": S("L12") - 0.9,
}


# ------------------------------------------------------------------ audio
def mouth_env(path):
    w = wave.open(str(path))
    sr, n = w.getframerate(), w.getnframes()
    d = struct.unpack("<%dh" % n, w.readframes(n))
    step = sr // 30
    vals = []
    for i in range(0, n, step):
        c = d[i : i + step]
        r = math.sqrt(sum(x * x for x in c) / max(1, len(c))) / 32768
        vals.append(min(1.0, max(0.0, (r - 0.015) / 0.11)))
    sm = [round((vals[max(0, i - 1)] + 2 * v + vals[min(len(vals) - 1, i + 1)]) / 4, 2) for i, v in enumerate(vals)]
    return sm


def build_audio():
    ids = list(LINES)
    cmd = ["ffmpeg", "-v", "error", "-y"]
    for i in ids:
        cmd += ["-i", str(VOICE / f"{i}.wav")]
    parts = [f"[{k}]aresample=44100,adelay={int(S(i) * 1000)}:all=1[a{k}]" for k, i in enumerate(ids)]
    mix = "".join(f"[a{k}]" for k in range(len(ids)))
    filt = ";".join(parts) + f";{mix}amix=inputs={len(ids)}:normalize=0,highpass=f=80,acompressor=threshold=-20dB:ratio=3,apad=whole_dur={TOTAL},loudnorm=I=-15:TP=-1.5,aresample=44100"
    cmd += ["-filter_complex", filt, "-ac", "1", "-b:a", "160k", str(ROOT / "assets" / "vo.mp3")]
    subprocess.run(cmd, check=True)


# ------------------------------------------------------------------ captions
def word_times():
    out = []
    for lid, info in LINES.items():
        words = info["text"].split()
        weights = [len(w.strip(".,:?!")) + 1.6 + (1.4 if w[-1] in ".,:?!" else 0) for w in words]
        scale = (E(lid) - S(lid)) / sum(weights)
        t = S(lid)
        for k, w in enumerate(words):
            out.append({"text": w, "start": round(t, 3), "end": round(t + weights[k] * scale, 3), "who": info["who"]})
            t += weights[k] * scale
    for k, w in enumerate(out):
        nxt = out[k + 1]["start"] if k + 1 < len(out) else TOTAL
        w["hide"] = round(min(nxt, w["end"] + 0.35), 3)
    return out


def captions():
    words = word_times()
    divs, js = [], []
    for k, w in enumerate(words):
        cls = "cap-word cat" if w["who"] == "c" else "cap-word"
        divs.append(f'    <div id="cap-{k}" class="cap-line"><span class="{cls}">{w["text"]}</span></div>')
        js.append(
            f'    tl.set("#cap-{k}", {{ visibility: "visible" }}, {w["start"]});\n'
            f'    tl.fromTo("#cap-{k} span", {{ scale: 0.72, y: 10 }}, {{ scale: 1, y: 0, duration: 0.12, ease: "back.out(3)" }}, {w["start"]});\n'
            f'    tl.set("#cap-{k}", {{ visibility: "hidden" }}, {w["hide"]});'
        )
    nl = "\n"
    return f"""<template>
  <style>
    #root {{
      position: absolute;
      inset: 0;
      pointer-events: none;
    }}
    .cap-line {{
      position: absolute;
      left: 0;
      width: 100%;
      top: 1190px;
      text-align: center;
      visibility: hidden;
      overflow: visible;
    }}
    .cap-word {{
      display: inline-block;
      font-family: "Nunito", sans-serif;
      font-weight: 900;
      font-size: 112px;
      line-height: 1.1;
      color: #fff;
      -webkit-text-stroke: 16px #15131c;
      paint-order: stroke fill;
      text-shadow: 0 9px 0 rgba(21, 19, 28, 0.55);
    }}
    .cap-word.cat {{
      color: #ffb43a;
    }}
  </style>
  <div id="root" data-composition-id="captions" data-width="{W}" data-height="{H}" data-duration="{TOTAL}">
{nl.join(divs)}
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
{nl.join(js)}
    window.__timelines["captions"] = tl;
  </script>
</template>
"""


# ------------------------------------------------------------------ HUD (counters, as in the reference)
def count_steps(t0, t1, a, b, fmt, fps=15):
    n = max(1, int((t1 - t0) * fps))
    return [(round(t0 + (t1 - t0) * k / n, 3), fmt(round(a + (b - a) * k / n))) for k in range(n + 1)]


def euro(v):
    return f"{v:,}".replace(",", ".") + " €"


def dotted(v):
    return f"{v:,}".replace(",", ".")


def hud_segments():
    return [
        ("h1", "Linke Socken", "WOCHE 1", DAY["w1"] + 0.4, DAY["m1"], [(DAY["w1"] + 0.4, "30")] + count_steps(S("L2"), E("L2"), 30, 23, str, 4)),
        ("h2", "Linke Socken", "TAG 30", DAY["m1"] + 0.4, DAY["pol"], [(DAY["m1"] + 0.4, "0")]),
        ("h3", "Ernst genommen", "TAG 31", DAY["pol"] + 0.4, DAY["d40"], [(DAY["pol"] + 0.4, "50 %"), (S("L6") + 0.4, "0 %")]),
        ("h4", "Geklaute Socken", "TAG 40", DAY["d40"] + 0.4, DAY["n3"], [(DAY["d40"] + 0.4, "40")] + count_steps(S("L8") + 2.2, E("L8"), 40, 47, str, 4)),
        ("h5", "Socken an deinen Füßen", "TAG 48", DAY["morn"] + 0.4, DAY["shop"], [(DAY["morn"] + 0.4, "2"), (S("L11") + 1.5, "0")]),
        ("h6", "Kontostand", "TAG 48", DAY["shop"] + 0.4, S("L14"), [(DAY["shop"] + 0.4, euro(340))] + count_steps(S("L12") + 3.3, E("L12"), 340, 40, euro)),
        ("h7", "Linke Socken im Lager", "SOCKEN-PAUL", S("L15") - 0.1, E("L16") + 0.6, [(S("L15") - 0.1, "0")] + count_steps(S("L15"), E("L15"), 0, 10000, dotted)),
    ]


def hud():
    segs = hud_segments()
    divs, js = [], []
    for hid, label, day, t0, t1, steps in segs:
        divs.append(
            f"""    <div id="{hid}" class="hud-box clip" data-start="{t0:.3f}" data-duration="{t1 - t0:.3f}">
      <div id="{hid}-in" class="hud-in">
        <div class="hud-label">{label}</div>
        <div><span id="{hid}-n" class="hud-num">{steps[0][1]}</span></div>
        <div class="hud-sub">{day}</div>
      </div>
    </div>"""
        )
        js.append(f'    tl.fromTo("#{hid}-in", {{ opacity: 0, y: -14 }}, {{ opacity: 1, y: 0, duration: 0.25, ease: "power3.out" }}, {t0:.3f});')
        for k, (t, txt) in enumerate(steps[1:]):
            # zero-width prefix keeps GSAP from parsing "10.000" as the number 10
            js.append(f'    tl.set("#{hid}-n", {{ textContent: "\\u200b{txt}" }}, {t:.3f});')
            if len(steps) < 12 or k == len(steps) - 2:
                js.append(f'    tl.fromTo("#{hid}-n", {{ scale: 1.1 }}, {{ scale: 1, duration: 0.18, ease: "power3.out" }}, {t:.3f});')
    nl = "\n"
    return f"""<template>
  <style>
    #root {{
      position: absolute;
      inset: 0;
      pointer-events: none;
    }}
    .hud-box {{
      position: absolute;
      left: 60px;
      top: 196px;
    }}
    .hud-in {{
      background: rgba(255, 255, 255, 0.9);
      color: #1d1a26;
      border-radius: 22px;
      padding: 18px 28px 16px;
      box-shadow: 0 6px 0 rgba(29, 26, 38, 0.25);
    }}
    .hud-label {{
      font-family: "Inter", sans-serif;
      font-weight: 700;
      font-size: 28px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }}
    .hud-num {{
      display: inline-block;
      font-family: "Playfair Display", serif;
      font-weight: 700;
      font-size: 96px;
      line-height: 1.05;
      transform-origin: 0% 50%;
    }}
    .hud-sub {{
      font-family: "Inter", sans-serif;
      font-weight: 400;
      font-size: 28px;
      letter-spacing: 0.12em;
      margin-top: 14px;
      opacity: 0.75;
    }}
  </style>
  <div id="root" data-composition-id="hud" data-width="{W}" data-height="{H}" data-duration="{TOTAL}">
{nl.join(divs)}
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
{nl.join(js)}
    window.__timelines["hud"] = tl;
  </script>
</template>
"""


# ------------------------------------------------------------------ day cards + end card
CARDS = [
    ("c1", "w1", "Woche 1", "Kevins Wohnung"),
    ("c2", "m1", "1 Monat", "später"),
    ("c3", "d40", "Tag 40", "neuer Plan"),
    ("c4", "n3", "03:00", "Uhr nachts"),
    ("c5", "morn", "Am Morgen", "danach"),
    ("c6", "shop", "Tag 48", "Kevin gibt auf"),
]


def cards():
    divs, js = [], []
    for cid, key, title, sub in CARDS:
        t0 = DAY[key]
        divs.append(
            f"""    <div id="{cid}" class="card clip" data-start="{t0:.3f}" data-duration="1.6">
      <div id="{cid}-in" class="card-in"><div class="card-title">{title}</div><div class="card-sub">{sub}</div></div>
    </div>"""
        )
        js.append(
            f'    tl.fromTo("#{cid}-in", {{ opacity: 0, scale: 1.12, filter: "blur(8px)" }}, {{ opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.3, ease: "power3.out" }}, {t0:.3f});\n'
            f'    tl.to("#{cid}-in", {{ opacity: 0, y: -20, duration: 0.25, ease: "power2.in" }}, {t0 + 1.3:.3f});'
        )
    end0 = E("L16") + 0.9
    nl = "\n"
    return f"""<template>
  <style>
    #root {{
      position: absolute;
      inset: 0;
      pointer-events: none;
    }}
    .card {{
      position: absolute;
      left: 0;
      width: 100%;
      top: 430px;
      text-align: center;
    }}
    .card-in {{
      display: inline-block;
      background: rgba(20, 18, 30, 0.62);
      border-radius: 28px;
      padding: 26px 56px 30px;
      color: #fff;
    }}
    .card-title {{
      font-family: "Playfair Display", serif;
      font-weight: 700;
      font-size: 120px;
      line-height: 1;
    }}
    .card-sub {{
      font-family: "Inter", sans-serif;
      font-weight: 700;
      font-size: 30px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      margin-top: 14px;
    }}
    #endcard {{
      position: absolute;
      inset: 0;
    }}
    #end-bg {{
      position: absolute;
      inset: 0;
      background: rgba(16, 14, 26, 0.82);
    }}
    #end-text {{
      position: absolute;
      left: 90px;
      right: 90px;
      top: 560px;
      text-align: center;
      color: #fff;
    }}
    .end-q {{
      font-family: "Nunito", sans-serif;
      font-weight: 900;
      font-size: 84px;
      line-height: 1.1;
    }}
    .end-q span {{
      color: #ffb43a;
    }}
    .end-sub {{
      font-family: "Inter", sans-serif;
      font-weight: 700;
      font-size: 36px;
      margin-top: 40px;
      opacity: 0.9;
    }}
    .end-handle {{
      font-family: "Inter", sans-serif;
      font-weight: 700;
      font-size: 40px;
      margin-top: 70px;
      color: #ffb43a;
    }}
  </style>
  <div id="root" data-composition-id="cards" data-width="{W}" data-height="{H}" data-duration="{TOTAL}">
{nl.join(divs)}
    <div id="endcard" class="clip" data-start="{end0:.3f}" data-duration="{TOTAL - end0:.3f}">
      <div id="end-bg"></div>
      <div id="end-text">
        <div class="end-q">Fehlen dir auch immer <span>linke</span> Socken?</div>
        <div class="end-sub">Jetzt weißt du warum.</div>
        <div class="end-handle">{HANDLE}</div>
      </div>
    </div>
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
{nl.join(js)}
    tl.fromTo("#end-bg", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.5, ease: "power2.out" }}, {end0:.3f});
    tl.fromTo("#end-text", {{ opacity: 0, y: 40 }}, {{ opacity: 1, y: 0, duration: 0.45, ease: "back.out(1.6)" }}, {end0 + 0.2:.3f});
    window.__timelines["cards"] = tl;
  </script>
</template>
"""


# ------------------------------------------------------------------ root
def sfx_list():
    out = []
    for k, (cid, key, *_rest) in enumerate(CARDS):
        out.append((f"sfx-card-{cid}", "assets/whoosh-short.mp3" if k % 2 else "assets/whoosh.mp3", DAY[key] - 0.05, 0.35))
    out += [
        ("sfx-grab", "assets/pop.mp3", 3.5, 0.35),
        ("sfx-ring", "assets/ping.mp3", S("L4") + 0.2, 0.4),
        ("sfx-lock", "assets/impact-bass-2.mp3", S("L8") + 1.8, 0.4),
        ("sfx-bare", "assets/impact-bass-1.mp3", S("L11") + 2.6, 0.45),
        ("sfx-beanie", "assets/pop.mp3", S("L14") + 0.5, 0.4),
        ("sfx-out", "assets/whoosh-cinematic.mp3", E("L16") + 0.6, 0.35),
    ]
    return out


def index():
    sfx = "\n".join(
        f'      <audio id="{aid}" class="clip" src="{src}" data-start="{t:.3f}" data-track-index="{6 + k}" data-volume="{v}"></audio>'
        for k, (aid, src, t, v) in enumerate(sfx_list())
    )
    host = lambda cid, z, kind, ti: (  # noqa: E731
        f'      <div id="{cid}" data-composition-id="{cid}" data-composition-src="compositions/{cid}.html" data-start="0" '
        f'data-duration="{TOTAL}" data-track-index="{ti}" data-track-kind="{kind}" data-width="{W}" data-height="{H}" style="z-index: {z}"></div>'
    )
    return f"""<!doctype html>
<html lang="de" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="assets/gsap.min.js"></script>
    <script src="assets/timing.js"></script>
    <style>
      * {{
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }}
      html,
      body {{
        margin: 0;
        width: 1080px;
        height: 1920px;
        overflow: hidden;
        background: #a6dcf7;
      }}
      #root {{
        position: relative;
        width: 100%;
        height: 100%;
      }}
      #world {{
        position: absolute;
        inset: 0;
        background: #a6dcf7;
      }}
      #world-canvas {{
        display: block;
        width: 1080px;
        height: 1920px;
      }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="{W}" data-height="{H}">
      <div id="world" class="clip" data-start="0" data-duration="{TOTAL}" data-track-index="0" style="z-index: 1">
        <canvas id="world-canvas" width="1080" height="1920"></canvas>
      </div>
{host("hud", 5, "graphics", 1)}
{host("cards", 8, "graphics", 2)}
{host("captions", 10, "captions", 3)}
      <audio id="vo" class="clip" src="assets/vo.mp3" data-start="0" data-duration="{TOTAL}" data-track-index="5" data-volume="1"></audio>
{sfx}
    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
      window.__timelines["main"] = tl;
    </script>
    <script type="module" src="assets/world.js"></script>
  </body>
</html>
"""


def main():
    (ROOT / "compositions").mkdir(exist_ok=True)
    build_audio()
    mouths = {lid: mouth_env(VOICE / f"{lid}.wav") for lid, info in LINES.items() if info["who"] == "c"}
    timing = {"total": TOTAL, "lines": TIMES, "marks": DAY, "mouth": mouths}
    (ROOT / "assets" / "timing.js").write_text("window.HF_TIMING = " + json.dumps(timing) + ";\n")
    (ROOT / "compositions" / "captions.html").write_text(captions())
    (ROOT / "compositions" / "hud.html").write_text(hud())
    (ROOT / "compositions" / "cards.html").write_text(cards())
    (ROOT / "index.html").write_text(index())
    print(f"total {TOTAL}s")
    for lid in TIMES:
        print(lid, TIMES[lid])


if __name__ == "__main__":
    main()
