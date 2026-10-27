"""Download the public-domain / CC0 images from Wikimedia Commons -> assets/img/, with credits.json."""
import json, os, re, sys, time, urllib.error, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = {"User-Agent": "HyperframesDocResearch/1.0 (https://github.com/kayaalpefe065-ai/hyperframes; educational video)"}
FILES = {
    "tambora": "Mount Tambora Volcano, Sumbawa Island, Indonesia.jpg",
    "earth": "The Earth seen from Apollo 17.jpg",
    "hunger1817": "Giezendanner Hunger 1817.jpg",
    "diodati": None,  # Rijksmuseum print, title looked up by search below
    "byron": "Byron 1813 by Phillips.jpg",
    "shelley": "RothwellMaryShelley.jpg",
    "frankenstein": "Frontispiece to Frankenstein 1831.jpg",
    "drais": None,
    "wilhelm": "König Wilhelm I Württ.jpg",
    "pinatubo": "Eruption of Mount Pinatubo, June 15, 1991.jpg",
}
SEARCH = {"diodati": "Gezicht op villa Diodati aan het Geneva meer", "drais": "Laufmaschine des Karl Friedrich Drais 1817 vorne rechts"}

def get(u):
    for _ in range(15):
        try:
            return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=40).read()
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
            wait = int(e.headers.get("retry-after") or 20) + 3
            print(f"  429, waiting {wait}s", flush=True)
            time.sleep(wait)
        except (TimeoutError, urllib.error.URLError) as e:
            print(f"  {e}, retrying", flush=True)
            time.sleep(10)
    raise SystemExit("rate limited")

def api(**kw):
    return json.loads(get("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(dict(format="json", **kw))))

def strip(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html or "")).strip()

credits_path = os.path.join(ROOT, "assets", "img", "credits.json")
credits = json.load(open(credits_path)) if os.path.exists(credits_path) else {}
for key, title in FILES.items():
    if key in credits:
        continue
    if title is None:
        d = api(action="query", list="search", srsearch=SEARCH[key], srnamespace=6, srlimit=1)
        title = d["query"]["search"][0]["title"][5:]
        time.sleep(5)
    d = api(action="query", titles="File:" + title, prop="imageinfo", iiprop="url|extmetadata", iiurlwidth=1280)
    page = next(iter(d["query"]["pages"].values()))
    ii = page["imageinfo"][0]
    m = ii["extmetadata"]
    url = ii.get("thumburl") or ii["url"]
    ext = os.path.splitext(urllib.parse.urlparse(url).path)[1].lower() or ".jpg"
    if ext not in (".jpg", ".jpeg", ".png"):
        ext = ".jpg"
    out = os.path.join(ROOT, "assets", "img", key + ext)
    time.sleep(5)
    data = get(url)
    open(out, "wb").write(data)
    credits[key] = {"file": os.path.basename(out), "title": title, "page": ii["descriptionurl"],
                    "artist": strip(m.get("Artist", {}).get("value")), "license": m.get("LicenseShortName", {}).get("value"),
                    "date": strip(m.get("DateTimeOriginal", {}).get("value"))}
    json.dump(credits, open(credits_path, "w"), ensure_ascii=False, indent=1)
    print(key, credits[key]["license"], "|", credits[key]["artist"][:60], flush=True)
    time.sleep(8)
