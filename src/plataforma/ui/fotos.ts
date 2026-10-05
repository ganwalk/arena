/*
  Retratos de exemplo (Pexels, licença livre) para as pessoas fictícias da demonstração.
  Ficam fora do domínio: em produção, a foto vem do cadastro e pode simplesmente não existir.
*/
const BASE = "/plataforma/pessoas/";

const FIXAS: Record<string, string> = {
  "u-lucas": "lucas",
  "u-marina": "marina",
  "u-theo": "theo",
  "u-claudia": "claudia",
  "u-rafael": "rafael",
  "u-beatriz": "beatriz",
  "u-sergio": "sergio",
  "u-livia": "livia",
  "u-andre": "andre",
  "u-fernanda": "fernanda",
  "u-juliana": "juliana",
  "u-paula": "paula",
  "u-marcos": "marcos",
  "u-roberto": "roberto",
  "u-gabriel": "gabriel",
};

const COLEGAS = [
  "alice-ferreira", "bernardo-souza", "cecilia-rocha", "heitor-almeida", "laura-pires",
  "miguel-cardoso", "valentina-gomes", "arthur-lacerda", "isabela-freitas", "enzo-barbosa", "lara-monteiro",
  "sofia-ribeiro", "davi-mendes", "helena-duarte", "rafaela-castro", "samuel-vieira",
  "joao-pedro-silva", "ana-clara-souza", "mateus-oliveira", "livia-moraes", "pietro-azevedo",
  "manuela-prado", "lorenzo-batista", "yasmin-carvalho", "caio-fernandes",
];

const MULHERES = 12;
const HOMENS = 12;
const NOMES_FEMININOS = /^(patr[ií]cia|carla|ana|renata|camila|aline|s[ií]lvia|let[ií]cia|daniela|bruna|maria|m[aã]e)/i;

function indice(texto: string, n: number) {
  let h = 0;
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (h % n) + 1;
}

/** Endereço do retrato da pessoa, ou null para mostrar as iniciais. */
export function fotoDe(id: string, nome: string): string | null {
  if (FIXAS[id]) return `${BASE}${FIXAS[id]}.jpg`;
  const slug = id.replace(/^u-/, "");
  if (COLEGAS.includes(slug)) return `${BASE}${slug}.jpg`;
  if (id.startsWith("u-resp-")) {
    return NOMES_FEMININOS.test(nome) ? `${BASE}mulher-${indice(id, MULHERES)}.jpg` : `${BASE}homem-${indice(id, HOMENS)}.jpg`;
  }
  return null;
}
