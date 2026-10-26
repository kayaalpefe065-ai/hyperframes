"""Generates the scene files for the "Katze spricht" test clip.

Run: python3 build.py   (writes index.html + compositions/*.html)
The art is plain SVG so every shape stays editable; this script only keeps the
shared character drawings in one place.
"""

import json
import pathlib

ROOT = pathlib.Path(__file__).parent
W, H = 1080, 1920
INK = "#23202e"
FUR = "#f39a3c"
FUR_DARK = "#d9762a"
CREAM = "#fbe9cf"
SKIN = "#fbfbf7"
SHIRT = "#22a58b"

# ---------------------------------------------------------------- timing
SCENES = [
    ("s1", 0.0, 3.1),
    ("s2", 3.1, 3.35),
    ("s3", 6.45, 2.8),
    ("s4", 9.25, 2.15),
    ("s5", 11.4, 2.6),
]
TOTAL = 14.0

# (start, end, text, speaker) - voice lines as placed in assets/vo.mp3
LINES = [
    (0.25, 2.76, "Was wäre, wenn deine Katze plötzlich sprechen könnte?", "n"),
    (3.30, 6.24, "Tag eins. Du machst dir morgens einen Kaffee. Und dann sagt sie:", "n"),
    (6.70, 8.97, "Der Napf ist seit drei Minuten leer, Kevin.", "cat"),
    (9.95, 11.03, "Du lässt die Tasse fallen.", "n"),
    (11.70, 13.00, "Und das ist erst der Anfang.", "n"),
]

# cat mouth state per 1/15 s from the RMS of her line (0 closed, 1 half, 2 open)
CAT_MOUTH = [0, 0, 0, 0, 2, 2, 2, 0, 1, 1, 0, 2, 1, 1, 1, 2, 2, 1, 1, 2, 1, 1, 1, 2, 2, 2, 0, 0, 0, 0, 1, 1, 1, 0, 0]


def word_times():
    out = []
    for start, end, text, who in LINES:
        words = text.split()
        weights = []
        for w in words:
            core = w.strip(".,:?!")
            weights.append(len(core) + 1.6 + (1.4 if w[-1] in ".,:?!" else 0))
        scale = (end - start) / sum(weights)
        t = start
        for i, w in enumerate(words):
            ws = t
            t += weights[i] * scale
            out.append({"text": w, "start": round(ws, 3), "end": round(t, 3), "who": who})
    # hold each word until the next one appears (within a line), max 0.35 s past its slot
    for i, w in enumerate(out):
        nxt = out[i + 1]["start"] if i + 1 < len(out) else TOTAL
        w["hide"] = round(min(nxt, w["end"] + 0.35), 3)
    return out


# ---------------------------------------------------------------- drawing helpers
def boil_filter(p):
    return f"""<filter id="{p}-boil" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence id="{p}-turb" type="fractalNoise" baseFrequency="0.018" numOctaves="1" seed="1" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>"""


def kevin_head(p, eyes="normal", mouth="smile", extra=""):
    """Head centred on (0,0), radius 135."""
    eye_sets = {
        "normal": f'<g id="{p}-kv-eyes-normal"><circle cx="-50" cy="-8" r="10" fill="{INK}"/><circle cx="50" cy="-8" r="10" fill="{INK}"/></g>',
        "happy": f'<g id="{p}-kv-eyes-happy" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"><path d="M -64 -4 Q -50 -22 -36 -4"/><path d="M 36 -4 Q 50 -22 64 -4"/></g>',
        "tiny": f'<g id="{p}-kv-eyes-tiny"><circle cx="-50" cy="-8" r="4" fill="{INK}"/><circle cx="50" cy="-8" r="4" fill="{INK}"/></g>',
    }
    mouths = {
        "smile": f'<path id="{p}-kv-mouth-smile" d="M -34 62 Q 0 92 34 62" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>',
        "flat": f'<path id="{p}-kv-mouth-flat" d="M -26 70 L 26 70" fill="none" stroke="{INK}" stroke-width="7" stroke-linecap="round"/>',
        "o": f'<ellipse id="{p}-kv-mouth-o" cx="0" cy="78" rx="26" ry="34" fill="#5a1f2b" stroke="{INK}" stroke-width="7"/>',
    }
    eyes_svg = "".join(v for k, v in eye_sets.items() if k in eyes.split())
    mouth_svg = "".join(v for k, v in mouths.items() if k in mouth.split())
    return f"""
      <path d="M -52 -128 l 14 -46 l 18 40 l 16 -50 l 14 48 l 22 -38 l 4 44" fill="none" stroke="#7a4a2a" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="135" fill="{SKIN}" stroke="{INK}" stroke-width="9"/>
      <ellipse cx="-92" cy="38" rx="20" ry="11" fill="#f6b3b0" opacity="0.7"/>
      <ellipse cx="92" cy="38" rx="20" ry="11" fill="#f6b3b0" opacity="0.7"/>
      {eyes_svg}
      <g id="{p}-kv-glasses" fill="rgba(255,255,255,0.25)" stroke="{INK}" stroke-width="7">
        <circle cx="-50" cy="-8" r="34"/><circle cx="50" cy="-8" r="34"/>
        <path d="M -16 -10 Q 0 -20 16 -10" fill="none"/>
      </g>
      {mouth_svg}
      {extra}"""


def kevin(p, arm_l=8, arm_r=-8, eyes="normal", mouth="smile"):
    """Full body, feet at (0,0), about 700 tall."""
    def arm(side, ang):
        sx = -82 if side == "l" else 82
        return f"""<g id="{p}-kv-arm-{side}" transform="rotate({ang} {sx} -392)">
          <path d="M {sx} -392 L {sx} -150" stroke="{INK}" stroke-width="11" stroke-linecap="round"/>
          <circle cx="{sx}" cy="-140" r="20" fill="{SKIN}" stroke="{INK}" stroke-width="7"/></g>"""

    return f"""
      <ellipse cx="0" cy="4" rx="120" ry="22" fill="rgba(35,32,46,0.18)"/>
      <path d="M -30 -205 L -36 -8 M 30 -205 L 36 -8" stroke="{INK}" stroke-width="11" stroke-linecap="round"/>
      <ellipse cx="-50" cy="-6" rx="36" ry="16" fill="#3d7be0" stroke="{INK}" stroke-width="7"/>
      <ellipse cx="50" cy="-6" rx="36" ry="16" fill="#3d7be0" stroke="{INK}" stroke-width="7"/>
      {arm("l", arm_l)}{arm("r", arm_r)}
      <rect x="-88" y="-425" width="176" height="235" rx="62" fill="{SHIRT}" stroke="{INK}" stroke-width="9"/>
      <g id="{p}-kv-head" transform="translate(0 -560)">{kevin_head(p, eyes, mouth)}</g>"""


def cat_head(p, mouth_states=False, lid=0.5):
    """Cat head centred on (0,0)."""
    lid_y = -12 - 22 + 44 * lid  # how far the lid comes down
    def eye(x):
        return f"""<g>
          <ellipse cx="{x}" cy="-12" rx="25" ry="23" fill="#d6e04a" stroke="{INK}" stroke-width="6"/>
          <ellipse cx="{x}" cy="-10" rx="6" ry="16" fill="{INK}"/>
          <path d="M {x-29} {lid_y} L {x+29} {lid_y} L {x+29} -40 L {x-29} -40 Z" fill="{FUR}"/>
          <path d="M {x-26} {lid_y} L {x+26} {lid_y}" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>
        </g>"""

    if mouth_states:
        mouth = f"""
          <path id="{p}-m0" d="M -20 30 Q -10 42 0 30 Q 10 42 20 30" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>
          <g id="{p}-m1" opacity="0"><ellipse cx="0" cy="36" rx="15" ry="10" fill="#5a1f2b" stroke="{INK}" stroke-width="6"/></g>
          <g id="{p}-m2" opacity="0"><ellipse cx="0" cy="40" rx="20" ry="20" fill="#5a1f2b" stroke="{INK}" stroke-width="6"/><ellipse cx="0" cy="50" rx="11" ry="7" fill="#f07c8f"/></g>"""
    else:
        mouth = f'<path d="M -20 30 Q -10 42 0 30 Q 10 42 20 30" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>'
    return f"""
      <path d="M -92 -38 L -104 -128 L -30 -82 Z" fill="{FUR}" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>
      <path d="M -84 -54 L -92 -106 L -48 -80 Z" fill="#f4a7a3"/>
      <path d="M 92 -38 L 104 -128 L 30 -82 Z" fill="{FUR}" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>
      <path d="M 84 -54 L 92 -106 L 48 -80 Z" fill="#f4a7a3"/>
      <ellipse cx="0" cy="0" rx="112" ry="92" fill="{FUR}" stroke="{INK}" stroke-width="8"/>
      <path d="M -16 -88 L -12 -60 M 0 -92 L 0 -62 M 16 -88 L 12 -60" stroke="{FUR_DARK}" stroke-width="8" stroke-linecap="round"/>
      <ellipse cx="0" cy="40" rx="52" ry="34" fill="{CREAM}"/>
      {eye(-42)}{eye(42)}
      <path d="M -10 14 L 10 14 L 0 25 Z" fill="#f07c8f" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>
      {mouth}
      <g stroke="{INK}" stroke-width="4" stroke-linecap="round">
        <path d="M -56 30 L -128 20 M -56 42 L -126 48"/><path d="M 56 30 L 128 20 M 56 42 L 126 48"/>
      </g>"""


def cat(p, lick=False):
    """Sitting cat, seat at (0,0), about 400 tall."""
    paw = f'<g id="{p}-cat-paw"><ellipse cx="-34" cy="-8" rx="28" ry="17" fill="{FUR}" stroke="{INK}" stroke-width="7"/></g>'
    return f"""
      <ellipse cx="0" cy="4" rx="110" ry="16" fill="rgba(35,32,46,0.18)"/>
      <g id="{p}-cat-tail" transform="rotate(0 70 -24)">
        <path d="M 70 -24 C 170 -24 196 -120 150 -196" fill="none" stroke="{INK}" stroke-width="40" stroke-linecap="round"/>
        <path d="M 70 -24 C 170 -24 196 -120 150 -196" fill="none" stroke="{FUR}" stroke-width="26" stroke-linecap="round"/>
      </g>
      <path d="M -92 0 C -116 -120 -72 -232 0 -232 C 72 -232 116 -120 92 0 Z" fill="{FUR}" stroke="{INK}" stroke-width="8"/>
      <path d="M -40 -10 C -52 -90 -30 -170 0 -172 C 30 -170 52 -90 40 -10 Z" fill="{CREAM}"/>
      <path d="M -84 -110 L -58 -104 M -88 -70 L -60 -66 M 84 -110 L 58 -104 M 88 -70 L 60 -66" stroke="{FUR_DARK}" stroke-width="9" stroke-linecap="round"/>
      <ellipse cx="34" cy="-8" rx="28" ry="17" fill="{FUR}" stroke="{INK}" stroke-width="7"/>
      {paw}
      <g id="{p}-cat-head" transform="translate(0 -300)">{cat_head(p)}</g>"""


def kitchen(p):
    """Wide kitchen set, 1080x1920."""
    return f"""
    <defs>
      <pattern id="{p}-chk" width="140" height="140" patternUnits="userSpaceOnUse" patternTransform="translate(540 1400) scale(1 0.42) rotate(45)">
        <rect width="140" height="140" fill="#f3efe2"/>
        <rect width="70" height="70" fill="#2fa79a"/><rect x="70" y="70" width="70" height="70" fill="#2fa79a"/>
      </pattern>
      <pattern id="{p}-stripe" width="56" height="56" patternUnits="userSpaceOnUse">
        <rect width="56" height="56" fill="#f7d65a"/><rect width="10" height="56" fill="#f1c84a"/>
      </pattern>
      <radialGradient id="{p}-glow" cx="0.5" cy="0.35" r="0.7">
        <stop offset="0" stop-color="#fff6d6" stop-opacity="0.75"/><stop offset="1" stop-color="#fff6d6" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect x="-200" y="-200" width="1480" height="1620" fill="url(#{p}-stripe)"/>
    <rect x="-200" y="1400" width="1480" height="720" fill="url(#{p}-chk)"/>
    <path d="M -200 1400 L 1280 1400" stroke="{INK}" stroke-width="9"/>
    <!-- window -->
    <rect x="470" y="380" width="440" height="430" rx="10" fill="#8fd3f5" stroke="{INK}" stroke-width="10"/>
    <rect x="470" y="660" width="440" height="150" fill="#bfe7a0"/>
    <circle cx="820" cy="470" r="44" fill="#fff3b0"/>
    <path d="M 690 380 L 690 810 M 470 600 L 910 600" stroke="#fff" stroke-width="16"/>
    <rect x="470" y="380" width="440" height="430" rx="10" fill="none" stroke="{INK}" stroke-width="10"/>
    <path d="M 440 360 L 560 360 C 540 520 560 700 520 830 L 440 830 Z" fill="#f29e38" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>
    <path d="M 940 360 L 820 360 C 840 520 820 700 860 830 L 940 830 Z" fill="#f29e38" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>
    <path d="M 420 360 L 960 360" stroke="{INK}" stroke-width="12" stroke-linecap="round"/>
    <!-- lamp -->
    <path d="M 300 -200 L 300 250" stroke="{INK}" stroke-width="6"/>
    <path d="M 210 330 Q 300 220 390 330 Z" fill="#2fb3a6" stroke="{INK}" stroke-width="8" stroke-linejoin="round"/>
    <ellipse cx="300" cy="334" rx="40" ry="12" fill="#fff6c2" stroke="{INK}" stroke-width="5"/>
    <!-- frames -->
    <rect x="80" y="520" width="150" height="190" fill="#fff" stroke="{INK}" stroke-width="8"/>
    <circle cx="155" cy="600" r="38" fill="#f29e38"/><path d="M 100 690 L 140 640 L 175 670 L 210 630 L 210 690 Z" fill="#7cc576"/>
    <!-- fridge -->
    <rect x="-40" y="700" width="250" height="720" rx="30" fill="#a8dde9" stroke="{INK}" stroke-width="10"/>
    <path d="M -40 960 L 210 960" stroke="{INK}" stroke-width="8"/>
    <path d="M 180 780 L 180 900 M 180 1010 L 180 1160" stroke="{INK}" stroke-width="12" stroke-linecap="round"/>
    <rect x="40" y="1040" width="90" height="70" fill="#fff" stroke="{INK}" stroke-width="5" transform="rotate(-6 85 1075)"/>
    <circle cx="70" cy="820" r="16" fill="#e8505b" stroke="{INK}" stroke-width="5"/>
    <!-- counter -->
    <rect x="240" y="1110" width="1100" height="300" fill="#39b8a8" stroke="{INK}" stroke-width="10"/>
    <rect x="290" y="1150" width="220" height="220" rx="12" fill="#2f9f92" stroke="{INK}" stroke-width="7"/>
    <rect x="550" y="1150" width="220" height="220" rx="12" fill="#2f9f92" stroke="{INK}" stroke-width="7"/>
    <rect x="810" y="1150" width="220" height="220" rx="12" fill="#2f9f92" stroke="{INK}" stroke-width="7"/>
    <path d="M 480 1250 L 480 1280 M 580 1250 L 580 1280 M 1000 1250 L 1000 1280" stroke="{INK}" stroke-width="9" stroke-linecap="round"/>
    <rect x="220" y="1076" width="1120" height="44" rx="8" fill="#f4f1ea" stroke="{INK}" stroke-width="9"/>
    <rect x="-200" y="-200" width="1480" height="2320" fill="url(#{p}-glow)"/>"""


def boil_sets(p, dur):
    return f"""
      for (let i = 0; i * (1 / 12) < {dur}; i++) {{
        tl.set("#{p}-turb", {{ attr: {{ seed: (i % 9) + 1 }} }}, i / 12);
      }}"""


def scene_file(p, dur, svg_body, js):
    return f"""<template>
  <style>
    #root {{
      position: absolute;
      inset: 0;
      overflow: hidden;
      background: #f7d65a;
    }}
    #root svg {{
      position: absolute;
      inset: 0;
    }}
  </style>
  <div id="root" data-composition-id="{p}" data-width="{W}" data-height="{H}" data-duration="{dur}">
    <svg id="{p}-svg" data-layout-allow-overflow viewBox="0 0 {W} {H}" width="{W}" height="{H}">
      <defs>{boil_filter(p)}</defs>
      <g filter="url(#{p}-boil)">
        <g id="{p}-cam">{svg_body}
        </g>
      </g>
    </svg>
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
{js}
{boil_sets(p, dur)}
    window.__timelines["{p}"] = tl;
  </script>
</template>
"""


# ---------------------------------------------------------------- scenes
def s1():
    p, dur = "s1", 3.1
    body = f"""{kitchen(p)}
          <g transform="translate(330 1690) scale(1.08)">{kevin(p, arm_l=10, arm_r=-10)}</g>
          <g transform="translate(790 1084) scale(0.92)">{cat(p)}</g>"""
    js = f"""
    tl.fromTo("#{p}-cam", {{ scale: 1 }}, {{ scale: 1.08, duration: {dur}, ease: "sine.inOut", svgOrigin: "560 1100" }}, 0);
    tl.fromTo("#{p}-cat-tail", {{ rotation: 0 }}, {{ rotation: -14, duration: 0.7, ease: "sine.inOut", svgOrigin: "70 -24", yoyo: true, repeat: 3 }}, 0.1);
    tl.fromTo("#{p}-kv-head", {{ rotation: 0 }}, {{ rotation: 6, duration: 0.5, ease: "back.out(2)", svgOrigin: "0 100" }}, 1.4);
    tl.fromTo("#{p}-cat-head", {{ rotation: 0 }}, {{ rotation: -8, duration: 0.35, ease: "back.out(2.5)", svgOrigin: "0 80" }}, 2.2);"""
    return p, dur, scene_file(p, dur, body, js)


def s2():
    p, dur = "s2", 3.35
    body = f"""
          <rect x="-200" y="-200" width="1480" height="1460" fill="#f7d65a"/>
          <g opacity="0.55">{"".join(f'<rect x="{x}" y="380" width="96" height="96" fill="none" stroke="#e9bf3f" stroke-width="6"/>' for x in range(0, 1100, 104))}</g>
          <rect x="-200" y="1180" width="1480" height="900" fill="#39b8a8" stroke="{INK}" stroke-width="10"/>
          <rect x="-200" y="1130" width="1480" height="70" rx="10" fill="#f4f1ea" stroke="{INK}" stroke-width="10"/>
          <rect x="60" y="1290" width="420" height="500" rx="16" fill="#2f9f92" stroke="{INK}" stroke-width="8"/>
          <rect x="560" y="1290" width="420" height="500" rx="16" fill="#2f9f92" stroke="{INK}" stroke-width="8"/>
          <!-- mug -->
          <g id="{p}-mug">
            <path d="M 690 1010 C 770 1010 780 1100 700 1110" fill="none" stroke="{INK}" stroke-width="30"/>
            <path d="M 690 1010 C 770 1010 780 1100 700 1110" fill="none" stroke="#fff" stroke-width="14"/>
            <rect x="480" y="930" width="230" height="210" rx="26" fill="#fff" stroke="{INK}" stroke-width="10"/>
            <rect x="485" y="1010" width="220" height="40" fill="#e8505b"/>
            <ellipse cx="595" cy="935" rx="112" ry="22" fill="#6b3b22" stroke="{INK}" stroke-width="9"/>
          </g>
          <g id="{p}-steam" opacity="0" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round">
            <path d="M 560 880 C 530 830 590 800 560 740"/><path d="M 630 870 C 600 820 660 790 630 730"/>
          </g>
          <!-- coffee stream -->
          <rect id="{p}-stream" x="582" y="640" width="26" height="300" rx="13" fill="#6b3b22" stroke="{INK}" stroke-width="5"/>
          <!-- arm + pot -->
          <path d="M -60 1080 Q 300 900 820 560" fill="none" stroke="{INK}" stroke-width="14" stroke-linecap="round"/>
          <g id="{p}-pot" transform="rotate(-40 640 520)">
            <path d="M 620 400 L 860 400 L 900 640 C 900 700 860 720 820 720 L 660 720 C 620 720 580 700 580 640 Z" fill="rgba(200,235,245,0.85)" stroke="{INK}" stroke-width="10" stroke-linejoin="round"/>
            <path d="M 596 560 L 884 560 L 900 640 C 900 700 860 720 820 720 L 660 720 C 620 720 580 700 580 640 Z" fill="#6b3b22"/>
            <path d="M 620 400 L 860 400 L 900 640 C 900 700 860 720 820 720 L 660 720 C 620 720 580 700 580 640 Z" fill="none" stroke="{INK}" stroke-width="10" stroke-linejoin="round"/>
            <rect x="600" y="360" width="280" height="60" rx="14" fill="{INK}"/>
            <path d="M 600 380 L 560 360" stroke="{INK}" stroke-width="14" stroke-linecap="round"/>
            <path d="M 880 420 C 960 430 960 600 890 610" fill="none" stroke="{INK}" stroke-width="22" stroke-linecap="round"/>
          </g>
          <circle cx="820" cy="560" r="34" fill="{SKIN}" stroke="{INK}" stroke-width="8"/>
          <!-- kevin peeking in, humming -->
          <g id="{p}-kv" transform="translate(150 840) scale(1.9) rotate(8)">{kevin_head(p, eyes="happy normal", mouth="smile")}</g>
          <g id="{p}-notes" fill="{INK}">
            <g id="{p}-note1"><circle cx="360" cy="520" r="18"/><path d="M 374 520 L 374 440 L 404 452" stroke="{INK}" stroke-width="8" fill="none"/></g>
            <g id="{p}-note2"><circle cx="420" cy="420" r="16"/><path d="M 432 420 L 432 350 L 460 362" stroke="{INK}" stroke-width="8" fill="none"/></g>
          </g>"""
    js = f"""
    tl.fromTo("#{p}-cam", {{ scale: 1.04 }}, {{ scale: 1.12, duration: {dur}, ease: "sine.inOut", svgOrigin: "600 900" }}, 0);
    tl.fromTo("#{p}-pot", {{ rotation: -6 }}, {{ rotation: -40, duration: 0.45, ease: "back.out(1.6)", svgOrigin: "820 560" }}, 0.15);
    tl.fromTo("#{p}-stream", {{ scaleY: 0 }}, {{ scaleY: 1, duration: 0.25, ease: "power2.in", svgOrigin: "595 640" }}, 0.45);
    tl.to("#{p}-stream", {{ scaleY: 0, duration: 0.2, ease: "power2.out", svgOrigin: "595 940" }}, 2.1);
    tl.to("#{p}-pot", {{ rotation: -4, duration: 0.4, ease: "power2.inOut", svgOrigin: "820 560" }}, 2.15);
    tl.fromTo("#{p}-steam", {{ opacity: 0, y: 20 }}, {{ opacity: 0.85, y: -20, duration: 0.9, ease: "sine.out" }}, 1.5);
    tl.fromTo("#{p}-note1", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: -40, duration: 1.1, ease: "sine.out" }}, 0.3);
    tl.fromTo("#{p}-note2", {{ opacity: 0, y: 30 }}, {{ opacity: 1, y: -50, duration: 1.1, ease: "sine.out" }}, 0.75);
    tl.to("#{p}-notes", {{ opacity: 0, duration: 0.2 }}, 2.2);
    tl.fromTo("#{p}-kv", {{ rotation: 8 }}, {{ rotation: -2, duration: 0.6, ease: "sine.inOut", svgOrigin: "150 960", yoyo: true, repeat: 2 }}, 0.1);
    // "Und dann sagt sie:" - he opens his eyes and looks over
    tl.set("#{p}-kv-eyes-happy", {{ opacity: 0 }}, 2.55);
    tl.set("#{p}-kv-eyes-normal", {{ opacity: 1 }}, 2.55);
    tl.fromTo("#{p}-kv-eyes-normal", {{ x: 0 }}, {{ x: 18, duration: 0.25, ease: "power3.out" }}, 2.6);"""
    body = body.replace('id="s2-kv-eyes-normal"', 'id="s2-kv-eyes-normal" opacity="0"')
    return p, dur, scene_file(p, dur, body, js)


def s3():
    p, dur = "s3", 2.8
    body = f"""
          <defs><radialGradient id="{p}-bg" cx="0.5" cy="0.4" r="0.8"><stop offset="0" stop-color="#fbe48a"/><stop offset="1" stop-color="#e9b94a"/></radialGradient></defs>
          <rect x="-200" y="-200" width="1480" height="2320" fill="url(#{p}-bg)"/>
          <rect x="560" y="140" width="520" height="560" rx="30" fill="#a9dcf3" opacity="0.6"/>
          <rect x="-200" y="1540" width="1480" height="600" fill="#f4f1ea" stroke="{INK}" stroke-width="10"/>
          <path d="M 100 1920 C 80 1500 300 1180 540 1180 C 780 1180 1000 1500 980 1920 Z" fill="{FUR}" stroke="{INK}" stroke-width="12"/>
          <path d="M 330 1920 C 330 1600 430 1400 540 1400 C 650 1400 750 1600 750 1920 Z" fill="{CREAM}"/>
          <g id="{p}-cat-head" transform="translate(540 800) scale(3.4)">{cat_head(p, mouth_states=True, lid=0.55)}</g>"""
    frames = json.dumps(CAT_MOUTH)
    js = f"""
    tl.fromTo("#{p}-cam", {{ scale: 1.18 }}, {{ scale: 1, duration: 0.3, ease: "power3.out", svgOrigin: "540 900" }}, 0);
    tl.to("#{p}-cam", {{ scale: 1.05, duration: {dur} - 0.3, ease: "sine.inOut", svgOrigin: "540 900" }}, 0.3);
    tl.fromTo("#{p}-cat-head", {{ rotation: 0 }}, {{ rotation: -5, duration: 0.6, ease: "sine.inOut", svgOrigin: "540 1120" }}, 0.25);
    tl.to("#{p}-cat-head", {{ rotation: 3, duration: 0.9, ease: "sine.inOut", svgOrigin: "540 1120" }}, 1.4);
    // mouth follows the loudness of her line (starts 6.70 s, scene starts 6.45 s)
    const mouth = {frames};
    mouth.forEach((m, i) => {{
      const t = 0.25 + i / 15;
      tl.set("#{p}-m0", {{ opacity: m === 0 ? 1 : 0 }}, t);
      tl.set("#{p}-m1", {{ opacity: m === 1 ? 1 : 0 }}, t);
      tl.set("#{p}-m2", {{ opacity: m === 2 ? 1 : 0 }}, t);
    }});"""
    return p, dur, scene_file(p, dur, body, js)


def s4():
    p, dur = "s4", 2.15
    sweat = '<path id="s4-sweat" d="M 0 -30 C 18 0 22 20 0 30 C -22 20 -18 0 0 -30 Z" fill="#8fd3f5" stroke="#23202e" stroke-width="4" opacity="0"/>'
    body = f"""
          <rect x="-200" y="-200" width="1480" height="2320" fill="#f7d65a"/>
          <g opacity="0.5" stroke="#e9bf3f" stroke-width="14">{"".join(f'<path d="M 540 860 L {540 + 1400 * __import__("math").cos(a / 9)} {860 + 1400 * __import__("math").sin(a / 9)}"/>' for a in range(0, 57, 2))}</g>
          <path d="M 120 1920 C 120 1500 300 1300 540 1300 C 780 1300 960 1500 960 1920 Z" fill="{SHIRT}" stroke="{INK}" stroke-width="12"/>
          <g id="{p}-kv" transform="translate(540 860) scale(2.7)">
            <g id="{p}-kv-face">{kevin_head(p, eyes="normal tiny", mouth="smile o", extra=sweat.replace('id="s4-sweat"', f'id="{p}-sweat" transform="translate(118 -70)"'))}</g>
          </g>
          <g id="{p}-hand">
            <g transform="translate(760 1480) rotate(-8)"><g id="{p}-mug2">
              <path d="M 100 -60 C 170 -60 170 30 100 30" fill="none" stroke="{INK}" stroke-width="30"/>
              <path d="M 100 -60 C 170 -60 170 30 100 30" fill="none" stroke="#fff" stroke-width="14"/>
              <rect x="-110" y="-130" width="220" height="200" rx="24" fill="#fff" stroke="{INK}" stroke-width="10"/>
              <rect x="-105" y="-60" width="210" height="38" fill="#e8505b"/>
            </g></g>
            <circle id="{p}-fist" cx="640" cy="1500" r="58" fill="{SKIN}" stroke="{INK}" stroke-width="10"/>
          </g>"""
    shake = "".join(
        f'tl.set("#{p}-cam", {{ x: {dx}, y: {dy} }}, {0.2 + i * 0.035:.3f});\n    '
        for i, (dx, dy) in enumerate([(14, -10), (-16, 8), (12, 12), (-10, -8), (8, 6), (-6, -4), (4, 3), (0, 0)])
    )
    js = f"""
    // anticipation squash, then the shock face
    tl.fromTo("#{p}-kv", {{ scaleY: 2.7, scaleX: 2.7 }}, {{ scaleY: 2.55, scaleX: 2.8, duration: 0.07, ease: "power2.in" }}, 0.0);
    tl.set("#{p}-kv-eyes-normal", {{ opacity: 0 }}, 0.08);
    tl.set("#{p}-kv-eyes-tiny", {{ opacity: 1 }}, 0.08);
    tl.set("#{p}-kv-mouth-smile", {{ opacity: 0 }}, 0.08);
    tl.set("#{p}-kv-mouth-o", {{ opacity: 1 }}, 0.08);
    tl.to("#{p}-kv", {{ scaleY: 2.9, scaleX: 2.62, duration: 0.09, ease: "power3.out" }}, 0.08);
    tl.to("#{p}-kv", {{ scaleY: 2.7, scaleX: 2.7, duration: 0.35, ease: "elastic.out(1, 0.5)" }}, 0.17);
    tl.fromTo("#{p}-kv-glasses", {{ y: 0 }}, {{ y: -38, duration: 0.1, ease: "power3.out" }}, 0.08);
    tl.to("#{p}-kv-glasses", {{ y: 0, duration: 0.4, ease: "bounce.out" }}, 0.2);
    // the mug slips
    tl.fromTo("#{p}-mug2", {{ y: 0, rotation: 0 }}, {{ y: 760, rotation: 50, duration: 0.3, ease: "power2.in" }}, 0.05);
    {shake}
    tl.fromTo("#{p}-fist", {{ scale: 1 }}, {{ scale: 0.85, duration: 0.15, ease: "power2.out", transformOrigin: "50% 50%" }}, 0.05);
    tl.fromTo("#{p}-sweat", {{ opacity: 0, y: 0 }}, {{ opacity: 1, y: 40, duration: 0.9, ease: "power1.in" }}, 0.5);"""
    for hid in ("s4-kv-eyes-tiny", "s4-kv-mouth-o"):
        body = body.replace(f'id="{hid}"', f'id="{hid}" opacity="0"')
    return p, dur, scene_file(p, dur, body, js)


def s5():
    p, dur = "s5", 2.6
    shards = f"""<g id="{p}-mess">
            <ellipse cx="420" cy="1800" rx="230" ry="46" fill="#6b3b22" stroke="{INK}" stroke-width="7"/>
            <path d="M 300 1770 L 340 1730 L 360 1780 Z" fill="#fff" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>
            <path d="M 470 1790 L 530 1750 L 545 1800 Z" fill="#e8505b" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>
            <path d="M 600 1820 L 650 1800 L 640 1840 Z" fill="#fff" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/>
          </g>"""
    body = f"""{kitchen(p)}
          {shards}
          <g transform="translate(330 1690) scale(1.08)">{kevin(p, arm_l=130, arm_r=-130, eyes="tiny", mouth="o")}</g>
          <g transform="translate(790 1084) scale(0.92)">{cat(p)}</g>"""
    js = f"""
    tl.fromTo("#{p}-cam", {{ scale: 1.14 }}, {{ scale: 1, duration: {dur}, ease: "power2.out", svgOrigin: "560 1300" }}, 0);
    // cat licks her paw, unbothered
    tl.set("#{p}-cat-paw", {{ x: 0, y: 0 }}, 0);
    for (let i = 0; i < 3; i++) {{
      tl.to("#{p}-cat-paw", {{ x: 18, y: -250, duration: 0.25, ease: "power2.out" }}, 0.2 + i * 0.6);
      tl.to("#{p}-cat-paw", {{ x: 0, y: 0, duration: 0.25, ease: "power2.in" }}, 0.5 + i * 0.6);
    }}
    tl.fromTo("#{p}-cat-head", {{ rotation: 0 }}, {{ rotation: 10, duration: 0.4, ease: "sine.inOut", svgOrigin: "0 80" }}, 0.2);
    tl.to("#{p}-cat-head", {{ rotation: -6, duration: 0.3, ease: "back.out(3)", svgOrigin: "0 80" }}, 2.0);
    tl.fromTo("#{p}-cat-tail", {{ rotation: 0 }}, {{ rotation: -16, duration: 0.6, ease: "sine.inOut", svgOrigin: "70 -24", yoyo: true, repeat: 3 }}, 0);
    tl.fromTo("#{p}-kv-arm-l", {{ rotation: 130 }}, {{ rotation: 124, duration: 0.12, ease: "sine.inOut", svgOrigin: "-82 -392", yoyo: true, repeat: 9 }}, 0);
    tl.fromTo("#{p}-kv-arm-r", {{ rotation: -130 }}, {{ rotation: -124, duration: 0.13, ease: "sine.inOut", svgOrigin: "82 -392", yoyo: true, repeat: 9 }}, 0);"""
    return p, dur, scene_file(p, dur, body, js)


# ---------------------------------------------------------------- HUD + captions
def hud():
    p, dur = "hud", TOTAL - 3.1
    cat_words = [w for w in word_times() if w["who"] == "cat"]
    sets = "".join(
        f'    tl.set("#hud-n1", {{ textContent: "{i + 1}" }}, {w["start"] - 3.1:.3f});\n'
        f'    tl.fromTo("#hud-n1", {{ scale: 1.25 }}, {{ scale: 1, duration: 0.18, ease: "power3.out" }}, {w["start"] - 3.1:.3f});\n'
        for i, w in enumerate(cat_words)
    )
    return p, dur, f"""<template>
  <style>
    #root {{
      position: absolute;
      inset: 0;
      pointer-events: none;
    }}
    .hud-box {{
      position: absolute;
      left: 72px;
      top: 210px;
      color: #23202e;
    }}
    .hud-label {{
      font-family: "Inter", sans-serif;
      font-weight: 700;
      font-size: 30px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }}
    .hud-num {{
      font-family: "Playfair Display", serif;
      font-weight: 700;
      font-size: 120px;
      line-height: 1;
      margin-top: 6px;
      transform-origin: 0% 50%;
      display: inline-block;
    }}
    .hud-sub {{
      font-family: "Inter", sans-serif;
      font-weight: 400;
      font-size: 28px;
      letter-spacing: 0.12em;
      opacity: 0.9;
      margin-top: 18px;
    }}
  </style>
  <div id="root" data-composition-id="hud" data-width="{W}" data-height="{H}" data-duration="{dur}">
    <div id="hud-a" class="hud-box clip" data-start="0" data-duration="{9.5 - 3.1:.2f}">
      <div id="hud-a-inner">
        <div class="hud-label">Wörter deiner Katze</div>
        <div><span id="hud-n1" class="hud-num">0</span></div>
        <div class="hud-sub">TAG 1</div>
      </div>
    </div>
    <div id="hud-b" class="hud-box clip" data-start="{9.5 - 3.1:.2f}" data-duration="{TOTAL - 9.5:.2f}">
      <div id="hud-b-inner">
        <div class="hud-label">Zerbrochene Tassen</div>
        <div><span id="hud-n2" class="hud-num">1</span></div>
        <div class="hud-sub">TAG 1</div>
      </div>
    </div>
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    tl.fromTo("#hud-a-inner", {{ opacity: 0, y: -16 }}, {{ opacity: 1, y: 0, duration: 0.25, ease: "power3.out" }}, 0.1);
{sets}    tl.fromTo("#hud-b-inner", {{ opacity: 0, scale: 1.3 }}, {{ opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2)", transformOrigin: "0% 50%" }}, {9.5 - 3.1:.2f});
    window.__timelines["hud"] = tl;
  </script>
</template>
"""


def captions():
    words = word_times()
    divs, js = [], []
    for i, w in enumerate(words):
        cls = "cap-word cat" if w["who"] == "cat" else "cap-word"
        divs.append(f'      <div id="cap-{i}" class="cap-line"><span class="{cls}">{w["text"]}</span></div>')
        sel = f"#cap-{i}"
        js.append(
            f'    tl.set("{sel}", {{ visibility: "visible" }}, {w["start"]});\n'
            f'    tl.fromTo("{sel} span", {{ scale: 0.72, y: 10 }}, {{ scale: 1, y: 0, duration: 0.12, ease: "back.out(3)" }}, {w["start"]});\n'
            f'    tl.set("{sel}", {{ visibility: "hidden" }}, {w["hide"]});'
        )
    return "captions", TOTAL, f"""<template>
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
      font-size: 118px;
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
{chr(10).join(divs)}
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
{chr(10).join(js)}
    window.__timelines["captions"] = tl;
  </script>
</template>
"""


# ---------------------------------------------------------------- root
SFX = [
    ("sfx-whoosh-1", "assets/whoosh-short.mp3", 3.08, 0.5),
    ("sfx-pop-1", "assets/pop.mp3", 3.22, 0.35),
    ("sfx-whoosh-2", "assets/whoosh-short.mp3", 6.42, 0.35),
    ("sfx-crash", "assets/crash.wav", 9.5, 0.9),
    ("sfx-impact", "assets/impact-bass-1.mp3", 9.5, 0.45),
    ("sfx-pop-2", "assets/pop.mp3", 9.62, 0.35),
    ("sfx-whoosh-3", "assets/whoosh-short.mp3", 11.38, 0.4),
]


def index(files):
    hosts = []
    for i, (p, start, dur) in enumerate(SCENES):
        hosts.append(
            f"""      <div id="{p}" data-composition-id="{p}" data-composition-src="compositions/{p}.html" data-start="{start}" data-duration="{dur}" data-track-index="1" data-track-kind="graphics" data-width="{W}" data-height="{H}" style="z-index: 1"></div>"""
        )
    hosts.append(
        f"""      <div id="hud" data-composition-id="hud" data-composition-src="compositions/hud.html" data-start="3.1" data-duration="{TOTAL - 3.1:.2f}" data-track-index="2" data-track-kind="graphics" data-width="{W}" data-height="{H}" style="z-index: 5"></div>"""
    )
    hosts.append(
        f"""      <div id="captions" data-composition-id="captions" data-composition-src="compositions/captions.html" data-start="0" data-duration="{TOTAL}" data-track-index="3" data-track-kind="captions" data-width="{W}" data-height="{H}" style="z-index: 10"></div>"""
    )
    audio = [
        f"""      <audio id="vo" class="clip" src="assets/vo.mp3" data-start="0" data-duration="{TOTAL}" data-track-index="4" data-volume="1"></audio>"""
    ]
    for i, (aid, src, t, vol) in enumerate(SFX):
        audio.append(
            f"""      <audio id="{aid}" class="clip" src="{src}" data-start="{t}" data-track-index="{5 + i}" data-volume="{vol}"></audio>"""
        )
    return f"""<!doctype html>
<html lang="de" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="assets/gsap.min.js"></script>
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
        background: #f7d65a;
      }}
      #root {{
        position: relative;
        width: 100%;
        height: 100%;
        background: #f7d65a;
      }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="{W}" data-height="{H}">
{chr(10).join(hosts)}
{chr(10).join(audio)}
    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
"""


def main():
    comp = ROOT / "compositions"
    comp.mkdir(exist_ok=True)
    files = []
    for fn in (s1, s2, s3, s4, s5, hud, captions):
        p, dur, html = fn()
        (comp / f"{p}.html").write_text(html)
        files.append(p)
    (ROOT / "index.html").write_text(index(files))
    print("wrote", files)


if __name__ == "__main__":
    main()
