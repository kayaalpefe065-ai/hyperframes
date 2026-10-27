"""The six vertical scenes of the TikTok teaser. Text stays inside the 168–1130 px band (captions sit below it)."""
import math
from kit import *


def scenes():
    # 01 — Juni 1816. In Deutschland schneit es. Mitten im Sommer.   (frame 0 is the hook: already full)
    s = Scene("s01", cam=("push", 1.0, 1.05))
    s.add(sky("sky", GREY_SKY), ground("gr", 1120, SNOW), flakes("fl", 70, 1, x1=1080, y0=-1900, y1=1900),
          figure("fz", 540, 1110, 1.6, mood="oh", ring=True))
    s.raw_html(calendar("cal", "1816", "Juni", 360, 180, w=360, rot=-4))
    s.label("ls", "Schnee?!", 0, 450, size=150, color=RED, w=1080)
    s.fall("fl", 70, 0, s.dur, dy=(500, 900), seed=1)
    s.write("#ls", s.w("schneit", off=-0.1)).shake("#fz-in", s.w("Sommer"), 0.5, 5)
    s.save()

    # 02 — Das Getreide verfault, Brot wird unbezahlbar, und die Menschen hungern.
    s = Scene("s02", cam=("push", 1.03, 1.0))
    s.add(sky("sky", "#a9b1ba"), ground("gr", 1100, "#7d6b4a"), wheat("wh", 540, 1110, 1.2, color="#9ec27a", n=7, gap=110),
          '<g id="bread" transform="translate(400,560)"><path d="M-200,50 Q-210,-100 0,-110 Q210,-100 200,50 Z" fill="#d79a4e"/>'
          '<path d="M-110,-70 L-80,0 M0,-80 L0,0 M110,-70 L80,0" fill="none"/></g>',
          '<g id="tag" transform="translate(620,380) rotate(12)"><path d="M0,0 L230,0 L280,60 L230,120 L0,120 Z" fill="#fff"/></g>',
          figure("fig", 860, 1060, 1.1, mood="sad", hat="cap"))
    s.label("lp", "€€€", 660, 410, size=84, color=RED)
    s.label("lv", "verfault", 120, 230, size=80, cls="box", rot=-3)
    s.label("lh", "Hunger", 600, 620, size=90, color=RED, cls="box", rot=3)
    t = s.w("verfault", off=-0.2)
    for k in range(7):
        s.to(f"#wh-{k}", t + k * 0.05, 0.8, ease="power2.in", rotation=(50 if k % 2 else -45), transformOrigin="50% 100%")
    s.write("#lv", s.w("verfault"))
    s.draw("#bread", s.w("Brot", off=-0.2), 0.4).draw("#tag", s.w("unbezahlbar", off=-0.2), 0.3).write("#lp", s.w("unbezahlbar"))
    s.write("#lh", s.w("hungern"))
    s.save()

    # 03 — Schuld ist ein einziger Vulkan. Über elftausend Kilometer entfernt.
    s = Scene("s03", cam=("push", 1.0, 1.06))
    r = 380
    s.add(globe("gl", 540, 760, r=r))
    k = r / 330
    gx, gy = GLOBE_PTS["germany"]
    ix, iy = GLOBE_PTS["indonesia"]
    gx, gy, ix, iy = 540 + gx * k, 760 + gy * k, 540 + ix * k, 760 + iy * k
    s.add(f'<g id="de"><circle cx="{gx:.0f}" cy="{gy:.0f}" r="16" fill="{RED}"/></g>', volcano("vol", ix, iy + 24, s=0.16),
          f'<g id="arc"><path d="M{gx:.0f},{gy:.0f} Q{(gx + ix) / 2 + 160:.0f},{min(gy, iy) - 200:.0f} {ix:.0f},{iy - 50:.0f}" fill="none" style="stroke:{RED};stroke-width:10"/></g>')
    s.label("lv", "1 Vulkan", 60, 180, size=100)
    s.label("lk", "über 11.000 km", 530, 200, size=64, cls="box", rot=3)
    s.draw("#gl", 0.0, 0.5).draw("#de", 0.2, 0.2).write("#lv", s.w("Vulkan", off=-0.2)).pop("#vol", s.w("Vulkan"))
    s.draw("#arc", s.w("elftausend", off=-0.3), 0.8).write("#lk", s.w("elftausend", off=0.1))
    s.save()

    # 04 — Sein Ausbruch kühlt die halbe Welt ab. Und niemand weiß, warum.
    s = Scene("s04", cam=("push", 1.0, 1.04))
    s.add(sky("sky", "#e89a6a"), ground("gr", 1120, "#8fb46a"), volcano("vol", 640, 1130, s=0.9, crater=True),
          '<g id="boom">' + "".join(g(f"p{i}", f'<circle cx="0" cy="0" r="{r_}" fill="{ASH}"/>', 640 + dx, 700 + dy)
                                    for i, (dx, dy, r_) in enumerate([(0, 0, 150), (-170, -80, 120), (170, -90, 130), (-50, -250, 140), (120, -290, 110)])) + "</g>",
          thermometer("th", 170, 1030, 1.15, level=0.7))
    s.label("lc", "halbe Welt: kälter", 0, 180, size=84, w=1080, color="#1f1d1a")
    s.label("q", "???", 60, 330, size=120, color=RED)
    t = s.w("Ausbruch", off=-0.15)
    s.shake("#vol-in", t, 0.8, 8).to("#sky", t, 0.6, fill="#6d5d5a")
    for i in range(5):
        s.fromto(f"#p{i}-in", t + i * 0.05, 0.8, {"scale": 0, "transformOrigin": "50% 50%"}, {"scale": 1}, ease="expo.out")
    s.to("#th-hg", s.w("kühlt", off=-0.1), 0.9, scaleY=0.7, transformOrigin="50% 100%").write("#lc", s.w("halbe"))
    s.write("#q", s.w("niemand"), 0.12)
    s.save()

    # 05 — Was das mit Frankenstein und dem Fahrrad zu tun hat?
    s = Scene("s05", bg="#e9e2d2", cam=("push", 1.0, 1.04))
    s.photo("fr", "assets/img/frankenstein.jpg", 90, 210, 520, 640, "„Frankenstein“ 1831", rot=-4, pos="50% 35%")
    s.photo("dr", "assets/img/drais.jpg", 460, 640, 540, 400, "Laufmaschine 1817", rot=4)
    s.label("q", "?", 820, 230, size=260, color=RED)
    s.slap("#fr", s.w("Frankenstein", off=-0.25)).slap("#dr", s.w("Fahrrad", off=-0.25)).write("#q", s.w("tun", off=-0.1))
    s.save()

    # 06 — Das ganze Video findest du auf YouTube. Link im Profil!
    s = Scene("s06", cam=("push", 1.03, 1.0))
    s.label("lt", "Das ganze Video", 0, 220, size=104, w=1080)
    s.label("ly", "auf YouTube", 0, 340, size=104, w=1080, color=RED)
    s.photo("th", "assets/img/youtube-thumb.png", 90, 500, 900, 506, "1816 – Das Jahr ohne Sommer · 6:31", rot=-2)
    s.label("ll", "Link im Profil ↓", 0, 1110 - 30, size=76, w=1080, cls="")
    s.write("#lt", s.w("ganze", off=-0.2)).write("#ly", s.w("YouTube", off=-0.1)).slap("#th", s.w("findest", off=-0.2)).write("#ll", s.w("Link"))
    s.save()


if __name__ == "__main__":
    scenes()
