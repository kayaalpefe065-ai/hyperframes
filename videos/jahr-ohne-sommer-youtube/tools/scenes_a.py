"""Einstieg und Teil 1 – Der Knall (scenes 01–13) plus the chapter cards."""
from kit import *


def chapter(sid, part, title, icon_svg, icon_draw="#icon"):
    s = Scene(sid, dur=3.0, cam=("push", 1.06, 1.0))
    s.add(icon_svg)
    s.add(f'<g id="ul"><path d="M560,640 Q960,610 1360,640" fill="none" style="stroke:{RED};stroke-width:12"/></g>')
    s.label("part", part, 0, 300, size=64, color="#6b645a", w=1920)
    s.label("title", title, 0, 400, size=150, w=1920)
    s.write("#part", 0.15).write("#title", 0.35, gap=0.12).draw("#ul", 0.8, 0.5).draw(icon_draw, 0.5, 0.8)
    return s


def chapters():
    chapter("c1", "Teil 1", "Der Knall", volcano("icon", 960, 900, s=0.32, fill="#9b7653")).save()
    chapter("c2", "Teil 2", "Der Schleier",
            '<g id="icon"><path d="M760,820 Q960,740 1160,820" fill="none" style="stroke:#c9b23a;stroke-width:14"/>'
            '<path d="M780,860 Q960,790 1140,860" fill="none" style="stroke:#c9b23a;stroke-width:10"/></g>').save()
    chapter("c3", "Teil 3", "Der Sommer, der nicht kam",
            '<g id="icon"><path d="M960,740 L960,900 M890,780 L1030,860 M890,860 L1030,780" fill="none" style="stroke:#5a8fc4;stroke-width:12"/></g>').save()
    chapter("c4", "Teil 4", "Hunger",
            '<g id="icon"><ellipse cx="960" cy="830" rx="150" ry="44" fill="#fff"/><ellipse cx="960" cy="822" rx="96" ry="22" fill="#efe3cf" style="stroke-width:5"/></g>').save()
    chapter("c5", "Teil 5", "Was blieb",
            '<g id="icon"><ellipse cx="880" cy="850" rx="26" ry="40" fill="#1f1d1a"/><ellipse cx="960" cy="800" rx="26" ry="40" fill="#1f1d1a"/>'
            '<ellipse cx="1040" cy="850" rx="26" ry="40" fill="#1f1d1a"/></g>').save()
    chapter("c6", "Teil 6", "Heute",
            '<g id="icon"><circle cx="940" cy="810" r="60" fill="#fff" style="stroke-width:10"/><line x1="985" y1="855" x2="1050" y2="920" style="stroke-width:16"/></g>').save()


def scenes():
    # 01 — Stell dir vor, es ist Juni. Du willst ins Freibad. Und draußen … schneit es.
    s = Scene("s01", cam=("push", 1.0, 1.04))
    s.add(sky("sky"), sun("sun", 1560, 220), cloud("cl", -400, 230, 1.3), ground("gr", 790),
          '<g id="snowcover" style="opacity:0">' + ground("snowg", 790, SNOW) + "</g>",
          flakes("fl", 70, 1), figure("fz", -200, 880, 1.25, ring=True, hat=None))
    s.raw_html(calendar("cal", "1816", "Juni", 120, 110))
    s.pop("#cal", s.w("Juni"), origin="50% 50%")
    t = s.w("Freibad", off=-0.6)
    s.fromto("#fz", t, 1.6, {"x": -200}, {"x": 760}, ease="power2.out").walk("fz", t, 1.6)
    t = s.w("draußen")
    s.to("#cl", t, 1.1, x=1700).to("#sun", t + 0.4, 0.6, opacity=0.25).to("#sky", t + 0.3, 0.8, fill=GREY_SKY)
    t = s.w("schneit", off=-0.2)
    s.fall("fl", 70, t, s.dur - t + 0.2).to("#snowcover", t + 0.3, 1.6, ease="sine.in", opacity=1).mood("fz", t, "oh")
    s.save()

    # 02 — Genau das ist passiert. Im Jahr achtzehnhundertsechzehn. Man nennt es: das Jahr ohne Sommer.
    s = Scene("s02", cam=("push", 1.03, 1.0))
    s.add(flakes("fl", 40, 2, y0=-1080, y1=1080, r=(4, 8)))
    s.label("year", "1816", 0, 230, size=300, w=1920)
    s.label("sub", "Das Jahr ohne Sommer", 0, 640, size=110, w=1920)
    s.add(f'<g id="strike"><path d="M1060,722 Q1230,700 1420,716" fill="none" style="stroke:{RED};stroke-width:14"/></g>')
    s.fall("fl", 40, 0, s.dur, dy=(200, 400), seed=2)
    s.write("#year", s.w("achtzehnhundertsechzehn"), 0.1).write("#sub", s.w("Jahr", 2, off=-0.2), 0.12)
    s.draw("#strike", s.w("Sommer", end=True, off=0.1), 0.35)
    s.save()

    # 03 — Ernten verfaulten, Brot wurde unbezahlbar, Menschen wanderten aus. Und am Ende entstand sogar ein Monster.
    s = Scene("s03", cam=("pan", 40, -40))
    s.add(wheat("wh", 330, 560, 0.8, color=ROT, n=5),
          '<g id="bread" transform="translate(800,420)"><path d="M-150,40 Q-160,-70 0,-80 Q160,-70 150,40 Z" fill="#d79a4e"/>'
          '<path d="M-80,-50 L-60,0 M0,-60 L0,0 M80,-50 L60,0" fill="none"/></g>',
          '<g id="tag" transform="translate(940,300) rotate(10)"><path d="M0,0 L150,0 L190,40 L150,80 L0,80 Z" fill="#fff"/><circle cx="160" cy="40" r="8" fill="none"/></g>',
          figure("mig", 1350, 600, 0.9, mood="sad", bundle=True),
          '<g id="monster" transform="translate(1660,560)"><rect x="-90" y="-250" width="180" height="210" rx="16" fill="#9fc48a"/>'
          '<rect x="-96" y="-270" width="192" height="44" fill="#1f1d1a"/><line x1="-120" y1="-120" x2="-90" y2="-120" style="stroke-width:12"/>'
          '<line x1="90" y1="-120" x2="120" y2="-120" style="stroke-width:12"/><circle cx="-38" cy="-160" r="10" fill="#1f1d1a" style="stroke:none"/>'
          '<circle cx="38" cy="-160" r="10" fill="#1f1d1a" style="stroke:none"/><path d="M-50,-90 L50,-90" /><path d="M-20,-226 L-10,-200 L-24,-186" fill="none" style="stroke-width:5"/></g>')
    s.label("l1", "Missernten", 200, 640, size=56).label("l2", "Teuerung", 700, 520, size=56)
    s.label("l3", "Auswanderung", 1190, 650, size=56).label("l4", "ein Monster?", 1530, 620, size=56, color=RED)
    s.label("price", "€€€", 975, 318, size=48, color=RED)
    s.draw("#wh", s.w("Ernten"), 0.7).write("#l1", s.w("verfaulten"))
    s.draw("#bread", s.w("Brot"), 0.6).draw("#tag", s.w("unbezahlbar"), 0.4).write("#price", s.w("unbezahlbar", off=0.3)).write("#l2", s.w("unbezahlbar", end=True))
    s.draw("#mig", s.w("Menschen"), 0.6).write("#l3", s.w("wanderten"))
    s.draw("#monster", s.w("Monster", off=-0.3), 0.7).write("#l4", s.w("Monster", end=True))
    s.save()

    # 04 — Und alles begann mit einem einzigen Berg. Über elftausend Kilometer entfernt.
    s = Scene("s04", cam=("push", 1.0, 1.05))
    s.add(globe("gl", 960, 520, r=380))
    gx, gy = GLOBE_PTS["germany"]; ix, iy = GLOBE_PTS["indonesia"]
    k = 380 / 330
    gx, gy, ix, iy = 960 + gx * k, 520 + gy * k, 960 + ix * k, 520 + iy * k
    s.add(f'<g id="de"><circle cx="{gx:.0f}" cy="{gy:.0f}" r="14" fill="{RED}"/></g>',
          volcano("vol", ix, iy + 20, s=0.13, fill="#9b7653"),
          f'<g id="arc"><path d="M{gx:.0f},{gy:.0f} Q{(gx + ix) / 2 + 140:.0f},{min(gy, iy) - 160:.0f} {ix:.0f},{iy - 40:.0f}" fill="none" style="stroke:{RED};stroke-width:8;stroke-dasharray:none"/></g>')
    s.label("lde", "wir", gx - 140, gy - 40, size=52)
    s.label("lkm", "über 11.000 km", 1320, 150, size=68, cls="box", rot=-3)
    s.draw("#gl", 0.0, 0.9).draw("#de", 0.6, 0.3).write("#lde", 0.7)
    s.pop("#vol", s.w("Berg")).draw("#arc", s.w("elftausend", off=-0.3), 0.9).write("#lkm", s.w("Kilometer"))
    s.save()

    # 05 — Indonesien, die Insel Sumbawa. Hier steht der Tambora, ein Vulkan, über viertausend Meter hoch.
    s = Scene("s05", bg=SEA)
    s.add(waves("sea", 0, SEA, amp=0),
          '<g id="isl"><path d="M380,640 q80,-120 240,-90 q60,-90 200,-60 q100,-40 220,10 q130,-20 240,60 q120,10 200,90 q-60,90 -240,70 '
          'q-140,40 -300,0 q-160,30 -300,-10 q-200,10 -260,-70 z" fill="#c9b27a"/></g>',
          volcano("vol", 1180, 655, s=0.22, fill="#9b7653", snowcap=False))
    s.label("lis", "Sumbawa", 520, 760, size=64)
    s.label("lind", "Indonesien", 80, 80, size=56, cls="box")
    s.write("#lind", s.w("Indonesien")).draw("#isl", s.w("Insel", off=-0.2), 0.8).write("#lis", s.w("Sumbawa"))
    s.draw("#vol", s.w("Tambora", off=-0.4), 0.6)
    s.cam = ("zoom", 1180, 560, 2.3, s.w("Tambora", off=-0.3), 1.3)
    s.add(arrow("h", "M1290,660 L1290,555", width=5))
    s.label("lh", "über 4.000 m", 1180, 470, size=34, cls="box")
    s.label("lt", "Tambora", 1060, 650, size=34)
    s.write("#lt", s.w("Tambora", end=True)).draw("#h", s.w("viertausend", off=-0.2), 0.4).write("#lh", s.w("viertausend", off=0.2))
    s.save()

    # 06 — Am fünften April achtzehnhundertfünfzehn grollt er zum ersten Mal. Am Abend des zehnten April explodiert er.
    s = Scene("s06", cam=("push", 1.0, 1.04))
    s.add(sky("sky", "#bfe3f5"), ground("gr", 860, "#8fb46a"), volcano("vol", 1100, 870, s=1.0),
          '<g id="smoke"><circle cx="1080" cy="300" r="40" fill="#bbb"/><circle cx="1120" cy="250" r="30" fill="#bbb"/></g>',
          '<g id="boom">' + "".join(puff(f"p{k}", 1100 + dx, 330 + dy, r) for k, (dx, dy, r) in enumerate(
              [(0, 0, 150), (-180, -60, 120), (170, -80, 130), (-60, -220, 140), (120, -260, 120), (-260, -200, 100), (260, -220, 100)])) + "</g>",
          '<g id="lava">' + "".join(g(f"lv{k}", f'<circle cx="0" cy="0" r="{16 + k % 3 * 6}" fill="{LAVA}"/>', 1100, 360) for k in range(9)) + "</g>")
    s.raw_html(calendar("cal1", "1815", "5. April", 110, 110, w=300))
    s.raw_html(calendar("cal2", "1815", "10. April", 110, 110, w=300))
    s.pop("#cal1", s.w("fünften"), origin="50% 50%")
    s.draw("#smoke", s.w("grollt"), 0.5).shake("#vol-in", s.w("grollt"), 0.6, 4)
    s.hide("#cal1", s.w("zehnten", off=-0.1), 0.1).pop("#cal2", s.w("zehnten"), origin="50% 50%")
    s.to("#sky", s.w("Abend"), 0.8, fill="#e89a6a")
    t = s.w("explodiert")
    s.beat(t)
    s.shake("#vol-in", t, 1.0, 9)
    for k in range(7):
        s.fromto(f"#p{k}", t + k * 0.04, 0.9, {"scale": 0, "transformOrigin": "50% 50%"}, {"scale": 1}, ease="expo.out")
    import math
    for k in range(9):
        a = -math.pi / 2 + (k - 4) * 0.32
        s.fromto(f"#lv{k}-in", t + 0.05, 1.3, {"x": 0, "y": 0}, {"x": math.cos(a) * 520, "y": math.sin(a) * 380 + 260}, ease="power1.out")
    s.to("#sky", t + 0.2, 0.6, fill="#6d5d5a")
    s.save()

    # 07 — Feuersäulen schießen in den Himmel. Glühende Lawinen aus Asche und Gas rasen die Hänge hinunter, bis ins Meer.
    s = Scene("s07", bg="#4b3f45", cam=("pan", 30, -30))
    s.add(sky("sky", "#4b3f45"), waves("sea", 900, "#3f6f94", amp=14), volcano("vol", 960, 920, s=1.05, crater=True))
    cols = "".join(f'<g id="col{k}"><path d="M{900 + k * 60},540 L{870 + k * 60 + (k - 1) * 40},{120 - k % 2 * 60} L{930 + k * 60 + (k - 1) * 40},{120 - k % 2 * 60} Z" fill="{LAVA}" style="stroke:#7a2b12"/></g>' for k in range(3))
    s.add(cols)
    s.add(f'<g id="flowL"><path d="M840,560 Q700,700 560,820 Q470,880 400,915" fill="none" style="stroke:{ASH};stroke-width:46"/>'
          f'<path d="M840,560 Q700,700 560,820 Q470,880 400,915" fill="none" style="stroke:{LAVA};stroke-width:14"/></g>',
          f'<g id="flowR"><path d="M1080,560 Q1220,690 1380,820 Q1470,880 1560,915" fill="none" style="stroke:{ASH};stroke-width:46"/>'
          f'<path d="M1080,560 Q1220,690 1380,820 Q1470,880 1560,915" fill="none" style="stroke:{LAVA};stroke-width:14"/></g>',
          '<g id="steam">' + "".join(puff(f"st{k}", x, 880, r, "#ddd") for k, (x, r) in enumerate([(380, 50), (440, 36), (1560, 50), (1500, 36)])) + "</g>")
    t = s.w("Feuersäulen")
    for k in range(3):
        s.fromto(f"#col{k}", t + k * 0.12, 0.6, {"scaleY": 0, "transformOrigin": "50% 100%"}, {"scaleY": 1}, ease="expo.out")
    s.label("ll", "Glutlawinen", 1300, 640, size=56, color="#fff")
    s.draw("#flowL", s.w("Lawinen"), 1.6).draw("#flowR", s.w("Lawinen", off=0.2), 1.6).write("#ll", s.w("Asche"))
    for k in range(4):
        s.fromto(f"#st{k}", s.w("Meer", off=-0.2) + k * 0.08, 0.7, {"scale": 0, "transformOrigin": "50% 100%"}, {"scale": 1}, ease="expo.out")
    s.save()

    # 08 — Den Knall hört man über tausend Kilometer weit. Auf Java hält man ihn für Kanonendonner und schickt Soldaten los.
    s = Scene("s08", cam=("push", 1.0, 1.03))
    s.add(ground("gr", 860, "#c9b27a"), volcano("vol", 260, 870, s=0.35))
    s.add('<g id="waves">' + "".join(f'<g id="wv{k}"><path d="M{300 + k * 150},{560 - k * 40} Q{360 + k * 160},{700} {300 + k * 150},{840 + k * 10}" fill="none" style="stroke-width:8"/></g>' for k in range(5)) + "</g>")
    s.add('<g id="cannon" transform="translate(1180,860)"><rect x="-10" y="-120" width="220" height="70" rx="30" fill="#555" transform="rotate(-14)"/>'
          '<circle cx="40" cy="-40" r="40" fill="#8a5a3c"/><circle cx="40" cy="-40" r="10" fill="#1f1d1a"/></g>',
          '<g id="sol">' + figure("so1", 1460, 860, 0.8, mood="oh", hat="shako") + figure("so2", 1620, 860, 0.8, mood="oh", hat="shako") + "</g>")
    s.label("lk", "über 1.000 km", 700, 420, size=64, cls="box", rot=-2)
    s.label("lq", "Kanonen?", 1300, 560, size=72, color=RED, rot=-4)
    s.label("lj", "Java", 1500, 160, size=56, cls="box")
    t = s.w("Knall")
    for k in range(5):
        s.draw(f"#wv{k}", t + k * 0.15, 0.4)
    s.write("#lk", s.w("tausend")).write("#lj", s.w("Java"))
    s.draw("#cannon", s.w("Kanonendonner", off=-0.2), 0.5).write("#lq", s.w("Kanonendonner", end=True))
    s.draw("#sol", s.w("Soldaten", off=-0.3), 0.5)
    t = s.w("los")
    s.to("#sol", t, 1.6, ease="power1.inOut", x=-420).walk("so1", t, 1.6).walk("so2", t, 1.6)
    s.save()

    # 09 — Rund um den Berg wird es tagelang stockdunkel. Tag und Nacht sind nicht mehr zu unterscheiden.
    s = Scene("s09", cam=("push", 1.0, 1.04))
    s.add(sky("sky", "#c9c2b8"), ground("gr", 860, "#a9a08f"), volcano("vol", 1500, 870, s=0.6),
          house("h1", 450, 880, 0.9), house("h2", 800, 880, 0.75), figure("fig", 1050, 880, 1.0, mood="oh", lantern=True))
    s.front(f'<rect id="dark" x="-40" y="-40" width="2000" height="1160" fill="{NIGHT}" style="opacity:0"/>',
            '<g id="lamp" style="opacity:0"><circle cx="1096" cy="752" r="70" fill="#ffd34d" style="opacity:0.35"/><rect x="1080" y="740" width="32" height="40" rx="6" fill="#ffd34d"/></g>')
    s.raw_html('<div id="eq" class="label" style="left:0;top:220px;width:1920px;text-align:center;font-size:110px;color:#fff;">'
               '<span class="wd">☀</span> <span class="wd">=</span> <span class="wd">☾</span></div>')
    s.to("#dark", s.w("stockdunkel", off=-0.3), 1.2, opacity=0.86).show("#lamp", s.w("stockdunkel", off=0.3), 0.4)
    s.write("#eq", s.w("Tag", 2), 0.25)
    s.save()

    # 10 — Danach ist der Tambora fast eineinhalb Kilometer niedriger. Wo der Gipfel war, klafft ein riesiger Krater.
    s = Scene("s10", cam=("push", 1.0, 1.03))
    s.add(sky("sky", "#d9e4ea"), ground("gr", 880, "#a9a08f"),
          '<g id="old"><path d="M-90,-500 Q0,-540 90,-500 L170,-380 L-170,-380 Z" transform="translate(620,890)" fill="none" style="stroke-dasharray:18 16;stroke:#7a746b"/></g>',
          volcano("vol", 620, 890, s=1.0, crater=True))
    s.add(arrow("h", "M620,330 L620,450", width=6))
    s.label("lh", "fast 1,5 km weniger", 140, 210, size=52, cls="box")
    s.photo("ph", "assets/img/tambora.jpg", 1130, 330, 640, 480, "Krater heute · Foto: NASA (ISS)", rot=3)
    s.label("lk", "Krater: 6 km breit", 1180, 230, size=52, color=RED)
    s.show("#old", 0.2, 0.3).draw("#h", s.w("eineinhalb", off=-0.2), 0.5).write("#lh", s.w("niedriger"))
    s.slap("#ph", s.w("Wo", off=-0.1)).write("#lk", s.w("Gipfel"))
    s.save()

    # 11 — Es ist der stärkste Vulkanausbruch der überlieferten Geschichte. Viel stärker als der berühmte Krakatau.
    s = Scene("s11", cam=("push", 1.0, 1.03))
    s.add(ground("gr", 880, "#c9b27a"), volcano("v1", 640, 880, s=0.5), volcano("v2", 1460, 880, s=0.5))
    big = [(0, 0, 160), (-140, -80, 130), (130, -90, 140), (-40, -230, 150), (110, -260, 120), (-200, -220, 110), (220, -230, 100), (0, -380, 130)]
    small = [(0, 0, 70), (-60, -40, 55), (60, -45, 60)]
    s.add('<g id="c1">' + "".join(f'<circle cx="{640 + dx}" cy="{460 + dy}" r="{r}" fill="{ASH}"/>' for dx, dy, r in big) + "</g>",
          '<g id="c2">' + "".join(f'<circle cx="{1460 + dx}" cy="{560 + dy}" r="{r}" fill="{ASH}"/>' for dx, dy, r in small) + "</g>")
    s.label("l1", "Tambora 1815", 440, 900, size=60).label("l2", "Krakatau 1883", 1260, 900, size=60)
    s.label("badge", "Nr. 1", 1000, 120, size=80, cls="box", color=RED, rot=6)
    s.write("#l1", 0.2).draw("#c1", s.w("stärkste", off=-0.2), 0.9).pop("#badge", s.w("Geschichte"), origin="50% 50%")
    s.write("#l2", s.w("Krakatau", off=-0.3)).draw("#c2", s.w("Krakatau"), 0.5)
    s.save()

    # 12 — Mehr als zehntausend Menschen sterben sofort. Ganze Dörfer, sogar ein kleines Königreich, verschwinden unter der Asche.
    s = Scene("s12", cam=("push", 1.0, 1.03))
    s.add(sky("sky", "#cfc8bd"), house("h1", 380, 860, 0.8), house("h2", 640, 860, 0.65), house("h3", 1300, 860, 0.7),
          '<g id="palace" transform="translate(960,860)"><rect x="-160" y="-260" width="320" height="260" fill="#efe3cf"/>'
          '<path d="M-180,-260 L0,-380 L180,-260 Z" fill="#b5533c"/><path d="M-36,-430 L-42,-480 L-18,-452 L0,-500 L18,-452 L42,-480 L36,-430 Z" fill="#ffd34d"/></g>',
          ground("gr", 870, "#a9a08f"))
    s.front(f'<rect id="ash" x="-40" y="1080" width="2000" height="900" fill="#9a958e" style="stroke:#1f1d1a;stroke-width:7"/>')
    s.label("ln", "über 10.000 Tote", 0, 120, size=80, w=1920)
    s.write("#ln", s.w("zehntausend"))
    s.to("#ash", s.w("verschwinden", off=-0.3), 2.2, ease="power1.inOut", y=-560)
    s.save()

    # 13 — Und dann kommt der Hunger. Die Asche hat Felder und Brunnen begraben. Zehntausende weitere sterben.
    s = Scene("s13", cam=("pan", -30, 30))
    s.add(sky("sky", "#d8d2c6"), ground("gr", 820, "#9a958e"), wheat("wh", 520, 830, 0.8, color="#9a8e6a", n=6),
          '<g id="well" transform="translate(1260,830)"><rect x="-110" y="-120" width="220" height="120" fill="#c9c2b8"/>'
          '<line x1="-90" y1="-120" x2="-90" y2="-300"/><line x1="90" y1="-120" x2="90" y2="-300"/><path d="M-130,-300 L0,-370 L130,-300 Z" fill="#8a5a3c"/></g>',
          '<g id="ashfall">' + "".join(f'<circle cx="{(k * 197) % 1920}" cy="{(k * 131) % 700 - 750}" r="{4 + k % 4}" fill="#8d8b88" style="stroke:none"/>' for k in range(60)) + "</g>",
          '<g id="bowl" transform="translate(1600,900)"><path d="M-110,-60 Q0,60 110,-60 Z" fill="#fff"/></g>')
    s.label("lh", "Hunger", 0, 140, size=120, w=1920, color=RED)
    s.label("lz", "Zehntausende weitere Opfer", 0, 300, size=64, w=1920)
    s.write("#lh", s.w("Hunger")).to("#ashfall", s.w("Asche", off=-0.2), 2.5, ease="none", y=760)
    for k in range(6):
        s.to(f"#wh-{k}", s.w("Felder") + k * 0.05, 0.8, ease="power2.in", rotation=60 + k * 6, transformOrigin="50% 100%")
    s.draw("#bowl", s.w("begraben"), 0.5).write("#lz", s.w("Zehntausende"))
    s.save()


if __name__ == "__main__":
    chapters()
    scenes()
