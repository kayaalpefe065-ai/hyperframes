"""Teil 4 – Hunger (29–37) und Teil 5 – Was blieb (38–46)."""
from kit import *


def sack(id_, x, y, s=1.0, label="Getreide"):
    return g(id_, '<path d="M-110,0 Q-140,-160 -70,-230 L-90,-270 L90,-270 L70,-230 Q140,-160 110,0 Z" fill="#d9c08a"/>'
                  '<path d="M-80,-250 L80,-250" fill="none"/>', x, y, s)


def horse(id_, x, y, s=1.0, sad=True):
    head = "M150,-250 L230,-200 L220,-170 L150,-200" if sad else "M150,-250 L230,-300 L240,-270 L160,-220"
    inner = ('<ellipse cx="0" cy="-200" rx="170" ry="70" fill="#a8774f"/>'
             '<line x1="-120" y1="-150" x2="-130" y2="0"/><line x1="-70" y1="-140" x2="-60" y2="0"/>'
             '<line x1="80" y1="-140" x2="70" y2="0"/><line x1="130" y1="-150" x2="140" y2="0"/>'
             f'<path d="M120,-230 L170,-300 L150,-250 Z" fill="#a8774f"/><path d="{head} Z" fill="#a8774f"/>'
             '<path d="M-170,-220 Q-230,-190 -210,-120" fill="none" style="stroke-width:10"/>'
             '<circle cx="185" cy="-232" r="5" fill="#1f1d1a" style="stroke:none"/>' if sad else "")
    return g(id_, inner, x, y, s)


def laufmaschine(id_, x, y, s=1.0):
    return g(id_, '<circle cx="-170" cy="-90" r="90" fill="none"/><circle cx="170" cy="-90" r="90" fill="none"/>'
                  '<line x1="-170" y1="-90" x2="170" y2="-90" style="stroke:#8a5a3c;stroke-width:16"/>'
                  '<line x1="170" y1="-90" x2="150" y2="-220"/><line x1="110" y1="-220" x2="190" y2="-220"/>'
                  '<path d="M-60,-112 L40,-112 L30,-96 L-50,-96 Z" fill="#8a5a3c"/>', x, y, s)


def scenes():
    # 29 — Für die Bauern ist es eine Katastrophe. Das Getreide wird nicht reif. Es verfault auf den nassen Feldern.
    s = Scene("s29", cam=("push", 1.0, 1.04))
    s.add(sky("sky", "#a9b1ba"), ground("gr", 860, "#7d6b4a"), wheat("w1", 560, 870, 1.0, color="#9ec27a", n=9, gap=60),
          wheat("w2", 1500, 870, 0.9, color="#9ec27a", n=5, gap=60), figure("fig", 1050, 900, 1.1, mood="sad", hat="cap"),
          rain("rn", 70, 29, 0, 1920, -200, 860))
    s.label("lr", "nicht reif", 300, 260, size=64, cls="box", rot=-3)
    s.label("lv", "verfault", 1350, 300, size=64, cls="box", color=RED, rot=3)
    s.fromto("#rn", 0, s.dur, {"y": 0}, {"y": 200}, ease="none")
    s.write("#lr", s.w("reif"))
    t = s.w("verfault", off=-0.2)
    for k in range(9):
        s.to(f"#w1-{k}", t + k * 0.06, 1.0, ease="power2.in", rotation=(50 if k % 2 else -45), transformOrigin="50% 100%")
    for k in range(5):
        s.to(f"#w2-{k}", t + 0.2 + k * 0.06, 1.0, ease="power2.in", rotation=(-50 if k % 2 else 45), transformOrigin="50% 100%")
    s.write("#lv", s.w("verfault", end=True))
    s.save()

    # 30 — Kartoffeln faulen in der Erde. Und der Wein wird so sauer, dass man ihn kaum trinken kann.
    s = Scene("s30", cam=("push", 1.0, 1.03))
    s.add('<rect x="-40" y="560" width="1000" height="560" fill="#8a6a45" style="stroke:none"/><line x1="-40" y1="560" x2="960" y2="560"/>')
    for k, (x, y) in enumerate([(200, 700), (420, 820), (650, 690), (800, 860)]):
        s.add(g(f"p{k}", '<ellipse cx="0" cy="0" rx="70" ry="48" fill="#d6b06a"/>', x, y))
    s.add('<g id="glass" transform="translate(1330,700)"><path d="M-90,-300 L90,-300 Q90,-130 0,-110 Q-90,-130 -90,-300 Z" fill="#fff"/>'
          '<path d="M-82,-240 L82,-240 Q80,-140 0,-122 Q-80,-140 -82,-240 Z" fill="#8e2747"/><line x1="0" y1="-110" x2="0" y2="0"/>'
          '<line x1="-70" y1="0" x2="70" y2="0"/></g>', figure("fig", 1640, 900, 1.1))
    s.label("lk", "Kartoffeln", 280, 470, size=60).label("ls", "sauer!", 1440, 280, size=80, color="#7a9a1a", rot=-5)
    s.write("#lk", s.w("Kartoffeln"))
    t = s.w("faulen")
    for k in range(4):
        s.to(f"#p{k}-in", t + k * 0.15, 0.8, scale=0.8, transformOrigin="50% 50%")
    s.js.append('tl.to("#p0-in ellipse, #p1-in ellipse, #p2-in ellipse, #p3-in ellipse", { fill: "#4f3f2a", duration: 1.2, ease: "none" }, %s);' % t)
    s.draw("#glass", s.w("Wein"), 0.5).mood("fig", s.w("sauer"), "oh").write("#ls", s.w("sauer")).shake("#fig-head", s.w("sauer"), 0.4, 5)
    s.save()

    # 31 — Die Folge: Die Preise explodieren. Getreide kostet bald zwei-, dreimal so viel wie vorher.
    s = Scene("s31", cam=("push", 1.0, 1.03))
    s.add(sack("sk", 400, 860, 1.3),
          '<g id="axes"><line x1="760" y1="860" x2="1800" y2="860"/><line x1="760" y1="860" x2="760" y2="160"/></g>',
          f'<g id="line"><path d="M780,780 L1000,770 L1150,740 L1300,600 L1450,420 L1650,220" fill="none" style="stroke:{RED};stroke-width:12"/></g>')
    s.label("lg", "Getreide", 300, 420, size=56)
    s.label("x2", "×2", 1360, 470, size=96, color=RED).label("x3", "×3", 1600, 120, size=110, color=RED)
    s.label("ly", "1815", 760, 880, size=40).label("ly2", "1817", 1600, 880, size=40)
    s.draw("#sk", 0.1, 0.5).write("#lg", 0.3).draw("#axes", 0.4, 0.4).write("#ly", 0.6).write("#ly2", 0.7)
    s.draw("#line", s.w("explodieren", off=-0.3), 1.3).write("#x2", s.w("zwei")).write("#x3", s.w("dreimal"))
    s.save()

    # 32 — Im Winter und im Frühjahr achtzehnhundertsiebzehn wird der Hunger richtig schlimm.
    s = Scene("s32", bg="#d9d3c8", cam=("push", 1.0, 1.04))
    s.add('<rect x="-40" y="-40" width="2000" height="1160" fill="#d9d3c8" style="stroke:none"/>',
          '<g id="win"><rect x="1300" y="140" width="380" height="320" fill="#5d6b80"/><line x1="1490" y1="140" x2="1490" y2="460"/><line x1="1300" y1="300" x2="1680" y2="300"/></g>',
          flakes("fl", 14, 32, 1310, 1670, 150, 450, r=(4, 8)),
          '<g id="table"><rect x="400" y="700" width="1100" height="40" fill="#8a5a3c"/><line x1="460" y1="740" x2="460" y2="1000"/><line x1="1440" y1="740" x2="1440" y2="1000"/></g>',
          '<g id="plate"><ellipse cx="950" cy="690" rx="170" ry="34" fill="#fff"/><ellipse cx="950" cy="686" rx="100" ry="16" fill="#f1ece2" style="stroke-width:4"/></g>',
          figure("fig", 700, 700, 0.9, mood="sad"))
    s.raw_html(calendar("cal", "Winter", "1817", 160, 140, w=260, color="#5d6b80"))
    s.label("lh", "Hunger", 1060, 520, size=90, color=RED)
    s.draw("#win", 0.1, 0.5).pop("#cal", s.w("achtzehnhundertsiebzehn"), origin="50% 50%").draw("#plate", s.w("Hunger", off=-0.4), 0.4).write("#lh", s.w("Hunger"))
    s.save()

    # 33 — Menschen strecken ihr Brot mit Sägemehl und Baumrinde. Sie essen Gras, Moos und Brennnesseln.
    s = Scene("s33", cam=("push", 1.0, 1.03))
    s.add('<g id="bread" transform="translate(960,560)"><path d="M-220,60 Q-230,-110 0,-120 Q230,-110 220,60 Z" fill="#b9915a"/>'
          '<path d="M-120,-80 L-90,0 M0,-90 L0,0 M120,-80 L90,0" fill="none"/></g>',
          '<g id="saw"><path d="M300,420 Q380,300 460,420 Z" fill="#e6c98f"/></g>',
          '<g id="bark"><path d="M1480,300 L1640,280 L1650,420 L1490,440 Z" fill="#7a5a3a"/><path d="M1520,320 L1600,310 M1520,360 L1620,350 M1520,400 L1600,390" fill="none" style="stroke-width:4"/></g>',
          '<g id="grass"><path d="M330,780 L350,640 L370,780 L400,620 L420,780 L450,660 L470,780" fill="none" style="stroke:#5e8f34;stroke-width:9"/></g>',
          '<g id="moss"><ellipse cx="960" cy="760" rx="130" ry="50" fill="#7da34a"/><circle cx="900" cy="740" r="14" fill="#9cc364" style="stroke-width:4"/><circle cx="1010" cy="750" r="14" fill="#9cc364" style="stroke-width:4"/></g>',
          '<g id="nettle"><line x1="1560" y1="800" x2="1560" y2="600" style="stroke:#4c7a2a"/><path d="M1560,680 q-80,-20 -90,-80 q70,10 90,80 z M1560,640 q80,-20 90,-80 q-70,10 -90,80 z" fill="#5e8f34"/></g>')
    s.label("l1", "Sägemehl", 280, 460, size=52).label("l2", "Baumrinde", 1460, 460, size=52)
    s.label("l3", "Gras", 345, 800, size=52).label("l4", "Moos", 905, 820, size=52).label("l5", "Brennnesseln", 1435, 815, size=52)
    s.draw("#bread", 0.1, 0.5).draw("#saw", s.w("Sägemehl", off=-0.2), 0.4).write("#l1", s.w("Sägemehl"))
    s.draw("#bark", s.w("Baumrinde", off=-0.2), 0.4).write("#l2", s.w("Baumrinde"))
    s.draw("#grass", s.w("Gras", off=-0.2), 0.4).write("#l3", s.w("Gras")).draw("#moss", s.w("Moos", off=-0.2), 0.4).write("#l4", s.w("Moos"))
    s.draw("#nettle", s.w("Brennnesseln", off=-0.2), 0.4).write("#l5", s.w("Brennnesseln"))
    s.save()

    # 34 — Bettler ziehen von Dorf zu Dorf. In der Schweiz und in Süddeutschland sterben Tausende.
    s = Scene("s34", cam=("push", 1.0, 1.03))
    s.add(ground("gr", 880, "#c9b98f"), house("h1", 200, 880, 0.6), house("h2", 900, 880, 0.6),
          '<g id="beg">' + figure("b1", 360, 900, 0.7, mood="sad", bundle=True) + figure("b2", 480, 900, 0.6, mood="sad") + "</g>")
    s.photo("ph", "assets/img/hunger1817.jpg", 1060, 140, 760, 470, "Hungersnot 1817 im Toggenburg · zeitgenössisch", rot=2, pos="50% 40%")
    s.label("lt", "Tausende Hungertote", 1100, 700, size=60, cls="box", color=RED)
    t = s.w("ziehen", off=-0.2)
    s.to("#beg", t, 2.2, ease="power1.inOut", x=460).walk("b1", t, 2.2).walk("b2", t, 2.2)
    s.slap("#ph", s.w("Schweiz", off=-0.3)).write("#lt", s.w("Tausende"))
    s.save()

    # 35 — Wer kann, packt seine Sachen. Aus Baden und Württemberg wandern Zehntausende aus.
    s = Scene("s35", cam=("pan", 40, -60))
    s.add(ground("gr", 880, "#b9c38f"), house("h", 260, 880, 0.9),
          '<g id="cart" transform="translate(620,880)"><rect x="-140" y="-200" width="280" height="110" fill="#a8774f"/>'
          '<circle cx="-90" cy="-60" r="60" fill="#fff"/><circle cx="90" cy="-60" r="60" fill="#fff"/><path d="M-120,-200 Q0,-320 120,-200 Z" fill="#efe3cf"/></g>',
          figure("fam", 830, 900, 1.0, mood="sad", bundle=True))
    rnd = random.Random(35)
    crowd = "".join(figure(f"m{k}", 1000 + (k % 8) * 115 + rnd.randint(-20, 20), 900 - (k // 8) * 90, 0.5, mood="sad") for k in range(16))
    s.add(f'<g id="crowd">{crowd}</g>')
    s.label("lb", "Baden & Württemberg", 100, 90, size=64, cls="box")
    s.label("lz", "Zehntausende", 1250, 330, size=84, color=RED)
    s.draw("#cart", s.w("packt"), 0.6).write("#lb", s.w("Baden"))
    t = s.w("Zehntausende", off=-0.3)
    for k in range(16):
        s.draw(f"#m{k}", t + k * 0.06, 0.3)
    s.write("#lz", s.w("Zehntausende", end=True))
    s.save()

    # 36 — Die einen ziehen die Donau hinunter nach Russland, bis in den Kaukasus. Die anderen über Holland nach Amerika.
    s = Scene("s36", bg="#efe7d6", cam=("push", 1.0, 1.02))
    s.add(f'<g id="home"><circle cx="760" cy="460" r="22" fill="{RED}"/></g>',
          '<g id="donau"><path d="M760,480 Q900,520 1050,500 T1350,560 T1600,620" fill="none" style="stroke:#5a8fc4;stroke-width:12"/></g>',
          arrow("east", "M1620,600 Q1700,560 1760,470", color=RED, width=9),
          arrow("west", "M730,440 Q600,330 470,330", color=RED, width=9),
          '<g id="sea"><path d="M-40,200 Q140,260 240,420 Q300,620 160,900 L-40,900 Z" fill="#9cc6e6"/></g>',
          arrow("ocean", "M400,320 Q260,360 140,480", color=RED, width=9),
          g("boat", '<path d="M-40,0 L40,0 L30,16 L-30,16 Z" fill="#8a5a3c"/><line x1="0" y1="0" x2="0" y2="-40"/><path d="M0,-38 L28,-8 L0,-8 Z" fill="#fff"/>', 800, 470))
    s.label("lw", "Württemberg", 640, 380, size=44)
    s.label("ld", "Donau", 1100, 540, size=44, color="#3a6fb0")
    s.label("lr", "Russland / Kaukasus", 1440, 380, size=52, cls="box")
    s.label("lh", "Holland", 380, 240, size=44, cls="box")
    s.label("la", "Amerika", 40, 560, size=56, cls="box")
    s.draw("#home", 0.1, 0.3).write("#lw", 0.2)
    s.draw("#donau", s.w("Donau", off=-0.2), 1.0).write("#ld", s.w("Donau")).fromto("#boat-in", s.w("Donau"), 2.4, {"x": 0, "y": 0}, {"x": 760, "y": 150}, ease="power1.inOut")
    s.draw("#east", s.w("Russland", off=-0.2), 0.6).write("#lr", s.w("Russland"))
    s.draw("#west", s.w("anderen"), 0.6).write("#lh", s.w("Holland")).draw("#sea", s.w("Holland", off=0.2), 0.5).draw("#ocean", s.w("Amerika", off=-0.3), 0.6).write("#la", s.w("Amerika"))
    s.save()

    # 37 — Viele erreichen ihr Ziel nie. Auf den überfüllten Schiffen sterben unzählige an Krankheiten.
    s = Scene("s37", bg="#c9d2da", cam=("push", 1.0, 1.04))
    s.add(sky("sky", "#b8c1ca"), cloud("c1", 400, 180, 1.0, "#8f98a3"), cloud("c2", 1500, 150, 1.2, "#848d98"),
          ship("sh", 960, 820, 1.1, heads=12, seed=37), waves("wv", 800, "#4f7fa8", amp=26))
    s.label("lu", "überfüllt", 1360, 360, size=64, cls="box", rot=3)
    s.fromto("#sh-in", 0, s.dur, {"rotation": -3, "svgOrigin": "0 0"}, {"rotation": 3, "svgOrigin": "0 0"}, ease="sine.inOut")
    s.write("#lu", s.w("überfüllten"))
    s.js.append('tl.to("#sh-heads circle:nth-child(3n)", { fill: "#b7b2a8", duration: 0.8, ease: "none" }, %s);' % s.w("Krankheiten", off=-0.3))
    s.save()

    # 38 — Doch das Jahr ohne Sommer hat nicht nur Leid hinterlassen. Sondern auch ein paar überraschende Spuren.
    s = Scene("s38", cam=("pan", -40, 40))
    for k in range(9):
        x, y = 200 + k * 180, 760 - (k % 2) * 70 - k * 40
        s.add(g(f"fp{k}", '<ellipse cx="0" cy="0" rx="26" ry="40" fill="#1f1d1a"/><circle cx="-14" cy="-56" r="8" fill="#1f1d1a"/>'
                          '<circle cx="2" cy="-60" r="8" fill="#1f1d1a"/><circle cx="16" cy="-54" r="7" fill="#1f1d1a"/>', x, y, rot=70))
    s.label("q", "?", 1680, 200, size=160, color=RED)
    t = s.w("Spuren", off=-0.9)
    for k in range(9):
        s.draw(f"#fp{k}", t + k * 0.1, 0.2)
    s.write("#q", s.w("Spuren", end=True))
    s.save()

    # 39 — Juni achtzehnhundertsechzehn, eine Villa am Genfer See. Wegen des Dauerregens sitzen ein paar junge Engländer drinnen fest.
    s = Scene("s39", cam=("push", 1.0, 1.04))
    s.photo("ph", "assets/img/diodati.jpg", 220, 120, 940, 640, "Villa Diodati (Stich) · Rijksmuseum, CC0", rot=-2)
    s.add(rain("rn", 80, 39, 0, 1920, -300, 900, color="#4f7fb0"),
          house("h", 1520, 880, 0.9), figure("f1", 1450, 840, 0.45, mood="sad"), figure("f2", 1530, 840, 0.45, mood="sad"), figure("f3", 1610, 840, 0.45, mood="sad"))
    s.raw_html(calendar("cal", "1816", "Juni", 1300, 120, w=230))
    s.label("lv", "Villa Diodati", 1260, 420, size=60, cls="box")
    s.pop("#cal", s.w("Juni"), origin="50% 50%").slap("#ph", s.w("Villa", off=-0.3)).write("#lv", s.w("Genfer"))
    s.draw("#rn", s.w("Dauerregens", off=-0.3), 0.6).fromto("#rn", s.w("Dauerregens", off=-0.3), s.dur, {"y": 0}, {"y": 220}, ease="none")
    s.draw("#h", s.w("sitzen", off=-0.3), 0.5)
    s.save()

    # 40 — Lord Byron schlägt einen Wettbewerb vor: Jeder soll eine Gruselgeschichte schreiben.
    s = Scene("s40", bg="#e9e2d2", cam=("push", 1.0, 1.03))
    s.photo("ph", "assets/img/byron.jpg", 200, 110, 520, 680, "Lord Byron · Th. Phillips, 1813", rot=-3, pos="50% 25%")
    s.add('<g id="paper"><path d="M1000,820 L1560,820 L1520,420 L1040,420 Z" fill="#fffdf6"/>'
          + "".join(f'<line x1="{1080 + k * 6}" y1="{480 + k * 60}" x2="{1460 - k * 6}" y2="{480 + k * 60}" style="stroke-width:4;stroke:#9a948a"/>' for k in range(5)) + "</g>",
          '<g id="candle"><rect x="1660" y="560" width="60" height="260" fill="#fffaf0"/><path d="M1690,560 q-24,-50 0,-90 q24,40 0,90 z" fill="#ffd34d"/></g>',
          '<g id="ghost"><path d="M1200,640 Q1200,520 1280,520 Q1360,520 1360,640 L1360,720 L1330,700 L1300,720 L1270,700 L1240,720 L1200,700 Z" fill="#fff"/>'
          '<circle cx="1255" cy="600" r="9" fill="#1f1d1a"/><circle cx="1305" cy="600" r="9" fill="#1f1d1a"/></g>')
    s.label("lw", "Wettbewerb:", 900, 160, size=72)
    s.label("lg", "die beste Gruselgeschichte", 900, 260, size=60, color=RED)
    s.slap("#ph", s.w("Byron", off=-0.4)).write("#lw", s.w("Wettbewerb")).draw("#paper", s.w("Jeder"), 0.5).draw("#candle", s.w("Jeder", off=0.2), 0.4)
    s.write("#lg", s.w("Gruselgeschichte")).draw("#ghost", s.w("schreiben", off=-0.2), 0.6)
    s.save()

    # 41 — Die achtzehnjährige Mary Shelley erfindet dabei eine Figur, die bis heute weltberühmt ist: Frankenstein.
    s = Scene("s41", bg="#e9e2d2", cam=("push", 1.0, 1.03))
    s.photo("ph", "assets/img/shelley.jpg", 180, 110, 540, 700, "Mary Shelley · R. Rothwell, 1840", rot=-2, pos="50% 22%")
    s.photo("fr", "assets/img/frankenstein.jpg", 1120, 100, 560, 720, "„Frankenstein“, Ausgabe 1831", rot=3, pos="50% 35%")
    s.label("la", "18 Jahre alt", 760, 260, size=60, cls="box", rot=-4)
    s.slap("#ph", s.w("Mary", off=-0.4)).write("#la", s.w("achtzehnjährige"))
    s.slap("#fr", s.w("Frankenstein", off=-0.2))
    s.save()

    # 42 — Zweite Spur: Mannheim. Hafer ist so teuer, dass viele Pferde nicht mehr gefüttert werden können.
    s = Scene("s42", cam=("push", 1.0, 1.03))
    s.add(ground("gr", 880, "#c9b98f"), sack("sk", 420, 880, 1.1), horse("hs", 1300, 880, 1.2),
          '<g id="tag" transform="translate(560,520) rotate(12)"><path d="M0,0 L220,0 L260,50 L220,100 L0,100 Z" fill="#fff"/></g>')
    s.label("lm", "Mannheim", 100, 90, size=64, cls="box")
    s.label("lh", "Hafer", 340, 700, size=52)
    s.label("lp", "€€€", 610, 535, size=60, color=RED)
    s.write("#lm", s.w("Mannheim")).draw("#sk", s.w("Hafer", off=-0.2), 0.5).write("#lh", s.w("Hafer"))
    s.draw("#tag", s.w("teuer", off=-0.2), 0.4).write("#lp", s.w("teuer")).draw("#hs", s.w("Pferde", off=-0.3), 0.7)
    s.save()

    # 43 — Achtzehnhundertsiebzehn baut Karl Drais eine Laufmaschine. Zwei Räder, ein Lenker, kein Pferd. Der Urahn des Fahrrads.
    s = Scene("s43", cam=("none",))
    s.photo("ph", "assets/img/drais.jpg", 120, 90, 640, 480, "Drais-Laufmaschine 1817 · gemeinfrei", rot=-3)
    s.add(ground("gr", 900, "#c9b98f"),
          '<g id="rider">' + laufmaschine("lm", 0, 0, 1.0) + figure("dr", 0, -130, 0.95, hat="top") + "</g>",
          f'<g id="nohorse"><circle cx="1650" cy="230" r="90" fill="#fff"/><path d="M1590,250 L1700,250 L1700,210 L1640,210 L1610,180 Z" fill="#a8774f" style="stroke-width:4"/>'
          f'<line x1="1585" y1="165" x2="1715" y2="295" style="stroke:{RED};stroke-width:12"/></g>')
    s.js.append('tl.set("#rider", { x: 1000, y: 900 }, 0);')
    s.label("lr", "2 Räder", 640, 740, size=52).label("ll", "Lenker", 1230, 560, size=52)
    s.label("lu", "Urahn des Fahrrads", 820, 140, size=68, cls="box", rot=-2)
    s.raw_html('<div id="year" class="label" style="left:860px;top:300px;font-size:90px;"><span class="wd">1817</span></div>')
    s.write("#year", s.w("Achtzehnhundertsiebzehn")).slap("#ph", s.w("Drais", off=-0.2))
    s.draw("#lm", s.w("Laufmaschine", off=-0.2), 0.7).draw("#dr", s.w("Laufmaschine", off=0.2), 0.5)
    s.write("#lr", s.w("Räder")).write("#ll", s.w("Lenker")).draw("#nohorse", s.w("kein"), 0.5)
    t = s.w("Urahn", off=-0.3)
    s.to("#rider", t, s.dur - t, ease="power1.in", x=1500).write("#lu", s.w("Urahn"))
    s.save()

    # 44 — Ob der Hafermangel ihn wirklich darauf brachte, ist nicht sicher. Aber manche Forscher vermuten es.
    s = Scene("s44", cam=("push", 1.0, 1.03))
    s.add(sack("sk", 420, 760, 0.9), laufmaschine("lm", 1450, 760, 0.8),
          arrow("ar", "M600,560 Q960,440 1280,560", width=8),
          figure("res", 960, 950, 0.8, hat="top"),
          '<g id="lens"><circle cx="1040" cy="700" r="40" fill="#fffdf6"/><line x1="1068" y1="728" x2="1098" y2="758" style="stroke-width:10"/></g>')
    s.label("q", "?", 900, 330, size=150, color=RED)
    s.label("lt", "Vermutung, nicht bewiesen", 0, 120, size=64, w=1920)
    s.draw("#sk", 0.1, 0.4).draw("#lm", 0.3, 0.5).draw("#ar", s.w("Hafermangel", off=-0.2), 0.6).write("#q", s.w("sicher", off=-0.2))
    s.draw("#res", s.w("Forscher", off=-0.3), 0.5).draw("#lens", s.w("vermuten", off=-0.2), 0.3).write("#lt", s.w("vermuten"))
    s.save()

    # 45 — Und in Württemberg gründet König Wilhelm der Erste eine Landwirtschaftsschule. Damit so ein Hunger nie wieder passiert.
    s = Scene("s45", cam=("push", 1.0, 1.03))
    s.photo("ph", "assets/img/wilhelm.jpg", 160, 100, 500, 720, "König Wilhelm I. von Württemberg", rot=-2, pos="50% 18%")
    s.add('<g id="school" transform="translate(1260,830)"><rect x="-380" y="-300" width="760" height="300" fill="#efe3cf"/>'
          '<path d="M-420,-300 L0,-460 L420,-300 Z" fill="#9d6b4f"/>'
          + "".join(f'<rect x="{-330 + k * 140}" y="-240" width="80" height="100" fill="#bfe1f3"/>' for k in range(5))
          + '<rect x="-50" y="-120" width="100" height="120" fill="#8a5a3c"/></g>', wheat("wh", 1260, 900, 0.5, n=12, gap=60))
    s.label("ls", "Landwirtschaftsschule Hohenheim (1818)", 820, 170, size=56, cls="box")
    s.slap("#ph", s.w("König", off=-0.3)).draw("#school", s.w("Landwirtschaftsschule", off=-0.5), 0.8).write("#ls", s.w("Landwirtschaftsschule", end=True))
    s.draw("#wh", s.w("Hunger", off=-0.2), 0.6)
    s.save()

    # 46 — Dazu ein großes Landwirtschaftsfest in Cannstatt. Daraus wird später: der Cannstatter Wasen.
    s = Scene("s46", cam=("push", 1.0, 1.04))
    s.add(sky("sky", SKY), ground("gr", 860, GRASS),
          '<g id="tent" transform="translate(620,880)"><path d="M-300,0 L-300,-220 L0,-380 L300,-220 L300,0 Z" fill="#fff"/>'
          '<path d="M-300,-220 L300,-220" fill="none"/><path d="M-60,0 L0,-160 L60,0 Z" fill="#8a5a3c"/>'
          f'<line x1="0" y1="-380" x2="0" y2="-460"/><path d="M0,-460 L60,-440 L0,-420 Z" fill="{RED}"/></g>',
          '<g id="cow" transform="translate(1100,880)"><ellipse cx="0" cy="-130" rx="130" ry="70" fill="#fff"/><circle cx="-40" cy="-150" r="22" fill="#1f1d1a"/>'
          '<line x1="-80" y1="-80" x2="-80" y2="0"/><line x1="80" y1="-80" x2="80" y2="0"/><ellipse cx="160" cy="-170" rx="50" ry="40" fill="#fff"/>'
          f'<circle cx="150" cy="-120" r="22" fill="{RED}"/></g>',
          '<g id="wheel" transform="translate(1560,880)"><line x1="-120" y1="0" x2="0" y2="-300"/><line x1="120" y1="0" x2="0" y2="-300"/>'
          '<circle cx="0" cy="-300" r="230" fill="none"/>'
          + "".join(f'<line x1="0" y1="-300" x2="{230 * math.cos(k * math.pi / 4):.0f}" y2="{-300 + 230 * math.sin(k * math.pi / 4):.0f}" style="stroke-width:4"/>'
                    f'<rect x="{230 * math.cos(k * math.pi / 4) - 24:.0f}" y="{-300 + 230 * math.sin(k * math.pi / 4) - 20:.0f}" width="48" height="40" fill="{["#e8483b", "#ffd34d", "#5a8fc4"][k % 3]}" style="stroke-width:4"/>' for k in range(8)) + "</g>")
    s.raw_html('<div id="y1818" class="label box" style="left:430px;top:250px;font-size:64px;"><span class="wd">1818</span></div>')
    s.label("lc", "Cannstatter Wasen", 1180, 120, size=72, color=RED)
    s.label("ll", "Landwirtschaftsfest", 300, 340, size=52)
    s.draw("#tent", s.w("Landwirtschaftsfest", off=-0.3), 0.6).write("#y1818", s.w("Landwirtschaftsfest")).write("#ll", s.w("Cannstatt")).draw("#cow", s.w("Cannstatt", off=-0.1), 0.5)
    s.draw("#wheel", s.w("später", off=-0.2), 0.9).write("#lc", s.w("Wasen", off=-0.3))
    s.save()


import math  # noqa: E402

if __name__ == "__main__":
    scenes()
