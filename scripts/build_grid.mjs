// Converte o TopoJSON do Natural Earth (50m) em GeoJSON para scripts/build_grid.py.
import { readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";

const topo = JSON.parse(readFileSync(new URL("../node_modules/world-atlas/land-50m.json", import.meta.url)));
writeFileSync(process.argv[2] || "land.geojson", JSON.stringify(feature(topo, topo.objects.land)));
