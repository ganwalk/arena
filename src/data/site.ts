// Conteúdo institucional usado na landing. Fonte: colegio-arena-conteudo.md (site atual, coleta de 01/10/2026).
export const SITE_ATUAL = "https://www.colegioarena.com.br";

export const WHATSAPP = "5562991925824";
export const WHATSAPP_ROTULO = "(62) 99192-5824";

export const unidades = [
  {
    nome: "Educação Infantil e Ensino Fundamental",
    endereco: "Av. T-11, 175, Setor Bueno",
    telefone: "(62) 3093-9230",
    email: "arena@colegioarena.com.br",
    mapa: "https://www.google.com/maps/search/?api=1&query=Col%C3%A9gio+Arena+T-11+175+Setor+Bueno+Goi%C3%A2nia",
  },
  {
    nome: "Ensino Médio",
    endereco: "Av. T-3 com Rua T-54, Qd. 101, Lt. 12, Setor Bueno",
    telefone: "(62) 3920-3250",
    email: "arena@colegioarena.com.br",
    mapa: "https://www.google.com/maps/search/?api=1&query=Col%C3%A9gio+Arena+Ensino+M%C3%A9dio+T-3+T-54+Setor+Bueno+Goi%C3%A2nia",
  },
  {
    nome: "Enem e vestibulares",
    endereco: "Av. C-235, 93, Qd. 538, Lt. 5, Jardim América",
    telefone: "(62) 3088-7878",
    email: "curso@colegioarena.com.br",
    mapa: "https://www.google.com/maps/search/?api=1&query=Arena+Enem+Vestibulares+C-235+93+Jardim+Am%C3%A9rica+Goi%C3%A2nia",
  },
];

export const etapas = [
  {
    id: "infantil",
    nome: "Educação Infantil",
    serie: "Primeira infância",
    texto: "Pedagogia da Escuta e inglês no dia a dia, com materiais concretos e atividades de mão na massa.",
    href: `${SITE_ATUAL}/conheca/educacao-infantil`,
    foto: "/img/infantil",
    unidade: "Av. T-11, Setor Bueno",
  },
  {
    id: "fundamental-1",
    nome: "Ensino Fundamental I",
    serie: "1º ao 5º ano",
    texto: "Inglês quatro vezes por semana, Writing Journal a partir do 2º ano e um Ateliê de Matemática.",
    href: `${SITE_ATUAL}/conheca/ensino-fundamental-i`,
    foto: "/img/fundamental-1",
    unidade: "Av. T-11, Setor Bueno",
  },
  {
    id: "fundamental-2",
    nome: "Ensino Fundamental II",
    serie: "6º ao 9º ano",
    texto: "Seis aulas por manhã, sete de Matemática e sete de Português por semana. À tarde, plantões, turmas olímpicas, artes e esportes.",
    href: `${SITE_ATUAL}/conheca/ensino-fundamental-ii`,
    foto: "/img/hero",
    unidade: "Av. T-11, Setor Bueno",
  },
  {
    id: "medio",
    nome: "Ensino Médio",
    serie: "1ª à 3ª série",
    texto: "Itinerários com laboratórios de ciências, olimpíadas, viagens internacionais orientadas e imersão no agronegócio.",
    href: `${SITE_ATUAL}/conheca/ensino-medio`,
    foto: "/img/medio",
    unidade: "Av. T-3 com Rua T-54, Setor Bueno",
  },
  {
    id: "vestibulares",
    nome: "Enem e vestibulares",
    serie: "Pré-vestibular",
    texto: "Material do Sistema Poliedro e uma turma própria para os vestibulares do ITA e do IME.",
    href: `${SITE_ATUAL}/conheca/enem-e-vestibulares`,
    foto: "/img/escola-de-politica",
    unidade: "Av. C-235, Jardim América",
  },
  {
    id: "online",
    nome: "Curso Arena Online",
    serie: "Pré-vestibular a distância",
    texto: "As aulas do pré-vestibular do Arena numa plataforma própria, para estudar no seu ritmo.",
    href: "https://cursoarenaonline.com.br",
    foto: null,
    unidade: "cursoarenaonline.com.br",
  },
] as const;

export const noticias = [
  {
    titulo: "Alunos do Arena conquistam certificação da Cambridge Assessment English",
    data: "2026-03-31",
    resumo: "A cerimônia aconteceu no auditório do colégio, com Daniel Duarte, analista educacional da Cambridge.",
    href: `${SITE_ATUAL}/noticia/317/alunos-do-arena-conquistam-certificacao-da-cambridge-assessment-english`,
    foto: "/img/cambridge",
  },
  {
    titulo: "Alumni Arena: Beatriz Rezende",
    data: "2026-03-29",
    resumo: "A ex-aluna cursa Finanças e Matemática Aplicada e conta a trajetória em vídeo.",
    href: `${SITE_ATUAL}/noticia/321/alumni-arena-beatriz-rezende`,
    foto: "/img/alumni",
  },
  {
    titulo: "Arena lança AgroLab, laboratório de vivência do agronegócio",
    data: "2026-03-21",
    resumo: "Uma mini fazenda modelo com manejo de água, drones e análise de solo em campo.",
    href: `${SITE_ATUAL}/noticia/319/arena-lanca-agrolab-laboratorio-de-vivencia-do-agronegocio`,
    foto: "/img/agrolab",
  },
  {
    titulo: "Primeiro encontro da Escola de Política no Arena",
    data: "2026-03-06",
    resumo: "O professor Fred Galves, da UFG, falou com os alunos da eletiva sobre jovens e democracia.",
    href: `${SITE_ATUAL}/noticia/320/primeiro-encontro-da-escola-de-politica-no-arena`,
    foto: "/img/escola-de-politica",
  },
];

export const acessos = [
  { rotulo: "Arena Virtual", href: `${SITE_ATUAL}/arenavirtual` },
  { rotulo: "Portal do aluno", href: "https://aluno.colegioarena.com.br" },
  { rotulo: "EducaMobile", href: "https://educamobile.colegioarena.com.br" },
  { rotulo: "Portal do professor", href: "https://professor.colegioarena.com.br" },
];

export const institucional = [
  { rotulo: "Nossa história", href: `${SITE_ATUAL}/conheca/nossa-historia` },
  { rotulo: "Proposta pedagógica", href: `${SITE_ATUAL}/conheca/proposta-pedagogica` },
  { rotulo: "Escola de Pais", href: `${SITE_ATUAL}/pais/escola-de-pais` },
  { rotulo: "Turmas olímpicas", href: `${SITE_ATUAL}/pagina/turmas-olimpicas` },
  { rotulo: "Canal de Ética e Ouvidoria", href: `${SITE_ATUAL}/ouvidoria` },
  { rotulo: "Código de Ética e Integridade (PDF)", href: `${SITE_ATUAL}/files/download/codigo_de_etica_e_integridade_arena.pdf` },
  { rotulo: "Relatório de Igualdade Salarial 2026 (PDF)", href: `${SITE_ATUAL}/files/download/RelatorioIgualdadeSalarialLote_2026_1_26039391000141.pdf` },
  { rotulo: "Relatório de Igualdade Salarial 2025 (PDF)", href: `${SITE_ATUAL}/files/download/RelatorioIgualdadeSalarialLote_2025_2_26039391000222.pdf` },
  { rotulo: "Termos de uso", href: `${SITE_ATUAL}/pagina/termos-de-uso` },
  { rotulo: "Política de privacidade", href: `${SITE_ATUAL}/pagina/politica-de-privacidade-e-de-protecao-de-dados` },
];

export const redes = [
  { rotulo: "Instagram", href: "https://instagram.com/colegioarena" },
  { rotulo: "YouTube", href: "https://youtube.com/tvarena" },
  { rotulo: "Facebook", href: "https://facebook.com/colegioarena" },
];

/** Vídeo institucional da hero. Quando existir, coloque o arquivo em public/video/ e informe o caminho aqui. */
export const HERO_VIDEO: { src: string; poster: string } | null = null;

/** Os três temas do slogan. Cada um troca as fotos do mosaico da hero (a grande é a foto que melhor representa cada palavra) e a legenda. */
export const temas = [
  {
    id: "forte",
    grande: { src: "/img/medio", foco: "50% 35%", alt: "Vestibulandos do Arena sujos de lama comemorando a aprovação no trote" },
    palavra: "forte",
    legenda: "4.922 premiações em olimpíadas entre 2023 e 2025 e ex-alunos aprovados em universidades de 11 países.",
    link: { rotulo: "Ver as turmas olímpicas", href: "#olimpicas" },
    fotos: [
      "/img/olimpicas-800.webp",
      "/mapa/t/galeria_42_1777489759_1.webp",
      "/img/cambridge-800.webp",
      "/mapa/t/galeria_17_1777382639_4.webp",
      "/mapa/t/galeria_42_1777489759_6.webp",
      "/mapa/t/galeria_42_1777489759_2.webp",
    ],
  },
  {
    id: "inovadora",
    grande: { src: "/img/agrolab", foco: "45% 40%", alt: "Alunos em campo com o professor na primeira visita ao AgroLab" },
    palavra: "inovadora",
    legenda: "O AgroLab é uma mini fazenda modelo com drones e análise de solo, e o Ensino Médio tem laboratórios de ciências.",
    link: { rotulo: "Conhecer o AgroLab", href: "#vida" },
    fotos: [
      "/mapa/t/galeria_19_1777388973_0.webp",
      "/img/aulas-praticas-800.webp",
      "/mapa/t/galeria_19_1777388973_5.webp",
      "/mapa/t/galeria_42_1777489759_8.webp",
      "/mapa/t/galeria_19_1777388973_7.webp",
      "/img/escola-de-politica-800.webp",
    ],
  },
  {
    id: "humanizada",
    grande: { src: "/img/infantil", foco: "26% 45%", alt: "Menina da Educação Infantil sorrindo no parque do Arena" },
    palavra: "humanizada",
    legenda: "Pedagogia da Escuta desde a Educação Infantil e uma Escola de Pais para as famílias.",
    link: { rotulo: "Ler a proposta pedagógica", href: "#proposta" },
    fotos: [
      "/img/fundamental-1-800.webp",
      "/mapa/t/galeria_70_1777980660_1.webp",
      "/img/escola-de-pais-800.webp",
      "/mapa/t/galeria_42_1777489759_3.webp",
      "/mapa/t/54168260369_b440e46d58_c.webp",
      "/mapa/t/galeria_42_1777489759_4.webp",
    ],
  },
];
