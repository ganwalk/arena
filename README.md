# Colégio Arena: landing page e Plataforma Arena

Primeira peça da nova linguagem visual do ecossistema do Colégio Arena. Astro (site estático), WebGL2 no mapa "Arena pelo mundo" e nenhum framework de UI no cliente.

O deploy tem três endereços que formam um fluxo só:

- `/`: página inicial da **Plataforma Arena**, que explica o caminho completo (site → captação → matrícula → família → aluno → professor → gestão) e abre cada etapa já como a pessoa certa.
- `/site/`: a landing de captação do colégio (etapa 1). O formulário “Agende uma visita” cria o contato no funil do CRM.
- `/plataforma/`: o protótipo de alta fidelidade da **Plataforma Arena**: portais do aluno, do professor, da família, da gestão e da captação (CRM), alternáveis na mesma conta, com dados fictícios. Só essa rota carrega Preact. Detalhes, personas, mapa de telas e o caminho para produção em [`docs/plataforma.md`](docs/plataforma.md).

## Rodar

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # gera dist/
npm run check    # tipos e diagnósticos do Astro
npm test         # regras da plataforma (vitest)
```

## Publicar na Vercel

1. Na Vercel, **Add New → Project** e importe o repositório `ganwalk/arena`.
2. A Vercel detecta o Astro pelo `vercel.json`. Não é preciso configurar variáveis de ambiente.
3. Cada push gera uma URL de preview; o branch de produção é o padrão do repositório.

## Direção de design

Seguindo o [no-red-flags](https://github.com/armandoauvp/no-red-flags):

- **Cor:** grafite da marca (`#2E3B42`) como base escura, petróleo (`#209BA0`, e `#0B7377` para texto e botões, por contraste) como única cor de ação, neutros frios (`#EEF3F3` e `#D9E3E4`) como superfície de apoio. Sem bege, por decisão de projeto.
- **Tipo:** Schibsted Grotesk, a fonte que o site atual já usa. Títulos em peso 800, sem itálico; o itálico da campanha da marca aparece só no destino da hero ("para Yale.").
- **Estrutura:** o módulo quadrado do painel geométrico da marca (quarto de círculo, triângulo, listras, anel). Grid de 12 colunas e filetes finos, sem cartões decorativos.

Motion: a hero troca de destino sozinha, como um vídeo (com pausa), e o mapa se monta a partir de Goiânia na primeira vez que aparece. O resto só se move em resposta ao usuário: módulos giram ao toque, o arco é desenhado ao escolher um ponto. `prefers-reduced-motion` desliga tudo.

### Hero

A página abre com a hero dentro de uma moldura branca arredondada, e o menu é a faixa de cima dessa moldura. Nos primeiros 220 px de rolagem a moldura se desfaz (`clip-path`, sem reflow) e o menu vira uma barra flutuante arredondada. O progresso fica em `--rolagem`, atualizado por `Base.astro`.

Um mosaico 4 × 4 no ritmo do painel da marca: módulos de cor e módulos que recortam fotos reais da base do mapa. O título percorre destinos reais ("Do Setor Bueno para Yale.", Harvard, Londres, Zurique, Texas, Paris, Toronto) e as fotos trocam junto, girando o recorte. Os módulos giram ao passar o cursor, e clicar numa foto ou em "Ver no mapa" abre o registro no mapa.

- A troca automática tem botão de pausa, para quando a hero sai da tela ou a aba fica oculta e não roda com `prefers-reduced-motion`.
- Os destinos ficam em `destinos` (`src/data/site.ts`).
- **Vídeo:** o módulo grande está pronto para o vídeo institucional. Coloque o arquivo em `public/video/` (MP4 H.264, sem áudio, 10 a 20 s em loop, até uns 4 MB) e preencha `HERO_VIDEO` em `src/data/site.ts`. Não foi possível baixar os vídeos do canal TV Arena deste ambiente.

### Fazenda, laboratório, palco e quadra

Explorador em abas (AgroLab, Laboratórios, Eletivas, Palco e quadra, Escola de Pais), com setas e Home/End no teclado. Cada aba é um módulo da marca e mostra fotos reais, o texto e os itens concretos tirados das notícias, das páginas de etapas e da base do mapa (resultados da FISEC).

### Etapas

Um seletor de idade (2 a 18 anos) acende a etapa correspondente e troca a foto. As faixas são as habituais do sistema brasileiro, com o aviso de que a série depende do mês de nascimento.

### Arena pelo mundo

Cada célula de terra (4° × 4°) é um módulo do painel. A costa é arredondada com os quartos de círculo da marca, escolhidos pelas células vizinhas (`src/scripts/mapa.ts`). Os anéis são os 156 registros da base que o site atual publica, agrupados por célula. Ao escolher um ponto, uma linha sai de Goiânia até ele e o painel mostra texto, fotos e nomes dos alunos.

- WebGL2 com instâncias (uma chamada de desenho para a terra, outra para os pontos). Sem WebGL2, o mesmo desenho sai estático em Canvas 2D.
- Os dados (`/mundo.json`, cerca de 160 KB) só são baixados quando a seção se aproxima da tela.
- A lista de países dá acesso por teclado a todos os registros.

## Dados

| Arquivo | Origem | Como regenerar |
|---|---|---|
| `src/data/conquistas.json`, `public/mapa/` | `colegioarena.com.br/mapadeconquistas/mapa_arenas.php` (157 registros, 373 imagens convertidas para WebP em 1280 px e 480 px) | `npm run dados` |
| `src/data/land-grid.json` | Natural Earth 50m (`world-atlas`) | `npm run grid` |
| `src/data/site.ts` | `colegio-arena-conteudo.md` (coleta de 01/10/2026) | manual |

Os números da seção (65 ex-alunos, 11 países de aprovação, 21 países de competição) são calculados da base em `src/lib/mundo.ts`, não digitados.

## Marca

- `public/brand/simbolo.svg`: vetorizado a partir do pin de 842 px do mapa atual. Fiel ao original.
- `public/brand/arena.svg` e `arena-branco.svg`: o logotipo "arena" só existe hoje em PNG com cerca de 24 px de altura de letra. O vetor é **provisório**: serve bem até uns 48 px de altura (cabeçalho e rodapé), mas as letras têm pequenas ondulações em tamanhos maiores. Trocar pelo vetor oficial assim que existir.

## Pendências para validar com o colégio

- **Endereços divergentes no site atual.** Usei os da página de contato: "Av. T-11, 175" (o rodapé diz "Rua T-11") e "Av. T-3 com Rua T-54, Qd. 101, Lt. 12" (os Termos de Uso dizem "Av. T-3, nº 2267").
- **Data de fundação.** "Criado em 2016" (Enem e vestibulares) contra "fundado em 2017" (Nossa História). A landing não cita o ano.
- **Correções de geocodificação** aplicadas em `scripts/build_data.py` (`CORRECOES`): Yale aparece em West Haven (é New Haven), Wharton em Ryde, no interior da Pensilvânia (é Filadélfia; coordenada corrigida), IYPT 2024 em Átány (o texto diz Budapeste), UBC em "Electoral Area A" (Vancouver), entre outras. Vale corrigir na base original.
- **Rótulo de categoria.** "Olimpíada científica" virou "Competição acadêmica", porque a categoria inclui debates (YMUN, HMUN, WSDC) e robótica.
- **Fotos.** Os banners atuais têm o texto da campanha gravado na imagem; usei recortes sem o texto. Fotos originais em alta resolução melhorariam o hero.

## Texto

Todo texto novo ou reescrito foi validado com o [no-ai-slop](https://github.com/petergyang/no-ai-slop). Citações da escola (a frase da proposta pedagógica) e os textos da base do mapa ficaram como estão no site atual.
