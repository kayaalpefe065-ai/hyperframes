"""Builds "POV: when you prank your teacher" (blocky 3D, no narration, sound effects only).

Outputs: assets/timing.js, compositions/overlay.html, index.html
Run: python3 build.py
"""

import json
import pathlib

ROOT = pathlib.Path(__file__).parent
W, H = 1080, 1920
HANDLE = "@waswenn.exe1"
TITLE = "POV: when you prank your teacher"
# beats in seconds
B = {
    "b0": 0.0,
    "b1": 3.2,
    "splash1": 4.5,
    "b2": 5.1,
    "b3": 7.6,
    "b4": 9.6,
    "b5": 11.6,
    "b6": 13.0,
    "gavel1": 13.6,
    "b7": 16.0,
    "b8": 17.6,
    "splash2": 18.7,
    "b9": 20.4,
    "end": 22.6,
}
TOTAL = 25.5


def overlay():
    return f"""<template>
  <style>
    #root {{
      position: absolute;
      inset: 0;
      pointer-events: none;
    }}
    #title {{
      position: absolute;
      left: 60px;
      right: 60px;
      top: 210px;
      text-align: center;
      font-family: "Montserrat", sans-serif;
      font-weight: 800;
      font-size: 66px;
      line-height: 1.12;
      color: #fff;
      -webkit-text-stroke: 12px #15131c;
      paint-order: stroke fill;
      text-shadow: 0 6px 0 rgba(21, 19, 28, 0.45);
    }}
    #phone {{
      position: absolute;
      left: 300px;
      top: 620px;
      width: 480px;
      height: 760px;
      border-radius: 64px;
      background: #1d1a26;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
    }}
    #phone-screen {{
      position: absolute;
      inset: 22px;
      border-radius: 46px;
      background: linear-gradient(#3d4a6e, #1b2238);
      color: #fff;
      text-align: center;
      font-family: "Inter", sans-serif;
    }}
    .ph-name {{
      margin-top: 120px;
      font-size: 54px;
      font-weight: 800;
    }}
    .ph-sub {{
      margin-top: 12px;
      font-size: 32px;
      opacity: 0.8;
    }}
    .ph-btns {{
      position: absolute;
      bottom: 90px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-around;
    }}
    .ph-btn {{
      width: 120px;
      height: 120px;
      border-radius: 60px;
    }}
    #stamp {{
      position: absolute;
      left: 0;
      width: 100%;
      top: 820px;
      text-align: center;
    }}
    #stamp-in {{
      display: inline-block;
      padding: 20px 40px;
      border: 12px solid #e8432e;
      border-radius: 24px;
      color: #e8432e;
      background: rgba(255, 255, 255, 0.9);
      font-family: "Montserrat", sans-serif;
      font-weight: 900;
      font-size: 84px;
      line-height: 1;
      text-align: center;
    }}
    #bubble {{
      position: absolute;
      left: 560px;
      top: 640px;
      width: 360px;
      height: 300px;
      border-radius: 150px;
      background: #fff;
      border: 10px solid #1d1a26;
    }}
    #bubble-tail {{
      position: absolute;
      left: 600px;
      top: 920px;
      width: 70px;
      height: 70px;
      background: #fff;
      border-right: 10px solid #1d1a26;
      border-bottom: 10px solid #1d1a26;
      transform: rotate(35deg);
    }}
    #endcard {{
      position: absolute;
      inset: 0;
    }}
    #end-bg {{
      position: absolute;
      inset: 0;
      background: rgba(16, 14, 26, 0.75);
    }}
    #end-text {{
      position: absolute;
      left: 80px;
      right: 80px;
      top: 720px;
      text-align: center;
      color: #fff;
      font-family: "Nunito", sans-serif;
      font-weight: 900;
    }}
    .end-q {{
      font-size: 110px;
    }}
    .end-sub {{
      margin-top: 30px;
      font-family: "Inter", sans-serif;
      font-weight: 700;
      font-size: 40px;
      color: #ffb43a;
    }}
  </style>
  <div id="root" data-composition-id="overlay" data-width="{W}" data-height="{H}" data-duration="{TOTAL}">
    <div id="title" class="clip" data-start="0" data-duration="{B['end']:.2f}">{TITLE}</div>
    <div id="phone" class="clip" data-start="{B['b3']:.2f}" data-duration="{B['b4'] - B['b3']:.2f}">
      <div id="phone-screen">
        <div class="ph-name">PRINCIPAL</div>
        <div class="ph-sub">calling...</div>
        <div class="ph-btns"><div class="ph-btn" style="background: #e8432e"></div><div class="ph-btn" style="background: #3fbf5a"></div></div>
      </div>
    </div>
    <div id="stamp" class="clip" data-start="{B['gavel1']:.2f}" data-duration="{B['b7'] - B['gavel1']:.2f}">
      <div id="stamp-in">DETENTION<br />FOR LIFE</div>
    </div>
    <div id="bubble-wrap" class="clip" data-start="{B['b7'] + 0.3:.2f}" data-duration="{B['b8'] - B['b7'] - 0.3:.2f}">
      <div id="bubble-tail"></div>
      <div id="bubble">
        <svg viewBox="0 0 360 300" width="360" height="300">
          <path d="M 120 110 L 240 110 L 225 220 L 135 220 Z" fill="#8a8f9c" stroke="#1d1a26" stroke-width="8" stroke-linejoin="round"/>
          <ellipse cx="180" cy="110" rx="60" ry="14" fill="#7be04a" stroke="#1d1a26" stroke-width="8"/>
          <path d="M 150 120 C 150 160 170 160 168 190 M 205 120 C 205 150 192 165 196 182" stroke="#7be04a" stroke-width="16" stroke-linecap="round" fill="none"/>
          <text x="270" y="90" font-family="Montserrat" font-weight="900" font-size="64" fill="#e8432e">?</text>
        </svg>
      </div>
    </div>
    <div id="endcard" class="clip" data-start="{B['end']:.2f}" data-duration="{TOTAL - B['end']:.2f}">
      <div id="end-bg"></div>
      <div id="end-text"><div class="end-q">Part 2?</div><div class="end-sub">Follow {HANDLE}</div></div>
    </div>
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    tl.fromTo("#title", {{ opacity: 0, y: -20 }}, {{ opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }}, 0.05);
    tl.fromTo("#phone-screen", {{ y: 900 }}, {{ y: 0, duration: 0.35, ease: "back.out(1.4)" }}, {B['b3']:.2f});
    tl.fromTo("#phone", {{ rotation: -4 }}, {{ rotation: 4, duration: 0.08, ease: "none", yoyo: true, repeat: 15 }}, {B['b3'] + 0.4:.2f});
    tl.fromTo("#stamp-in", {{ scale: 2.6, opacity: 0, rotation: -14 }}, {{ scale: 1, opacity: 1, rotation: -8, duration: 0.22, ease: "power4.in" }}, {B['gavel1']:.2f});
    tl.fromTo("#bubble", {{ scale: 0 }}, {{ scale: 1, duration: 0.25, ease: "back.out(2)" }}, {B['b7'] + 0.3:.2f});
    tl.fromTo("#end-bg", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.4 }}, {B['end']:.2f});
    tl.fromTo("#end-text", {{ opacity: 0, scale: 1.3 }}, {{ opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.6)" }}, {B['end'] + 0.15:.2f});
    window.__timelines["overlay"] = tl;
  </script>
</template>
"""


SFX = [
    ("sfx-sneak", "assets/pop.mp3", 1.8, 0.35),
    ("sfx-splash1", "assets/impact-bass-1.mp3", B["splash1"], 0.6),
    ("sfx-splash1b", "assets/pop.mp3", B["splash1"] + 0.05, 0.5),
    ("sfx-laugh1", "assets/applause.wav", B["b2"] + 1.3, 0.35),
    ("sfx-ring1", "assets/ping.mp3", B["b3"] + 0.1, 0.45),
    ("sfx-ring2", "assets/ping.mp3", B["b3"] + 0.9, 0.45),
    ("sfx-cut", "assets/whoosh.mp3", B["b5"] - 0.05, 0.4),
    ("sfx-drama", "assets/drama.wav", B["b5"] + 0.2, 0.45),
    ("sfx-gavel1", "assets/gong.wav", B["gavel1"], 0.45),
    ("sfx-gavel2", "assets/impact-bass-2.mp3", B["splash2"] - 0.15, 0.45),
    ("sfx-splash2", "assets/impact-bass-1.mp3", B["splash2"], 0.6),
    ("sfx-cheer", "assets/applause.wav", B["splash2"] + 0.2, 0.5),
    ("sfx-end", "assets/whoosh-short.mp3", B["end"] - 0.05, 0.4),
]


def index():
    sfx = "\n".join(
        f'      <audio id="{aid}" class="clip" src="{src}" data-start="{t:.2f}" data-track-index="{4 + k}" data-volume="{v}"></audio>'
        for k, (aid, src, t, v) in enumerate(SFX)
    )
    return f"""<!doctype html>
<html lang="en" data-resolution="portrait">
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
        background: #cfe8ff;
      }}
      #root {{
        position: relative;
        width: 100%;
        height: 100%;
      }}
      #world {{
        position: absolute;
        inset: 0;
        background: #cfe8ff;
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
      <div id="overlay" data-composition-id="overlay" data-composition-src="compositions/overlay.html" data-start="0" data-duration="{TOTAL}" data-track-index="1" data-track-kind="graphics" data-width="{W}" data-height="{H}" style="z-index: 10"></div>
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
    (ROOT / "assets" / "timing.js").write_text("window.HF_TIMING = " + json.dumps({"total": TOTAL, "lines": {}, "marks": B}) + ";\n")
    (ROOT / "compositions" / "overlay.html").write_text(overlay())
    (ROOT / "index.html").write_text(index())
    print("total", TOTAL)


if __name__ == "__main__":
    main()
