"""Scene kit for the 1816 YouTube film: a hand-drawn paper look written as static SVG + GSAP.

A scene is built with `Scene`, which collects SVG markup (drawn props), HTML (hand-lettered labels,
taped-on photos) and timeline calls, then writes `compositions/<id>.html`. Ids are written short in
the scene definitions and prefixed with the scene id on output, because every scene is mounted into
the same document.

Motion grammar of the medium: ink is *drawn* on (stroke dash), fills are washed in after the line,
photos are slapped onto the paper and taped, words are written in one after another. The whole
drawing "boils" (a new noise seed 12 times a second), like hand-drawn animation.
"""
import json, os, random, re, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ALIGNED = json.load(open(os.path.join(ROOT, "tools", "aligned.json"), encoding="utf-8"))
LEAD, TAIL = 0.35, 0.8
HOLD = {"s51": 2.6}  # extra hold after the voice (the film's last line)

INK, PAPER, RED = "#1f1d1a", "#f4efe4", "#e8483b"
SKY, GREY_SKY, NIGHT = "#9fd3f0", "#b6bac2", "#2c3346"
GRASS, EARTH, SAND, SEA = "#a7d07a", "#b39a6b", "#e6c98f", "#6cb2dd"
SUN, LAVA, ASH, SULFUR, SNOW = "#ffd34d", "#f26b2a", "#8d8b88", "#e9d84a", "#ffffff"
SKIN, WHEAT, ROT = "#fff8ec", "#e8b84a", "#7d6b3a"


def _dur(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True).stdout
    return float(out)


def _norm(w):
    return re.sub(r"[^0-9a-zäöüß]", "", w.lower())


# ---------------------------------------------------------------------------------------------
# Props: functions returning SVG strings. (x, y) is the prop's anchor (usually its foot / base).


def g(id_, inner, x=0, y=0, s=1.0, rot=0, extra=""):
    tr = f"translate({x},{y})" + (f" rotate({rot})" if rot else "") + (f" scale({s})" if s != 1 else "")
    return f'<g id="{id_}" transform="{tr}" {extra}><g id="{id_}-in">{inner}</g></g>'


def figure(id_, x, y, s=1.0, mood="smile", hat=None, ring=False, arms="down", bundle=False, lantern=False,
           color=SKIN):
    """Stick figure standing on (x, y). Sub-ids: -head -arml -armr -legl -legr -smile -sad -oh."""
    arm_l = {"down": "0,-140 -46,-92", "up": "0,-140 -60,-210", "out": "0,-140 -70,-140"}[arms]
    arm_r = {"down": "0,-140 46,-92", "up": "0,-140 60,-210", "out": "0,-140 70,-140"}[arms]
    hat_svg = ""
    if hat == "top":
        hat_svg = '<rect x="-30" y="-290" width="60" height="50" fill="#1f1d1a"/><line x1="-46" y1="-240" x2="46" y2="-240"/>'
    elif hat == "shako":
        hat_svg = '<rect x="-26" y="-296" width="52" height="58" fill="#2b4a8b"/><line x1="-34" y1="-238" x2="34" y2="-238"/><circle cx="0" cy="-282" r="6" fill="#ffd34d" style="stroke:none"/>'
    elif hat == "crown":
        hat_svg = '<path d="M-30,-236 L-34,-282 L-14,-258 L0,-290 L14,-258 L34,-282 L30,-236 Z" fill="#ffd34d"/>'
    elif hat == "cap":
        hat_svg = '<path d="M-38,-226 Q0,-282 38,-226 Z" fill="#7d5a3a"/><line x1="30" y1="-228" x2="62" y2="-224"/>'
    elif hat == "scarf":
        hat_svg = '<path d="M-42,-206 Q0,-262 42,-206 Q0,-226 -42,-206 Z" fill="#8a6fb0"/>'
    ring_svg = ('<ellipse cx="0" cy="-92" rx="62" ry="22" fill="#e8483b"/><path d="M-40,-108 L-36,-76 M36,-108 L40,-76" stroke="#fff"/>'
                if ring else "")
    bundle_svg = ('<line x1="46" y1="-92" x2="70" y2="-190"/><circle cx="78" cy="-206" r="26" fill="#c79a5b"/>'
                  if bundle else "")
    lantern_svg = ('<g id="%s-lantern"><line x1="46" y1="-92" x2="46" y2="-70"/><rect x="30" y="-70" width="32" height="40" rx="6" fill="#ffd34d"/></g>' % id_
                   if lantern else "")
    inner = f"""
      <line x1="0" y1="-158" x2="0" y2="-66"/>
      <g id="{id_}-legl"><line x1="0" y1="-66" x2="-30" y2="0"/></g>
      <g id="{id_}-legr"><line x1="0" y1="-66" x2="30" y2="0"/></g>
      <g id="{id_}-arml"><polyline points="{arm_l}" fill="none"/></g>
      <g id="{id_}-armr"><polyline points="{arm_r}" fill="none"/>{bundle_svg}{lantern_svg}</g>
      {ring_svg}
      <g id="{id_}-head">
        <circle cx="0" cy="-200" r="40" fill="{color}"/>
        <circle cx="-13" cy="-206" r="4.5" fill="#1f1d1a" style="stroke:none"/>
        <circle cx="13" cy="-206" r="4.5" fill="#1f1d1a" style="stroke:none"/>
        <g id="{id_}-smile" style="opacity:{1 if mood == 'smile' else 0}"><path d="M-14,-186 Q0,-174 14,-186" fill="none" style="stroke-width:5"/></g>
        <g id="{id_}-sad" style="opacity:{1 if mood == 'sad' else 0}"><path d="M-13,-178 Q0,-190 13,-178" fill="none" style="stroke-width:5"/></g>
        <g id="{id_}-oh" style="opacity:{1 if mood == 'oh' else 0}"><ellipse cx="0" cy="-182" rx="7" ry="9" fill="#1f1d1a" style="stroke:none"/></g>
        {hat_svg}
      </g>"""
    return g(id_, inner, x, y, s)


def volcano(id_, x, y, s=1.0, fill="#9b7653", crater=False, snowcap=False):
    """Cone with its base centred on (x, y): 900 wide, 520 tall at s=1."""
    if crater:
        body = '<path d="M-450,0 L-170,-380 Q-120,-410 -80,-370 Q0,-330 80,-370 Q120,-410 170,-380 L450,0 Z" fill="%s"/>' % fill
    else:
        body = '<path d="M-450,0 L-90,-500 Q0,-540 90,-500 L450,0 Z" fill="%s"/>' % fill
    cap = '<path d="M-90,-500 Q0,-540 90,-500 L130,-445 L70,-470 L20,-440 L-30,-470 L-80,-440 L-130,-445 Z" fill="#fff"/>' if snowcap else ""
    return g(id_, body + cap, x, y, s)


def cloud(id_, x, y, s=1.0, fill="#d7dade"):
    d = "M-170,40 q-30,-70 50,-80 q20,-70 110,-55 q60,-60 140,-5 q90,-10 90,70 q40,40 -20,70 L-150,70 q-60,0 -20,-30 z"
    return g(id_, f'<path d="{d}" fill="{fill}"/>', x, y, s)


def puff(id_, x, y, r, fill=ASH):
    return f'<g id="{id_}" transform="translate({x},{y})"><circle cx="0" cy="0" r="{r}" fill="{fill}"/></g>'


def sun(id_, x, y, r=90):
    rays = " ".join(
        f"M{round(__import__('math').cos(a) * (r + 30))},{round(__import__('math').sin(a) * (r + 30))} "
        f"L{round(__import__('math').cos(a) * (r + 62))},{round(__import__('math').sin(a) * (r + 62))}"
        for a in [i * 3.14159 / 4 for i in range(8)])
    return g(id_, f'<circle cx="0" cy="0" r="{r}" fill="{SUN}"/><path d="{rays}"/>', x, y)


def moon(id_, x, y, r=70):
    return g(id_, f'<path d="M20,-{r} A{r},{r} 0 1,0 20,{r} A{r * 0.75},{r * 0.75} 0 1,1 20,-{r} Z" fill="#f3e9b8"/>', x, y)


def house(id_, x, y, s=1.0, wall="#f1d9b5", roof="#b5533c", snow=False):
    sn = '<path d="M-130,-200 L0,-310 L130,-200 L110,-196 L0,-290 L-110,-196 Z" fill="#fff"/>' if snow else ""
    inner = (f'<rect x="-110" y="-200" width="220" height="200" fill="{wall}"/>'
             f'<path d="M-130,-200 L0,-300 L130,-200 Z" fill="{roof}"/>{sn}'
             '<rect x="-30" y="-100" width="60" height="100" fill="#8a5a3c"/>'
             '<rect x="-90" y="-160" width="44" height="44" fill="#bfe1f3"/><rect x="46" y="-160" width="44" height="44" fill="#bfe1f3"/>')
    return g(id_, inner, x, y, s)


def church(id_, x, y, s=1.0, snow=False):
    sn = '<path d="M-60,-420 L0,-560 L60,-420 L44,-418 L0,-530 L-44,-418 Z" fill="#fff"/>' if snow else ""
    inner = ('<rect x="-60" y="-420" width="120" height="420" fill="#efe3cf"/>'
             '<path d="M-70,-420 L0,-570 L70,-420 Z" fill="#6f7d8c"/>' + sn +
             '<line x1="0" y1="-570" x2="0" y2="-630"/><line x1="-20" y1="-608" x2="20" y2="-608"/>'
             '<path d="M-26,-300 L-26,-250 L26,-250 L26,-300 Q0,-330 -26,-300 Z" fill="#bfe1f3"/>'
             '<path d="M-30,0 L-30,-90 Q0,-130 30,-90 L30,0 Z" fill="#8a5a3c"/>')
    return g(id_, inner, x, y, s)


def tree(id_, x, y, s=1.0, crown="#7fb35a", snow=False):
    sn = '<path d="M-90,-250 Q0,-330 90,-250 Q40,-270 0,-262 Q-40,-270 -90,-250 Z" fill="#fff"/>' if snow else ""
    return g(id_, f'<rect x="-18" y="-160" width="36" height="160" fill="#8a5a3c"/><circle cx="0" cy="-230" r="100" fill="{crown}"/>{sn}', x, y, s)


def wheat(id_, x, y, s=1.0, color=WHEAT, n=7, gap=46, prefix=None):
    """A row of stalks; each stalk is its own group <id>-k (for bending/rotting)."""
    out = []
    for k in range(n):
        sx = (k - (n - 1) / 2) * gap
        h = 210 + (k * 37 % 50)
        out.append(f'<g id="{id_}-{k}" transform="translate({sx:.0f},0)"><line x1="0" y1="0" x2="0" y2="-{h}" style="stroke:#6b8f3a;stroke-width:6"/>'
                   f'<ellipse cx="0" cy="-{h + 26}" rx="14" ry="34" fill="{color}" style="stroke-width:5"/></g>')
    return g(id_, "".join(out), x, y, s)


def flakes(id_, n, seed, x0=0, x1=1920, y0=-1100, y1=-40, r=(5, 11)):
    rnd = random.Random(seed)
    out = [f'<circle id="{id_}-{k}" cx="{rnd.uniform(x0, x1):.0f}" cy="{rnd.uniform(y0, y1):.0f}" r="{rnd.uniform(*r):.1f}" '
           f'fill="#fff" style="stroke:#a7afb8;stroke-width:2.5"/>' for k in range(n)]
    return f'<g id="{id_}">{"".join(out)}</g>'


def rain(id_, n, seed, x0=0, x1=1920, y0=-1100, y1=0, color="#5a8fc4"):
    rnd = random.Random(seed)
    out = []
    for k in range(n):
        x, y = rnd.uniform(x0, x1), rnd.uniform(y0, y1)
        out.append(f'<line x1="{x:.0f}" y1="{y:.0f}" x2="{x - 10:.0f}" y2="{y + 44:.0f}" style="stroke:{color};stroke-width:5"/>')
    return f'<g id="{id_}">{"".join(out)}</g>'


def thermometer(id_, x, y, s=1.0, level=0.7):
    """Bulb at (x, y). The mercury column is <id>-hg, scaled from its foot (scaleY tween)."""
    h = 420
    inner = (f'<rect x="-34" y="-{h + 40}" width="68" height="{h + 40}" rx="34" fill="#fff"/>'
             f'<g id="{id_}-hg"><rect x="-16" y="-{h * level:.0f}" width="32" height="{h * level:.0f}" fill="{RED}" style="stroke:none"/></g>'
             f'<circle cx="0" cy="20" r="56" fill="{RED}"/>'
             + "".join(f'<line x1="34" y1="-{40 + i * 60}" x2="64" y2="-{40 + i * 60}" style="stroke-width:5"/>' for i in range(7)))
    return g(id_, inner, x, y, s)


def ship(id_, x, y, s=1.0, heads=0, seed=1):
    rnd = random.Random(seed)
    hs = "".join(f'<circle cx="{-220 + k * (440 / max(1, heads - 1)):.0f}" cy="{-118 - rnd.uniform(0, 14):.0f}" r="20" fill="{SKIN}" style="stroke-width:5"/>'
                 for k in range(heads))
    inner = (f'<g id="{id_}-heads">{hs}</g>'
             '<path d="M-300,-100 L300,-100 L240,0 L-240,0 Z" fill="#8a5a3c"/>'
             '<line x1="-60" y1="-100" x2="-60" y2="-520"/><line x1="120" y1="-100" x2="120" y2="-440"/>'
             '<path d="M-60,-500 Q40,-400 -60,-240 Z" fill="#fff"/><path d="M120,-420 Q200,-340 120,-220 Z" fill="#fff"/>')
    return g(id_, inner, x, y, s)


def waves(id_, y, color=SEA, amp=18, top=None):
    d = f"M-40,{y} " + " ".join(f"q60,-{amp} 120,0 t120,0" for _ in range(9)) + f" L2000,1120 L-40,1120 Z"
    return f'<g id="{id_}"><path d="{d}" fill="{color}"/></g>'


def ground(id_, y, fill=GRASS):
    return f'<g id="{id_}"><path d="M-40,{y} Q480,{y - 40} 960,{y - 10} T1960,{y - 20} L1960,1120 L-40,1120 Z" fill="{fill}"/></g>'


def sky(id_, fill=SKY):
    return f'<rect id="{id_}" x="-40" y="-40" width="2000" height="1160" fill="{fill}" style="stroke:none"/>'


def arrow(id_, d, color=INK, width=7, head=True):
    """A drawn path with an arrow head; d is the path; the head is drawn at its end via a marker."""
    m = f' marker-end="url(#{id_}-hd)"' if head else ""
    return (f'<g id="{id_}"><defs><marker id="{id_}-hd" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">'
            f'<path d="M0,0 L10,5 L0,10" fill="none" style="stroke:{color};stroke-width:2"/></marker></defs>'
            f'<path d="{d}" fill="none" style="stroke:{color};stroke-width:{width}"{m}/></g>')


def globe(id_, x, y, r=330, land="#8cc06a", sea="#7cc0e8", center="asia"):
    """A drawn globe, roughly centred on Eurasia (Europe upper left, Indonesia lower right)."""
    k = r / 330
    blobs = {
        "europe": "M-250,-170 q40,-60 110,-50 q30,-40 80,-10 q30,30 -10,60 q-40,10 -50,50 q-50,10 -70,-10 q-60,10 -60,-40 z",
        "africa": "M-230,-30 q60,-30 120,0 q40,40 40,100 q-10,80 -60,140 q-40,30 -60,-20 q-20,-60 -60,-90 q-40,-60 20,-130 z",
        "asia": "M-80,-230 q120,-70 260,-30 q90,40 80,110 q-30,40 -80,30 q-20,60 -70,70 q-40,-10 -60,30 q-50,-20 -60,-80 q-60,-20 -70,-70 q0,-40 0,-60 z",
        "india": "M20,-40 q40,-10 50,30 q-10,50 -30,80 q-30,-30 -40,-70 z",
        "indonesia": "M90,120 q40,-10 70,6 q-30,14 -70,-6 z M190,140 q36,-6 60,10 q-30,10 -60,-10 z M150,170 q30,0 44,10 q-24,8 -44,-10 z",
        "australia": "M160,220 q70,-30 130,10 q20,50 -30,70 q-60,10 -100,-20 q-20,-30 0,-60 z",
    }
    parts = "".join(f'<path id="{id_}-{n}" d="{d}" fill="{land}" transform="scale({k})" style="stroke-width:{5 / k:.1f}"/>' for n, d in blobs.items())
    inner = (f'<defs><clipPath id="{id_}-clip"><circle cx="0" cy="0" r="{r}"/></clipPath></defs>'
             f'<circle cx="0" cy="0" r="{r}" fill="{sea}"/><g clip-path="url(#{id_}-clip)">{parts}</g>'
             f'<circle cx="0" cy="0" r="{r}" fill="none"/>')
    return g(id_, inner, x, y)


GLOBE_PTS = {"germany": (-150, -165), "indonesia": (175, 140), "philippines": (215, 40), "switzerland": (-165, -150),
             "newengland": (-330, -150), "india": (45, 0), "china": (120, -80)}


def calendar(id_, top, big, x, y, w=250, rot=-4, color=RED):
    """HTML calendar sheet (returns HTML)."""
    return (f'<div id="{id_}" class="cal" style="left:{x}px;top:{y}px;width:{w}px;">'
            f'<div class="cal-top" style="background:{color}">{top}</div><div class="cal-big">{big}</div></div>')


# ---------------------------------------------------------------------------------------------


class Scene:
    def __init__(self, sid, bg=PAPER, dur=None, cam=("push", 1.0, 1.035), boil=True):
        self.sid, self.bg, self.boil = sid, bg, boil
        self.key = sid[1:] if sid[1:].isdigit() else sid  # voice take / transcript key ("s05" -> "05")
        self.svg, self.top, self.html, self.js = [], [], [], []
        vo = os.path.join(ROOT, "assets", "voice", f"{self.key}.mp3")
        self.vo = _dur(vo) if os.path.exists(vo) else 0.0
        self.dur = round(dur if dur else LEAD + self.vo + TAIL + HOLD.get(sid, 0.0), 2)
        self.words = ALIGNED.get(self.key, [])
        self.cam = cam
        self.beats = []

    # -- time anchors -------------------------------------------------------------------------
    def w(self, prefix, n=1, end=False, off=0.0):
        """Start (or end) of the n-th script word starting with prefix, in scene seconds."""
        p, c = _norm(prefix), 0
        for wd in self.words:
            if _norm(wd["text"]).startswith(p):
                c += 1
                if c == n:
                    return round(LEAD + (wd["end"] if end else wd["start"]) + off, 3)
        raise KeyError(f"{self.sid}: word {prefix!r} #{n} not in {[x['text'] for x in self.words]}")

    # -- markup -------------------------------------------------------------------------------
    def add(self, *svg):
        self.svg.extend(svg)
        return self

    def front(self, *svg):
        """SVG drawn above everything (not boiled), e.g. a darkening layer."""
        self.top.extend(svg)
        return self

    def label(self, id_, text, x, y, size=64, color=INK, w=None, align="center", rot=0, cls="", bg=None):
        words = "".join(f'<span class="wd">{t}</span> ' for t in text.split(" "))
        style = f"left:{x}px;top:{y}px;font-size:{size}px;color:{color};text-align:{align};"
        if w:
            style += f"width:{w}px;"
        if bg:
            style += f"background:{bg};"
        self.html.append(f'<div id="{id_}" class="label {cls}" style="{style}" data-rot="{rot}">{words.strip()}</div>')
        return self

    def photo(self, id_, src, x, y, w, h, credit, rot=-3, fit="cover", pos="50% 50%"):
        self.html.append(
            f'<div id="{id_}" class="photo" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;">'
            f'<div class="ph-clip"><img id="{id_}-img" src="{src}" alt="" style="object-fit:{fit};object-position:{pos}"/></div>'
            f'<div class="tape" style="left:-28px;top:-18px;"></div><div class="tape" style="right:-28px;top:-18px;"></div>'
            f'<div class="credit">{credit}</div></div>')
        self._photo_rot = getattr(self, "_photo_rot", {})
        self._photo_rot[id_] = rot
        return self

    def raw_html(self, s):
        self.html.append(s)
        return self

    # -- motion -------------------------------------------------------------------------------
    def draw(self, sel, t, d=0.6):
        self.js.append(f'D("{sel}", {t}, {d});')
        return self

    def write(self, sel, t, gap=0.08):
        """Hand-lettered label: words written in one after another."""
        self.js.append(f'W("{sel}", {t}, {gap});')
        return self

    def slap(self, sel, t):
        rot = self._photo_rot[sel.lstrip("#")]
        self.js.append(f'P("{sel}", {t}, {rot});')
        return self

    def pop(self, sel, t, d=0.5, ease="back.out(2.2)", origin="50% 100%"):
        # from(): lands on the element's own transform (an SVG prop keeps its translate and scale)
        self.js.append(f'tl.from("{sel}", {{ scale: 0, transformOrigin: "{origin}", duration: {d}, ease: "{ease}" }}, {t});')
        return self

    def show(self, sel, t, d=0.3):
        self.js.append(f'tl.fromTo("{sel}", {{ opacity: 0 }}, {{ opacity: 1, duration: {d}, ease: "none" }}, {t});')
        return self

    def hide(self, sel, t, d=0.25):
        self.js.append(f'tl.to("{sel}", {{ opacity: 0, duration: {d}, ease: "none" }}, {t});')
        return self

    def to(self, sel, t, d, ease="power2.inOut", **props):
        self.js.append(f'tl.to("{sel}", {{ {_props(props)}, duration: {d}, ease: "{ease}" }}, {t});')
        return self

    def fromto(self, sel, t, d, a, b, ease="power2.inOut"):
        self.js.append(f'tl.fromTo("{sel}", {{ {_props(a)} }}, {{ {_props(b)}, duration: {d}, ease: "{ease}" }}, {t});')
        return self

    def mood(self, fig, t, mood):
        for m in ("smile", "sad", "oh"):
            self.js.append(f'tl.to("#{fig}-{m}", {{ opacity: {1 if m == mood else 0}, duration: 0.1, ease: "none" }}, {t});')
        return self

    def walk(self, fig, t, d, steps=None, amp=22):
        steps = steps or max(2, int(d / 0.28))
        sd = d / steps
        for k in range(steps):
            a = amp if k % 2 == 0 else -amp
            self.js.append(f'tl.to("#{fig}-legl", {{ rotation: {a}, svgOrigin: "0 -66", duration: {sd:.3f}, ease: "sine.inOut" }}, {t + k * sd:.3f});')
            self.js.append(f'tl.to("#{fig}-legr", {{ rotation: {-a}, svgOrigin: "0 -66", duration: {sd:.3f}, ease: "sine.inOut" }}, {t + k * sd:.3f});')
        self.js.append(f'tl.to(["#{fig}-legl", "#{fig}-legr"], {{ rotation: 0, svgOrigin: "0 -66", duration: 0.15 }}, {t + d:.3f});')
        return self

    def jump(self, fig, t, n=2, h=50):
        for k in range(n):
            self.js.append(f'tl.to("#{fig}-in", {{ y: -{h}, duration: 0.18, ease: "power2.out", yoyo: true, repeat: 1 }}, {t + k * 0.4:.3f});')
        return self

    def shake(self, sel, t, d=0.6, amp=6):
        n = max(2, int(d / 0.06))
        self.js.append(f'tl.to("{sel}", {{ x: {amp}, duration: 0.06, repeat: {n}, yoyo: true, ease: "none" }}, {t});')
        self.js.append(f'tl.set("{sel}", {{ x: 0 }}, {t + d + 0.07:.3f});')
        return self

    def fall(self, sel_prefix, n, t, d, dy=(560, 960), seed=1, drift=40):
        rnd = random.Random(seed)
        for k in range(n):
            self.js.append(f'tl.fromTo("#{sel_prefix}-{k}", {{ x: 0, y: 0 }}, {{ x: {rnd.uniform(-drift, drift):.0f}, y: {rnd.uniform(*dy):.0f}, duration: {d}, ease: "none" }}, {t});')
        return self

    def beat(self, t):
        self.beats.append(t)
        return self

    # -- output -------------------------------------------------------------------------------
    def render(self):
        sid = self.sid
        pre = lambda s: _prefix(s, sid)
        svg = pre("\n".join(self.svg))
        top = pre("\n".join(self.top))
        html = pre("\n".join(self.html))
        js = "\n      ".join(pre(l) for l in self.js)
        mode, *args = self.cam
        if mode == "push":
            cam = f'tl.fromTo("#{sid}-cam", {{ scale: {args[0]} }}, {{ scale: {args[1]}, duration: {self.dur}, ease: "sine.inOut" }}, 0);'
        elif mode == "pan":
            cam = f'tl.fromTo("#{sid}-cam", {{ x: {args[0]}, scale: 1.06 }}, {{ x: {args[1]}, scale: 1.06, duration: {self.dur}, ease: "sine.inOut" }}, 0);'
        elif mode == "zoom":  # (x, y, scale, t, d): a camera move onto a point at time t
            x, y, sc, t, d = args
            cam = (f'tl.set("#{sid}-cam", {{ transformOrigin: "{x}px {y}px" }}, 0);'
                   f' tl.to("#{sid}-cam", {{ scale: {sc}, duration: {d}, ease: "power2.inOut" }}, {t});')
        else:
            cam = ""
        boil = ""
        if self.boil:
            boil = (f'const turb = document.querySelector("#{sid}-turb");\n      const clock = {{ t: 0 }};\n'
                    f'      tl.to(clock, {{ t: {self.dur}, duration: {self.dur}, ease: "none", '
                    f'onUpdate: () => turb.setAttribute("seed", String(1 + (Math.floor(clock.t * 12) % 6))) }}, 0);')
        return TEMPLATE.format(sid=sid, bg=self.bg, svg=svg, top=top, html=html, js=js, cam=cam, boil=boil,
                               css=CSS.replace("SID", sid))

    def save(self):
        with open(os.path.join(ROOT, "compositions", f"{self.sid}.html"), "w", encoding="utf-8") as f:
            f.write(self.render())
        return self


def _props(d):
    out = []
    for k, v in d.items():
        out.append(f'{k}: {json.dumps(v) if isinstance(v, str) else v}')
    return ", ".join(out)


def _prefix(s, sid):
    s = re.sub(r'\bid="([A-Za-z][\w-]*)"', lambda m: f'id="{sid}-{m.group(1)}"', s)
    s = re.sub(r"url\(#([A-Za-z][\w-]*)\)", lambda m: f"url(#{sid}-{m.group(1)})", s)
    def ref(m):
        name = m.group(1)
        if name.startswith(sid + "-") or re.fullmatch(r"[0-9a-fA-F]{3,8}", name):
            return m.group(0)
        return f"#{sid}-{name}"
    s = re.sub(r'(?<![\w&])#([A-Za-z][\w-]*)(?=[\s",\]\)\.:>]|$)', ref, s)
    return s


CSS = """
    @font-face { font-family: "Patrick Hand"; src: url("assets/fonts/patrick-hand.woff2") format("woff2"); }
    #root { position: absolute; inset: 0; overflow: hidden; font-family: "Patrick Hand", sans-serif; color: #1f1d1a; }
    #SID-cam { position: absolute; inset: 0; }
    #SID-art { position: absolute; inset: 0; width: 1920px; height: 1080px; overflow: visible; }
    #SID-art :is(line, path, circle, rect, ellipse, polygon, polyline) { stroke: #1f1d1a; stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; }
    #SID-cam .label { position: absolute; line-height: 1.05; white-space: nowrap; }
    #SID-cam .label.box { background: #fffcf5; border: 6px solid #1f1d1a; border-radius: 18px; padding: 6px 22px; }
    #SID-cam .wd { display: inline-block; }
    #SID-cam .photo { position: absolute; background: #fffdf8; padding: 16px 16px 52px; box-shadow: 0 10px 22px rgba(40, 30, 20, 0.28); }
    #SID-cam .ph-clip { width: 100%; height: 100%; overflow: hidden; background: #ddd; }
    #SID-cam .ph-clip img { width: 100%; height: 100%; display: block; }
    #SID-cam .tape { position: absolute; width: 120px; height: 40px; background: rgba(236, 222, 170, 0.82); }
    #SID-cam .tape:first-of-type { transform: rotate(-24deg); }
    #SID-cam .tape:last-of-type { transform: rotate(24deg); }
    #SID-cam .credit { position: absolute; left: 16px; right: 16px; bottom: 8px; font-size: 28px; color: #4a453e; white-space: nowrap; overflow: hidden; }
    #SID-cam .cal { position: absolute; background: #fff; border: 7px solid #1f1d1a; border-radius: 22px; text-align: center; overflow: hidden; }
    #SID-cam .cal-top { color: #fff; font-size: 44px; padding: 8px 0; border-bottom: 7px solid #1f1d1a; }
    #SID-cam .cal-big { font-size: 80px; padding: 10px 0 14px; }
"""

TEMPLATE = """<template>
  <style>{css}
    #root {{ background: {bg}; }}
  </style>
  <div id="root" data-composition-id="{sid}" data-width="1920" data-height="1080">
    <div id="{sid}-cam">
      <svg id="{sid}-art" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="{sid}-boil" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence id="{sid}-turb" type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="1" />
            <feDisplacementMap in="SourceGraphic" scale="4" />
          </filter>
        </defs>
        <g filter="url(#{sid}-boil)">
{svg}
        </g>
{top}
      </svg>
{html}
    </div>
  </div>
  <script>
    (() => {{
      const tl = gsap.timeline({{ paused: true }});
      const SHAPES = "path, line, circle, rect, ellipse, polygon, polyline";
      // Draw ink on: every stroke of the selection is drawn from its start, then its fill washes in.
      const D = (sel, at, dur) => {{
        const els = [];
        document.querySelectorAll(sel).forEach((n) => (n.matches(SHAPES) ? els.push(n) : els.push(...n.querySelectorAll(SHAPES))));
        const shapes = els.filter((e) => !e.closest("marker, clipPath"));
        shapes.forEach((e) => e.setAttribute("pathLength", "1"));
        tl.fromTo(shapes, {{ opacity: 0 }}, {{ opacity: 1, duration: 0.01, ease: "none" }}, at);
        tl.fromTo(shapes, {{ strokeDasharray: "1 1", strokeDashoffset: 1 }}, {{ strokeDashoffset: 0, duration: dur, ease: "power1.inOut", stagger: Math.min(0.05, (dur * 0.5) / shapes.length) }}, at);
        tl.fromTo(shapes, {{ fillOpacity: 0 }}, {{ fillOpacity: 1, duration: dur * 0.6, ease: "none" }}, at + dur * 0.45);
      }};
      // Write a hand-lettered label: its words appear one after another out of a slight blur.
      const W = (sel, at, gap) => {{
        const el = document.querySelector(sel);
        const rot = Number(el.dataset.rot || 0);
        if (rot) tl.set(el, {{ rotation: rot }}, 0);
        if (el.classList.contains("box")) tl.fromTo(el, {{ opacity: 0 }}, {{ opacity: 1, duration: 0.12, ease: "none" }}, at);
        tl.fromTo(el.querySelectorAll(".wd"), {{ opacity: 0, filter: "blur(6px)" }}, {{ opacity: 1, filter: "blur(0px)", duration: 0.16, stagger: gap, ease: "none" }}, at);
      }};
      // Slap a photo onto the paper: it drops in slightly large and turned, lands, then drifts in close.
      const P = (sel, at, rot) => {{
        tl.fromTo(sel, {{ opacity: 0, scale: 1.18, rotation: rot + 7 }}, {{ opacity: 1, scale: 1, rotation: rot, duration: 0.45, ease: "expo.out" }}, at);
        tl.fromTo(sel + "-img", {{ scale: 1 }}, {{ scale: 1.08, duration: 6, ease: "none" }}, at);
      }};
      {boil}
      {cam}
      {js}
      window.__timelines["{sid}"] = tl;
    }})();
  </script>
</template>
"""
