// Mapa "Arena pelo mundo": cada célula de terra é um módulo do painel geométrico da marca.
// WebGL2 com instâncias; sem WebGL2, o mesmo desenho sai estático em Canvas 2D.

export interface Grade {
  lon0: number;
  lat0: number;
  step: number;
  cols: number;
  rows: number;
}
export interface PontoMapa {
  c: number;
  r: number;
  ids: number[];
  bits: number;
}

const FORMA = { cheio: 0, quarto: 1, folha: 2, ponto: 3, listras: 4, anel: 5, disco: 6, triangulo: 7 } as const;

const COR = {
  fundo: [0x1c, 0x25, 0x29],
  terra: [
    [0x34, 0x43, 0x4a],
    [0x40, 0x52, 0x5a],
    [0x1d, 0x5a, 0x5e],
  ],
  listras: [0x7d, 0x80, 0x7b],
  luz: [0x56, 0x6a, 0x73],
  apagado: [0x55, 0x63, 0x6a],
  // aprovacao, competicao, viagem, torneio
  cat: [
    [0x4c, 0xc3, 0xc8],
    [0xf0, 0xb5, 0x4b],
    [0xe3, 0xdd, 0xd2],
    [0xef, 0x7a, 0x68],
  ],
  origem: [0xff, 0xff, 0xff],
};

const rgb = (c: number[]) => c.map((v) => v / 255);

function hash(c: number, r: number) {
  const s = Math.sin(c * 127.1 + r * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

interface Instancia {
  c: number;
  r: number;
  forma: number;
  giro: number;
  tom: number;
  tam: number;
  cat: number;
  idx: number;
}

/** Escolhe forma e giro de cada célula de terra a partir das vizinhas: a costa fica arredondada com os quartos de círculo da marca. */
export function celulasDeTerra(linhas: string[]): Instancia[] {
  const rows = linhas.length;
  const cols = linhas[0].length;
  const terra = (c: number, r: number) => r >= 0 && r < rows && linhas[r][(c + cols) % cols] === "1";
  const out: Instancia[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!terra(c, r)) continue;
      const n = terra(c, r - 1), s = terra(c, r + 1), l = terra(c + 1, r), o = terra(c - 1, r);
      const viz = +n + +s + +l + +o;
      const h = hash(c, r);
      let forma: number = FORMA.cheio;
      let giro = 0;
      // tons em manchas largas, como as áreas do painel, e não célula a célula
      const mancha = Math.sin(c * 0.21 + Math.sin(r * 0.33) * 2.1) + Math.cos(r * 0.27 - c * 0.07);
      let tom = mancha > 0.9 ? 1 : 0;
      if (viz === 0) {
        forma = FORMA.ponto;
      } else if (viz === 1) {
        forma = FORMA.folha;
        giro = n ? 1 : l ? 2 : s ? 3 : 0;
      } else if (viz === 2 && n !== s) {
        // canto convexo: quarto de círculo com o centro no canto voltado para a terra
        forma = FORMA.quarto;
        if (n && o) giro = 0;
        else if (n && l) giro = 1;
        else if (s && l) giro = 2;
        else giro = 3;
      } else if (viz === 4 && h > 0.94) {
        forma = FORMA.listras;
        giro = h > 0.97 ? 1 : 0;
      } else if (viz === 4 && h < 0.04) {
        forma = FORMA.triangulo;
        tom = 2;
        giro = Math.floor(h * 1000) % 4;
      }
      out.push({ c, r, forma, giro, tom, tam: 1, cat: 0, idx: -1 });
    }
  }
  return out;
}

const VERT = `#version 300 es
precision highp float;
precision highp int;
in vec2 aPos;
in vec2 aCell;
in vec4 aInfo; // forma, giro, tom, tamanho
in vec2 aMeta; // bits de categoria, índice do ponto
uniform vec2 uRes;
uniform float uCell;
uniform vec2 uOrigem;
uniform float uTempo;
uniform int uFiltro;
uniform int uFiltroAntes;
uniform float uFiltroT;
uniform float uHover;
uniform float uSel;
out vec2 vUv;
out vec2 vCentro;
flat out vec4 vInfo;
flat out vec2 vMeta;
flat out float vAtivo;
flat out float vPx;

float ativo(int filtro) {
  if (aMeta.y < 0.0) return 1.0;
  return (int(aMeta.x) & filtro) != 0 ? 1.0 : 0.0;
}

void main() {
  float atraso = distance(aCell, uOrigem) * 0.026 + (aMeta.y >= 0.0 ? 0.35 : 0.0);
  float p = clamp((uTempo - atraso) / 0.55, 0.0, 1.0);
  float e = 1.0 - pow(1.0 - p, 3.0);
  float a = mix(ativo(uFiltroAntes), ativo(uFiltro), uFiltroT);
  float tam = aInfo.w;
  if (aMeta.y >= 0.0) {
    tam *= mix(0.45, 1.0, a);
    if (abs(aMeta.y - uHover) < 0.5) tam *= 1.25;
    if (abs(aMeta.y - uSel) < 0.5) tam *= 1.35;
  }
  vec2 centro = (aCell + 0.5) * uCell;
  vec2 pos = centro + (aPos - 0.5) * tam * e * uCell;
  vec2 clip = pos / uRes * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  vUv = aPos;
  vCentro = centro;
  vInfo = aInfo;
  vMeta = aMeta;
  vAtivo = a;
  vPx = max(tam * e * uCell, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
precision highp int;
in vec2 vUv;
in vec2 vCentro;
flat in vec4 vInfo;
flat in vec2 vMeta;
flat in float vAtivo;
flat in float vPx;
uniform vec2 uMouse;
uniform float uLuz;
uniform float uSel;
uniform int uFiltro;
uniform vec3 uTerra[3];
uniform vec3 uListras;
uniform vec3 uClaro;
uniform vec3 uApagado;
uniform vec3 uCat[4];
uniform vec3 uOrigemCor;
out vec4 cor;

vec2 girar(vec2 uv, float g) {
  vec2 p = uv - 0.5;
  float a = -g * 1.5707963;
  return vec2(cos(a) * p.x - sin(a) * p.y, sin(a) * p.x + cos(a) * p.y) + 0.5;
}

float caixa(vec2 p, float m) {
  vec2 d = abs(p - 0.5) - (0.5 - m);
  return max(d.x, d.y);
}

void main() {
  int forma = int(vInfo.x + 0.5);
  vec2 uv = girar(vUv, vInfo.y);
  float m = 0.07; // respiro entre módulos
  float d;
  if (forma == 0) {
    d = caixa(uv, m);
  } else if (forma == 1) {
    vec2 q = (uv - m) / (1.0 - 2.0 * m);
    d = max(length(q) - 1.0, caixa(uv, m)) * (1.0 - 2.0 * m);
  } else if (forma == 2) {
    vec2 q = (uv - m) / (1.0 - 2.0 * m);
    vec2 k = max(q - 0.5, 0.0);
    float canto = (q.x > 0.5 && q.y > 0.5) ? length(k) - 0.5 : -1.0;
    d = max(canto * (1.0 - 2.0 * m), caixa(uv, m));
  } else if (forma == 3) {
    d = length(uv - 0.5) - 0.36;
  } else if (forma == 4) {
    float f = fract((uv.x + uv.y) * 2.5);
    d = max(abs(f - 0.5) / 2.5 - 0.11, caixa(uv, m));
  } else if (forma == 7) {
    d = max((uv.x + uv.y - 1.0) * 0.7071, caixa(uv, m));
  } else if (forma == 5) {
    float r = length(uv - 0.5);
    d = abs(r - 0.36) - 0.12;
  } else {
    d = length(uv - 0.5) - 0.48;
  }
  float aa = 0.7 / vPx;
  float alfa = 1.0 - smoothstep(-aa, aa, d);
  if (alfa <= 0.0) discard;

  vec3 c;
  if (vMeta.y < 0.0) {
    int tom = int(vInfo.z + 0.5);
    c = forma == 4 ? uListras : uTerra[tom];
    float luz = exp(-pow(distance(vCentro, uMouse) / uLuz, 2.0));
    c = mix(c, uClaro, luz * 0.55);
  } else if (vMeta.x < 0.5) {
    c = uOrigemCor;
  } else {
    int bits = int(vMeta.x) & uFiltro;
    if (bits == 0) bits = int(vMeta.x);
    int i = (bits & 1) != 0 ? 0 : (bits & 2) != 0 ? 1 : (bits & 4) != 0 ? 2 : 3;
    c = mix(uApagado, uCat[i], vAtivo);
    if (forma == 6) {
      float r = length(uv - 0.5);
      c = r < 0.3 ? c : mix(uOrigemCor, c, smoothstep(0.36, 0.38, r));
    }
  }
  cor = vec4(c * alfa, alfa);
}`;

export interface OpcoesMapa {
  linhas: string[];
  pontos: PontoMapa[];
  origem: { c: number; r: number };
  reduzir: boolean;
}

export class Mapa {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private terra: Instancia[];
  private marcas: Instancia[] = [];
  private opcoes: OpcoesMapa;
  private celulaCss = 8;
  private dpr = 1;
  private mouse = [-9999, -9999];
  private filtro = 15;
  private filtroAntes = 15;
  private filtroT = 1;
  private hover = -1;
  private sel = -1;
  private inicio = 0;
  private tempo = 0;
  private quadro = 0;
  private prog: WebGLProgram | null = null;
  private vaos: { vao: WebGLVertexArrayObject; buf: WebGLBuffer; n: number }[] = [];
  private u: Record<string, WebGLUniformLocation | null> = {};

  constructor(canvas: HTMLCanvasElement, opcoes: OpcoesMapa) {
    this.canvas = canvas;
    this.opcoes = opcoes;
    this.terra = celulasDeTerra(opcoes.linhas);
    this.montarMarcas();
    const gl = canvas.getContext("webgl2", { antialias: false, premultipliedAlpha: true, alpha: true });
    if (gl && this.iniciarGL(gl)) this.gl = gl;
    else this.ctx = canvas.getContext("2d");
    if (opcoes.reduzir) this.tempo = 99;
  }

  get webgl() {
    return this.gl !== null;
  }

  get tamanhoCelula() {
    return this.celulaCss;
  }

  private montarMarcas() {
    const { pontos, origem } = this.opcoes;
    this.marcas = pontos.map((p, i) => ({
      c: p.c,
      r: p.r,
      forma: FORMA.anel,
      giro: 0,
      tom: 0,
      tam: 0.8 + Math.min(Math.log2(p.ids.length), 3) * 0.22,
      cat: p.bits,
      idx: i,
    }));
    this.marcas.push({ c: origem.c, r: origem.r, forma: FORMA.disco, giro: 0, tom: 0, tam: 0.75, cat: 0, idx: 9999 });
  }

  private iniciarGL(gl: WebGL2RenderingContext) {
    const sh = (tipo: number, src: string) => {
      const s = gl.createShader(tipo)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };
    const v = sh(gl.VERTEX_SHADER, VERT);
    const f = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!v || !f) return false;
    const p = gl.createProgram()!;
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.warn(gl.getProgramInfoLog(p));
      return false;
    }
    this.prog = p;
    for (const nome of [
      "uRes", "uCell", "uOrigem", "uTempo", "uFiltro", "uFiltroAntes", "uFiltroT", "uHover", "uSel",
      "uMouse", "uLuz", "uTerra", "uListras", "uClaro", "uApagado", "uCat", "uOrigemCor",
    ]) this.u[nome] = gl.getUniformLocation(p, nome);

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(p, "aPos");
    const aCell = gl.getAttribLocation(p, "aCell");
    const aInfo = gl.getAttribLocation(p, "aInfo");
    const aMeta = gl.getAttribLocation(p, "aMeta");

    for (const lista of [this.terra, this.marcas]) {
      const vao = gl.createVertexArray()!;
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      const buf = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, this.empacotar(lista), gl.STATIC_DRAW);
      const passo = 8 * 4;
      gl.enableVertexAttribArray(aCell);
      gl.vertexAttribPointer(aCell, 2, gl.FLOAT, false, passo, 0);
      gl.vertexAttribDivisor(aCell, 1);
      gl.enableVertexAttribArray(aInfo);
      gl.vertexAttribPointer(aInfo, 4, gl.FLOAT, false, passo, 8);
      gl.vertexAttribDivisor(aInfo, 1);
      gl.enableVertexAttribArray(aMeta);
      gl.vertexAttribPointer(aMeta, 2, gl.FLOAT, false, passo, 24);
      gl.vertexAttribDivisor(aMeta, 1);
      this.vaos.push({ vao, buf, n: lista.length });
    }
    gl.bindVertexArray(null);
    return true;
  }

  private empacotar(lista: Instancia[]) {
    const a = new Float32Array(lista.length * 8);
    lista.forEach((it, i) => {
      a.set([it.c, it.r, it.forma, it.giro, it.tom, it.tam, it.cat, it.idx], i * 8);
    });
    return a;
  }

  /** Ajusta o tamanho da célula em pixels CSS e redesenha. */
  dimensionar(celulaCss: number) {
    const { linhas } = this.opcoes;
    this.celulaCss = celulaCss;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = linhas[0].length * celulaCss;
    const h = linhas.length * celulaCss;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.pedir();
  }

  revelar() {
    if (this.inicio || this.opcoes.reduzir) return;
    this.inicio = performance.now();
    this.pedir();
  }

  definirMouse(x: number, y: number) {
    if (this.opcoes.reduzir) return;
    this.mouse = [x * this.dpr, y * this.dpr];
    this.pedir();
  }

  definirFiltro(bits: number) {
    if (bits === this.filtro) return;
    this.filtroAntes = this.filtro;
    this.filtro = bits;
    this.filtroT = this.opcoes.reduzir ? 1 : 0;
    this.pedir();
  }

  definirHover(i: number) {
    if (i === this.hover) return;
    this.hover = i;
    this.pedir();
  }

  definirSelecao(i: number) {
    this.sel = i;
    const lista = this.marcas;
    lista.forEach((m) => {
      if (m.idx !== 9999) m.forma = m.idx === i ? FORMA.disco : FORMA.anel;
    });
    if (this.gl) {
      const { buf } = this.vaos[1];
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buf);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, this.empacotar(lista), this.gl.STATIC_DRAW);
    }
    this.pedir();
  }

  /** Ponto mais próximo de uma posição em pixels CSS, entre os que passam no filtro. */
  pontoEm(x: number, y: number): number {
    const cx = x / this.celulaCss - 0.5;
    const cy = y / this.celulaCss - 0.5;
    let melhor = -1;
    let dist = Infinity;
    for (const m of this.marcas) {
      if (m.idx === 9999 || !(m.cat & this.filtro)) continue;
      const d = Math.hypot(m.c - cx, m.r - cy);
      if (d < m.tam * 0.6 + 0.8 && d < dist) {
        dist = d;
        melhor = m.idx;
      }
    }
    return melhor;
  }

  centroCss(c: number, r: number) {
    return { x: (c + 0.5) * this.celulaCss, y: (r + 0.5) * this.celulaCss };
  }

  private pedir() {
    if (!this.quadro) this.quadro = requestAnimationFrame((t) => this.desenhar(t));
  }

  private desenhar(agora: number) {
    this.quadro = 0;
    let continuar = false;
    if (this.inicio) {
      this.tempo = (agora - this.inicio) / 1000;
      if (this.tempo < 3.2) continuar = true;
    }
    if (this.filtroT < 1) {
      this.filtroT = Math.min(1, this.filtroT + 1 / 14);
      continuar = true;
    }
    if (this.gl) this.desenharGL();
    else this.desenhar2D();
    if (continuar) this.pedir();
  }

  private desenharGL() {
    const gl = this.gl!;
    const { origem } = this.opcoes;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.prog);
    const u = this.u;
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uCell, this.celulaCss * this.dpr);
    gl.uniform2f(u.uOrigem, origem.c, origem.r);
    gl.uniform1f(u.uTempo, this.inicio || this.opcoes.reduzir ? this.tempo : 0);
    gl.uniform1i(u.uFiltro, this.filtro);
    gl.uniform1i(u.uFiltroAntes, this.filtroAntes);
    gl.uniform1f(u.uFiltroT, this.filtroT);
    gl.uniform1f(u.uHover, this.hover);
    gl.uniform1f(u.uSel, this.sel);
    gl.uniform2f(u.uMouse, this.mouse[0], this.mouse[1]);
    gl.uniform1f(u.uLuz, 120 * this.dpr);
    gl.uniform3fv(u.uTerra, COR.terra.flatMap(rgb));
    gl.uniform3fv(u.uListras, rgb(COR.listras));
    gl.uniform3fv(u.uClaro, rgb(COR.luz));
    gl.uniform3fv(u.uApagado, rgb(COR.apagado));
    gl.uniform3fv(u.uCat, COR.cat.flatMap(rgb));
    gl.uniform3fv(u.uOrigemCor, rgb(COR.origem));
    for (const { vao, n } of this.vaos) {
      gl.bindVertexArray(vao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n);
    }
    gl.bindVertexArray(null);
  }

  // Fallback sem WebGL2: o mesmo desenho, estático.
  private desenhar2D() {
    const ctx = this.ctx;
    if (!ctx) return;
    const s = this.celulaCss * this.dpr;
    const m = s * 0.07;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const css = (c: number[]) => `rgb(${c[0]},${c[1]},${c[2]})`;
    for (const it of this.terra) {
      const x = it.c * s, y = it.r * s;
      ctx.save();
      ctx.translate(x + s / 2, y + s / 2);
      ctx.rotate((it.giro * Math.PI) / 2);
      ctx.translate(-s / 2, -s / 2);
      ctx.fillStyle = css(it.forma === FORMA.listras ? COR.listras : COR.terra[it.tom]);
      ctx.beginPath();
      if (it.forma === FORMA.quarto) {
        ctx.moveTo(m, m);
        ctx.arc(m, m, s - 2 * m, 0, Math.PI / 2);
      } else if (it.forma === FORMA.ponto) {
        ctx.arc(s / 2, s / 2, s * 0.36, 0, Math.PI * 2);
      } else if (it.forma === FORMA.triangulo) {
        ctx.moveTo(m, m);
        ctx.lineTo(s - m, m);
        ctx.lineTo(m, s - m);
      } else if (it.forma === FORMA.folha) {
        ctx.moveTo(m, m);
        ctx.lineTo(s - m, m);
        ctx.lineTo(s - m, s / 2);
        ctx.arc(s / 2, s / 2, s / 2 - m, 0, Math.PI / 2);
        ctx.lineTo(m, s - m);
      } else if (it.forma === FORMA.listras) {
        ctx.rect(m, m, s - 2 * m, s - 2 * m);
        ctx.clip();
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = s * 0.155;
        for (let k = -1; k <= 3; k++) {
          ctx.moveTo((k / 2.5) * s - s, s * 2);
          ctx.lineTo((k / 2.5) * s + s, 0);
        }
        ctx.stroke();
        ctx.restore();
        continue;
      } else {
        ctx.rect(m, m, s - 2 * m, s - 2 * m);
      }
      ctx.fill();
      ctx.restore();
    }
    for (const it of this.marcas) {
      const x = (it.c + 0.5) * s, y = (it.r + 0.5) * s;
      let bits = it.cat & this.filtro;
      const ativo = it.idx === 9999 || bits !== 0;
      if (!bits) bits = it.cat;
      const i = bits & 1 ? 0 : bits & 2 ? 1 : bits & 4 ? 2 : 3;
      const raio = (it.tam * s * (ativo ? 1 : 0.45) * (it.idx === this.hover ? 1.25 : 1)) / 2;
      ctx.fillStyle = it.idx === 9999 ? "#fff" : ativo ? css(COR.cat[i]) : css(COR.apagado);
      ctx.beginPath();
      if (it.forma === FORMA.anel) {
        ctx.arc(x, y, raio * 0.96, 0, Math.PI * 2);
        ctx.arc(x, y, raio * 0.48, 0, Math.PI * 2, true);
      } else {
        ctx.arc(x, y, raio * 0.96, 0, Math.PI * 2);
      }
      ctx.fill("evenodd");
    }
  }
}
