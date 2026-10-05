/*
  Critérios de aceite do núcleo (dossiê, B4 e P03–P05), verificados contra as regras e ações.
  Pessoas: A só na turma 1, B só na turma 2, C nas duas, professor D só na turma 1 e disciplina X, coordenador.
*/
import { describe, expect, it } from "vitest";
import * as acao from "./acoes";
import { acessoMaterial, materiaisDoAluno, posicaoNaFila, situacaoTarefa, validarArquivo, validarLink } from "./regras";
import { semente } from "./semente";
import type { Anexo, Banco, Usuario } from "./tipos";

const agora = new Date("2026-10-05T10:00:00"); // segunda-feira
const dia = "2026-10-05";

function cenario(): Banco {
  const u = (id: string, papeis: Usuario["papeis"]): Usuario => ({ id, nome: id, papeis, email: `${id}@t`, cargo: "", ativo: true });
  const vazio = semente(agora);
  return {
    ...vazio,
    usuarios: [u("A", ["aluno"]), u("B", ["aluno"]), u("C", ["aluno"]), u("D", ["professor"]), u("E", ["professor"]), u("coord", ["coordenacao"]), u("sec", ["secretaria"]), u("resp", ["responsavel"])],
    turmas: [
      { id: "t1", nome: "Turma 1", etapa: "medio", anoLetivo: 2026, unidade: "" },
      { id: "t2", nome: "Turma 2", etapa: "medio", anoLetivo: 2026, unidade: "" },
    ],
    disciplinas: [
      { id: "X", nome: "X" },
      { id: "Y", nome: "Y" },
    ],
    vinculosAluno: [
      { alunoId: "A", turmaId: "t1", desde: "2026-02-01" },
      { alunoId: "B", turmaId: "t2", desde: "2026-02-01" },
      { alunoId: "C", turmaId: "t1", desde: "2026-02-01" },
      { alunoId: "C", turmaId: "t2", desde: "2026-02-01" },
    ],
    vinculosProfessor: [
      { professorId: "D", turmaId: "t1", disciplinaId: "X", desde: "2026-02-01" },
      { professorId: "E", turmaId: "t2", disciplinaId: "Y", desde: "2026-02-01" },
    ],
    vinculosResponsavel: [{ responsavelId: "resp", alunoId: "A", parentesco: "Mãe", ativo: true }],
    materiais: [],
    tarefas: [],
    entregas: [],
    fila: [],
    plantoes: [{ id: "pl", professorId: "D", disciplinaId: "X", diasSemana: [1], inicio: "13:30", fim: "17:30", local: "", series: "" }],
    avisos: [],
    solicitacoes: [],
    auditoria: [],
  };
}

const pronto = (id = "arq"): Anexo => ({ id, nome: "aula.pdf", tipo: "application/pdf", tamanho: 1000, estado: "pronto", chave: id });
const dados = (extra: Partial<acao.DadosMaterial> = {}): acao.DadosMaterial => ({
  titulo: "Aula 1",
  contexto: "",
  disciplinaId: "X",
  turmaIds: ["t1"],
  anexos: [pronto()],
  ...extra,
});
const ok = (r: acao.Resultado) => {
  if (!r.ok) throw new Error(r.erro);
  return r;
};
const user = (b: Banco, id: string) => b.usuarios.find((u) => u.id === id);

describe("materiais: quem publica e quem abre", () => {
  it("professor publica para a turma certa; A e C abrem, B é bloqueado mesmo pelo identificador", () => {
    const r = ok(acao.criarMaterial(cenario(), "D", dados(), true, agora));
    const b = r.banco;
    expect(acessoMaterial(b, user(b, "A"), r.id!, dia).ok).toBe(true);
    expect(acessoMaterial(b, user(b, "C"), r.id!, dia).ok).toBe(true);
    expect(acessoMaterial(b, user(b, "B"), r.id!, dia)).toEqual({ ok: false, motivo: "sem-permissao" });
    expect(materiaisDoAluno(b, "B", dia)).toHaveLength(0);
  });

  it("D não publica na turma 2 nem em outra disciplina", () => {
    expect(acao.criarMaterial(cenario(), "D", dados({ turmaIds: ["t2"] }), true, agora).ok).toBe(false);
    expect(acao.criarMaterial(cenario(), "D", dados({ disciplinaId: "Y" }), true, agora).ok).toBe(false);
  });

  it("aluno e responsável não publicam", () => {
    expect(acao.criarMaterial(cenario(), "A", dados(), true, agora).ok).toBe(false);
    expect(acao.criarMaterial(cenario(), "resp", dados(), true, agora).ok).toBe(false);
  });

  it("revogar o vínculo de A impede novos acessos", () => {
    const r = ok(acao.criarMaterial(cenario(), "D", dados(), true, agora));
    const b = ok(acao.moverAluno(r.banco, "coord", "A", null, agora)).banco;
    expect(acessoMaterial(b, user(b, "A"), r.id!, dia).ok).toBe(false);
  });

  it("não publica com arquivo enviando, com falha ou sem recurso", () => {
    const enviando = { ...pronto(), estado: "enviando" as const };
    const falhou = { ...pronto(), estado: "falhou" as const };
    expect(acao.criarMaterial(cenario(), "D", dados({ anexos: [enviando] }), true, agora).ok).toBe(false);
    expect(acao.criarMaterial(cenario(), "D", dados({ anexos: [falhou] }), true, agora).ok).toBe(false);
    expect(acao.criarMaterial(cenario(), "D", dados({ anexos: [] }), true, agora).ok).toBe(false);
    // rascunho pode ficar incompleto
    expect(acao.criarMaterial(cenario(), "D", dados({ anexos: [] }), false, agora).ok).toBe(true);
  });

  it("rascunho é invisível ao aluno", () => {
    const r = ok(acao.criarMaterial(cenario(), "D", dados(), false, agora));
    expect(acessoMaterial(r.banco, user(r.banco, "A"), r.id!, dia)).toEqual({ ok: false, motivo: "nao-encontrado" });
  });

  it("repetir o envio com a mesma chave não duplica", () => {
    const b1 = ok(acao.criarMaterial(cenario(), "D", dados(), true, agora, "mat-chave")).banco;
    const b2 = ok(acao.criarMaterial(b1, "D", dados(), true, agora, "mat-chave")).banco;
    expect(b2.materiais.filter((m) => m.id === "mat-chave")).toHaveLength(1);
  });

  it("link só com http(s)", () => {
    expect(validarLink("javascript:alert(1)").ok).toBe(false);
    expect(validarLink("data:text/html,oi").ok).toBe(false);
    expect(validarLink("youtube.com/watch?v=1")).toEqual({ ok: true, url: "https://youtube.com/watch?v=1" });
    expect(acao.criarMaterial(cenario(), "D", dados({ anexos: [], link: { url: "file:///etc/passwd", rotulo: "" } }), true, agora).ok).toBe(false);
  });

  it("correção guarda a versão anterior e exige nota; retirada tem motivo e aparece ao aluno como retirada", () => {
    const r = ok(acao.criarMaterial(cenario(), "D", dados(), true, agora));
    expect(acao.corrigirMaterial(r.banco, "D", r.id!, dados({ titulo: "Aula 1 (corrigida)" }), "", agora).ok).toBe(false);
    const c = ok(acao.corrigirMaterial(r.banco, "D", r.id!, dados({ titulo: "Aula 1 (corrigida)" }), "Troquei o PDF", agora));
    const m = c.banco.materiais.find((x) => x.id === r.id)!;
    expect(m.atual.versao).toBe(2);
    expect(m.historico[0].titulo).toBe("Aula 1");
    expect(acao.retirarMaterial(c.banco, "E", r.id!, "erro", agora).ok).toBe(false);
    const t = ok(acao.retirarMaterial(c.banco, "coord", r.id!, "Conteúdo errado", agora));
    expect(acessoMaterial(t.banco, user(t.banco, "A"), r.id!, dia)).toEqual({ ok: false, motivo: "retirado" });
    expect(acessoMaterial(t.banco, user(t.banco, "B"), r.id!, dia)).toEqual({ ok: false, motivo: "sem-permissao" });
    expect(t.banco.auditoria[0]).toMatchObject({ atorId: "coord", acao: "retirou material" });
  });
});

describe("arquivos", () => {
  it("confere extensão, tipo e tamanho", () => {
    expect(validarArquivo("lista.pdf", "application/pdf", 1000, ["application/pdf"]).ok).toBe(true);
    expect(validarArquivo("virus.exe", "application/x-msdownload", 1000, ["application/pdf"]).ok).toBe(false);
    expect(validarArquivo("falso.pdf", "image/png", 1000, ["application/pdf", "image/png"]).ok).toBe(false);
    expect(validarArquivo("grande.pdf", "application/pdf", 40 * 1024 * 1024, ["application/pdf"]).ok).toBe(false);
    expect(validarArquivo("vazio.pdf", "application/pdf", 0, ["application/pdf"]).ok).toBe(false);
  });
});

describe("tarefas: entrega com comprovante", () => {
  const tarefa = (b: Banco, permiteReenvio = true) =>
    ok(acao.criarTarefa(b, "D", { titulo: "Ex. 1 a 3", instrucoes: "", disciplinaId: "X", turmaIds: ["t1"], prazo: "2026-10-07T23:59:00.000Z", permiteReenvio }, agora));

  it("só registra como enviada com anexos prontos, e a mesma chave não duplica", () => {
    const t = tarefa(cenario());
    const carregando = { ...pronto("f1"), estado: "enviando" as const };
    expect(acao.enviarEntrega(t.banco, "A", t.id!, [carregando], agora, "e1").ok).toBe(false);
    const e = ok(acao.enviarEntrega(t.banco, "A", t.id!, [pronto("f1")], agora, "e1"));
    const de_novo = ok(acao.enviarEntrega(e.banco, "A", t.id!, [pronto("f1")], agora, "e1"));
    expect(de_novo.banco.entregas).toHaveLength(1);
    expect(de_novo.banco.entregas[0].protocolo).toMatch(/^ENT-20261005-\d{6}$/);
  });

  it("aluno de outra turma não entrega", () => {
    const t = tarefa(cenario());
    expect(acao.enviarEntrega(t.banco, "B", t.id!, [pronto()], agora, "e2").ok).toBe(false);
  });

  it("reenvio só até o prazo, ou depois de devolvida", () => {
    const t = tarefa(cenario(), false);
    const e = ok(acao.enviarEntrega(t.banco, "A", t.id!, [pronto()], agora, "e1"));
    expect(acao.enviarEntrega(e.banco, "A", t.id!, [pronto()], agora, "e2").ok).toBe(false);
    const d = ok(acao.avaliarEntrega(e.banco, "D", "e1", "devolvida", "Foto ilegível", agora));
    const r = ok(acao.enviarEntrega(d.banco, "A", t.id!, [pronto()], agora, "e2"));
    expect(r.banco.entregas.find((x) => x.id === "e2")!.tentativa).toBe(2);
  });

  it("situação: atrasada sem entrega depois do prazo", () => {
    const t = tarefa(cenario());
    const tar = t.banco.tarefas[0];
    expect(situacaoTarefa(tar, undefined, new Date("2026-10-08T12:00:00Z"))).toBe("atrasada");
    expect(situacaoTarefa(tar, undefined, agora)).toBe("pendente");
  });
});

describe("plantão: fila presencial com grupos", () => {
  it("grupo ocupa uma posição; ninguém entra duas vezes; chamar avança a fila", () => {
    let b = ok(acao.entrarNaFila(cenario(), "A", "pl", ["C"], "Questão 4", agora)).banco;
    expect(acao.entrarNaFila(b, "C", "pl", [], "", agora).ok).toBe(false);
    b = ok(acao.entrarNaFila(b, "B", "pl", [], "", new Date(agora.getTime() + 60_000))).banco;
    expect(posicaoNaFila(b, "pl", dia, "C")).toBe(1);
    expect(posicaoNaFila(b, "pl", dia, "B")).toBe(2);
    expect(acao.chamarProximo(b, "E", "pl", agora).ok).toBe(false);
    b = ok(acao.chamarProximo(b, "D", "pl", agora)).banco;
    expect(posicaoNaFila(b, "pl", dia, "A")).toBe(0);
    expect(posicaoNaFila(b, "pl", dia, "B")).toBe(1);
    b = ok(acao.chamarProximo(b, "D", "pl", agora)).banco;
    expect(posicaoNaFila(b, "pl", dia, "A")).toBeNull();
  });

  it("colega que sai do grupo não tira os outros da fila", () => {
    let b = ok(acao.entrarNaFila(cenario(), "A", "pl", ["C"], "", agora)).banco;
    const id = b.fila[0].id;
    b = ok(acao.sairDaFila(b, "C", id, agora)).banco;
    expect(posicaoNaFila(b, "pl", dia, "A")).toBe(1);
    expect(posicaoNaFila(b, "pl", dia, "C")).toBeNull();
  });
});

describe("família e atendimento", () => {
  it("responsável só abre solicitação sobre o próprio filho, com prazo de resposta", () => {
    expect(acao.abrirSolicitacao(cenario(), "resp", { alunoId: "B", setor: "Secretaria", assunto: "x", texto: "uma mensagem longa" }, agora).ok).toBe(false);
    const r = ok(acao.abrirSolicitacao(cenario(), "resp", { alunoId: "A", setor: "Secretaria", assunto: "Declaração", texto: "Preciso de uma declaração." }, agora));
    expect(r.banco.solicitacoes[0].prazoResposta).toBe(new Date("2026-10-06T10:00:00").toISOString());
  });

  it("professor só avisa as próprias turmas; escola toda só pela coordenação", () => {
    const base: acao.DadosAviso = { titulo: "Prova", corpo: "Quinta", categoria: "Pedagógico", publico: { tipo: "turmas", turmaIds: ["t2"] }, paraAlunos: true, paraResponsaveis: false, exigeCiencia: false };
    expect(acao.publicarAviso(cenario(), "D", base, agora).ok).toBe(false);
    expect(acao.publicarAviso(cenario(), "D", { ...base, publico: { tipo: "turmas", turmaIds: ["t1"] } }, agora).ok).toBe(true);
    expect(acao.publicarAviso(cenario(), "D", { ...base, publico: { tipo: "escola" } }, agora).ok).toBe(false);
    expect(acao.publicarAviso(cenario(), "coord", { ...base, publico: { tipo: "escola" } }, agora).ok).toBe(true);
  });
});

describe("captação até a matrícula", () => {
  it("lead percorre o funil, perda exige motivo e a matrícula cria os acessos", () => {
    const b0 = semente(agora);
    const lead = ok(
      acao.criarLead(
        b0,
        "u-juliana",
        {
          familia: "",
          bairro: "Setor Bueno",
          origem: "Site",
          contato: { nome: "Ana Prado", relacao: "Mãe", telefone: "62 99999-0000" },
          candidatos: [{ nome: "Bento Prado", anoNascimento: 2016, etapa: "fundamental-1", serieInteresse: "5º ano" }],
          valorMensal: 2350,
          anoLetivo: 2027,
        },
        agora,
      ),
    );
    expect(lead.banco.familias[0].nome).toBe("Família Prado");
    expect(acao.moverOportunidade(lead.banco, "u-juliana", lead.id!, "perdido", agora).ok).toBe(false);
    expect(acao.moverOportunidade(lead.banco, "u-juliana", lead.id!, "matriculado", agora).ok).toBe(false);
    expect(acao.criarLead(b0, "u-lucas", { ...({} as acao.DadosLead) }, agora).ok).toBe(false);

    const cand = lead.banco.candidatos.find((c) => c.nome === "Bento Prado")!;
    expect(acao.matricular(lead.banco, "u-marcos", lead.id!, { [cand.id]: "t-5a" }, agora).ok).toBe(false);
    const m = ok(acao.matricular(lead.banco, "u-juliana", lead.id!, { [cand.id]: "t-5a" }, agora));
    const aluno = m.banco.usuarios.find((u) => u.nome === "Bento Prado")!;
    const mae = m.banco.usuarios.find((u) => u.nome === "Ana Prado")!;
    expect(aluno.papeis).toEqual(["aluno"]);
    expect(m.banco.vinculosAluno).toContainEqual({ alunoId: aluno.id, turmaId: "t-5a", desde: dia });
    expect(m.banco.vinculosResponsavel).toContainEqual({ responsavelId: mae.id, alunoId: aluno.id, parentesco: "Mãe", ativo: true });
    expect(m.banco.oportunidades.find((o) => o.id === lead.id)!.estagio).toBe("matriculado");
  });
});

describe("site → captação", () => {
  it("o formulário público cria o contato no funil, atribuído ao relacionamento", () => {
    const b0 = semente(agora);
    expect(acao.pedirVisitaPeloSite(b0, { responsavel: "", telefone: "62 99999-0000", crianca: "", etapa: "medio" }, agora).ok).toBe(false);
    expect(acao.pedirVisitaPeloSite(b0, { responsavel: "Rita Lopes", telefone: "123", crianca: "", etapa: "medio" }, agora).ok).toBe(false);
    const r = ok(acao.pedirVisitaPeloSite(b0, { responsavel: "Rita Lopes", telefone: "62 99999-0000", crianca: "Caio", etapa: "medio" }, agora));
    const o = r.banco.oportunidades.find((x) => x.id === r.id)!;
    expect(o).toMatchObject({ estagio: "novo", responsavelId: "u-marcos", valorMensal: 3150 });
    expect(r.banco.familias[0]).toMatchObject({ nome: "Família Lopes", origem: "Site" });
    expect(r.banco.tarefasCrm.some((t) => t.oportunidadeId === r.id)).toBe(true);
    expect(r.banco.auditoria[0].acao).toBe("recebeu pedido de visita pelo site");
  });
});
