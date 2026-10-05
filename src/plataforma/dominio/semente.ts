/*
  Dados fictícios da demonstração. Nenhuma pessoa aqui existe; nomes, notas e conversas são inventados.
  As datas são relativas ao momento em que a semente é gerada, para que "hoje" sempre tenha plantões,
  tarefas com prazo próximo e avisos recentes.
*/
import { diaDe, somarDias } from "./regras";
import type { Banco, Disciplina, Etapa, Nota, Turma, Usuario } from "./tipos";

export const VERSAO_BANCO = 3;

const iso = (d: Date) => d.toISOString();
const em = (base: Date, dias: number, hora = 9, minuto = 0) => {
  const d = somarDias(base, dias);
  d.setHours(hora, minuto, 0, 0);
  return d;
};

/** Pseudoaleatório estável, para que as notas não mudem a cada carga. */
function sorteio(texto: string) {
  let h = 2166136261;
  for (const c of texto) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

const ANO = 2026;

const turmas: Turma[] = [
  { id: "t-5a", nome: "5º ano A", etapa: "fundamental-1", anoLetivo: ANO, unidade: "Unidade T-11" },
  { id: "t-9a", nome: "9º ano A", etapa: "fundamental-2", anoLetivo: ANO, unidade: "Unidade T-11" },
  { id: "t-1b", nome: "1ª série B", etapa: "medio", anoLetivo: ANO, unidade: "Unidade T-3" },
  { id: "t-3a", nome: "3ª série A", etapa: "medio", anoLetivo: ANO, unidade: "Unidade T-3" },
  { id: "t-3b", nome: "3ª série B", etapa: "medio", anoLetivo: ANO, unidade: "Unidade T-3" },
];

const disciplinas: Disciplina[] = [
  { id: "d-bio", nome: "Biologia" },
  { id: "d-cie", nome: "Ciências" },
  { id: "d-fis", nome: "Física" },
  { id: "d-geo", nome: "Geografia" },
  { id: "d-his", nome: "História" },
  { id: "d-ing", nome: "Inglês" },
  { id: "d-mat", nome: "Matemática" },
  { id: "d-por", nome: "Língua Portuguesa" },
  { id: "d-red", nome: "Redação" },
];

const pessoa = (id: string, nome: string, papeis: Usuario["papeis"], cargo: string): Usuario => ({
  id,
  nome,
  papeis,
  cargo,
  email: `${id.slice(2)}@exemplo.arena`,
  ativo: true,
});

/* Personas principais (aparecem no seletor de perfil) */
const personas: Usuario[] = [
  pessoa("u-lucas", "Lucas Andrade", ["aluno"], "3ª série A"),
  pessoa("u-marina", "Marina Martins", ["aluno"], "1ª série B"),
  pessoa("u-theo", "Theo Martins", ["aluno"], "5º ano A"),
  pessoa("u-claudia", "Cláudia Martins", ["responsavel"], "Mãe de Marina e Theo"),
  pessoa("u-rafael", "Rafael Nunes", ["professor", "responsavel"], "Professor de História e pai do Gabriel"),
  pessoa("u-beatriz", "Beatriz Lima", ["professor"], "Professora de Biologia e Ciências"),
  pessoa("u-sergio", "Sérgio Prado", ["professor"], "Professor de Matemática"),
  pessoa("u-livia", "Lívia Campos", ["professor"], "Professora do 5º ano"),
  pessoa("u-andre", "André Costa", ["professor"], "Professor de Física"),
  pessoa("u-fernanda", "Fernanda Alves", ["coordenacao"], "Coordenação do Ensino Médio"),
  pessoa("u-juliana", "Juliana Reis", ["secretaria"], "Secretaria escolar"),
  pessoa("u-paula", "Paula Siqueira", ["coordenacao", "comercial"], "Direção"),
  pessoa("u-marcos", "Marcos Teixeira", ["comercial"], "Relacionamento com famílias"),
];

/* Colegas de turma, para dar corpo às listas e aos números da gestão */
const colegas: Record<string, string[]> = {
  "t-5a": ["Alice Ferreira", "Bernardo Souza", "Cecília Rocha", "Heitor Almeida", "Laura Pires"],
  "t-9a": ["Miguel Cardoso", "Valentina Gomes", "Arthur Lacerda", "Isabela Freitas", "Enzo Barbosa", "Lara Monteiro"],
  "t-1b": ["Sofia Ribeiro", "Davi Mendes", "Helena Duarte", "Rafaela Castro", "Samuel Vieira"],
  "t-3a": ["João Pedro Silva", "Ana Clara Souza", "Mateus Oliveira", "Lívia Moraes", "Pietro Azevedo"],
  "t-3b": ["Gabriel Nunes", "Manuela Prado", "Lorenzo Batista", "Yasmin Carvalho", "Caio Fernandes"],
};

const slug = (nome: string) =>
  nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, "-");

export function semente(agora: Date = new Date()): Banco {
  const hoje = diaDe(agora);
  const inicioAno = `${ANO}-02-02`;
  const usuarios: Usuario[] = [...personas];
  const vinculosAluno: Banco["vinculosAluno"] = [
    { alunoId: "u-lucas", turmaId: "t-3a", desde: inicioAno },
    { alunoId: "u-marina", turmaId: "t-1b", desde: inicioAno },
    { alunoId: "u-theo", turmaId: "t-5a", desde: inicioAno },
  ];
  const vinculosResponsavel: Banco["vinculosResponsavel"] = [
    { responsavelId: "u-claudia", alunoId: "u-marina", parentesco: "Mãe", ativo: true },
    { responsavelId: "u-claudia", alunoId: "u-theo", parentesco: "Mãe", ativo: true },
  ];

  for (const [turmaId, nomes] of Object.entries(colegas)) {
    for (const nome of nomes) {
      const id = nome === "Gabriel Nunes" ? "u-gabriel" : `u-${slug(nome)}`;
      const t = turmas.find((x) => x.id === turmaId)!;
      usuarios.push(pessoa(id, nome, ["aluno"], t.nome));
      vinculosAluno.push({ alunoId: id, turmaId, desde: inicioAno });
      if (id === "u-gabriel") {
        vinculosResponsavel.push({ responsavelId: "u-rafael", alunoId: id, parentesco: "Pai", ativo: true });
      } else {
        const sobrenome = nome.split(" ").slice(-1)[0];
        const respId = `u-resp-${slug(nome)}`;
        usuarios.push(pessoa(respId, `${sorteio(nome) > 0.5 ? "Patrícia" : "Eduardo"} ${sobrenome}`, ["responsavel"], `Responsável por ${nome.split(" ")[0]}`));
        vinculosResponsavel.push({ responsavelId: respId, alunoId: id, parentesco: sorteio(nome) > 0.5 ? "Mãe" : "Pai", ativo: true });
      }
    }
  }
  usuarios.push(pessoa("u-roberto", "Roberto Andrade", ["responsavel"], "Pai do Lucas"));
  vinculosResponsavel.push({ responsavelId: "u-roberto", alunoId: "u-lucas", parentesco: "Pai", ativo: true });

  const aula = (professorId: string, disciplinaId: string, ...turmaIds: string[]) =>
    turmaIds.map((turmaId) => ({ professorId, disciplinaId, turmaId, desde: inicioAno }));

  const vinculosProfessor: Banco["vinculosProfessor"] = [
    ...aula("u-rafael", "d-his", "t-1b", "t-3a", "t-3b", "t-9a"),
    ...aula("u-beatriz", "d-bio", "t-1b", "t-3a", "t-3b"),
    ...aula("u-beatriz", "d-cie", "t-9a"),
    ...aula("u-sergio", "d-mat", "t-1b", "t-3a", "t-3b", "t-9a"),
    ...aula("u-livia", "d-por", "t-5a"),
    ...aula("u-livia", "d-mat", "t-5a"),
    ...aula("u-livia", "d-cie", "t-5a"),
    ...aula("u-andre", "d-fis", "t-1b", "t-3a", "t-3b"),
  ];

  /* ---------- materiais ---------- */
  const pdf = (id: string, nome: string, kb: number, previa: string) => ({
    id,
    nome,
    tipo: "application/pdf",
    tamanho: kb * 1024,
    estado: "pronto" as const,
    previa,
  });

  const materiais: Banco["materiais"] = [
    {
      id: "m-2guerra",
      autorId: "u-rafael",
      disciplinaId: "d-his",
      turmaIds: ["t-3a", "t-3b"],
      status: "publicado",
      atual: {
        versao: 2,
        titulo: "Segunda Guerra: mapas e fotografias da aula",
        contexto: "Material da aula sobre o front oriental. Use os mapas para a questão 3 da lista.",
        anexos: [
          pdf("a-2g-1", "segunda-guerra-mapas.pdf", 2380, "Mapa 1: avanço alemão, junho a dezembro de 1941.\nMapa 2: Stalingrado, 1942–1943.\nMapa 3: a contraofensiva soviética até Berlim."),
          pdf("a-2g-2", "fotografias-comentadas.pdf", 4120, "Doze fotografias de arquivo, cada uma com data, local e uma pergunta para discussão."),
        ],
        autorId: "u-rafael",
        em: iso(em(agora, -1, 18, 20)),
        nota: "Troquei o mapa 2, que estava com a legenda trocada.",
      },
      historico: [
        {
          versao: 1,
          titulo: "Segunda Guerra: mapas e fotografias da aula",
          contexto: "Material da aula sobre o front oriental.",
          anexos: [pdf("a-2g-0", "segunda-guerra-mapas.pdf", 2310, "Versão anterior.")],
          autorId: "u-rafael",
          em: iso(em(agora, -2, 11, 5)),
        },
      ],
      criadoEm: iso(em(agora, -2, 11, 0)),
      publicadoEm: iso(em(agora, -2, 11, 5)),
    },
    {
      id: "m-genetica",
      autorId: "u-beatriz",
      disciplinaId: "d-bio",
      turmaIds: ["t-3a", "t-3b", "t-1b"],
      status: "publicado",
      atual: {
        versao: 1,
        titulo: "Lista de genética: 1ª e 2ª leis de Mendel",
        contexto: "Vinte questões de vestibular, com gabarito no fim. Vamos corrigir as dez primeiras no plantão de quarta.",
        anexos: [pdf("a-gen-1", "lista-genetica-mendel.pdf", 860, "Questão 1 (UFG). Em ervilhas, a cor amarela da semente é dominante sobre a verde…")],
        autorId: "u-beatriz",
        em: iso(em(agora, -3, 14, 10)),
      },
      historico: [],
      criadoEm: iso(em(agora, -3, 14, 0)),
      publicadoEm: iso(em(agora, -3, 14, 10)),
    },
    {
      id: "m-funcoes-video",
      autorId: "u-sergio",
      disciplinaId: "d-mat",
      turmaIds: ["t-3a", "t-3b"],
      status: "publicado",
      atual: {
        versao: 1,
        titulo: "Resolução comentada do simulado 6",
        contexto: "Vídeo com as questões de matemática que mais derrubaram a turma no último ciclo.",
        anexos: [],
        link: { url: "https://www.youtube.com/watch?v=exemplo-arena", rotulo: "Assistir no YouTube" },
        autorId: "u-sergio",
        em: iso(em(agora, -5, 20, 0)),
      },
      historico: [],
      criadoEm: iso(em(agora, -5, 19, 50)),
      publicadoEm: iso(em(agora, -5, 20, 0)),
    },
    {
      id: "m-cinematica",
      autorId: "u-andre",
      disciplinaId: "d-fis",
      turmaIds: ["t-3b"],
      status: "publicado",
      atual: {
        versao: 1,
        titulo: "Cinemática: resumo para a prova",
        contexto: "Resumo da 3ª série B, com as fórmulas do bimestre.",
        anexos: [pdf("a-cin-1", "cinematica-resumo.pdf", 540, "Movimento uniforme: s = s₀ + v·t …")],
        autorId: "u-andre",
        em: iso(em(agora, -4, 10, 0)),
      },
      historico: [],
      criadoEm: iso(em(agora, -4, 9, 40)),
      publicadoEm: iso(em(agora, -4, 10, 0)),
    },
    {
      id: "m-lista-errada",
      autorId: "u-sergio",
      disciplinaId: "d-mat",
      turmaIds: ["t-3a"],
      status: "retirado",
      atual: {
        versao: 1,
        titulo: "Lista de logaritmos",
        contexto: "Lista para a aula de quinta.",
        anexos: [pdf("a-log-1", "lista-logaritmos.pdf", 310, "")],
        autorId: "u-sergio",
        em: iso(em(agora, -6, 8, 0)),
      },
      historico: [],
      criadoEm: iso(em(agora, -6, 8, 0)),
      publicadoEm: iso(em(agora, -6, 8, 0)),
      retirada: { por: "u-sergio", em: iso(em(agora, -6, 9, 30)), motivo: "Publiquei a lista do ano passado por engano. A certa sai na quinta." },
    },
    {
      id: "m-revolucao",
      autorId: "u-rafael",
      disciplinaId: "d-his",
      turmaIds: ["t-1b"],
      status: "publicado",
      atual: {
        versao: 1,
        titulo: "Revolução Industrial: linha do tempo",
        contexto: "Para a tarefa da página 112. Traga impressa ou no celular.",
        anexos: [pdf("a-rev-1", "linha-do-tempo-revolucao-industrial.pdf", 720, "1712: máquina a vapor de Newcomen…")],
        autorId: "u-rafael",
        em: iso(em(agora, -1, 9, 0)),
      },
      historico: [],
      criadoEm: iso(em(agora, -1, 8, 50)),
      publicadoEm: iso(em(agora, -1, 9, 0)),
    },
    {
      id: "m-rascunho",
      autorId: "u-rafael",
      disciplinaId: "d-his",
      turmaIds: ["t-3a"],
      status: "rascunho",
      atual: {
        versao: 1,
        titulo: "Guerra Fria: roteiro de estudo",
        contexto: "",
        anexos: [],
        autorId: "u-rafael",
        em: iso(em(agora, 0, 7, 40)),
      },
      historico: [],
      criadoEm: iso(em(agora, 0, 7, 40)),
    },
    {
      id: "m-fracoes",
      autorId: "u-livia",
      disciplinaId: "d-mat",
      turmaIds: ["t-5a"],
      status: "publicado",
      atual: {
        versao: 1,
        titulo: "Frações com receitas: atividade para fazer em casa",
        contexto: "Escolham uma receita com a família e dobrem as quantidades.",
        anexos: [pdf("a-fra-1", "fracoes-receitas.pdf", 420, "Receita de bolo de fubá: 3/4 de xícara de açúcar…")],
        autorId: "u-livia",
        em: iso(em(agora, -2, 16, 0)),
      },
      historico: [],
      criadoEm: iso(em(agora, -2, 16, 0)),
      publicadoEm: iso(em(agora, -2, 16, 0)),
    },
  ];

  /* ---------- tarefas e entregas ---------- */
  const tarefas: Banco["tarefas"] = [
    {
      id: "tar-pag112",
      professorId: "u-rafael",
      disciplinaId: "d-his",
      turmaIds: ["t-1b"],
      titulo: "Exercícios 1 a 3 da página 112",
      instrucoes: "Resolva no caderno ou no livro e envie as fotos da resolução. Pode ser direto do celular.",
      prazo: iso(em(agora, 2, 23, 59)),
      permiteReenvio: true,
      criadaEm: iso(em(agora, -1, 9, 5)),
    },
    {
      id: "tar-funcoes",
      professorId: "u-sergio",
      disciplinaId: "d-mat",
      turmaIds: ["t-1b"],
      titulo: "Funções do 1º grau: questões 5 a 8",
      instrucoes: "Mostre o gráfico de cada função. Foto nítida, sem sombra.",
      prazo: iso(em(agora, -1, 23, 59)),
      permiteReenvio: false,
      criadaEm: iso(em(agora, -6, 10, 0)),
    },
    {
      id: "tar-celula",
      professorId: "u-beatriz",
      disciplinaId: "d-bio",
      turmaIds: ["t-1b"],
      titulo: "Desenho da célula vegetal com legendas",
      instrucoes: "Desenhe à mão e fotografe. Vale capricho na legenda.",
      prazo: iso(em(agora, -8, 23, 59)),
      permiteReenvio: true,
      criadaEm: iso(em(agora, -14, 10, 0)),
    },
    {
      id: "tar-resumo",
      professorId: "u-livia",
      disciplinaId: "d-por",
      turmaIds: ["t-5a"],
      titulo: "Resumo do capítulo 4 de “O menino do dedo verde”",
      instrucoes: "Até dez linhas, à mão. Peça a um adulto para ajudar na foto.",
      prazo: iso(em(agora, 3, 18, 0)),
      permiteReenvio: true,
      criadaEm: iso(em(agora, -2, 15, 0)),
    },
  ];

  const foto = (id: string, nome: string) => ({ id, nome, tipo: "image/jpeg", tamanho: 1_850_000, estado: "pronto" as const, previa: "Foto da resolução (exemplo)." });
  const entregas: Banco["entregas"] = [
    {
      id: "ent-marina-celula",
      tarefaId: "tar-celula",
      alunoId: "u-marina",
      anexos: [foto("f-mc-1", "celula-vegetal.jpg")],
      protocolo: `ENT-${diaDe(em(agora, -9)).replace(/-/g, "")}-418273`,
      enviadaEm: iso(em(agora, -9, 21, 14)),
      tentativa: 1,
      status: "conferida",
      retorno: { por: "u-beatriz", em: iso(em(agora, -7, 13, 0)), texto: "Ótimo desenho. Faltou só o vacúolo na legenda." },
    },
    {
      id: "ent-marina-funcoes",
      tarefaId: "tar-funcoes",
      alunoId: "u-marina",
      anexos: [foto("f-mf-1", "funcoes-1.jpg"), foto("f-mf-2", "funcoes-2.jpg")],
      protocolo: `ENT-${diaDe(em(agora, -2)).replace(/-/g, "")}-552901`,
      enviadaEm: iso(em(agora, -2, 20, 3)),
      tentativa: 1,
      status: "enviada",
    },
    ...["u-sofia-ribeiro", "u-davi-mendes", "u-helena-duarte"].map((alunoId, i) => ({
      id: `ent-${alunoId}-112`,
      tarefaId: "tar-pag112",
      alunoId,
      anexos: [foto(`f-${alunoId}`, "pagina-112.jpg")],
      protocolo: `ENT-${diaDe(agora).replace(/-/g, "")}-10${i}337`,
      enviadaEm: iso(em(agora, 0, 7, 10 + i * 9)),
      tentativa: 1,
      status: "enviada" as const,
    })),
    ...["u-sofia-ribeiro", "u-helena-duarte", "u-samuel-vieira"].map((alunoId, i) => ({
      id: `ent-${alunoId}-funcoes`,
      tarefaId: "tar-funcoes",
      alunoId,
      anexos: [foto(`f-${alunoId}-f`, "funcoes.jpg")],
      protocolo: `ENT-${diaDe(em(agora, -2)).replace(/-/g, "")}-20${i}114`,
      enviadaEm: iso(em(agora, -2, 19, 10 + i * 7)),
      tentativa: 1,
      status: "enviada" as const,
    })),
  ];

  /* ---------- plantões ---------- */
  const plantoes: Banco["plantoes"] = [
    { id: "p-bio", professorId: "u-beatriz", disciplinaId: "d-bio", diasSemana: [1, 3], inicio: "13:30", fim: "17:30", local: "Sala 12, prédio do Médio", series: "1ª a 3ª série" },
    { id: "p-his", professorId: "u-rafael", disciplinaId: "d-his", diasSemana: [1, 2, 4], inicio: "13:30", fim: "16:10", local: "Sala 8, prédio do Médio", series: "3ª série" },
    { id: "p-mat", professorId: "u-sergio", disciplinaId: "d-mat", diasSemana: [2, 4, 5], inicio: "14:00", fim: "17:00", local: "Biblioteca, mesa 2", series: "1ª a 3ª série" },
    { id: "p-fis", professorId: "u-andre", disciplinaId: "d-fis", diasSemana: [1, 3, 5], inicio: "14:00", fim: "16:30", local: "Laboratório de Física", series: "3ª série" },
  ];
  const fila: Banco["fila"] = [];
  const semana = agora.getDay();
  const filaHoje = (plantaoId: string, entradas: [string[], string | undefined, number][]) =>
    entradas.forEach(([alunoIds, duvida, minutos], i) =>
      fila.push({
        id: `fila-${plantaoId}-${i}`,
        plantaoId,
        data: hoje,
        autorId: alunoIds[0],
        alunoIds,
        duvida,
        entrouEm: iso(new Date(agora.getTime() - minutos * 60_000)),
        status: "aguardando",
        atualizadoEm: iso(new Date(agora.getTime() - minutos * 60_000)),
      }),
    );
  for (const p of plantoes) {
    if (!p.diasSemana.includes(semana)) continue;
    if (p.id === "p-bio" || p.id === "p-mat") {
      filaHoje(p.id, [
        [["u-joao-pedro-silva", "u-ana-clara-souza"], "Questão 7 da lista de genética: não entendi o cruzamento.", 25],
        [["u-manuela-prado"], undefined, 12],
      ]);
    } else {
      filaHoje(p.id, [[["u-lorenzo-batista"], "Revisão para a prova de sexta.", 8]]);
    }
  }

  /* ---------- avisos e agenda ---------- */
  const avisos: Banco["avisos"] = [
    {
      id: "avi-simulado",
      autorId: "u-fernanda",
      titulo: "Simulado UFG no sábado, das 8h às 12h30",
      corpo: "O simulado é na unidade T-3. Traga caneta preta, documento com foto e água. Os portões fecham às 7h50.",
      categoria: "Pedagógico",
      publico: { tipo: "turmas", turmaIds: ["t-3a", "t-3b"] },
      paraAlunos: true,
      paraResponsaveis: true,
      exigeCiencia: false,
      publicadoEm: iso(em(agora, -1, 10, 0)),
      ciencias: [],
    },
    {
      id: "avi-agrolab",
      autorId: "u-livia",
      titulo: "Autorização: visita ao AgroLab na próxima sexta",
      corpo: "O 5º ano A vai passar a manhã no AgroLab. Saída às 7h30 e retorno às 12h, em ônibus da escola. Confirme a ciência até quarta-feira.",
      categoria: "Evento",
      publico: { tipo: "turmas", turmaIds: ["t-5a"] },
      paraAlunos: false,
      paraResponsaveis: true,
      exigeCiencia: true,
      publicadoEm: iso(em(agora, -2, 17, 0)),
      ciencias: [
        { usuarioId: "u-resp-alice-ferreira", em: iso(em(agora, -2, 18, 0)) },
        { usuarioId: "u-resp-heitor-almeida", em: iso(em(agora, -1, 7, 30)) },
      ],
    },
    {
      id: "avi-reuniao",
      autorId: "u-fernanda",
      titulo: "Reunião de pais da 1ª série",
      corpo: "Na quinta, às 19h, no auditório da unidade T-3. Vamos apresentar o resultado do 3º bimestre e o calendário de provas.",
      categoria: "Pedagógico",
      publico: { tipo: "turmas", turmaIds: ["t-1b"] },
      paraAlunos: false,
      paraResponsaveis: true,
      exigeCiencia: true,
      publicadoEm: iso(em(agora, -3, 12, 0)),
      ciencias: [{ usuarioId: "u-resp-sofia-ribeiro", em: iso(em(agora, -3, 13, 0)) }],
    },
    {
      id: "avi-festa",
      autorId: "u-juliana",
      titulo: "Festa da família: ingressos na secretaria",
      corpo: "Os ingressos estão à venda na secretaria das duas unidades até sexta. Cada aluno tem direito a quatro convites.",
      categoria: "Evento",
      publico: { tipo: "escola" },
      paraAlunos: true,
      paraResponsaveis: true,
      exigeCiencia: false,
      publicadoEm: iso(em(agora, -4, 9, 0)),
      ciencias: [],
    },
    {
      id: "avi-gripe",
      autorId: "u-juliana",
      titulo: "Vacinação contra a gripe na escola",
      corpo: "A equipe de saúde estará na unidade T-11 na terça, das 8h às 11h. Traga o cartão de vacina.",
      categoria: "Saúde",
      publico: { tipo: "turmas", turmaIds: ["t-5a", "t-9a"] },
      paraAlunos: false,
      paraResponsaveis: true,
      exigeCiencia: false,
      publicadoEm: iso(em(agora, -6, 9, 0)),
      ciencias: [],
    },
  ];

  const agenda: Banco["agenda"] = [
    { id: "ev-simulado", titulo: "Simulado UFG", data: diaDe(em(agora, ((6 - semana + 7) % 7) || 7)), hora: "08:00", local: "Unidade T-3", descricao: "Simulado no formato da UFG.", publico: { tipo: "turmas", turmaIds: ["t-3a", "t-3b"] } },
    { id: "ev-reuniao", titulo: "Reunião de pais da 1ª série", data: diaDe(em(agora, 3)), hora: "19:00", local: "Auditório, unidade T-3", descricao: "Resultado do 3º bimestre e calendário de provas.", publico: { tipo: "turmas", turmaIds: ["t-1b"] } },
    { id: "ev-agrolab", titulo: "Visita ao AgroLab", data: diaDe(em(agora, 4)), hora: "07:30", local: "Saída da unidade T-11", descricao: "Manhã no AgroLab com o 5º ano A.", publico: { tipo: "turmas", turmaIds: ["t-5a"] } },
    { id: "ev-escola-pais", titulo: "Escola de Pais: adolescência e telas", data: diaDe(em(agora, 9)), hora: "19:30", local: "Auditório, unidade T-3", descricao: "Palestra aberta às famílias de todas as etapas.", publico: { tipo: "escola" } },
  ];

  /* ---------- notas ---------- */
  const notas: Nota[] = [];
  const periodos = ["1º bimestre", "2º bimestre", "3º bimestre"];
  for (const v of vinculosAluno) {
    const disciplinasDaTurma = [...new Set(vinculosProfessor.filter((p) => p.turmaId === v.turmaId).map((p) => p.disciplinaId))];
    for (const d of disciplinasDaTurma) {
      for (const periodo of periodos) {
        const base = 5.2 + sorteio(`${v.alunoId}${d}`) * 4.3;
        const valor = Math.min(10, Math.max(2.5, base + (sorteio(`${v.alunoId}${d}${periodo}`) - 0.5) * 2.4));
        notas.push({ alunoId: v.alunoId, disciplinaId: d, periodo, valor: Math.round(valor * 10) / 10, origem: "Secretaria, fechamento do bimestre", atualizadoEm: iso(em(agora, periodo.startsWith("3") ? -12 : -70)) });
      }
    }
  }

  /* ---------- atendimento ---------- */
  const solicitacoes: Banco["solicitacoes"] = [
    {
      id: "sol-theo",
      protocolo: `ATD-${diaDe(em(agora, -1)).replace(/-/g, "")}-302114`,
      autorId: "u-claudia",
      alunoId: "u-theo",
      setor: "Professor",
      assunto: "Theo com dificuldade em frações",
      status: "aberta",
      abertaEm: iso(em(agora, -1, 20, 15)),
      prazoResposta: iso(em(agora, 2, 20, 15)),
      mensagens: [{ autorId: "u-claudia", texto: "Boa noite. O Theo tem chorado na hora da tarefa de frações. Existe algum reforço ou material extra que a gente possa usar em casa?", em: iso(em(agora, -1, 20, 15)) }],
    },
    {
      id: "sol-boletim",
      protocolo: `ATD-${diaDe(em(agora, -9)).replace(/-/g, "")}-118430`,
      autorId: "u-claudia",
      alunoId: "u-marina",
      setor: "Secretaria",
      assunto: "Declaração de matrícula para o clube",
      status: "encerrada",
      abertaEm: iso(em(agora, -9, 8, 0)),
      prazoResposta: iso(em(agora, -8, 8, 0)),
      responsavelId: "u-juliana",
      mensagens: [
        { autorId: "u-claudia", texto: "Preciso da declaração de matrícula da Marina para o clube de natação.", em: iso(em(agora, -9, 8, 0)) },
        { autorId: "u-juliana", texto: "Pronto, Cláudia. A declaração está assinada e pode ser retirada na secretaria da T-3 ou baixada pelo link enviado ao seu e-mail.", em: iso(em(agora, -9, 14, 30)) },
      ],
    },
    {
      id: "sol-atrasada",
      protocolo: `ATD-${diaDe(em(agora, -5)).replace(/-/g, "")}-774520`,
      autorId: "u-resp-miguel-cardoso",
      alunoId: "u-miguel-cardoso",
      setor: "Coordenação",
      assunto: "Troca de turma no contraturno",
      status: "aberta",
      abertaEm: iso(em(agora, -5, 11, 0)),
      prazoResposta: iso(em(agora, -3, 11, 0)),
      mensagens: [{ autorId: "u-resp-miguel-cardoso", texto: "Gostaria de saber se o Miguel pode trocar a eletiva de robótica pela de teatro a partir do mês que vem.", em: iso(em(agora, -5, 11, 0)) }],
    },
  ];

  /* ---------- serviços externos ---------- */
  const servicos: Banco["servicos"] = [
    { id: "srv-pmais", nome: "P+ Poliedro", descricao: "Livro digital e conteúdos do sistema de ensino.", url: "https://www.sistemapoliedro.com.br", publico: ["aluno", "professor"], ativo: true },
    { id: "srv-evolucional", nome: "Evolucional", descricao: "Resultados dos simulados.", url: "https://www.evolucional.com.br", publico: ["aluno", "professor", "coordenacao"], ativo: true },
    { id: "srv-financeiro", nome: "Financeiro e boletos", descricao: "Mensalidades, boletos e segunda via.", url: "https://www.colegioarena.com.br/arenavirtual", publico: ["responsavel"], ativo: true },
    { id: "srv-ouvidoria", nome: "Canal de Ética e Ouvidoria", descricao: "Relatos com sigilo, fora da escola.", url: "https://www.colegioarena.com.br/ouvidoria", publico: ["aluno", "responsavel", "professor"], ativo: true },
  ];

  /* ---------- CRM ---------- */
  const familias: Banco["familias"] = [];
  const contatos: Banco["contatos"] = [];
  const candidatos: Banco["candidatos"] = [];
  const oportunidades: Banco["oportunidades"] = [];
  const notasCrm: Banco["notasCrm"] = [];
  const tarefasCrm: Banco["tarefasCrm"] = [];
  const valor: Record<Etapa, number> = { infantil: 1950, "fundamental-1": 2350, "fundamental-2": 2650, medio: 3150, "pre-vestibular": 1290 };

  type Lead = [
    familia: string,
    bairro: string,
    origem: Banco["familias"][number]["origem"],
    contato: [string, string, string],
    criancas: [string, number, Etapa, string, string?][],
    estagio: Banco["oportunidades"][number]["estagio"],
    diasAtras: number,
    responsavelId: string,
    extra?: { nota?: string; tarefa?: [string, number]; perda?: string; visita?: number; tipo?: "rematricula" },
  ];
  const leads: Lead[] = [
    ["Família Carvalho", "Setor Bueno", "Site", ["Renata Carvalho", "Mãe", "62 99811-2040"], [["Pedro Carvalho", 2014, "fundamental-2", "7º ano", "Colégio do bairro"]], "novo", 0, "u-marcos", { nota: "Pediu visita pelo formulário do site. Quer conhecer as turmas olímpicas.", tarefa: ["Ligar para Renata", 0] }],
    ["Família Queiroz", "Jardim Goiás", "Instagram", ["Tiago Queiroz", "Pai", "62 98402-7711"], [["Lia Queiroz", 2022, "infantil", "Infantil 4"]], "novo", 1, "u-marcos", { tarefa: ["Responder no WhatsApp", -1] }],
    ["Família Bastos", "Setor Marista", "Indicação", ["Camila Bastos", "Mãe", "62 99120-4488"], [["Rafael Bastos", 2010, "medio", "2ª série"]], "em-conversa", 4, "u-paula", { nota: "Indicação da família Ribeiro. Interesse em SAT e aplicação para fora.", tarefa: ["Enviar material do SAT Center", 1] }],
    ["Família Moura", "Setor Oeste", "WhatsApp", ["Fábio Moura", "Pai", "62 98877-1203"], [["Isadora Moura", 2016, "fundamental-1", "5º ano"], ["Benício Moura", 2019, "fundamental-1", "2º ano"]], "em-conversa", 6, "u-marcos", { nota: "Dois filhos. Perguntou sobre desconto para irmãos." }],
    ["Família Teles", "Setor Bueno", "Site", ["Aline Teles", "Mãe", "62 99654-3321"], [["Gustavo Teles", 2011, "fundamental-2", "9º ano", "Escola municipal"]], "visita-agendada", 5, "u-marcos", { visita: 2, nota: "Quer ver o laboratório e a quadra." }],
    ["Família Arantes", "Alphaville Flamboyant", "Evento", ["Marcelo Arantes", "Pai", "62 98111-0090"], [["Clara Arantes", 2009, "medio", "3ª série"]], "visita-agendada", 3, "u-paula", { visita: 1 }],
    ["Família Duarte Lima", "Jardim América", "Indicação", ["Sílvia Duarte", "Avó", "62 99230-5566"], [["Vicente Lima", 2020, "infantil", "Infantil 5"]], "visita-realizada", 12, "u-marcos", { nota: "Visitou com a avó e a mãe. Gostaram da Pedagogia da Escuta; a mãe quer conversar com a coordenação do Infantil.", tarefa: ["Agendar conversa com a coordenação do Infantil", 2] }],
    ["Família Sampaio", "Setor Sul", "Telefone", ["Rodrigo Sampaio", "Pai", "62 98500-1717"], [["Júlia Sampaio", 2012, "fundamental-2", "8º ano"]], "visita-realizada", 15, "u-paula", { tarefa: ["Enviar proposta com valores de 2027", -2] }],
    ["Família Valadares", "Setor Bueno", "Site", ["Letícia Valadares", "Mãe", "62 99900-3412"], [["Otávio Valadares", 2008, "pre-vestibular", "Pré-vestibular Medicina"]], "proposta", 9, "u-marcos", { nota: "Proposta enviada por e-mail. Comparando com outro cursinho." }],
    ["Família Guimarães", "Nova Suíça", "Indicação", ["Daniela Guimarães", "Mãe", "62 98760-2202"], [["Antônio Guimarães", 2015, "fundamental-1", "5º ano"]], "proposta", 7, "u-paula", { tarefa: ["Confirmar documentos da transferência", 1] }],
    ["Família Nogueira", "Setor Marista", "Indicação", ["Fernando Nogueira", "Pai", "62 99712-6060"], [["Luísa Nogueira", 2011, "fundamental-2", "9º ano"]], "matriculado", 30, "u-marcos"],
    ["Família Pacheco", "Setor Oeste", "Instagram", ["Bruna Pacheco", "Mãe", "62 98234-9090"], [["Nina Pacheco", 2021, "infantil", "Infantil 4"]], "perdido", 20, "u-marcos", { perda: "Escolheu escola mais perto de casa." }],
    ["Família Fontes", "Jardim Goiás", "Site", ["Hugo Fontes", "Pai", "62 99187-4545"], [["Davi Fontes", 2009, "medio", "3ª série"]], "perdido", 25, "u-paula", { perda: "Valor da mensalidade acima do planejado." }],
    ["Família Cardoso", "Setor Bueno", "Rematrícula", ["Eduardo Cardoso", "Pai", "62 99300-1188"], [["Miguel Cardoso", 2011, "medio", "1ª série (2027)"]], "em-conversa", 2, "u-paula", { tipo: "rematricula", nota: "Rematrícula para 2027. A família está insatisfeita com a resposta sobre a troca de eletiva.", tarefa: ["Conversar com a coordenação sobre a solicitação em atraso", 0] }],
  ];

  leads.forEach(([nome, bairro, origem, [cNome, relacao, telefone], criancas, estagio, diasAtras, responsavelId, extra = {}], i) => {
    const familiaId = `fam-${i}`;
    const criada = em(agora, -diasAtras - 3, 10 + (i % 6), 15);
    familias.push({ id: familiaId, nome, bairro, origem, responsavelId, etiquetas: criancas.length > 1 ? ["Irmãos"] : [], criadaEm: iso(criada) });
    contatos.push({ id: `con-${i}`, familiaId, nome: cNome, relacao, telefone, email: `${slug(cNome).replace(/-/g, ".")}@exemplo.com`, principal: true });
    const ids = criancas.map(([cn, ano, etapa, serie, escola], j) => {
      const id = `can-${i}-${j}`;
      candidatos.push({ id, familiaId, nome: cn, anoNascimento: ano, etapa, serieInteresse: serie, escolaAtual: escola });
      return id;
    });
    const opId = `opo-${i}`;
    oportunidades.push({
      id: opId,
      familiaId,
      candidatoIds: ids,
      tipo: extra.tipo ?? "captacao",
      estagio,
      ordem: i,
      responsavelId,
      anoLetivo: 2027,
      valorMensal: criancas.reduce((s, c) => s + valor[c[2]], 0),
      visita: extra.visita !== undefined ? { data: diaDe(em(agora, extra.visita)), hora: "15:00", unidade: criancas[0][2] === "medio" || criancas[0][2] === "pre-vestibular" ? "Unidade T-3" : "Unidade T-11" } : undefined,
      motivoPerda: extra.perda,
      criadaEm: iso(criada),
      atualizadaEm: iso(em(agora, -diasAtras, 16, 0)),
    });
    notasCrm.push({ id: `nota-${i}-0`, familiaId, oportunidadeId: opId, autorId: responsavelId, texto: `Primeiro contato pelo canal ${origem === "Site" ? "do site" : origem}.`, em: iso(criada) });
    if (extra.nota) notasCrm.unshift({ id: `nota-${i}-1`, familiaId, oportunidadeId: opId, autorId: responsavelId, texto: extra.nota, em: iso(em(agora, -diasAtras, 15, 0)) });
    if (extra.tarefa) tarefasCrm.push({ id: `tcrm-${i}`, titulo: extra.tarefa[0], prazo: iso(em(agora, extra.tarefa[1], 17, 0)), responsavelId, familiaId, oportunidadeId: opId });
  });

  return {
    versao: VERSAO_BANCO,
    usuarios,
    turmas,
    disciplinas,
    vinculosAluno,
    vinculosProfessor,
    vinculosResponsavel,
    materiais,
    tarefas,
    entregas,
    plantoes,
    fila,
    avisos,
    agenda,
    notas,
    solicitacoes,
    servicos,
    familias,
    contatos,
    candidatos,
    oportunidades,
    tarefasCrm,
    notasCrm,
    auditoria: [],
  };
}

/** Personas mostradas no seletor de perfil da demonstração, na ordem de apresentação. */
export const PERSONAS = personas.map((p) => p.id);
