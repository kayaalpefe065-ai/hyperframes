"""Profile picture for the channel "Kritzelgeschichte": a 1080x1920 composition, cropped to 1080x1080 by tools/export.sh.

Uses the TikTok project's kit (same hand-drawn props). The square crop is y 420..1500; anything important stays
inside the inscribed circle, because TikTok and YouTube show avatars round.
"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(PROJ, "..", "jahr-ohne-sommer-tiktok", "tools"))
from kit import *  # noqa: E402

s = Scene("profil", dur=1.0, cam=("none",), boil=False)
s.add('<rect x="-40" y="-40" width="1200" height="2000" fill="#f4efe4" style="stroke:none"/>',
      '<circle cx="540" cy="960" r="430" fill="#ffd34d" style="stroke-width:12"/>',
      # a small erupting volcano behind the figure: the channel's first story
      volcano("vol", 790, 1260, s=0.34),
      '<g>' + "".join(f'<circle cx="{790 + dx}" cy="{1060 + dy}" r="{r}" fill="#8d8b88" style="stroke-width:8"/>'
                      for dx, dy, r in [(0, 0, 50), (-40, -50, 40), (35, -70, 45)]) + "</g>",
      figure("fz", 470, 1400, 3.0, mood="smile", hat="top", arms="down"),
      # raised right arm holding a pencil
      '<g transform="translate(470,1400) scale(3)"><polyline points="0,-140 64,-205" fill="none"/>'
      '<g transform="translate(64,-205) rotate(30)"><rect x="-10" y="-70" width="20" height="62" fill="#ffd34d" style="stroke-width:4"/>'
      '<path d="M-10,-8 L10,-8 L0,12 Z" fill="#f1d9b5" style="stroke-width:4"/><rect x="-10" y="-82" width="20" height="12" fill="#e8483b" style="stroke-width:4"/></g></g>',
      '<path d="M140,1400 Q540,1370 940,1400" fill="none" style="stroke-width:10"/>')
html = s.render().replace('<g filter="url(#profil-boil)">', '<g>').replace(
    '<g id="profil-fz-arml"><polyline points="0,-140 -46,-92" fill="none"/>', '<g id="profil-fz-arml"><polyline points="0,-140 -34,-66" fill="none"/>').replace('<g id="profil-fz-armr"><polyline points="0,-140 46,-92" fill="none"/>', '<g id="profil-fz-armr"><polyline points="0,-140 0,-140" fill="none"/>')
open(os.path.join(PROJ, "compositions", "profil.html"), "w", encoding="utf-8").write(html)
open(os.path.join(PROJ, "index.html"), "w", encoding="utf-8").write("""<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1080px; height: 1920px; overflow: hidden; background: #f4efe4; }
      #root { position: relative; width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="1" data-width="1080" data-height="1920">
      <div id="sc-profil" data-composition-id="profil" data-composition-src="compositions/profil.html" data-start="0" data-duration="1"
        data-track-index="1" data-track-kind="graphics" data-width="1080" data-height="1920"></div>
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
""")
print("ok")
