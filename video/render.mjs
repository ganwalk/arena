// Renderiza video/brag.html quadro a quadro e gera video/arena-brag.mp4 com a trilha.
//   node video/render.mjs                 vídeo completo (30 fps)
//   node video/render.mjs --quadros 3,12.5 só os quadros indicados, em PNG (para revisão)
// Precisa de ffmpeg e do Playwright (Chromium). A trilha sai de video/trilha.py.
import { createServer } from "node:http";
import { readFile, mkdir, writeFile, rm } from "node:fs/promises";
import { spawn, execFileSync } from "node:child_process";
import { extname, join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  const raiz = execFileSync("npm", ["root", "-g"]).toString().trim();
  ({ chromium } = require(join(raiz, "playwright")));
}

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "..");
const FPS = 30;
const TRABALHOS = Number(process.env.TRABALHOS || 4);
const args = process.argv.slice(2);
const quadros = args.includes("--quadros") ? args[args.indexOf("--quadros") + 1].split(",").map(Number) : null;

const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".wav": "audio/wav" };
const servidor = createServer(async (req, res) => {
  try {
    const caminho = join(RAIZ, decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (!caminho.startsWith(RAIZ)) throw new Error("fora");
    const dados = await readFile(caminho);
    res.writeHead(200, { "content-type": TIPOS[extname(caminho)] || "application/octet-stream" });
    res.end(dados);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((ok) => servidor.listen(0, ok));
const URL_PAGINA = `http://localhost:${servidor.address().port}/video/brag.html?render`;

const navegador = await chromium.launch();
async function abrir() {
  const pagina = await navegador.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await pagina.goto(URL_PAGINA);
  await pagina.evaluate(() => window.pronto);
  return pagina;
}

const SAIDA = join(AQUI, "saida");
await mkdir(SAIDA, { recursive: true });

if (quadros) {
  const pagina = await abrir();
  for (const t of quadros) {
    await pagina.evaluate((t) => window.seek(t), t);
    await pagina.screenshot({ path: join(SAIDA, `quadro-${t.toFixed(2)}.png`) });
  }
  console.log(`${quadros.length} quadros em ${SAIDA}`);
} else {
  const dur = await (await abrir()).evaluate(() => window.DUR);
  const total = Math.round(dur * FPS);
  const fatia = Math.ceil(total / TRABALHOS);
  const inicio = Date.now();
  let feitos = 0;
  await Promise.all(
    Array.from({ length: TRABALHOS }, async (_, w) => {
      const pagina = await abrir();
      const de = w * fatia, ate = Math.min(total, de + fatia);
      const ff = spawn("ffmpeg", ["-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "12", "-pix_fmt", "yuv420p", join(SAIDA, `parte-${w}.mp4`)], { stdio: ["pipe", "inherit", "inherit"] });
      for (let f = de; f < ate; f++) {
        await pagina.evaluate((t) => window.seek(t), f / FPS);
        const png = await pagina.screenshot({ type: "png" });
        if (!ff.stdin.write(png)) await new Promise((ok) => ff.stdin.once("drain", ok));
        if (++feitos % 150 === 0) console.log(`${feitos}/${total} quadros, ${((Date.now() - inicio) / 1000).toFixed(0)} s`);
      }
      ff.stdin.end();
      await new Promise((ok) => ff.on("close", ok));
    }),
  );
  await writeFile(join(SAIDA, "partes.txt"), Array.from({ length: TRABALHOS }, (_, w) => `file 'parte-${w}.mp4'`).join("\n"));
  const trilha = join(AQUI, "trilha.wav");
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", join(SAIDA, "partes.txt"), "-i", trilha,
    "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart",
    "-c:a", "aac", "-b:a", "192k", "-shortest", join(AQUI, "arena-brag.mp4")], { stdio: "inherit" });
  for (let w = 0; w < TRABALHOS; w++) await rm(join(SAIDA, `parte-${w}.mp4`));
  await rm(join(SAIDA, "partes.txt"));
  console.log(`video/arena-brag.mp4 pronto em ${((Date.now() - inicio) / 1000).toFixed(0)} s`);
}
await navegador.close();
servidor.close();
