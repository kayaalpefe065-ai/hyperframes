"""Write YOUTUBE.md: title, description with chapters, sources and image credits, tags."""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ch = json.load(open(os.path.join(ROOT, "tools", "chapters.json"), encoding="utf-8"))
cred = json.load(open(os.path.join(ROOT, "assets", "img", "credits.json"), encoding="utf-8"))

def ts(t):
    t = int(t)
    return f"{t // 60}:{t % 60:02d}"

USE = {"tambora": "Tambora-Krater aus der ISS", "earth": "Die Erde, Apollo 17", "hunger1817": "Hungersnot 1817",
       "diodati": "Villa Diodati", "byron": "Lord Byron", "shelley": "Mary Shelley", "frankenstein": "Frankenstein, Titelbild 1831",
       "drais": "Laufmaschine von Karl Drais", "wilhelm": "König Wilhelm I. von Württemberg", "pinatubo": "Ausbruch des Pinatubo 1991"}
lines = [
    "# YouTube – 1816: Das Jahr ohne Sommer", "",
    "## Titel", "",
    "Schnee im Juni: Wie ein Vulkan der Welt 1816 den Sommer stahl", "",
    "Alternativen:", "- 1816 – Das Jahr ohne Sommer (ein Vulkan, die halbe Welt friert)",
    "- Ein Vulkan, kein Sommer: Was 1816 wirklich passiert ist", "",
    "## Beschreibung", "",
    "Juni 1816: In der Schweiz schneit es, in Süddeutschland verfault das Getreide auf den Feldern, Brot wird unbezahlbar. "
    "Schuld ist ein Vulkan auf der anderen Seite der Welt: der Tambora in Indonesien. In diesem Video erklären wir, wie sein "
    "Ausbruch im April 1815 die halbe Welt abkühlte, warum Zehntausende hungerten und auswanderten – und was das alles mit "
    "Frankenstein, dem Fahrrad und dem Cannstatter Wasen zu tun hat.", "",
    "Kapitel:",
]
lines += [f"{ts(t)} {name}" for t, name in ch["chapters"]]
lines += [
    "", "Quellen:",
    "- Oppenheimer, C. (2003): Climatic, environmental and human consequences of the largest known historic eruption: Tambora volcano (Indonesia) 1815. Progress in Physical Geography 27(2), 230–259.",
    "- Post, J. D. (1977): The Last Great Subsistence Crisis in the Western World. Johns Hopkins University Press.",
    "- Behringer, W. (2015): Tambora und das Jahr ohne Sommer. Wie ein Vulkan die Welt in die Krise stürzte. C. H. Beck.",
    "- Lessing, H.-E. (2003): Automobilität – Karl Drais und die unglaublichen Anfänge. Maxime-Verlag. (These: Hafermangel → Laufmaschine; nicht belegt)",
    "- Self, S. et al. (1993) / McCormick, M. P. et al. (1995): Pinatubo-Ausbruch 1991 und seine Klimawirkung.", "",
    "Bilder (Wikimedia Commons):",
]
for key, label in USE.items():
    c = cred.get(key)
    if c:
        artist = c["artist"] or "unbekannt"
        lines.append(f"- {label}: {artist} – {c['license']} – {c['page']}")
    else:
        lines.append(f"- {label}: (fehlt)")
lines += [
    "", "Sprecher: ElevenLabs („Will“). Musik: ElevenLabs Music. Zeichnungen und Animation: HyperFrames.", "",
    "## Tags", "",
    "1816, Jahr ohne Sommer, Tambora, Vulkanausbruch, Vulkan, Klimageschichte, Hungersnot, Hungerjahr 1817, Geschichte, "
    "Württemberg, Auswanderung, Frankenstein, Mary Shelley, Karl Drais, Laufmaschine, Cannstatter Wasen, Pinatubo, Klima, Erklärvideo", "",
    "## Hinweise zum Hochladen", "",
    "- Video: `jahr-ohne-sommer-youtube.mp4` (1920×1080, 30 fps), Thumbnail: `thumbnail.png` (1280×720).",
    "- Die Untertitel sind ins Video eingebrannt. Als zusätzliche YouTube-Untertitelspur kann `captions.srt` hochgeladen werden.",
    "- Kapitel funktionieren auf YouTube, wenn die Liste mit 0:00 beginnt (ist so).",
]
open(os.path.join(ROOT, "YOUTUBE.md"), "w", encoding="utf-8").write("\n".join(lines) + "\n")
print("ok")
