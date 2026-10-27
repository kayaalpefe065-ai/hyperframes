"""Assemble the TikTok teaser: scenes, big captions, index.html (1080x1920) with voice, music and sfx.

Usage: python3 -I tools/build.py
"""
import os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import ALIGNED, LEAD, ROOT, Scene, _dur  # noqa: E402
import scenes  # noqa: E402

ORDER = ["s01", "s02", "s03", "s04", "s05", "s06"]
SFX = [("s01", "achtzehnhundertsechzehn", "impact-bass-2", 0.45), ("s03", "Vulkan", "pop", 0.6),
       ("s04", "Ausbruch", "impact-bass-1", 0.8), ("s05", "Frankenstein", "whoosh-short", 0.4), ("s06", "Video", "whoosh", 0.35)]
NUMS = {"achtzehnhundertsechzehn": "1816", "elftausend": "11.000"}
CAP_TOP = 1170  # captions: bottom of the safe band (168–1330 px)


def caption_text(w):
    m = re.match(r"^(\W*)(\w+)(\W*)$", w)
    if m and m.group(2).lower() in NUMS:
        return m.group(1) + NUMS[m.group(2).lower()] + m.group(3)
    return w


def main():
    scenes.scenes()
    durs = {sid: Scene(sid).dur for sid in ORDER}
    starts, t = {}, 0.0
    for sid in ORDER:
        starts[sid] = round(t, 2)
        t += durs[sid]
    total = round(t, 2)
    hosts, audio = [], []
    for sid in ORDER:
        hosts.append(f'''      <div id="sc-{sid}" data-composition-id="{sid}" data-composition-src="compositions/{sid}.html" data-start="{starts[sid]:.2f}"
        data-duration="{durs[sid]}" data-track-index="1" data-track-kind="graphics" data-width="1080" data-height="1920"></div>''')
        vo = _dur(os.path.join(ROOT, "assets", "voice", f"{sid[1:]}.mp3"))
        audio.append(f'      <audio id="vo-{sid}" class="clip" src="assets/voice/{sid[1:]}.mp3" data-start="{starts[sid] + LEAD:.2f}" '
                     f'data-duration="{vo - 0.06:.2f}" data-track-index="2" data-volume="1"></audio>')
    for k, (sid, word, f, vol) in enumerate(SFX):
        at = starts[sid] + Scene(sid).w(word)
        d = _dur(os.path.join(ROOT, "assets", "sfx", f"{f}.mp3"))
        audio.append(f'      <audio id="sfx-{k}" class="clip" src="assets/sfx/{f}.mp3" data-start="{at:.2f}" data-duration="{d:.2f}" '
                     f'data-track-index="{3 + k % 2}" data-volume="{vol}"></audio>')
    audio.append(f'      <audio id="mu" class="clip" src="assets/music/a.mp3" data-start="0" data-duration="{total}" data-media-start="40" '
                 f'data-track-index="5" data-volume="0.24" data-fade-in="0.3" data-fade-out="1.5"></audio>')

    groups = []
    for sid in ORDER:
        cur, words = [], ALIGNED[sid[1:]]
        for i, w in enumerate(words):
            cur.append(w)
            txt = " ".join(caption_text(x["text"]) for x in cur)
            nxt = words[i + 1] if i + 1 < len(words) else None
            gap = (nxt["start"] - w["end"]) if nxt else 9
            if not nxt or w["text"][-1] in ".!?…:," or gap > 0.25 or len(cur) >= 3 or len(txt) > 16:
                groups.append([starts[sid] + LEAD + cur[0]["start"], starts[sid] + LEAD + cur[-1]["end"], txt])
                cur = []
    for gp in groups:
        gp[0] = round(max(0.1, gp[0] - 0.04), 3)
    for k, gp in enumerate(groups):
        nxt = groups[k + 1][0] if k + 1 < len(groups) else total
        gp[1] = round(min(gp[1] + 0.25, nxt - 0.02), 3)
    html = "\n".join(f'    <div id="cap-{k}" class="capg"><span>{txt}</span></div>' for k, (_, _, txt) in enumerate(groups))
    js = "\n".join(f'      tl.set("#cap-{k}", {{ visibility: "visible" }}, {a:.3f}); tl.set("#cap-{k}", {{ visibility: "hidden" }}, {b:.3f});'
                   for k, (a, b, _) in enumerate(groups))
    with open(os.path.join(ROOT, "compositions", "captions.html"), "w", encoding="utf-8") as f:
        f.write(CAPTIONS.format(html=html, js=js, dur=total, top=CAP_TOP))
    hosts.append(f'''      <div id="sc-captions" data-composition-id="captions" data-composition-src="compositions/captions.html" data-start="0"
        data-duration="{total}" data-track-index="8" data-track-kind="captions" data-width="1080" data-height="1920"></div>''')
    with open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8") as f:
        f.write(INDEX.format(total=total, hosts="\n".join(hosts), audio="\n".join(audio)))
    print(f"{len(ORDER)} scenes, {len(groups)} caption groups, total {total:.1f}s")


CAPTIONS = """<template>
  <style>
    @font-face {{ font-family: "Patrick Hand"; src: url("assets/fonts/patrick-hand.woff2") format("woff2"); }}
    #root {{ position: absolute; inset: 0; pointer-events: none; }}
    .capg {{ position: absolute; left: 0; right: 0; top: {top}px; text-align: center; visibility: hidden; overflow: visible; }}
    .capg span {{ display: inline-block; font-family: "Patrick Hand", sans-serif; font-size: 78px; line-height: 1.1;
      color: #1f1d1a; background: #fffcf5; border: 6px solid #1f1d1a; border-radius: 18px; padding: 4px 28px 8px; }}
  </style>
  <div id="root" data-composition-id="captions" data-width="1080" data-height="1920">
{html}
  </div>
  <script>
    (() => {{
      const tl = gsap.timeline({{ paused: true }});
{js}
      tl.set({{}}, {{}}, {dur});
      window.__timelines["captions"] = tl;
    }})();
  </script>
</template>
"""

INDEX = """<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1080px; height: 1920px; overflow: hidden; background: #f4efe4; }}
      #root {{ position: relative; width: 100%; height: 100%; background: #f4efe4; }}
    </style>
  </head>
  <body>
    <!-- Generated by tools/build.py from tools/scenes.py; edit those and rebuild. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{total}" data-width="1080" data-height="1920">
{hosts}
{audio}
    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
"""

if __name__ == "__main__":
    main()
