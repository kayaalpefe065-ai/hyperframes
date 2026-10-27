"""Teil 2 – Der Schleier (14–21) und Teil 3 – Der Sommer, der nicht kam (22–28)."""
import math
from kit import *


def dots(id_, n, seed, x0, x1, y0, y1, r=(6, 11), fill=SULFUR):
    rnd = random.Random(seed)
    return f'<g id="{id_}">' + "".join(
        g(f"{id_}-{k}", f'<circle cx="0" cy="0" r="{rnd.uniform(*r):.1f}" fill="{fill}" style="stroke-width:4"/>',
          round(rnd.uniform(x0, x1)), round(rnd.uniform(y0, y1))) for k in range(n)) + "</g>"


def scenes():
    # 14 — Aber der Tambora schleudert nicht nur Asche hoch. Sondern vor allem etwas Unsichtbares: Schwefel.
    s = Scene("s14", cam=("push", 1.0, 1.04))
    s.add(sky("sky", "#d9e4ea"), ground("gr", 900, "#a9a08f"), volcano("vol", 960, 910, s=0.7, crater=True))
    rnd = random.Random(14)
    s.add('<g id="ash">' + "".join(g(f"a{k}", f'<circle cx="0" cy="0" r="{rnd.uniform(40, 80):.0f}" fill="{ASH}"/>', 960, 600) for k in range(8)) + "</g>",
          dots("so", 22, 4, 900, 1020, 560, 620))
    s.label("ls", "Schwefel", 1240, 200, size=96, color="#a8951c")
    t = s.w("Asche")
    for k in range(8):
        a = -math.pi / 2 + (k - 3.5) * 0.3
        s.fromto(f"#a{k}-in", t + k * 0.05, 1.2, {"x": 0, "y": 0, "scale": 0.2}, {"x": math.cos(a) * 380, "y": math.sin(a) * 420, "scale": 1}, ease="power2.out")
    t2 = s.w("Unsichtbares")
    for k in range(8):  # the ash falls back to the ground
        s.to(f"#a{k}-in", t2 + 0.3 + k * 0.04, 1.4, ease="power2.in", y=300, opacity=0)
    s.show("#so", t2, 0.4)
    for k in range(22):
        s.fromto(f"#so-{k}-in", t2 + k * 0.03, s.dur - t2, {"x": 0, "y": 0}, {"x": rnd.uniform(-300, 300), "y": rnd.uniform(-560, -420)}, ease="power1.out")
    s.write("#ls", s.w("Schwefel"))
    s.save()

    # 15 — Rund sechzig Millionen Tonnen Schwefeldioxid steigen auf. Bis in die Stratosphäre, über vierzig Kilometer hoch.
    s = Scene("s15", cam=("push", 1.0, 1.03))
    s.add(sky("sky", "#e3eef4"), '<g id="strat"><rect x="-40" y="-40" width="2000" height="300" fill="#cfdbe8" style="stroke:none"/></g>',
          ground("gr", 960, "#a9a08f"), volcano("vol", 1250, 965, s=0.18, crater=True))
    axis = '<g id="axis"><line x1="220" y1="950" x2="220" y2="90"/>' + "".join(
        f'<line x1="200" y1="{950 - k * 205}" x2="240" y2="{950 - k * 205}" style="stroke-width:5"/>' for k in range(5)) + "</g>"
    s.add(axis, cloud("cl", 700, 800, 0.6), cloud("cl2", 1600, 790, 0.5),
          '<g id="plane" transform="translate(500,730)"><path d="M-60,0 L60,0 L80,-10 L60,-14 L-50,-14 Z" fill="#fff"/><path d="M-10,-8 L20,-40 L30,-40 L20,-8 Z" fill="#fff"/></g>',
          dots("so", 26, 15, 1210, 1290, 840, 880))
    for k in range(5):
        s.label(f"km{k}", f"{k * 10} km", 60, 925 - k * 205, size=34)
    s.label("lstr", "Stratosphäre", 1380, 120, size=60)
    s.label("lw", "Wolken & Wetter", 860, 640, size=44, color="#5b6670")
    s.label("lt", "≈ 60 Mio. Tonnen SO₂", 300, 300, size=64, cls="box", rot=-2)
    s.draw("#axis", 0.1, 0.6)
    for k in range(5):
        s.write(f"#km{k}", 0.2 + k * 0.08)
    s.write("#lt", s.w("sechzig")).write("#lw", s.w("Schwefeldioxid"))
    rnd = random.Random(150)
    t = s.w("steigen", off=-0.3)
    for k in range(26):
        s.fromto(f"#so-{k}-in", t + k * 0.04, 2.6, {"x": 0, "y": 0}, {"x": rnd.uniform(-600, 500), "y": rnd.uniform(-820, -690)}, ease="power2.inOut")
    s.show("#strat", s.w("Stratosphäre", off=-0.2), 0.5).write("#lstr", s.w("Stratosphäre"))
    s.save()

    # 16 — Dort oben gibt es keinen Regen, der das Gas auswäscht. Es wird zu winzigen Tröpfchen.
    s = Scene("s16", cam=("push", 1.03, 1.0))
    s.add(sky("sky", "#e3eef4"), '<rect x="-40" y="-40" width="2000" height="420" fill="#cfdbe8" style="stroke:none"/>',
          dots("so", 30, 16, 100, 1820, 80, 330), cloud("cl", 960, 690, 1.2, "#b8bfc8"), rain("rn", 34, 3, 700, 1260, 780, 900),
          f'<g id="no"><circle cx="1560" cy="520" r="70" fill="#fff"/><line x1="1520" y1="480" x2="1600" y2="560" style="stroke:{RED};stroke-width:12"/>'
          '<path d="M1560,480 q-26,40 0,64 q26,-24 0,-64 z" fill="#5a8fc4" style="stroke-width:4"/></g>',
          '<g id="lens"><circle cx="560" cy="440" r="170" fill="#fffdf6"/><line x1="680" y1="560" x2="760" y2="640" style="stroke-width:20"/></g>',
          '<g id="drops">' + "".join(f'<path d="M{480 + (k % 3) * 70},{380 + (k // 3) * 60} q-14,22 0,34 q14,-12 0,-34 z" fill="{SULFUR}" style="stroke-width:4"/>' for k in range(6)) + "</g>")
    s.label("lno", "oben: kein Regen", 1380, 610, size=48)
    s.label("ld", "Sulfat-Tröpfchen", 380, 650, size=52, cls="box")
    s.draw("#no", s.w("keinen", off=-0.1), 0.5).write("#lno", s.w("Regen"))
    s.draw("#lens", s.w("winzigen", off=-0.4), 0.5).draw("#drops", s.w("Tröpfchen", off=-0.3), 0.5).write("#ld", s.w("Tröpfchen", end=True))
    s.save()

    # 17 — Die Winde tragen sie einmal um die ganze Erde. Wie ein dünner Schleier legen sie sich um den Planeten.
    s = Scene("s17", bg="#1f2433", cam=("push", 1.0, 1.05), boil=True)
    s.photo("ph", "assets/img/earth.jpg", 610, 110, 700, 700, "Foto: NASA / Apollo 17 (1972)", rot=0)
    s.add(arrow("w1", "M520,520 Q500,180 900,110", color="#fff", width=9), arrow("w2", "M1400,400 Q1440,760 1020,860", color="#fff", width=9))
    s.front('<g id="veil" style="opacity:0"><circle cx="960" cy="460" r="400" fill="none" style="stroke:#e9d84a;stroke-width:60;opacity:0.5"/>'
            '<circle cx="960" cy="460" r="430" fill="none" style="stroke:#e9d84a;stroke-width:10;opacity:0.6;stroke-dasharray:4 22"/></g>')
    s.label("lv", "Schleier", 1460, 160, size=80, color="#e9d84a")
    s.slap("#ph", 0.0).draw("#w1", s.w("Winde"), 0.8).draw("#w2", s.w("Erde", off=-0.3), 0.8)
    s.fromto("#veil", s.w("Schleier", off=-0.3), 1.2, {"opacity": 0, "scale": 0.92, "transformOrigin": "960px 460px"}, {"opacity": 1, "scale": 1}, ease="power2.out")
    s.write("#lv", s.w("Schleier"))
    s.save()

    # 18 — Und dieser Schleier wirft einen Teil des Sonnenlichts zurück ins All, bevor es unten ankommt.
    s = Scene("s18", cam=("push", 1.0, 1.03))
    s.add(sky("sky", "#e3eef4"), sun("sun", 200, 150, 80), ground("gr", 900),
          f'<g id="veil"><path d="M-40,420 Q960,360 1960,420 L1960,470 Q960,410 -40,470 Z" fill="{SULFUR}" style="opacity:0.75"/></g>',
          figure("fig", 1500, 900, 0.9, mood="sad"))
    for k in range(5):
        x = 380 + k * 230
        if k in (1, 3):  # bounced back
            d = f"M{x - 130},{150 + k * 10} L{x},{420} L{x + 100},{170}"
        else:
            d = f"M{x - 130},{150 + k * 10} L{x + 140},{860}"
        s.add(arrow(f"r{k}", d, color="#e0a800", width=9))
    s.label("lb", "zurück ins All", 640, 210, size=52, cls="box")
    s.label("lu", "weniger Licht", 860, 680, size=52, cls="box")
    s.draw("#veil", 0.1, 0.6)
    for k in range(5):
        s.draw(f"#r{k}", s.w("Sonnenlichts", off=-0.3) + k * 0.1, 0.8)
    s.write("#lb", s.w("zurück")).write("#lu", s.w("unten")).mood("fig", s.w("unten"), "sad")
    s.save()

    # 19 — Im Durchschnitt wird es auf der Erde etwa ein halbes bis ein Grad kälter. Klingt wenig. Ist es aber nicht.
    s = Scene("s19", cam=("push", 1.0, 1.03))
    s.add(thermometer("th", 620, 860, 1.4, level=0.62), figure("fig", 1300, 900, 1.1))
    s.label("lt", "−0,5 bis −1 °C", 780, 260, size=96, color="#3a6fb0")
    s.label("lq", "wenig?", 1380, 360, size=72, rot=6)
    s.label("lx", "doch!", 1380, 360, size=88, color=RED, rot=-6)
    s.draw("#th", 0.1, 0.6)
    s.to("#th-hg", s.w("kälter", off=-0.6), 1.0, scaleY=0.8, transformOrigin="50% 100%").write("#lt", s.w("halbes"))
    s.to("#fig-arml", s.w("Klingt"), 0.25, rotation=-110, svgOrigin="0 -140").to("#fig-armr", s.w("Klingt"), 0.25, rotation=110, svgOrigin="0 -140")
    s.write("#lq", s.w("wenig")).hide("#lq", s.w("Ist", off=-0.1), 0.15).write("#lx", s.w("nicht", off=-0.2))
    s.to("#fig-arml", s.w("Ist"), 0.2, rotation=0, svgOrigin="0 -140").to("#fig-armr", s.w("Ist"), 0.25, rotation=-150, svgOrigin="0 -140").mood("fig", s.w("Ist"), "oh")
    s.save()

    # 20 — Denn ein Grad weniger im Durchschnitt heißt: kalte Tage, späte Fröste. Und Regen, Regen, Regen.
    s = Scene("s20", bg="#e9e6df", cam=("none",))
    s.add(sky("sky", "#e3e6ea"), ground("gr", 920, "#9fb48a"),
          '<g id="cold"><circle cx="400" cy="330" r="110" fill="#bcd8ee"/><path d="M400,250 L400,410 M330,290 L470,370 M330,370 L470,290" fill="none" style="stroke:#3a6fb0;stroke-width:9"/></g>',
          '<g id="frost"><path d="M960,560 L960,330" fill="none" style="stroke:#6b8f3a"/><circle cx="960" cy="300" r="46" fill="#f5b3c8"/>'
          '<path d="M920,270 l20,10 M990,265 l-16,16 M960,250 l0,22" fill="none" style="stroke:#9cc7e8;stroke-width:6"/></g>',
          cloud("c1", 1450, 280, 0.9, "#9aa3ad"), cloud("c2", 600, 160, 1.1, "#8f98a3"), cloud("c3", 1200, 120, 1.4, "#848d98"),
          rain("r1", 30, 21, 1250, 1650, 360, 880), rain("r2", 50, 22, 300, 1000, 260, 880), rain("r3", 90, 23, 0, 1920, 180, 880))
    s.label("l1", "kalte Tage", 290, 470, size=52).label("l2", "späte Fröste", 830, 600, size=52)
    s.draw("#cold", s.w("kalte"), 0.5).write("#l1", s.w("Tage")).draw("#frost", s.w("späte"), 0.5).write("#l2", s.w("Fröste"))
    for k in range(3):
        t = s.w("Regen", k + 1, off=-0.15)
        s.draw(f"#c{k + 1}", t, 0.35).draw(f"#r{k + 1}", t + 0.15, 0.4)
    s.save()

    # 21 — Das Erstaunliche: Damals wusste niemand, woher die Kälte kam. Den Zusammenhang erkannte man erst rund hundert Jahre später.
    s = Scene("s21", cam=("push", 1.0, 1.03))
    s.add(figure("fig", 420, 860, 1.2, mood="oh", hat="top"), volcano("vol", 1080, 600, s=0.3),
          '<g id="flake"><path d="M1620,420 L1620,600 M1542,465 L1698,555 M1542,555 L1698,465" fill="none" style="stroke:#3a6fb0;stroke-width:12"/></g>',
          f'<g id="link"><path d="M1240,520 Q1420,420 1560,500" fill="none" style="stroke:{RED};stroke-width:8;stroke-dasharray:22 18"/></g>')
    s.label("q", "???", 470, 300, size=110, color=RED)
    s.label("l1", "1816: niemand weiß warum", 140, 140, size=56)
    s.label("l2", "erst um 1920 erkannt", 1080, 760, size=60, cls="box", rot=-2)
    s.write("#l1", s.w("Damals")).write("#q", s.w("niemand"), 0.15)
    s.draw("#vol", s.w("Zusammenhang", off=-0.5), 0.5).draw("#flake", s.w("Zusammenhang", off=-0.3), 0.5).draw("#link", s.w("Zusammenhang", off=0.1), 0.6)
    s.write("#l2", s.w("hundert"))
    s.save()

    # 22 — Europa, Frühjahr achtzehnhundertsechzehn. Der Schnee will einfach nicht schmelzen.
    s = Scene("s22", cam=("pan", 40, -40))
    s.add(sky("sky", GREY_SKY), ground("gr", 860, SNOW), church("ch", 1300, 870, 0.9, snow=True), house("h1", 520, 870, 0.9, snow=True),
          house("h2", 860, 870, 0.7, snow=True), tree("t1", 1660, 870, 0.9, crown="#9bb37e", snow=True),
          '<g id="sunw" style="opacity:0.35">' + sun("sun", 960, 170, 70) + "</g>", figure("fig", 1050, 900, 1.0, mood="sad", hat="scarf"))
    s.label("le", "Europa", 100, 80, size=56, cls="box").label("lf", "Frühjahr 1816", 100, 190, size=72)
    s.write("#le", s.w("Europa")).write("#lf", s.w("Frühjahr"))
    s.to("#fig-armr", s.w("Schnee"), 0.4, rotation=-60, svgOrigin="0 -140").to("#fig-armr", s.w("schmelzen"), 0.4, rotation=0, svgOrigin="0 -140")
    s.save()

    # 23 — Im Mai: Frost. Und in der Schweiz schneit es in diesem Jahr in jedem einzelnen Monat.
    s = Scene("s23", cam=("push", 1.0, 1.03))
    s.raw_html(calendar("cal", "1816", "Mai", 120, 120, w=260, color="#3a6fb0"))
    s.add('<g id="frost"><path d="M250,560 L250,420 M190,455 L310,525 M190,525 L310,455" fill="none" style="stroke:#3a6fb0;stroke-width:10"/></g>',
          '<g id="alps"><path d="M560,560 L760,250 L860,380 L980,200 L1180,560 Z" fill="#b8c2cc"/><path d="M930,277 L980,200 L1030,277 L1000,262 L980,280 L955,262 Z" fill="#fff"/>'
          f'<rect x="1100" y="340" width="70" height="70" fill="{RED}"/><path d="M1135,355 L1135,395 M1115,375 L1155,375" fill="none" style="stroke:#fff;stroke-width:10"/>'
          '<line x1="1100" y1="340" x2="1100" y2="450"/></g>')
    months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
    for k, m in enumerate(months):
        x, y = 1270 + (k % 4) * 150, 180 + (k // 4) * 170
        s.add(f'<g id="m{k}"><rect x="{x}" y="{y}" width="130" height="140" rx="14" fill="#fff"/></g>')
        s.add(f'<g id="sn{k}"><path d="M{x + 65},{y + 70} l0,50 M{x + 43},{y + 82} l44,26 M{x + 43},{y + 108} l44,-26" fill="none" style="stroke:#3a6fb0;stroke-width:6"/></g>')
        s.label(f"t{k}", m, x, y + 6, size=40, w=130)
    s.label("ls", "Schweiz", 700, 600, size=60)
    s.pop("#cal", s.w("Mai"), origin="50% 50%").draw("#frost", s.w("Frost"), 0.4)
    s.draw("#alps", s.w("Schweiz", off=-0.2), 0.6).write("#ls", s.w("Schweiz"))
    t = s.w("Jahr", off=-0.2)
    for k in range(12):
        s.draw(f"#m{k}", t + k * 0.05, 0.3).write(f"#t{k}", t + k * 0.05 + 0.1)
    t = s.w("jedem", off=-0.1)
    for k in range(12):
        s.draw(f"#sn{k}", t + k * 0.09, 0.25)
    s.save()

    # 24 — Dazu regnet es. Wochenlang. Flüsse und Seen treten über die Ufer.
    s = Scene("s24", cam=("push", 1.0, 1.03))
    s.add(sky("sky", "#a9b1ba"), ground("gr", 700, "#8fa77a"),
          '<g id="river"><path d="M-40,800 Q500,760 960,800 T1960,790 L1960,880 Q1400,900 960,870 T-40,880 Z" fill="#6c9ac4"/></g>',
          house("h1", 380, 760, 0.7), house("h2", 1450, 760, 0.8), tree("t1", 1050, 760, 0.7),
          cloud("c1", 500, 160, 1.2, "#848d98"), cloud("c2", 1350, 140, 1.4, "#7c8590"), rain("rn", 120, 24, 0, 1920, 160, 1000))
    s.front('<rect id="flood" x="-40" y="1080" width="2000" height="600" fill="#6c9ac4" style="stroke:#1f1d1a;stroke-width:7;opacity:0.85"/>')
    s.label("lw", "wochenlang", 760, 330, size=72, cls="box", rot=-3)
    s.fromto("#rn", 0, s.dur, {"y": 0}, {"y": 160}, ease="none")
    s.write("#lw", s.w("Wochenlang"))
    s.to("#flood", s.w("Flüsse", off=-0.2), 2.4, ease="power1.inOut", y=-380)
    s.save()

    # 25 — In Süddeutschland ist es mitten im Sommer zwei bis drei Grad kälter als normal.
    s = Scene("s25", cam=("push", 1.0, 1.03))
    s.add(thermometer("t1", 700, 780, 1.2, level=0.75), thermometer("t2", 1220, 780, 1.2, level=0.75))
    s.label("l1", "normaler Sommer", 540, 870, size=48).label("l2", "Sommer 1816", 1100, 870, size=48)
    s.label("ld", "−2 bis −3 °C", 1340, 300, size=84, color="#3a6fb0")
    s.label("ls", "Süddeutschland", 0, 70, size=64, w=1920)
    s.write("#ls", s.w("Süddeutschland")).draw("#t1", 0.3, 0.5).write("#l1", 0.5).draw("#t2", s.w("Sommer", off=-0.3), 0.5).write("#l2", s.w("Sommer"))
    s.to("#t2-hg", s.w("zwei", off=-0.2), 1.0, scaleY=0.62, transformOrigin="50% 100%").write("#ld", s.w("Grad"))
    s.save()

    # 26 — Auch in Nordamerika. In Neuengland schneit es im Juni, und im Juli und August gibt es Nachtfrost.
    s = Scene("s26", bg="#cfd5dc", cam=("pan", -30, 30))
    s.add(sky("sky", GREY_SKY), ground("gr", 860, SNOW),
          '<g id="farm" transform="translate(760,870)"><rect x="-200" y="-260" width="400" height="260" fill="#b5533c"/><path d="M-230,-260 L0,-420 L230,-260 Z" fill="#7a3426"/>'
          '<path d="M-60,0 L-60,-150 L60,-150 L60,0" fill="#f1e3c8"/><path d="M-60,-150 L60,0 M60,-150 L-60,0" fill="none"/></g>',
          flakes("fl", 40, 26, y0=-900, y1=0), '<g id="night" style="opacity:0">' + moon("mo", 1640, 180) + "</g>")
    s.label("ln", "Neuengland (USA)", 100, 80, size=60, cls="box")
    s.raw_html(calendar("c1", "1816", "Juni", 1100, 300, w=210, color="#3a6fb0"))
    s.raw_html(calendar("c2", "1816", "Juli", 1330, 420, w=210, color="#3a6fb0"))
    s.raw_html(calendar("c3", "1816", "August", 1530, 560, w=250, color="#3a6fb0"))
    s.write("#ln", s.w("Neuengland")).fall("fl", 40, s.w("schneit", off=-0.3), 3.0, seed=26).pop("#c1", s.w("Juni"), origin="50% 50%")
    s.pop("#c2", s.w("Juli"), origin="50% 50%").pop("#c3", s.w("August"), origin="50% 50%").show("#night", s.w("Nachtfrost", off=-0.2), 0.4)
    s.to("#sky", s.w("Nachtfrost", off=-0.2), 0.6, fill=NIGHT)
    s.save()

    # 27 — Die Amerikaner nennen das Jahr später: Eighteen hundred and froze to death. Achtzehnhundert und erfroren.
    s = Scene("s27", bg="#dfe9f2", cam=("push", 1.0, 1.04))
    s.add(figure("fig", 1560, 880, 1.2, mood="sad", color="#cfe6f7"),
          '<g id="ice"><path d="M1500,700 l10,40 l10,-40 M1600,700 l8,30 l8,-30" fill="#fff" style="stroke-width:4"/></g>')
    s.label("en", "„Eighteen hundred and froze to death“", 100, 260, size=88)
    s.label("de", "„Achtzehnhundert-und-erfroren“", 100, 470, size=88, color="#3a6fb0")
    s.write("#en", s.w("Eighteen", off=-0.1), 0.12).write("#de", s.w("Achtzehnhundert", off=-0.1), 0.15).draw("#ice", s.w("erfroren"), 0.4)
    s.save()

    # 28 — Und in Asien? In China fallen Ernten aus. In Indien gerät der Monsun durcheinander.
    s = Scene("s28", cam=("pan", 40, -40))
    s.add(sky("sky", "#dfe6e0"), ground("gr", 860, "#a9b98a"), wheat("rice", 520, 870, 0.8, color="#cbbf7a", n=7),
          cloud("mon", 1400, 330, 1.2, "#8f98a3"),
          arrow("sw", "M1250,560 q60,-80 120,0 t120,0 q40,80 -60,90", width=8))
    s.label("lc", "China: Missernten", 220, 330, size=60, cls="box")
    s.label("li", "Indien: Monsun gestört", 1110, 640, size=60, cls="box")
    s.label("la", "Asien?", 0, 70, size=72, w=1920)
    s.write("#la", s.w("Asien")).write("#lc", s.w("China")).draw("#rice", s.w("China", off=0.2), 0.5)
    for k in range(7):
        s.to(f"#rice-{k}", s.w("Ernten") + k * 0.05, 0.8, ease="power2.in", rotation=55 + k * 4, transformOrigin="50% 100%")
    s.draw("#mon", s.w("Indien"), 0.5).write("#li", s.w("Monsun")).draw("#sw", s.w("durcheinander", off=-0.2), 0.6)
    s.save()


if __name__ == "__main__":
    scenes()
