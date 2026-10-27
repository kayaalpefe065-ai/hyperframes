"""Assemble the film: scene compositions, captions, index.html (scenes, voice, music, sfx) and chapter marks.

Usage: python3 -I tools/build.py      (run from anywhere; writes into the project)
"""
import json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import ALIGNED, LEAD, ROOT, Scene, _dur, _norm  # noqa: E402
import scenes_a  # noqa: E402

MODULES = [scenes_a]
for name in ("scenes_b", "scenes_c", "scenes_d"):
    if os.path.exists(os.path.join(ROOT, "tools", name + ".py")):
        MODULES.append(__import__(name))

def _s(a, b):
    return [f"s{i:02d}" for i in range(a, b)]


ORDER = _s(1, 5) + ["c1"] + _s(5, 14) + ["c2"] + _s(14, 22) + ["c3"] + _s(22, 29) + ["c4"] + _s(29, 38) + ["c5"] + _s(38, 47) + ["c6"] + _s(47, 52)
CHAPTERS = {"s01": "Einstieg", "c1": "Teil 1 – Der Knall", "c2": "Teil 2 – Der Schleier", "c3": "Teil 3 – Der Sommer, der nicht kam",
            "c4": "Teil 4 – Hunger", "c5": "Teil 5 – Was blieb", "c6": "Teil 6 – Heute"}
MUSIC = [("a", "s01", "c3"), ("b", "c3", "c5"), ("c", "c5", None)]  # cue, from scene, until scene (crossfade there)
MUSIC_VOL = 0.22  # music ~-30 LUFS under a -17 LUFS voice

# Sound effects: (scene, word prefix or seconds, nth, file, volume)
SFX = [
    ("s01", "Freibad", 1, "whoosh-short", 0.35), ("s02", "achtzehnhundertsechzehn", 1, "impact-bass-2", 0.55),
    ("s04", "Berg", 1, "pop", 0.5), ("s06", "explodiert", 1, "impact-bass-1", 0.9), ("s07", "Feuersäulen", 1, "whoosh", 0.4),
    ("s11", "Geschichte", 1, "pop", 0.55), ("s19", "kälter", 1, "pop", 0.45), ("s31", "explodieren", 1, "impact-bass-2", 0.45),
    ("s41", "Frankenstein", 1, "impact-bass-2", 0.45), ("s47", "feiern", 1, "pop", 0.5),
]
CARD_WHOOSH = ["whoosh", "whoosh-short"]

NUMS = {"achtzehnhundertsechzehn": "1816", "achtzehnhundertfünfzehn": "1815", "achtzehnhundertsiebzehn": "1817",
        "neunzehnhunderteinundneunzig": "1991", "zehntausend": "10.000", "elftausend": "11.000", "viertausend": "4.000",
        "tausend": "1.000", "sechzig": "60", "vierzig": "40", "hundert": "100", "fünften": "5.", "zehnten": "10."}


def caption_text(w):
    m = re.match(r"^(\W*)(\w+)(\W*)$", w)
    if m and m.group(2).lower() in NUMS:
        n = NUMS[m.group(2).lower()]
        return m.group(1) + n + m.group(3)
    return w


def main():
    for mod in MODULES:
        for fn in ("chapters", "scenes"):
            if hasattr(mod, fn):
                getattr(mod, fn)()
    # durations come from the written scene timelines' source of truth: Scene() computes them the same way
    durs = {}
    for sid in ORDER:
        path = os.path.join(ROOT, "compositions", f"{sid}.html")
        if not os.path.exists(path):
            print("missing scene", sid)
            continue
        durs[sid] = Scene(sid, dur=3.0 if sid.startswith("c") else None).dur
    starts, t = {}, 0.0
    for sid in ORDER:
        if sid in durs:
            starts[sid] = round(t, 2)
            t += durs[sid]
    total = round(t, 2)

    hosts, audio, caps = [], [], []
    for sid in ORDER:
        if sid not in durs:
            continue
        hosts.append(f'''      <div id="sc-{sid}" data-composition-id="{sid}" data-composition-src="compositions/{sid}.html" data-start="{starts[sid]:.2f}"
        data-duration="{durs[sid]}" data-track-index="1" data-track-kind="graphics" data-width="1920" data-height="1080"></div>''')
        if not sid.startswith("c"):
            vo = _dur(os.path.join(ROOT, "assets", "voice", f"{sid[1:]}.mp3"))
            audio.append(f'      <audio id="vo-{sid}" class="clip" src="assets/voice/{sid[1:]}.mp3" data-start="{starts[sid] + LEAD:.2f}" '
                         f'data-duration="{vo - 0.06:.2f}" data-track-index="2" data-volume="1"></audio>')
    for k, sid in enumerate(s for s in ORDER if s.startswith("c") and s in starts):
        f = CARD_WHOOSH[k % 2]
        audio.append(f'      <audio id="sfx-{sid}" class="clip" src="assets/sfx/{f}.mp3" data-start="{starts[sid] + 0.05:.2f}" '
                     f'data-duration="0.57" data-track-index="4" data-volume="0.35"></audio>')
    for k, (sid, word, n, f, vol) in enumerate(SFX):
        if sid not in starts:
            continue
        sc = Scene(sid)
        at = starts[sid] + (word if isinstance(word, (int, float)) else sc.w(word, n))
        d = _dur(os.path.join(ROOT, "assets", "sfx", f"{f}.mp3"))
        audio.append(f'      <audio id="sfx-{k}" class="clip" src="assets/sfx/{f}.mp3" data-start="{at:.2f}" data-duration="{d:.2f}" '
                     f'data-track-index="{3 + k % 2}" data-volume="{vol}"></audio>')
    for mi, (cue, a, b) in enumerate(MUSIC):
        if a not in starts:
            continue
        # crossfades: cue a runs 2 s into Teil 3, cue c starts 2 s before Teil 5 (cue b is 110 s long)
        st = starts[a] - (2.0 if cue == "c" else 0.0)
        en = (starts[b] + (2.0 if cue == "a" else 0.0)) if b in starts else total
        length = _dur(os.path.join(ROOT, "assets", "music", f"{cue}.mp3"))
        if en - st > length:
            print(f"WARNING music {cue}: needs {en - st:.1f}s, track is {length:.1f}s")
            en = st + length
        audio.append(f'      <audio id="mu-{cue}" class="clip" src="assets/music/{cue}.mp3" data-start="{st:.2f}" data-duration="{en - st:.2f}" '
                     f'data-track-index="{5 + mi % 2}" data-volume="{MUSIC_VOL}" data-fade-in="1.5" data-fade-out="{3.0 if b is None else 2.0}"></audio>')

    # captions: groups of script words timed by the aligned takes
    groups = []
    for sid in ORDER:
        if sid.startswith("c") or sid not in starts:
            continue
        cur = []
        words = ALIGNED[sid[1:]]
        for i, w in enumerate(words):
            cur.append(w)
            txt = " ".join(caption_text(x["text"]) for x in cur)
            nxt = words[i + 1] if i + 1 < len(words) else None
            gap = (nxt["start"] - w["end"]) if nxt else 9
            end_sent = w["text"][-1] in ".!?…:"
            comma = w["text"][-1] in ",;"
            if not nxt or end_sent or gap > 0.3 or len(cur) >= 6 or len(txt) > 34 or (comma and len(cur) >= 3):
                groups.append([starts[sid] + LEAD + cur[0]["start"], starts[sid] + LEAD + cur[-1]["end"], txt])
                cur = []
    for gp in groups:
        gp[0] = round(max(0.1, gp[0] - 0.05), 3)
    for k, gp in enumerate(groups):
        nxt = groups[k + 1][0] if k + 1 < len(groups) else total
        gp[1] = round(min(gp[1] + 0.35, nxt - 0.02), 3)
    def srt_t(x):
        ms = int(round(x * 1000))
        return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
    with open(os.path.join(ROOT, "captions.srt"), "w", encoding="utf-8") as f:
        for k, (a, b, txt) in enumerate(groups):
            f.write(f"{k + 1}\n{srt_t(a)} --> {srt_t(b)}\n{txt}\n\n")
    caps_html = "\n".join(f'    <div id="cap-{k}" class="capg"><span>{txt}</span></div>' for k, (_, _, txt) in enumerate(groups))
    caps_js = "\n".join(f'      tl.set("#cap-{k}", {{ visibility: "visible" }}, {a:.3f}); tl.set("#cap-{k}", {{ visibility: "hidden" }}, {b:.3f});'
                        for k, (a, b, _) in enumerate(groups))
    with open(os.path.join(ROOT, "compositions", "captions.html"), "w", encoding="utf-8") as f:
        f.write(CAPTIONS.format(html=caps_html, js=caps_js, dur=total))
    hosts.append(f'''      <div id="sc-captions" data-composition-id="captions" data-composition-src="compositions/captions.html" data-start="0"
        data-duration="{total}" data-track-index="8" data-track-kind="captions" data-width="1920" data-height="1080"></div>''')

    with open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8") as f:
        f.write(INDEX.format(total=total, hosts="\n".join(hosts), audio="\n".join(audio)))
    marks = [(starts[sid], name) for sid, name in CHAPTERS.items() if sid in starts]
    with open(os.path.join(ROOT, "tools", "chapters.json"), "w", encoding="utf-8") as f:
        json.dump({"total": total, "chapters": marks, "starts": starts}, f, ensure_ascii=False, indent=1)
    print(f"{len(durs)} scenes, {len(groups)} caption groups, total {total:.1f}s ({int(total // 60)}:{int(total % 60):02d})")
    for t0, name in marks:
        print(f"  {int(t0 // 60)}:{int(t0 % 60):02d} {name}")


CAPTIONS = """<template>
  <style>
    @font-face {{ font-family: "Patrick Hand"; src: url("assets/fonts/patrick-hand.woff2") format("woff2"); }}
    #root {{ position: absolute; inset: 0; pointer-events: none; }}
    .capg {{ position: absolute; left: 0; right: 0; bottom: 64px; text-align: center; visibility: hidden; overflow: visible; }}
    .capg span {{ display: inline-block; font-family: "Patrick Hand", sans-serif; font-size: 54px; line-height: 1.15;
      color: #1f1d1a; background: rgba(255, 252, 245, 0.92); border-radius: 12px; padding: 4px 22px 6px; }}
  </style>
  <div id="root" data-composition-id="captions" data-width="1920" data-height="1080">
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
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: #f4efe4; }}
      #root {{ position: relative; width: 100%; height: 100%; background: #f4efe4; }}
    </style>
  </head>
  <body>
    <!-- Generated by tools/build.py from tools/scenes_*.py; edit those and rebuild. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{total}" data-width="1920" data-height="1080">
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
