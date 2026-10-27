"""Builds "POV: when you prank your teacher" v2 (blocky 3D, absurd, silent: add a trending sound in TikTok).

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
    "b1": 1.8,
    "splash1": 3.0,
    "boom1": 3.5,
    "poof": 4.6,
    "b3": 6.2,
    "bruh": 7.0,
    "b4": 8.0,
    "b5": 9.8,
    "crash": 10.4,
    "b6": 12.0,
    "b7": 13.4,
    "gavel1": 15.0,
    "b8": 16.8,
    "b9": 18.2,
    "launch": 18.8,
    "b10": 20.6,
    "land": 21.4,
    "b11": 24.0,
    "end": 25.4,
}
TOTAL = 28.0


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
    <div id="phone" class="clip" data-start="{B['b4']:.2f}" data-duration="{B['b5'] - B['b4']:.2f}">
      <div id="phone-screen">
        <div class="ph-name">PRINCIPAL</div>
        <div class="ph-sub">calling on banana...</div>
        <div class="ph-btns"><div class="ph-btn" style="background: #e8432e"></div><div class="ph-btn" style="background: #3fbf5a"></div></div>
      </div>
    </div>
    <div id="stamp" class="clip" data-start="{B['gavel1']:.2f}" data-duration="{B['b8'] - B['gavel1']:.2f}">
      <div id="stamp-in">DETENTION<br />FOR LIFE</div>
    </div>
    <div id="bubble-wrap" class="clip" data-start="{B['b8'] + 0.3:.2f}" data-duration="{B['b9'] - B['b8'] - 0.3:.2f}">
      <div id="bubble-tail"></div>
      <div id="bubble">
        <svg viewBox="0 0 360 300" width="360" height="300">
          <path d="M 180 40 C 220 80 225 150 215 210 L 145 210 C 135 150 140 80 180 40 Z" fill="#f4f1ea" stroke="#1d1a26" stroke-width="8" stroke-linejoin="round"/>
          <path d="M 180 40 C 200 58 210 80 214 96 L 146 96 C 150 80 160 58 180 40 Z" fill="#e8432e" stroke="#1d1a26" stroke-width="8" stroke-linejoin="round"/>
          <circle cx="180" cy="135" r="20" fill="#9fdcff" stroke="#1d1a26" stroke-width="7"/>
          <path d="M 145 170 L 112 225 L 148 210 Z M 215 170 L 248 225 L 212 210 Z" fill="#e8432e" stroke="#1d1a26" stroke-width="7" stroke-linejoin="round"/>
          <path d="M 155 214 L 180 270 L 205 214 Z" fill="#ffb43a"/>
          <text x="262" y="96" font-family="Montserrat" font-weight="900" font-size="64" fill="#e8432e">!</text>
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
    tl.fromTo("#phone-screen", {{ y: 900 }}, {{ y: 0, duration: 0.35, ease: "back.out(1.4)" }}, {B['b4']:.2f});
    tl.fromTo("#phone", {{ rotation: -4 }}, {{ rotation: 4, duration: 0.08, ease: "none", yoyo: true, repeat: 15 }}, {B['b4'] + 0.4:.2f});
    tl.fromTo("#stamp-in", {{ scale: 2.6, opacity: 0, rotation: -14 }}, {{ scale: 1, opacity: 1, rotation: -8, duration: 0.22, ease: "power4.in" }}, {B['gavel1']:.2f});
    tl.fromTo("#bubble", {{ scale: 0 }}, {{ scale: 1, duration: 0.25, ease: "back.out(2)" }}, {B['b8'] + 0.3:.2f});
    tl.fromTo("#end-bg", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.4 }}, {B['end']:.2f});
    tl.fromTo("#end-text", {{ opacity: 0, scale: 1.3 }}, {{ opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.6)" }}, {B['end'] + 0.15:.2f});
    window.__timelines["overlay"] = tl;
  </script>
</template>
"""


# silent on purpose: the sound gets added in TikTok (a trending sound)
SFX = []


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
