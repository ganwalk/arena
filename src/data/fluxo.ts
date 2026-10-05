/*
  O fluxo único da Plataforma Arena, na ordem em que uma família vive a escola.
  Cada etapa aponta para a tela real do protótipo, já aberta como a pessoa certa.
*/
export interface Etapa {
  id: string;
  numero: number;
  titulo: string;
  quem: string;
  acontece: string;
  resolve: string;
  itens: string[];
  pessoa?: { id: string; nome: string; papel: string };
  href: string;
  acao: string;
  tela: string;
  celular?: string;
  forma: "quarto" | "triangulo" | "listras" | "anel" | "folha" | "ponto";
}

const como = (id: string, rota: string) => `/plataforma/?como=${id}#${rota}`;

export const fluxo: Etapa[] = [
  {
    id: "site",
    numero: 1,
    titulo: "Site",
    quem: "Família interessada",
    acontece: "Conhece o colégio e pede uma visita.",
    resolve: "O pedido deixa de se perder no WhatsApp: vira contato no funil, com dono e prazo de retorno.",
    itens: ["Etapas, conquistas e unidades", "Formulário “Agende uma visita”", "Contato cai direto na captação"],
    href: "/site/#visita",
    acao: "Abrir o site",
    tela: "site",
    forma: "quarto",
  },
  {
    id: "captacao",
    numero: 2,
    titulo: "Captação",
    quem: "Relacionamento e direção",
    acontece: "Retorna, agenda a visita e acompanha cada família até a decisão.",
    resolve: "Nenhuma família sem próximo passo. Motivos de perda viram dado, não lembrança.",
    itens: ["Funil em quadro, por etapa de ensino", "Ficha da família com linha do tempo", "Tarefas com prazo e relatórios"],
    pessoa: { id: "u-marcos", nome: "Marcos Teixeira", papel: "Relacionamento" },
    href: como("u-marcos", "/crm"),
    acao: "Entrar como Marcos",
    tela: "crm",
    forma: "triangulo",
  },
  {
    id: "matricula",
    numero: 3,
    titulo: "Matrícula",
    quem: "Secretaria",
    acontece: "Escolhe a turma e matricula. Os acessos do aluno e do responsável nascem aqui.",
    resolve: "Um cadastro só: o vínculo de turma e de família define o que cada pessoa vê dali em diante.",
    itens: ["Matrícula a partir da oportunidade", "Contas e vínculos criados juntos", "Turmas, pessoas e saídas na gestão"],
    pessoa: { id: "u-juliana", nome: "Juliana Reis", papel: "Secretaria" },
    href: como("u-juliana", "/crm"),
    acao: "Entrar como Juliana",
    tela: "crm",
    forma: "anel",
  },
  {
    id: "familia",
    numero: 4,
    titulo: "Família",
    quem: "Mães, pais e responsáveis",
    acontece: "Acompanha cada filho, confirma avisos e fala com a escola com protocolo.",
    resolve: "Sai o WhatsApp pessoal sem resposta; entra um pedido com setor, prazo e histórico.",
    itens: ["Resumo por filho", "Avisos com ciência", "Notas, tarefas e agenda", "Fale com a escola, com prazo"],
    pessoa: { id: "u-claudia", nome: "Cláudia Martins", papel: "Mãe de Marina e Theo" },
    href: como("u-claudia", "/pais"),
    acao: "Entrar como Cláudia",
    tela: "familia",
    celular: "familia-celular",
    forma: "folha",
  },
  {
    id: "aluno",
    numero: 5,
    titulo: "Aluno",
    quem: "Do 5º ano ao pré-vestibular",
    acontece: "Abre o material da aula, entrega a tarefa pelo celular e entra na fila do plantão.",
    resolve: "Material num lugar só, foto direto do celular com comprovante, posição na fila sem site à parte.",
    itens: ["Materiais por disciplina", "Tarefa com foto e comprovante", "Fila do plantão, sozinho ou em grupo", "Boletim com fonte e data"],
    pessoa: { id: "u-marina", nome: "Marina Martins", papel: "1ª série B" },
    href: como("u-marina", "/aluno/tarefas/tar-pag112"),
    acao: "Entrar como Marina",
    tela: "aluno",
    celular: "aluno-celular",
    forma: "ponto",
  },
  {
    id: "professor",
    numero: 6,
    titulo: "Professor",
    quem: "Corpo docente",
    acontece: "Publica uma vez para várias turmas, confere entregas e chama a fila do plantão.",
    resolve: "Uma publicação no lugar de HD Virtual, AirDrop, QR code e repasse no grupo da sala.",
    itens: ["Publicar com revisão de destinatários", "Versões e retirada com motivo", "Conferir ou devolver entregas", "Fila ao vivo"],
    pessoa: { id: "u-beatriz", nome: "Beatriz Lima", papel: "Biologia" },
    href: como("u-beatriz", "/professor/plantao"),
    acao: "Entrar como Beatriz",
    tela: "professor",
    forma: "listras",
  },
  {
    id: "gestao",
    numero: 7,
    titulo: "Gestão",
    quem: "Coordenação e direção",
    acontece: "Vê a escola inteira: uso, entregas, atendimento atrasado e quem precisa de atenção.",
    resolve: "Os números saem do uso real. A rematrícula e as indicações voltam para a captação.",
    itens: ["Painel da escola", "Atendimento por prazo", "Moderação e auditoria", "Serviços externos"],
    pessoa: { id: "u-fernanda", nome: "Fernanda Alves", papel: "Coordenação" },
    href: como("u-fernanda", "/gestao"),
    acao: "Entrar como Fernanda",
    tela: "gestao",
    forma: "quarto",
  },
];

/** O que uma ação provoca no resto da escola: o que torna o fluxo único. */
export const reflexos = [
  { quando: "A família pede visita no site", entao: "o contato aparece no funil do relacionamento, com tarefa de retorno para o dia útil seguinte." },
  { quando: "A secretaria matricula", entao: "nascem a conta do aluno e a do responsável; o aluno entra na lista da turma e do professor." },
  { quando: "O professor publica um material", entao: "ele aparece na hora para as turmas escolhidas, e só para elas, inclusive se alguém tentar pelo link." },
  { quando: "O aluno entrega a tarefa", entao: "ganha protocolo, o professor confere ou devolve e a família vê a situação." },
  { quando: "A família abre um pedido", entao: "entra na fila da gestão com prazo; se vencer, aparece no painel." },
  { quando: "Chega a rematrícula", entao: "a conversa volta para a captação, com o histórico da família junto." },
];

export const mudancas = [
  { antes: "Quatro apps e sites salvos no celular", depois: "Um endereço, um login, um portal por papel" },
  { antes: "Material por HD Virtual, AirDrop, QR code e grupo da sala", depois: "Publicado uma vez, aberto no celular pela turma certa" },
  { antes: "Foto da tarefa → computador → envio", depois: "Foto direto do celular, com comprovante" },
  { antes: "Pedido de visita e dúvidas pelo WhatsApp pessoal", depois: "Funil com dono, protocolo e prazo de resposta" },
];
