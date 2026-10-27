"""Teil 6 – Heute (47–51)."""
import math
from kit import *


def scenes():
    # 47 — 1817 wird das Wetter endlich besser. Als die ersten vollen Erntewagen in die Dörfer rollen, feiern die Menschen.
    s = Scene("s47", cam=("push", 1.0, 1.03))
    s.add(sky("sky", GREY_SKY), '<g id="sunb" style="opacity:0">' + sun("sun", 1600, 200, 100) + "</g>", ground("gr", 860, GRASS),
          house("h1", 260, 870, 0.8), church("ch", 520, 870, 0.7),
          '<g id="wagon"><g transform="translate(0,870)"><path d="M-200,-260 Q0,-420 200,-260 Z" fill="#e8b84a"/>'
          '<rect x="-220" y="-260" width="440" height="120" fill="#a8774f"/><circle cx="-130" cy="-70" r="70" fill="#fff"/><circle cx="130" cy="-70" r="70" fill="#fff"/></g></g>',
          figure("p1", 1250, 900, 0.9), figure("p2", 1420, 900, 0.8, hat="scarf"), figure("p3", 1580, 900, 0.9, hat="cap"))
    s.raw_html('<div id="year" class="label box" style="left:120px;top:110px;font-size:72px;"><span class="wd">1817</span></div>')
    s.write("#year", s.w("Achtzehnhundertsiebzehn")).to("#sky", s.w("besser", off=-0.3), 1.0, fill=SKY).show("#sunb", s.w("besser"), 0.8)
    t = s.w("Erntewagen", off=-0.6)
    s.fromto("#wagon", t, 1.8, {"x": -300}, {"x": 900}, ease="power2.out")
    t = s.w("feiern", off=-0.1)
    for k, f in enumerate(["p1", "p2", "p3"]):
        s.to(f"#{f}-arml", t, 0.2, rotation=100, svgOrigin="0 -140").to(f"#{f}-armr", t, 0.2, rotation=-100, svgOrigin="0 -140")
        s.jump(f, t + k * 0.12, n=2, h=45)
    s.save()

    # 48 — Heute wissen wir: Ein einziger großer Ausbruch kann das Klima der ganzen Welt für Jahre verändern.
    s = Scene("s48", cam=("push", 1.0, 1.04))
    s.add(globe("gl", 960, 520, r=340))
    ix, iy = GLOBE_PTS["indonesia"]
    k = 340 / 330
    s.add(volcano("vol", 960 + ix * k, 520 + iy * k + 14, s=0.11),
          '<g id="pf">' + "".join(f'<circle cx="{960 + ix * k + dx:.0f}" cy="{520 + iy * k - 60 + dy:.0f}" r="{r}" fill="{ASH}"/>' for dx, dy, r in [(0, 0, 26), (-24, -26, 20), (24, -30, 22)]) + "</g>")
    s.front('<g id="veil" style="opacity:0"><circle cx="960" cy="520" r="372" fill="none" style="stroke:#e9d84a;stroke-width:44;opacity:0.5"/></g>')
    s.label("ly", "1815 → 1816 → 1817", 1340, 200, size=56, cls="box")
    s.label("lh", "Heute wissen wir:", 120, 120, size=64)
    s.write("#lh", s.w("Heute")).draw("#gl", 0.2, 0.8).pop("#vol", s.w("Ausbruch", off=-0.2)).draw("#pf", s.w("Ausbruch", off=0.1), 0.4)
    s.fromto("#veil", s.w("Welt", off=-0.3), 1.0, {"opacity": 0, "scale": 0.9, "transformOrigin": "960px 520px"}, {"opacity": 1, "scale": 1}, ease="power2.out")
    s.write("#ly", s.w("Jahre", off=-0.2), 0.15)
    s.save()

    # 49 — Neunzehnhunderteinundneunzig zum Beispiel: Der Pinatubo auf den Philippinen. Danach war es weltweit messbar kühler.
    s = Scene("s49", cam=("push", 1.0, 1.03))
    if has_img("pinatubo.jpg"):
        s.photo("ph", "assets/img/pinatubo.jpg", 180, 130, 960, 640, "Pinatubo, 15. Juni 1991 · Foto: U.S. Air Force", rot=-2)
    else:
        s.add(ground("gr", 880, "#9fb48a"), volcano("ph", 620, 890, s=0.8, crater=True),
              '<g id="plume">' + "".join(f'<circle cx="{620 + dx}" cy="{420 + dy}" r="{r}" fill="#9a958e"/>' for dx, dy, r in
                                          [(0, 0, 120), (-130, -90, 100), (120, -110, 110), (-30, -250, 120), (90, -300, 90)]) + "</g>")
        s.label("lp", "Pinatubo, Philippinen", 260, 900 - 140, size=56, cls="box")
    s.add(thermometer("th", 1560, 820, 1.0, level=0.7))
    s.label("ly", "1991", 1300, 110, size=96, cls="box", rot=4)
    s.label("lk", "messbar kühler", 1180, 560, size=52, color="#3a6fb0")
    s.write("#ly", s.w("Neunzehnhunderteinundneunzig"))
    if has_img("pinatubo.jpg"):
        s.slap("#ph", s.w("Pinatubo", off=-0.3))
    else:
        s.draw("#ph", s.w("Pinatubo", off=-0.4), 0.5).draw("#plume", s.w("Pinatubo"), 0.7).write("#lp", s.w("Philippinen"))
    s.draw("#th", s.w("Danach", off=-0.2), 0.5).to("#th-hg", s.w("kühler", off=-0.5), 1.0, scaleY=0.82, transformOrigin="50% 100%").write("#lk", s.w("messbar"))
    s.save()

    # 50 — Und der Tambora hat etwa dreimal so viel Schwefel ausgestoßen. Deshalb beobachten Forscher heute Vulkane auf der ganzen Welt.
    s = Scene("s50", cam=("pan", 40, -40))

    def pile(id_, x, n):
        out = []
        for k in range(n):
            out.append(f'<rect x="{x - 90}" y="{700 - (k + 1) * 130}" width="180" height="120" rx="10" fill="{SULFUR}"/>')
        return f'<g id="{id_}">' + "".join(out) + "</g>"

    s.add('<line x1="200" y1="700" x2="1000" y2="700"/>', pile("pp", 420, 1), pile("tp", 780, 3),
          '<g id="seis"><rect x="1140" y="300" width="620" height="380" rx="20" fill="#fff"/>'
          '<path d="M1180,500 L1260,500 L1280,470 L1300,530 L1320,440 L1345,560 L1370,480 L1390,500 L1720,500" fill="none" style="stroke:#e8483b;stroke-width:6"/></g>',
          figure("res", 1450, 960, 0.85, hat="cap"))
    s.label("lp", "Pinatubo", 330, 720, size=48).label("lt", "Tambora", 690, 720, size=48)
    s.label("lx", "≈ 3×", 900, 200, size=110, color=RED)
    s.label("lw", "Vulkane werden überwacht", 1130, 200, size=56)
    s.draw("#pp", 0.2, 0.4).write("#lp", 0.3).write("#lt", s.w("Tambora"))
    for k in range(3):
        s.js.append('tl.from("#tp rect:nth-child(%d)", { scaleY: 0, transformOrigin: "50%% 100%%", duration: 0.35, ease: "back.out(2)" }, %s);' % (k + 1, s.w("dreimal") + k * 0.15))
    s.write("#lx", s.w("Schwefel"))
    s.draw("#seis", s.w("beobachten", off=-0.3), 0.8).draw("#res", s.w("Forscher", off=-0.2), 0.5).write("#lw", s.w("Vulkane"))
    s.save()

    # 51 — Ein einziger Vulkan. Und die halbe Welt hatte keinen Sommer.
    s = Scene("s51", dur=None, cam=("push", 1.04, 1.0))
    s.add(sky("sky", GREY_SKY), ground("gr", 860, SNOW), volcano("vol", 1580, 870, s=0.32),
          '<g id="smk"><circle cx="1600" cy="640" r="24" fill="#999"/><circle cx="1620" cy="600" r="30" fill="#999"/><circle cx="1650" cy="550" r="36" fill="#999"/></g>',
          flakes("fl", 50, 51, y0=-1100, y1=1000), figure("fz", 760, 900, 1.25, mood="sad", ring=True))
    s.label("tt", "1816 – Das Jahr ohne Sommer", 0, 150, size=110, w=1920)
    s.fall("fl", 50, 0, s.dur, dy=(200, 420), seed=51)
    s.draw("#smk", s.w("Vulkan", off=-0.2), 0.6).write("#tt", s.w("keinen", off=0.2), 0.1)
    s.save()


if __name__ == "__main__":
    scenes()
