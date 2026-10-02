"""Baixa a base do mapa "Arena pelo Mundo" do site atual e gera:
- src/data/conquistas.json (registros limpos)
- public/mapa/<arquivo>.webp e public/mapa/t/<arquivo>.webp (imagens otimizadas)
Uso: python3 scripts/build_data.py [--sem-imagens]
"""
import html, json, os, re, sys, urllib.parse, urllib.request, concurrent.futures as cf
from io import BytesIO

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTE = "https://www.colegioarena.com.br/mapadeconquistas/mapa_arenas.php"
IMGS = "https://www.colegioarena.com.br/uploads/mapa/"
CAT = {"aprovacao": "aprovacao", "olimpiada": "olimpiada", "viagem": "viagem",
       "competicao": "torneio", "arena": "arena"}


def baixar(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def limpar(desc):
    """HTML do CMS -> lista de blocos {"t": "p"|"li", "x": texto}."""
    s = (desc or "").replace("\r", "")
    s = re.sub(r"<li[^>]*>", "\n•", s)
    s = re.sub(r"<br\s*/?>|</p>|</li>|</h\d>|</div>", "\n", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = re.sub(r"[\u2060\u200b\ufeff]", "", html.unescape(s).replace("\xa0", " "))
    blocos = []
    for linha in s.split("\n"):
        linha = re.sub(r"\s+", " ", linha).strip()
        if not linha:
            continue
        if linha.startswith("•"):
            blocos.append({"t": "li", "x": linha[1:].strip()})
        else:
            blocos.append({"t": "p", "x": linha})
    return blocos


def separar_alunos(blocos):
    """Nos registros de universidade, a lista final de nomes vira 'alunos'."""
    for i, b in enumerate(blocos):
        if re.search(r"aprovad[oa]s?\s*:?\s*", b["x"], re.I) and re.search(r"Arena", b["x"]):
            resto = re.split(r"aprovad[oa]s?\s*:?\s*", b["x"], flags=re.I)[-1].strip()
            nomes = ([resto] if resto else []) + [x["x"] for x in blocos[i + 1:]]
            return blocos[:i], [n for n in nomes if len(n) < 60]
    return blocos, []


def arquivo(nome):
    base = re.sub(r"[^A-Za-z0-9_-]+", "-", os.path.splitext(nome)[0]).strip("-")
    return base + ".webp"


RUIDO = re.compile(r"Região|Region|Township|Ward \d|Community Board|Golden Horseshoe|Mesorregião|Microrregião", re.I)
INSTITUICAO = re.compile(r"Universit|College|School|Institut|Tech\b|Scholars|Colégio", re.I)
VIA = re.compile(r"\b(Street|Avenue|Road|Drive|Rue|Rua|Parkway|Circle|Highway|PATH|Campus|Boulevard|Lane)\b", re.I)


def lugar(endereco):
    """Cidade e país a partir do endereço do geocodificador (formato Nominatim)."""
    partes = [p.strip() for p in endereco.split(",") if p.strip()]
    pais = partes[-1] if partes else ""
    resto = [p for p in partes[:-1]
             if not re.search(r"\d", p) and not RUIDO.search(p) and re.search(r"[A-Za-zÀ-ÿ]", p)
             and not re.search(r"[\u0600-\u06ff\u3040-\u30ff\u4e00-\u9fff]", p)]
    resto = [p for p in resto if not INSTITUICAO.search(p) and not VIA.search(p)]
    resto = [re.sub(r"^(Town|City) of ", "", p) for p in resto]
    if not resto:
        return "", pais
    if pais.startswith("Estados Unidos"):
        for i, p in enumerate(resto):
            if p.endswith("County") or p.endswith("Parish") or p.startswith("Condado de"):
                return (resto[i - 1] if i else ""), pais
        return (resto[-2] if len(resto) > 1 else resto[0]), pais
    if pais == "Brasil" or len(resto) > 2:
        cand = [p for p in resto if p not in ("Goiás", "São Paulo", "Distrito Federal") or len(resto) == 1]
        return (resto[-2] if len(resto) > 1 else resto[0]), pais
    return resto[0], pais


# Correções de geocodificação da base atual (revisar com o colégio; listadas no README).
CORRECOES = {
    1: {"cidade": "New Haven"},
    88: {"cidade": "New Haven"},
    150: {"cidade": "New Haven"},
    3: {"cidade": "Budapeste"},
    149: {"cidade": "Filadélfia", "lng": -75.1932, "lat": 39.9496},
    153: {"cidade": "Coimbra"},
    157: {"cidade": "Sherbrooke"},
    158: {"cidade": "Vancouver"},
    15: {"cidade": "Escânia"},
    141: {"cidade": "Fairfax"},
}


def main():
    dados = json.loads(baixar(FONTE))
    saida, arquivos = [], set()
    for x in dados:
        blocos = limpar(x["descricao"])
        alunos = []
        if x["categoria"] == "aprovacao" and x["id"] >= 72:
            blocos, alunos = separar_alunos(blocos)
        cidade, pais = lugar(x["pais"])
        if (x.get("isoCode") or "").lower() == "br":
            pais = "Brasil"
        fotos = [f for f in (x.get("fotos") or []) if f]
        capa = x.get("imagem") or None
        for f in fotos + ([capa] if capa else []):
            arquivos.add(f)
        saida.append({
            "id": x["id"],
            "nome": x["nome"].strip(),
            "cidade": cidade,
            "pais": pais,
            "iso": (x.get("isoCode") or "").lower(),
            "cat": CAT.get(x["categoria"], x["categoria"]),
            "texto": blocos,
            "alunos": alunos,
            "capa": arquivo(capa) if capa else None,
            "fotos": [arquivo(f) for f in fotos],
            "lng": x["coordenadas"][0],
            "lat": x["coordenadas"][1],
        })
        saida[-1].update(CORRECOES.get(x["id"], {}))
    os.makedirs(os.path.join(ROOT, "src/data"), exist_ok=True)
    with open(os.path.join(ROOT, "src/data/conquistas.json"), "w") as fh:
        json.dump(saida, fh, ensure_ascii=False, separators=(",", ":"))
    print(len(saida), "registros,", len(arquivos), "imagens")

    if "--sem-imagens" in sys.argv:
        return
    from PIL import Image, ImageOps
    destino = os.path.join(ROOT, "public/mapa")
    os.makedirs(os.path.join(destino, "t"), exist_ok=True)

    def otimizar(nome):
        base = arquivo(nome)
        if os.path.exists(os.path.join(destino, base)):
            return nome, True
        try:
            im = ImageOps.exif_transpose(Image.open(BytesIO(baixar(IMGS + urllib.parse.quote(nome))))).convert("RGB")
        except Exception as e:
            return nome, str(e)
        g = im.copy(); g.thumbnail((1280, 1280)); g.save(os.path.join(destino, base), "WEBP", quality=72, method=5)
        p = im.copy(); p.thumbnail((480, 480)); p.save(os.path.join(destino, "t", base), "WEBP", quality=68, method=5)
        return nome, True

    with cf.ThreadPoolExecutor(6) as ex:
        falhas = [r for r in ex.map(otimizar, sorted(arquivos)) if r[1] is not True]
    print("falhas:", falhas)


if __name__ == "__main__":
    main()
