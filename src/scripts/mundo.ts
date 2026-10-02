import { Mapa, type PontoMapa } from "./mapa";

type Cat = "aprovacao" | "olimpiada" | "viagem" | "torneio";
interface Registro {
  id: number;
  nome: string;
  cidade: string;
  pais: string;
  cat: Cat;
  texto: { t: "p" | "li"; x: string }[];
  alunos: string[];
  capa: string | null;
  fotos: string[];
  lng: number;
  lat: number;
}
interface Dados {
  grade: { lon0: number; lat0: number; step: number; cols: number; rows: number; linhas: string[] };
  origem: { lng: number; lat: number };
  pontos: { c: number; r: number; ids: number[] }[];
  registros: Registro[];
}

const BIT: Record<Cat, number> = { aprovacao: 1, olimpiada: 2, viagem: 4, torneio: 8 };
const ROTULO: Record<Cat, string> = {
  aprovacao: "Aprovação em universidade",
  olimpiada: "Competição acadêmica",
  viagem: "Viagem de conhecimento",
  torneio: "Torneio esportivo",
};
const PAIS_CURTO: Record<string, string> = { "Estados Unidos da América": "Estados Unidos" };

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const pais = (p: string) => PAIS_CURTO[p] ?? p;
function texto(lista: { t: "p" | "li"; x: string }[]) {
  let html = "";
  let emLista = false;
  for (const b of lista) {
    if (b.t === "li" && !emLista) {
      html += "<ul>";
      emLista = true;
    }
    if (b.t !== "li" && emLista) {
      html += "</ul>";
      emLista = false;
    }
    html += b.t === "li" ? `<li>${esc(b.x)}</li>` : `<p>${esc(b.x)}</p>`;
  }
  return html + (emLista ? "</ul>" : "");
}

/** Título de um grupo de registros: a cidade quando todos coincidem, senão o país. */
function tituloGrupo(regs: Registro[]) {
  const cidades = new Set(regs.map((r) => r.cidade));
  const paises = new Set(regs.map((r) => r.pais));
  if (cidades.size === 1 && regs[0].cidade) return lugar(regs[0]);
  if (paises.size === 1) return pais(regs[0].pais);
  return [...paises].map(pais).join(" e ");
}

const lugar = (r: Registro) => [r.cidade, pais(r.pais)].filter(Boolean).join(", ");

export async function iniciarMundo(secao: HTMLElement) {
  const palco = secao.querySelector<HTMLElement>("[data-palco]")!;
  const tela = secao.querySelector<HTMLElement>("[data-tela]")!;
  const canvas = secao.querySelector<HTMLCanvasElement>("[data-canvas]")!;
  const arco = secao.querySelector<SVGSVGElement>("[data-arco]")!;
  const caminho = arco.querySelector("path")!;
  const rotuloOrigem = secao.querySelector<HTMLElement>("[data-origem]")!;
  const dica = secao.querySelector<HTMLElement>("[data-dica]")!;
  const detalhe = secao.querySelector<HTMLElement>("[data-detalhe]")!;
  const carregando = secao.querySelector<HTMLElement>("[data-carregando]")!;
  const reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let dados: Dados;
  try {
    dados = await (await fetch("/mundo.json")).json();
  } catch {
    carregando.textContent = "Não foi possível carregar o mapa. Recarregue a página para tentar de novo.";
    return;
  }
  carregando.remove();

  const porId = new Map(dados.registros.map((r) => [r.id, r]));
  const pontos: PontoMapa[] = dados.pontos.map((p) => ({
    ...p,
    bits: p.ids.reduce((b, id) => b | BIT[porId.get(id)!.cat], 0),
  }));
  const g = dados.grade;
  const celulaDe = (lng: number, lat: number) => {
    let x = lng;
    while (x < g.lon0) x += 360;
    return { c: Math.floor((x - g.lon0) / g.step), r: Math.floor((g.lat0 - lat) / g.step) };
  };
  const origem = celulaDe(dados.origem.lng, dados.origem.lat);

  const mapa = new Mapa(canvas, { linhas: g.linhas, pontos, origem, reduzir });
  let selecionado = -1;

  function dimensionar() {
    const largura = palco.clientWidth;
    const minimo = largura < 720 ? 11 : 0;
    mapa.dimensionar(Math.max(largura / g.cols, minimo));
    const o = mapa.centroCss(origem.c, origem.r);
    rotuloOrigem.style.left = `${o.x}px`;
    rotuloOrigem.style.top = `${o.y}px`;
    rotuloOrigem.hidden = false;
    arco.setAttribute("viewBox", `0 0 ${g.cols * mapa.tamanhoCelula} ${g.rows * mapa.tamanhoCelula}`);
    if (selecionado >= 0) desenharArco(selecionado, false);
  }
  dimensionar();
  new ResizeObserver(() => dimensionar()).observe(palco);

  // No celular o mapa é mais largo que a tela: começa centrado no Atlântico, entre Goiânia e a Europa.
  if (palco.scrollWidth > palco.clientWidth) {
    const alvo = mapa.centroCss(celulaDe(-25, 0).c, 0).x;
    palco.scrollLeft = alvo - palco.clientWidth / 2;
  }

  const obs = new IntersectionObserver(
    (e) => {
      if (e.some((x) => x.isIntersecting)) {
        obs.disconnect();
        mapa.revelar();
      }
    },
    { threshold: 0.3 },
  );
  obs.observe(tela);

  // ---------- interação no mapa
  const local = (e: PointerEvent) => {
    const b = canvas.getBoundingClientRect();
    return { x: e.clientX - b.left, y: e.clientY - b.top };
  };

  tela.addEventListener("pointermove", (e) => {
    const { x, y } = local(e);
    mapa.definirMouse(x, y);
    if (e.pointerType !== "mouse") return;
    const i = mapa.pontoEm(x, y);
    mapa.definirHover(i);
    tela.style.cursor = i >= 0 ? "pointer" : "crosshair";
    if (i < 0) {
      dica.hidden = true;
      return;
    }
    const p = pontos[i];
    const regs = p.ids.map((id) => porId.get(id)!);
    const titulo = regs.length === 1 ? regs[0].nome : tituloGrupo(regs);
    const sub = regs.length === 1 ? lugar(regs[0]) : `${regs.length} registros`;
    dica.innerHTML = `<strong>${esc(titulo)}</strong><span>${esc(sub)}</span>`;
    const c = mapa.centroCss(p.c, p.r);
    dica.style.left = `${c.x}px`;
    dica.style.top = `${c.y - mapa.tamanhoCelula}px`;
    dica.hidden = false;
  });

  tela.addEventListener("pointerleave", () => {
    mapa.definirMouse(-9999, -9999);
    mapa.definirHover(-1);
    dica.hidden = true;
  });

  tela.addEventListener("click", (e) => {
    const { x, y } = local(e as PointerEvent);
    const i = mapa.pontoEm(x, y);
    if (i < 0) return;
    const p = pontos[i];
    const regs = p.ids.map((id) => porId.get(id)!);
    selecionarPonto(i, regs.length === 1 ? regs[0].nome : tituloGrupo(regs), p.ids);
    marcarPais(null);
  });

  // ---------- filtros
  const filtros = [...secao.querySelectorAll<HTMLButtonElement>("[data-filtro]")];
  filtros.forEach((b) =>
    b.addEventListener("click", () => {
      filtros.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      mapa.definirFiltro(Number(b.dataset.filtro));
    }),
  );

  // ---------- países
  const botoesPais = [...secao.querySelectorAll<HTMLButtonElement>("[data-pais]")];
  function marcarPais(nome: string | null) {
    botoesPais.forEach((b) => b.setAttribute("aria-current", String(b.dataset.pais === nome)));
  }
  botoesPais.forEach((b) =>
    b.addEventListener("click", () => {
      const nome = b.dataset.pais!;
      const ids = dados.registros.filter((r) => r.pais === nome).map((r) => r.id);
      // destaca no mapa o ponto do país com mais registros
      let melhor = -1;
      pontos.forEach((p, i) => {
        const n = p.ids.filter((id) => porId.get(id)!.pais === nome).length;
        if (n && (melhor < 0 || n > pontos[melhor].ids.filter((id) => porId.get(id)!.pais === nome).length)) melhor = i;
      });
      marcarPais(nome);
      selecionarPonto(melhor, pais(nome), ids);
    }),
  );

  // ---------- seleção e painel
  function desenharArco(i: number, animar: boolean) {
    const p = pontos[i];
    const a = mapa.centroCss(origem.c, origem.r);
    const b = mapa.centroCss(p.c, p.r);
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 - d * 0.32;
    caminho.setAttribute("d", `M${a.x} ${a.y}Q${mx} ${my} ${b.x} ${b.y}`);
    const L = caminho.getTotalLength();
    caminho.style.transition = "none";
    caminho.style.strokeDasharray = `${L}`;
    caminho.style.strokeDashoffset = animar && !reduzir ? `${L}` : "0";
    if (animar && !reduzir) {
      caminho.getBoundingClientRect();
      caminho.style.transition = "stroke-dashoffset 700ms cubic-bezier(0.2, 0.7, 0.2, 1)";
      caminho.style.strokeDashoffset = "0";
    }
  }

  function selecionarPonto(i: number, titulo: string, ids: number[]) {
    selecionado = i;
    mapa.definirSelecao(i);
    if (i >= 0) desenharArco(i, true);
    mostrarLista(titulo, ids);
    const b = detalhe.getBoundingClientRect();
    if (b.top > innerHeight - 120 || b.bottom < 0) {
      detalhe.scrollIntoView({ behavior: reduzir ? "auto" : "smooth", block: "start" });
    }
  }

  function mostrarLista(titulo: string, ids: number[]) {
    const regs = ids.map((id) => porId.get(id)!);
    if (regs.length === 1) {
      detalhe.innerHTML = registroHTML(regs[0]);
      ligarRegistro(regs[0]);
      return;
    }
    const ordem: Cat[] = ["aprovacao", "olimpiada", "viagem", "torneio"];
    regs.sort((a, b) => ordem.indexOf(a.cat) - ordem.indexOf(b.cat) || a.nome.localeCompare(b.nome, "pt"));
    detalhe.innerHTML = `
      <div class="grupo">
        <h3 class="grupo__titulo">${esc(titulo)}</h3>
        <p class="grupo__n">${regs.length} registros</p>
        <ul role="list" class="grupo__lista">
          ${regs
            .map(
              (r) => `<li><button type="button" data-reg="${r.id}">
                <span class="cat cat--${r.cat}" aria-hidden="true"></span>
                <span class="grupo__nome">${esc(r.nome)}</span>
                <span class="grupo__lugar">${esc(ROTULO[r.cat])}${r.cidade ? `, ${esc(r.cidade)}` : ""}</span>
              </button></li>`,
            )
            .join("")}
        </ul>
      </div>`;
    detalhe.querySelectorAll<HTMLButtonElement>("[data-reg]").forEach((b) =>
      b.addEventListener("click", () => {
        const r = porId.get(Number(b.dataset.reg))!;
        detalhe.innerHTML = registroHTML(r, { titulo, ids });
        ligarRegistro(r);
        detalhe.querySelector<HTMLElement>("h3")?.focus();
        const p = pontos.findIndex((p) => p.ids.includes(r.id));
        if (p >= 0 && p !== selecionado) {
          selecionado = p;
          mapa.definirSelecao(p);
          desenharArco(p, true);
        }
      }),
    );
  }

  let voltar: { titulo: string; ids: number[] } | null = null;

  function registroHTML(r: Registro, de?: { titulo: string; ids: number[] }) {
    voltar = de ?? null;
    const fotos = [...(r.capa ? [r.capa] : []), ...r.fotos.filter((f) => f !== r.capa)];
    const principal = fotos[0];
    const blocos = r.texto;
    const curto = blocos.length > 4;
    const alunos = r.alunos.length
      ? `<h4 class="registro__sub">Ex-alunos aprovados</h4>
         <ul role="list" class="registro__alunos">${r.alunos
           .map((n) => (n.endsWith(":") ? `<li class="registro__area">${esc(n.slice(0, -1))}</li>` : `<li>${esc(n)}</li>`))
           .join("")}</ul>`
      : "";
    return `
      <article class="registro">
        ${voltar ? `<button type="button" class="registro__voltar" data-voltar>Voltar para ${esc(voltar.titulo)}</button>` : ""}
        ${
          principal
            ? `<figure class="registro__foto"><img data-foto src="/mapa/${principal}" alt="Foto do registro ${esc(r.nome)}" width="1280" height="853" decoding="async"></figure>`
            : ""
        }
        ${
          fotos.length > 1
            ? `<ul role="list" class="registro__galeria">${fotos
                .slice(0, 12)
                .map(
                  (f, i) =>
                    `<li><button type="button" data-miniatura="${f}" aria-pressed="${i === 0}" aria-label="Mostrar foto ${i + 1} de ${Math.min(fotos.length, 12)}"><img src="/mapa/t/${f}" alt="" loading="lazy" width="120" height="80"></button></li>`,
                )
                .join("")}</ul>`
            : ""
        }
        <p class="registro__cat"><span class="cat cat--${r.cat}" aria-hidden="true"></span>${ROTULO[r.cat]}</p>
        <h3 class="registro__titulo" tabindex="-1">${esc(r.nome)}</h3>
        <p class="registro__lugar">${esc(lugar(r))}</p>
        <div class="registro__texto" data-texto>${texto(curto ? blocos.slice(0, 3) : blocos)}</div>
        ${curto ? `<button type="button" class="registro__mais" data-mais>Ler o texto completo</button>` : ""}
        ${alunos}
      </article>`;
  }

  function ligarRegistro(r: Registro) {
    detalhe.querySelector("[data-voltar]")?.addEventListener("click", () => {
      if (voltar) mostrarLista(voltar.titulo, voltar.ids);
      detalhe.querySelector<HTMLElement>("[data-reg]")?.focus();
    });
    detalhe.querySelector("[data-mais]")?.addEventListener("click", (e) => {
      const alvo = detalhe.querySelector<HTMLElement>("[data-texto]")!;
      alvo.innerHTML = texto(r.texto);
      (e.currentTarget as HTMLElement).remove();
    });
    const foto = detalhe.querySelector<HTMLImageElement>("[data-foto]");
    const minis = [...detalhe.querySelectorAll<HTMLButtonElement>("[data-miniatura]")];
    minis.forEach((m) =>
      m.addEventListener("click", () => {
        if (!foto) return;
        foto.src = `/mapa/${m.dataset.miniatura}`;
        minis.forEach((x) => x.setAttribute("aria-pressed", String(x === m)));
      }),
    );
  }
}
