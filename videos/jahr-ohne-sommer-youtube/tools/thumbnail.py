"""YouTube thumbnail (1920x1080 composition, exported to 1280x720 PNG by tools/thumbnail.sh)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *  # noqa: E402

s = Scene("thumb", dur=1.0, cam=("none",), boil=False)
s.add(sky("sky", "#9aa4b0"), ground("gr", 820, SNOW),
      volcano("vol", 1560, 830, s=0.75, crater=True),
      '<g id="boom">' + "".join(f'<circle cx="{1560 + dx}" cy="{360 + dy}" r="{r}" fill="#8d8b88"/>' for dx, dy, r in
                                [(0, 0, 120), (-150, -50, 100), (140, -70, 110), (-40, -200, 120), (110, -230, 100)]) + "</g>",
      "".join(f'<circle cx="{1560 + dx}" cy="{420 + dy}" r="{r}" fill="{LAVA}"/>' for dx, dy, r in [(-200, 60, 22), (220, 30, 26), (-120, -140, 18), (180, -160, 20)]),
      flakes("fl", 60, 7, y0=40, y1=1040, r=(6, 12)),
      figure("fz", 1130, 960, 2.0, mood="oh", ring=True))
s.raw_html('<div style="position:absolute;left:70px;top:60px;font-size:250px;line-height:0.9;color:#1f1d1a;'
           'background:#fffcf5;border:10px solid #1f1d1a;border-radius:30px;padding:10px 40px;transform:rotate(-4deg);">1816</div>')
s.raw_html('<div style="position:absolute;left:60px;top:430px;font-size:150px;line-height:1;color:#e8483b;'
           'background:#fffcf5;border:10px solid #1f1d1a;border-radius:30px;padding:14px 36px 20px;transform:rotate(2deg);white-space:nowrap;">Schnee<br>im Juni?!</div>')
s.raw_html('<div style="position:absolute;left:70px;top:860px;font-size:76px;line-height:1;color:#1f1d1a;'
           'background:#fffcf5;border:8px solid #1f1d1a;border-radius:22px;padding:6px 30px;white-space:nowrap;">Das Jahr ohne Sommer</div>')
html = s.render()
root = os.path.join(ROOT, "thumbnail")
open(os.path.join(root, "compositions", "thumb.html"), "w", encoding="utf-8").write(html)
open(os.path.join(root, "index.html"), "w", encoding="utf-8").write("""<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1920px; height: 1080px; overflow: hidden; background: #f4efe4; }
      #root { position: relative; width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="1" data-width="1920" data-height="1080">
      <div id="sc-thumb" data-composition-id="thumb" data-composition-src="compositions/thumb.html" data-start="0" data-duration="1"
        data-track-index="1" data-track-kind="graphics" data-width="1920" data-height="1080"></div>
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
""")
print("ok")
