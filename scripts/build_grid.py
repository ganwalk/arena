"""Gera src/data/land-grid.json: malha equiretangular de células de terra.
Uso: node scripts/build_grid.mjs /tmp/land.geojson && python3 scripts/build_grid.py /tmp/land.geojson
"""
import json, os, sys
from PIL import Image, ImageDraw

GRID = {"lon0": -170, "lat0": 80, "step": 4, "cols": 90, "rows": 35}
SS = 20  # pixels por célula na rasterização
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

geo = json.load(open(sys.argv[1]))
W, H = GRID["cols"] * SS, GRID["rows"] * SS
img = Image.new("L", (W, H), 0)
draw = ImageDraw.Draw(img)

for f in geo["features"]:
    g = f["geometry"]
    polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    for poly in polys:
        for i, ring in enumerate(poly):
            # desdobra a longitude para anéis que cruzam o antimeridiano
            un, prev = [], None
            for lon, lat in ring:
                if prev is not None:
                    while lon - prev > 180: lon -= 360
                    while lon - prev < -180: lon += 360
                un.append((lon, lat)); prev = lon
            for shift in (-360, 0, 360, 720):
                pts = [((lon + shift - GRID["lon0"]) / GRID["step"] * SS, (GRID["lat0"] - lat) / GRID["step"] * SS) for lon, lat in un]
                if max(p[0] for p in pts) < 0 or min(p[0] for p in pts) > W:
                    continue
                draw.polygon(pts, fill=0 if i else 255)

rows = []
px = img.load()
for r in range(GRID["rows"]):
    line = ""
    for c in range(GRID["cols"]):
        tot = sum(px[c * SS + x, r * SS + y] for y in range(SS) for x in range(SS))
        line += "1" if tot / (255 * SS * SS) >= 0.34 else "0"
    rows.append(line)
json.dump({**GRID, "linhas": rows}, open(os.path.join(ROOT, "src/data/land-grid.json"), "w"))
print("\n".join(rows).replace("0", " ").replace("1", "#"))
