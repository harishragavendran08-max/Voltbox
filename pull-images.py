#!/usr/bin/env python3
"""
Pull a real, matching product photo for every item in seed-products.json from
Wikimedia Commons — a free, open image library whose photos hotlink reliably
from anywhere in the world (unlike some hobby image services).

Run it from the project folder:

    python3 pull-images.py
    rm voltbox-data.json          # so the catalog re-seeds with the new links
    ./mvnw spring-boot:run

For each product it searches Commons by the product's name and only accepts a
photo whose filename actually contains the model (so "RTX 4070" gets an RTX
4070, not a random card). Parts too niche to have their own Commons photo get a
real photo for their category instead; anything with nothing at all keeps its
local category tile. Nothing ends up blank.

Anything that's already pointing at a Wikimedia photo is left alone, so hand-
picked links are never overwritten.
"""
import json, re, time, urllib.parse, urllib.request

SEED = "src/main/resources/seed-products.json"
API  = "https://commons.wikimedia.org/w/api.php"
UA   = {"User-Agent": "voltbox-demo/1.0 (community catalog, contact: local)"}  # Commons asks for a UA

# filenames that aren't a clean product photo — skip them
BAD = ("logo", "icon", "chart", "graph", "diagram", "benchmark", "review", "test",
       "video", "screenshot", "geekerwan", "map", "pont", "wafer", "comparison",
       "unboxing", "meme", "award")

# a good generic search per category, for parts too niche for their own photo
CATEGORY_QUERY = {
    "cpus": "CPU processor chip", "gpus": "graphics card GPU",
    "memory": "RAM memory module", "storage": "solid state drive",
    "motherboards": "computer motherboard", "power": "computer power supply unit",
    "cooling": "CPU cooler heatsink", "cases": "computer case tower",
    "networking": "network switch router", "cables": "USB cable",
    "peripherals": "computer mechanical keyboard", "monitors": "LCD computer monitor display",
    "microcontrollers": "Arduino microcontroller board", "components": "electronic components",
    "sensors": "electronic sensor module", "tools": "multimeter tool",
    "connectors": "electrical connector", "adapters": "USB adapter hub",
}

# words too generic to count as a real name-match
STOP = set("the a an of with and for in on at to gb tb mhz w amd intel nvidia "
           "gpu cpu pcs pc pack kit series".split())


def norm(s):
    return re.sub(r"[\s_\-]+", " ", s.lower())


def search(query, limit=12):
    params = {"action": "query", "generator": "search", "gsrsearch": query,
              "gsrnamespace": "6", "gsrlimit": str(limit), "prop": "imageinfo",
              "iiprop": "url", "iiurlwidth": "700", "format": "json"}
    url = API + "?" + urllib.parse.urlencode(params)
    # retry a couple times with a SHORT timeout — Commons sometimes throttles a
    # burst, and we'd rather give up quickly and fall back than hang for a minute
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers=UA)
            data = json.load(urllib.request.urlopen(req, timeout=8))
            break
        except Exception:
            time.sleep(1 + attempt)
    else:
        return []
    out = []
    for p in (data.get("query") or {}).get("pages", {}).values():
        ii = p.get("imageinfo")
        if not ii:
            continue
        title = p["title"].replace("File:", "")
        if not re.search(r"\.(jpg|jpeg|png|webp)$", title, re.I):
            continue
        if any(b in norm(title) for b in BAD):
            continue
        out.append((title, ii[0]["thumburl"]))
    return out


# one real photo per category, fetched ONCE up front (see prewarm_categories) so
# a page of 10 storage products doesn't fire 10 identical searches — that's what
# throttled the early runs. key: category slug -> a real photo url (or None).
_category_cache = {}

def category_photo(cat):
    # only cache a SUCCESS — a failed lookup is left uncached so it's retried
    if _category_cache.get(cat):
        return _category_cache[cat]
    hits = search(CATEGORY_QUERY.get(cat, cat), limit=8)
    if hits:
        _category_cache[cat] = hits[0][1]
    return _category_cache.get(cat)


def prewarm_categories(products):
    # grab every category's fallback photo first, gently, before the big burst of
    # per-product searches — so even if those get throttled, no card is left blank
    cats = sorted(set(p["category"] for p in products))
    print("warming up %d category photos..." % len(cats))
    for c in cats:
        for _ in range(3):                 # try hard — these are the safety net
            if category_photo(c):
                break
            time.sleep(2)
        print("   %-16s %s" % (c, "ok" if _category_cache.get(c) else "— (will use tile)"))
        time.sleep(0.5)


def score(words, filename):
    n = norm(filename)
    return sum(1 for w in words if len(w) > 1 and w not in STOP and w in n)


def best_image(p):
    words = re.findall(r"[a-z0-9]+", p["title"].lower())
    ranked = sorted(((score(words, t), u) for t, u in search(p["title"])), reverse=True)
    if ranked and ranked[0][0] >= 2:                        # 2+ name-words = a solid match
        return ranked[0][1], "exact"
    cat = category_photo(p["category"])                     # else a real photo for the category
    if cat:
        return cat, "category"
    return "/images/categories/%s.svg" % p["category"], "tile"   # else the local tile


def main():
    products = json.load(open(SEED))
    prewarm_categories(products)            # safety net first, before the burst
    counts = {"kept": 0, "exact": 0, "category": 0, "tile": 0}
    for i, p in enumerate(products, 1):
        if "upload.wikimedia.org" in p.get("image", ""):    # already a Wikimedia photo — leave it
            counts["kept"] += 1
            print("%3d/%d  keep     %-36.36s" % (i, len(products), p["title"]))
            continue
        url, kind = best_image(p)
        p["image"] = url
        counts[kind] += 1
        print("%3d/%d  %-8s %-36.36s  %s" % (i, len(products), kind, p["title"], url[:66]), flush=True)
        if i % 15 == 0:                                     # save as we go, so nothing's lost
            json.dump(products, open(SEED, "w"), indent=2)
        time.sleep(0.3)                                     # be polite to the API

    json.dump(products, open(SEED, "w"), indent=2)
    real = counts["kept"] + counts["exact"] + counts["category"]
    print("\nDone. %d of %d products got a real photo "
          "(%d kept, %d exact match, %d category); %d kept the local tile."
          % (real, len(products), counts["kept"], counts["exact"],
             counts["category"], counts["tile"]))


if __name__ == "__main__":
    main()
