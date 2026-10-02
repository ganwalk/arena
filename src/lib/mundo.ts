// Prepara a base do "Arena pelo mundo" (src/data/conquistas.json) para o mapa.
import conquistas from "../data/conquistas.json";
import grade from "../data/land-grid.json";

export type Categoria = "aprovacao" | "olimpiada" | "viagem" | "torneio" | "arena";
export interface Bloco {
  t: "p" | "li";
  x: string;
}
export interface Registro {
  id: number;
  nome: string;
  cidade: string;
  pais: string;
  iso: string;
  cat: Categoria;
  texto: Bloco[];
  alunos: string[];
  capa: string | null;
  fotos: string[];
  lng: number;
  lat: number;
}
export interface Ponto {
  c: number;
  r: number;
  ids: number[];
}

export const CATEGORIAS: { id: Exclude<Categoria, "arena">; rotulo: string; bit: number }[] = [
  { id: "aprovacao", rotulo: "Aprovação em universidade", bit: 1 },
  { id: "olimpiada", rotulo: "Competição acadêmica", bit: 2 },
  { id: "viagem", rotulo: "Viagem de conhecimento", bit: 4 },
  { id: "torneio", rotulo: "Torneio esportivo", bit: 8 },
];

export const GOIANIA = { lng: -49.2648, lat: -16.6869 };
export const registros = conquistas as Registro[];

export function celula(lng: number, lat: number) {
  let x = lng;
  while (x < grade.lon0) x += 360;
  while (x >= grade.lon0 + 360) x -= 360;
  return {
    c: Math.min(grade.cols - 1, Math.floor((x - grade.lon0) / grade.step)),
    r: Math.max(0, Math.min(grade.rows - 1, Math.floor((grade.lat0 - lat) / grade.step))),
  };
}

export function pontos(): Ponto[] {
  const mapa = new Map<string, Ponto>();
  for (const reg of registros) {
    if (reg.cat === "arena") continue;
    const { c, r } = celula(reg.lng, reg.lat);
    const k = `${c}:${r}`;
    if (!mapa.has(k)) mapa.set(k, { c, r, ids: [] });
    mapa.get(k)!.ids.push(reg.id);
  }
  return [...mapa.values()];
}

/** Nomes de ex-alunos aprovados citados na base (registros por universidade e resumos por país). */
export function alunosAprovados(): Set<string> {
  const nomes = new Set<string>();
  for (const reg of registros) {
    for (const n of reg.alunos) if (!n.endsWith(":")) nomes.add(n.trim());
    if (reg.cat === "aprovacao" && reg.nome.startsWith("Aprova")) {
      for (const b of reg.texto) {
        const m = b.x.match(/^([A-ZÀ-Ý][^—–-]{2,40}?)\s+[—–-]\s+/);
        if (m) nomes.add(m[1].trim());
      }
    }
  }
  return nomes;
}

export function numeros() {
  const paisesAprovacao = new Set(registros.filter((r) => r.cat === "aprovacao").map((r) => r.pais));
  const paisesCompeticao = new Set(
    registros.filter((r) => r.cat === "olimpiada" && r.pais !== "Brasil").map((r) => r.pais),
  );
  const contagem = Object.fromEntries(CATEGORIAS.map((c) => [c.id, registros.filter((r) => r.cat === c.id).length]));
  return {
    alunos: alunosAprovados().size,
    paisesAprovacao: paisesAprovacao.size,
    paisesCompeticao: paisesCompeticao.size,
    contagem: contagem as Record<Exclude<Categoria, "arena">, number>,
    total: registros.filter((r) => r.cat !== "arena").length,
  };
}

const CONTINENTE: Record<string, string> = {
  "Estados Unidos da América": "América", Brasil: "América", Canadá: "América", México: "América", Argentina: "América", Panamá: "América",
  China: "Ásia e Oriente Médio", Japão: "Ásia e Oriente Médio", Azerbaijão: "Ásia e Oriente Médio", Bahrein: "Ásia e Oriente Médio",
  "Emirados Árabes Unidos": "Ásia e Oriente Médio", Geórgia: "Ásia e Oriente Médio", Vietnã: "Ásia e Oriente Médio",
  Quênia: "África e Oceania", Austrália: "África e Oceania",
};
export const ORDEM_CONTINENTES = ["América", "Europa", "Ásia e Oriente Médio", "África e Oceania"];

/** Países agrupados por continente; país sem entrada explícita é europeu. */
export function continentes() {
  const grupos = ORDEM_CONTINENTES.map((nome) => ({ nome, paises: [] as ReturnType<typeof paises>, total: 0 }));
  for (const p of paises()) {
    const g = grupos.find((x) => x.nome === (CONTINENTE[p.pais] ?? "Europa"))!;
    g.paises.push(p);
    g.total += p.ids.length;
  }
  return grupos;
}

/** Países com registros, do maior para o menor. */
export function paises() {
  const m = new Map<string, { pais: string; iso: string; ids: number[] }>();
  for (const reg of registros) {
    if (reg.cat === "arena") continue;
    if (!m.has(reg.pais)) m.set(reg.pais, { pais: reg.pais, iso: reg.iso, ids: [] });
    m.get(reg.pais)!.ids.push(reg.id);
  }
  return [...m.values()].sort((a, b) => b.ids.length - a.ids.length || a.pais.localeCompare(b.pais, "pt"));
}

export { grade };
