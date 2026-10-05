/*
  Captação e relacionamento com famílias. Estrutura do Relaticle adaptada à escola:
  Company → Família, People → Contato (+ Candidato, a criança), Opportunity → Oportunidade no funil
  de matrícula, Tasks e Notes ligados à família. A matrícula fecha o ciclo criando as contas
  do aluno e do responsável nos outros portais.
*/
import { useState } from "preact/hooks";
import * as acao from "../dominio/acoes";
import { ESTAGIOS, ETAPAS, diaDe, nomeDe, reais, resumoFunil, rotuloEstagio, rotuloEtapa, somarDiasUteis, temPapel } from "../dominio/regras";
import type { Banco, EstagioFunil, Etapa, Oportunidade, OrigemLead } from "../dominio/tipos";
import type { ItemNav } from "../App";
import { href, ir, loja, useLoja } from "../estado/loja";
import { Abas, Avatar, Botao, Cabecalho, Campo, Escolhas, Estado, Icone, Janela, Numero, Secao, Selo, resultado } from "../ui/base";
import { Linha } from "../ui/comum";
import { data, dataHora, plural, prazo, primeiroNome, quando } from "../ui/formato";

const ANO_CAPTACAO = 2027;
const ORIGENS: OrigemLead[] = ["Site", "WhatsApp", "Instagram", "Indicação", "Evento", "Telefone", "Rematrícula"];

export function navCrm(b: Banco, id: string, agora: Date): ItemNav[] {
  const fim = new Date(agora);
  fim.setHours(23, 59, 59);
  const minhas = b.tarefasCrm.filter((t) => !t.concluidaEm && t.responsavelId === id && t.prazo <= fim.toISOString()).length;
  return [
    { id: "inicio", rotulo: "Funil", icone: "funil" },
    { id: "familias", rotulo: "Famílias", icone: "pessoas" },
    { id: "tarefas", rotulo: "Tarefas", icone: "tarefa", contagem: minhas },
    { id: "relatorios", rotulo: "Relatórios", icone: "nota" },
  ];
}

export function PortalCrm({ secao, id }: { secao: string; id?: string }) {
  if (secao === "familias") return id ? <Familia id={id} /> : <Familias />;
  if (secao === "tarefas") return <Tarefas />;
  if (secao === "relatorios") return <Relatorios />;
  return <Funil />;
}

const familia = (b: Banco, id: string) => b.familias.find((f) => f.id === id);
const contatoPrincipal = (b: Banco, familiaId: string) => b.contatos.find((c) => c.familiaId === familiaId && c.principal);
const candidatosDe = (b: Banco, o: Oportunidade) => b.candidatos.filter((c) => o.candidatoIds.includes(c.id));

/* ---------- funil (kanban) ---------- */

function Funil() {
  const { banco, eu, agora } = useLoja();
  const [novo, setNovo] = useState(false);
  const [etapa, setEtapa] = useState<"todas" | Etapa>("todas");
  const [so, setSo] = useState<"todos" | "meus">("todos");
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<EstagioFunil | null>(null);
  const [perda, setPerda] = useState<string | null>(null);
  const [matricula, setMatricula] = useState<string | null>(null);
  const [visita, setVisita] = useState<string | null>(null);

  const ops = banco.oportunidades.filter(
    (o) =>
      o.anoLetivo === ANO_CAPTACAO &&
      (so === "todos" || o.responsavelId === eu!.id) &&
      (etapa === "todas" || candidatosDe(banco, o).some((c) => c.etapa === etapa)),
  );
  const r = resumoFunil(banco, ANO_CAPTACAO);

  function mover(id: string, estagio: EstagioFunil, antesDe?: string) {
    const o = banco.oportunidades.find((x) => x.id === id);
    if (!o || (o.estagio === estagio && !antesDe)) return;
    if (estagio === "perdido") return setPerda(id);
    if (estagio === "matriculado") return setMatricula(id);
    if (estagio === "visita-agendada" && !o.visita) return setVisita(id);
    resultado(loja.executar((b, a, ag) => acao.moverOportunidade(b, a, id, estagio, ag, { antesDe })), `Movido para “${rotuloEstagio(estagio)}”.`);
  }

  return (
    <div class="pagina pagina--larga">
      <Cabecalho
        titulo={`Captação ${ANO_CAPTACAO}`}
        sub={`${r.abertas} famílias em negociação · ${reais(r.receitaAberta)}/mês em aberto · ${r.ganhas} matrículas`}
        acoes={
          <Botao icone="mais" onClick={() => setNovo(true)}>
            Novo contato
          </Botao>
        }
      />
      <div class="filtros">
        <Abas rotulo="Etapa" ativa={etapa} aoMudar={setEtapa} abas={[{ id: "todas", rotulo: "Todas as etapas" }, ...ETAPAS.map((e) => ({ id: e.id, rotulo: e.rotulo }))]} />
        <Abas rotulo="Responsável" ativa={so} aoMudar={setSo} abas={[{ id: "todos", rotulo: "Todos" }, { id: "meus", rotulo: "Meus" }]} />
      </div>
      <p class="campo__dica">Arraste os cartões entre as colunas, ou use “Mover para” dentro de cada um.</p>
      <div class="kanban" role="list">
        {ESTAGIOS.map((est) => {
          const coluna = ops.filter((o) => o.estagio === est.id).sort((a, b) => a.ordem - b.ordem);
          const soma = coluna.reduce((s, o) => s + o.valorMensal, 0);
          return (
            <section
              key={est.id}
              role="listitem"
              class={`kanban__coluna kanban__coluna--${est.id}${sobre === est.id ? " kanban__coluna--sobre" : ""}`}
              aria-label={`${est.rotulo}, ${coluna.length}`}
              onDragOver={(e) => {
                e.preventDefault();
                setSobre(est.id);
              }}
              onDragLeave={() => setSobre(null)}
              onDrop={(e) => {
                e.preventDefault();
                setSobre(null);
                const id = e.dataTransfer?.getData("text/plain") || arrastando;
                if (id) mover(id, est.id);
                setArrastando(null);
              }}
            >
              <header class="kanban__topo">
                <h2>{est.rotulo}</h2>
                <span class="kanban__n">{coluna.length}</span>
              </header>
              {soma > 0 && est.id !== "perdido" && <p class="kanban__soma">{reais(soma)}/mês</p>}
              <div class="kanban__cartoes">
                {coluna.map((o) => (
                  <CartaoOportunidade key={o.id} o={o} agora={agora} aoArrastar={setArrastando} aoMover={mover} />
                ))}
                {!coluna.length && <p class="kanban__vazio">Nenhuma família</p>}
              </div>
            </section>
          );
        })}
      </div>

      <NovoLead aberta={novo} aoFechar={() => setNovo(false)} />
      <JanelaPerda id={perda} aoFechar={() => setPerda(null)} />
      <JanelaVisita id={visita} aoFechar={() => setVisita(null)} />
      <JanelaMatricula id={matricula} aoFechar={() => setMatricula(null)} />
    </div>
  );
}

function CartaoOportunidade({ o, agora, aoArrastar, aoMover }: { o: Oportunidade; agora: Date; aoArrastar: (id: string | null) => void; aoMover: (id: string, e: EstagioFunil) => void }) {
  const { banco } = useLoja();
  const f = familia(banco, o.familiaId)!;
  const cands = candidatosDe(banco, o);
  const proxima = banco.tarefasCrm.filter((t) => t.oportunidadeId === o.id && !t.concluidaEm).sort((a, b) => a.prazo.localeCompare(b.prazo))[0];
  const atrasada = proxima && proxima.prazo < agora.toISOString();
  const parado = Math.round((agora.getTime() - new Date(o.atualizadaEm).getTime()) / 864e5);
  return (
    <article
      class="cartao-op"
      draggable
      onDragStart={(e) => {
        e.dataTransfer?.setData("text/plain", o.id);
        aoArrastar(o.id);
      }}
      onDragEnd={() => aoArrastar(null)}
    >
      <a class="cartao-op__titulo" href={href("crm", "familias", f.id)}>
        {f.nome}
      </a>
      <p class="cartao-op__cand">{cands.map((c) => `${primeiroNome(c.nome)}, ${c.serieInteresse}`).join(" · ")}</p>
      <div class="cartao-op__selos">
        {o.tipo === "rematricula" && <Selo tom="alerta">Rematrícula</Selo>}
        {o.tipo !== "rematricula" && <Selo>{f.origem}</Selo>}
        {o.visita && o.estagio === "visita-agendada" && <Selo tom="acao">Visita {data(o.visita.data)}, {o.visita.hora}</Selo>}
      </div>
      {proxima && (
        <p class={`cartao-op__tarefa${atrasada ? " cartao-op__tarefa--atrasada" : ""}`}>
          <Icone nome="relogio" tamanho={14} /> {proxima.titulo} · {prazo(proxima.prazo, agora).replace("vence ", "")}
        </p>
      )}
      {o.motivoPerda && <p class="cartao-op__perda">{o.motivoPerda}</p>}
      <div class="cartao-op__rodape">
        <span class="suave">{reais(o.valorMensal)}/mês</span>
        {parado >= 7 && !["matriculado", "perdido"].includes(o.estagio) && <span class="cartao-op__parado">parado há {parado} dias</span>}
        <Avatar nome={nomeDe(banco, o.responsavelId)} tamanho={22} />
      </div>
      <label class="cartao-op__mover">
        <span class="visualmente-oculto">Mover {f.nome} para</span>
        <select value="" onChange={(e) => { const v = e.currentTarget.value as EstagioFunil; e.currentTarget.value = ""; if (v) aoMover(o.id, v); }}>
          <option value="">Mover para…</option>
          {ESTAGIOS.filter((x) => x.id !== o.estagio).map((x) => (
            <option key={x.id} value={x.id}>
              {x.rotulo}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}

/* ---------- janelas do funil ---------- */

const VALOR_ETAPA: Record<Etapa, number> = { infantil: 1950, "fundamental-1": 2350, "fundamental-2": 2650, medio: 3150, "pre-vestibular": 1290 };

function NovoLead({ aberta, aoFechar }: { aberta: boolean; aoFechar: () => void }) {
  const vazio = { nome: "", anoNascimento: 2015, etapa: "fundamental-1" as Etapa, serieInteresse: "", escolaAtual: "" };
  const [contato, setContato] = useState({ nome: "", relacao: "Mãe", telefone: "", email: "" });
  const [bairro, setBairro] = useState("");
  const [origem, setOrigem] = useState<OrigemLead>("Site");
  const [criancas, setCriancas] = useState([vazio]);
  const [nota, setNota] = useState("");
  const mudar = (i: number, p: Partial<typeof vazio>) => setCriancas(criancas.map((c, j) => (j === i ? { ...c, ...p } : c)));

  return (
    <Janela aberta={aberta} aoFechar={aoFechar} titulo="Novo contato de família" largura={640}>
      <form
        class="form"
        onSubmit={(e) => {
          e.preventDefault();
          const r = loja.executar((b, a, ag) =>
            acao.criarLead(b, a, { familia: "", bairro, origem, contato, candidatos: criancas, valorMensal: criancas.reduce((s, c) => s + VALOR_ETAPA[c.etapa], 0), anoLetivo: ANO_CAPTACAO, nota }, ag),
          );
          if (resultado(r, "Contato cadastrado. Uma tarefa de retorno foi criada para amanhã.")) {
            setContato({ nome: "", relacao: "Mãe", telefone: "", email: "" });
            setCriancas([vazio]);
            setNota("");
            aoFechar();
          }
        }}
      >
        <div class="grade-campos">
          <Campo rotulo="Quem entrou em contato" id="l-nome">
            <input id="l-nome" value={contato.nome} onInput={(e) => setContato({ ...contato, nome: e.currentTarget.value })} />
          </Campo>
          <Campo rotulo="Relação" id="l-rel">
            <select id="l-rel" value={contato.relacao} onChange={(e) => setContato({ ...contato, relacao: e.currentTarget.value })}>
              {["Mãe", "Pai", "Avó", "Avô", "Responsável"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Telefone (WhatsApp)" id="l-tel">
            <input id="l-tel" inputMode="tel" value={contato.telefone} onInput={(e) => setContato({ ...contato, telefone: e.currentTarget.value })} placeholder="62 9…" />
          </Campo>
          <Campo rotulo="E-mail (opcional)" id="l-email">
            <input id="l-email" type="email" value={contato.email} onInput={(e) => setContato({ ...contato, email: e.currentTarget.value })} />
          </Campo>
          <Campo rotulo="Bairro" id="l-bairro">
            <input id="l-bairro" value={bairro} onInput={(e) => setBairro(e.currentTarget.value)} />
          </Campo>
          <Campo rotulo="Como chegou" id="l-origem">
            <select id="l-origem" value={origem} onChange={(e) => setOrigem(e.currentTarget.value as OrigemLead)}>
              {ORIGENS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Campo>
        </div>
        {criancas.map((c, i) => (
          <fieldset class="form__bloco" key={i}>
            <legend class="form__titulo">{criancas.length > 1 ? `Criança ${i + 1}` : "Criança"}</legend>
            <div class="grade-campos">
              <Campo rotulo="Nome" id={`c-nome-${i}`}>
                <input id={`c-nome-${i}`} value={c.nome} onInput={(e) => mudar(i, { nome: e.currentTarget.value })} />
              </Campo>
              <Campo rotulo="Ano de nascimento" id={`c-ano-${i}`}>
                <input id={`c-ano-${i}`} type="number" min={2005} max={2024} value={c.anoNascimento} onInput={(e) => mudar(i, { anoNascimento: Number(e.currentTarget.value) })} />
              </Campo>
              <Campo rotulo="Etapa" id={`c-etapa-${i}`}>
                <select id={`c-etapa-${i}`} value={c.etapa} onChange={(e) => mudar(i, { etapa: e.currentTarget.value as Etapa })}>
                  {ETAPAS.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.rotulo}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo rotulo="Série de interesse" id={`c-serie-${i}`}>
                <input id={`c-serie-${i}`} value={c.serieInteresse} onInput={(e) => mudar(i, { serieInteresse: e.currentTarget.value })} placeholder="Ex.: 6º ano" />
              </Campo>
            </div>
          </fieldset>
        ))}
        <Botao variante="fantasma" pequeno icone="mais" onClick={() => setCriancas([...criancas, vazio])}>
          Outra criança da mesma família
        </Botao>
        <Campo rotulo="Anotação (opcional)" id="l-nota">
          <textarea id="l-nota" rows={2} value={nota} onInput={(e) => setNota(e.currentTarget.value)} placeholder="O que a família procura, o que perguntou" />
        </Campo>
        <div class="janela__rodape">
          <Botao variante="fantasma" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao type="submit">Cadastrar</Botao>
        </div>
      </form>
    </Janela>
  );
}

const MOTIVOS = ["Valor da mensalidade", "Distância de casa", "Escolheu outra escola", "Proposta pedagógica", "Desistiu de mudar", "Sem retorno da família"];

function JanelaPerda({ id, aoFechar }: { id: string | null; aoFechar: () => void }) {
  const [motivo, setMotivo] = useState("");
  const [detalhe, setDetalhe] = useState("");
  return (
    <Janela aberta={!!id} aoFechar={aoFechar} titulo="Marcar como perdido">
      <Escolhas rotulo="Motivo principal" opcoes={MOTIVOS.map((m) => ({ id: m, rotulo: m }))} valor={motivo ? [motivo] : []} aoMudar={([m]) => setMotivo(m)} />
      <Campo rotulo="Detalhe (opcional)" id="p-det">
        <input id="p-det" value={detalhe} onInput={(e) => setDetalhe(e.currentTarget.value)} />
      </Campo>
      <div class="janela__rodape">
        <Botao variante="fantasma" onClick={aoFechar}>
          Cancelar
        </Botao>
        <Botao
          variante="perigo"
          disabled={!motivo}
          onClick={() => {
            const m = detalhe.trim() ? `${motivo}: ${detalhe.trim()}` : motivo;
            if (resultado(loja.executar((b, a, ag) => acao.moverOportunidade(b, a, id!, "perdido", ag, { motivoPerda: m })), "Registrado como perdido.")) {
              setMotivo("");
              setDetalhe("");
              aoFechar();
            }
          }}
        >
          Marcar como perdido
        </Botao>
      </div>
    </Janela>
  );
}

function JanelaVisita({ id, aoFechar }: { id: string | null; aoFechar: () => void }) {
  const { agora } = useLoja();
  const [dia, setDia] = useState(diaDe(somarDiasUteis(agora, 2)));
  const [hora, setHora] = useState("15:00");
  const [unidade, setUnidade] = useState("Unidade T-11");
  return (
    <Janela aberta={!!id} aoFechar={aoFechar} titulo="Agendar visita">
      <div class="grade-campos">
        <Campo rotulo="Data" id="v-dia">
          <input id="v-dia" type="date" value={dia} onInput={(e) => setDia(e.currentTarget.value)} />
        </Campo>
        <Campo rotulo="Horário" id="v-hora">
          <input id="v-hora" type="time" value={hora} onInput={(e) => setHora(e.currentTarget.value)} />
        </Campo>
      </div>
      <Escolhas rotulo="Unidade" opcoes={[{ id: "Unidade T-11", rotulo: "T-11 (Infantil e Fundamental)" }, { id: "Unidade T-3", rotulo: "T-3 (Ensino Médio)" }, { id: "Unidade C-235", rotulo: "C-235 (Pré-vestibular)" }]} valor={[unidade]} aoMudar={([u]) => setUnidade(u)} />
      <div class="janela__rodape">
        <Botao variante="fantasma" onClick={aoFechar}>
          Cancelar
        </Botao>
        <Botao onClick={() => resultado(loja.executar((b, a, ag) => acao.agendarVisita(b, a, id!, { data: dia, hora, unidade }, ag)), "Visita agendada. Lembrete criado para a véspera.") && aoFechar()}>
          Agendar
        </Botao>
      </div>
    </Janela>
  );
}

function JanelaMatricula({ id, aoFechar }: { id: string | null; aoFechar: () => void }) {
  const { banco, eu } = useLoja();
  const [turmas, setTurmas] = useState<Record<string, string>>({});
  const o = banco.oportunidades.find((x) => x.id === id);
  const secretaria = temPapel(eu, "secretaria");
  return (
    <Janela aberta={!!id} aoFechar={aoFechar} titulo="Matricular">
      {o && !secretaria && (
        <Estado icone="escudo" tom="alerta" titulo="A matrícula é feita pela secretaria.">
          Mova para “Proposta enviada” e avise a secretaria. Ela confere documentos e contrato antes de matricular.
        </Estado>
      )}
      {o && secretaria && (
        <>
          <p class="texto">
            Confirme a turma de cada criança. Ao matricular, a plataforma cria o acesso do aluno e do responsável principal ({contatoPrincipal(banco, o.familiaId)?.nome}) e vincula os dois.
          </p>
          {candidatosDe(banco, o).map((c) => (
            <Campo key={c.id} rotulo={`${c.nome} · interesse: ${c.serieInteresse}`} id={`m-${c.id}`}>
              <select id={`m-${c.id}`} value={turmas[c.id] ?? ""} onChange={(e) => setTurmas({ ...turmas, [c.id]: e.currentTarget.value })}>
                <option value="">Escolha a turma</option>
                {banco.turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome} ({rotuloEtapa(t.etapa)})
                  </option>
                ))}
              </select>
            </Campo>
          ))}
          <p class="campo__dica">Na demonstração, as turmas são as de 2026. Em produção, entram as turmas do ano letivo da matrícula.</p>
        </>
      )}
      <div class="janela__rodape">
        <Botao variante="fantasma" onClick={aoFechar}>
          {secretaria ? "Cancelar" : "Fechar"}
        </Botao>
        {secretaria && (
          <Botao
            icone="ok"
            onClick={() => {
              if (resultado(loja.executar((b, a, ag) => acao.matricular(b, a, id!, turmas, ag)), "Matrícula feita. Os acessos já aparecem em Gestão → Turmas.")) {
                setTurmas({});
                aoFechar();
              }
            }}
          >
            Matricular
          </Botao>
        )}
      </div>
    </Janela>
  );
}

/* ---------- famílias ---------- */

function Familias() {
  const { banco, agora } = useLoja();
  const [busca, setBusca] = useState("");
  const termo = busca.trim().toLowerCase();
  const lista = banco.familias.filter((f) => {
    if (!termo) return true;
    const textos = [f.nome, f.bairro, ...banco.contatos.filter((c) => c.familiaId === f.id).flatMap((c) => [c.nome, c.telefone]), ...banco.candidatos.filter((c) => c.familiaId === f.id).map((c) => c.nome)];
    return textos.some((t) => t.toLowerCase().includes(termo));
  });
  return (
    <div class="pagina">
      <Cabecalho titulo="Famílias" sub={`${banco.familias.length} famílias no relacionamento`} />
      <label class="busca busca--larga">
        <span class="visualmente-oculto">Buscar família</span>
        <input type="search" placeholder="Nome, criança, telefone ou bairro" value={busca} onInput={(e) => setBusca(e.currentTarget.value)} />
      </label>
      <div class="tabela-rolagem">
        <table class="tabela">
          <thead>
            <tr>
              <th scope="col">Família</th>
              <th scope="col">Contato</th>
              <th scope="col">Crianças</th>
              <th scope="col">Estágio</th>
              <th scope="col">Origem</th>
              <th scope="col">Atualizado</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((f) => {
              const c = contatoPrincipal(banco, f.id);
              const o = banco.oportunidades.filter((x) => x.familiaId === f.id).sort((a, b) => b.atualizadaEm.localeCompare(a.atualizadaEm))[0];
              return (
                <tr key={f.id}>
                  <th scope="row">
                    <a href={href("crm", "familias", f.id)}>{f.nome}</a>
                    <span class="tabela__sub">{f.bairro}</span>
                  </th>
                  <td>
                    {c?.nome}
                    <span class="tabela__sub">{c?.telefone}</span>
                  </td>
                  <td>{banco.candidatos.filter((x) => x.familiaId === f.id).map((x) => `${primeiroNome(x.nome)} (${x.serieInteresse})`).join(", ")}</td>
                  <td>{o && <Selo tom={o.estagio === "matriculado" ? "ok" : o.estagio === "perdido" ? "perigo" : "acao"}>{rotuloEstagio(o.estagio)}</Selo>}</td>
                  <td>{f.origem}</td>
                  <td>{o ? quando(o.atualizadaEm, agora) : "–"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!lista.length && <Estado icone="busca" titulo="Nenhuma família encontrada." />}
    </div>
  );
}

function Familia({ id }: { id: string }) {
  const { banco, agora } = useLoja();
  const f = familia(banco, id);
  const [nota, setNota] = useState("");
  const [tarefa, setTarefa] = useState("");
  const [prazoT, setPrazoT] = useState(diaDe(somarDiasUteis(agora, 1)));
  const [visita, setVisita] = useState<string | null>(null);
  const [perda, setPerda] = useState<string | null>(null);
  const [matricula, setMatricula] = useState<string | null>(null);
  if (!f) return <Estado icone="busca" titulo="Família não encontrada." />;
  const contatos = banco.contatos.filter((c) => c.familiaId === id);
  const cands = banco.candidatos.filter((c) => c.familiaId === id);
  const ops = banco.oportunidades.filter((o) => o.familiaId === id);
  const notas = banco.notasCrm.filter((n) => n.familiaId === id);
  const tarefas = banco.tarefasCrm.filter((t) => t.familiaId === id).sort((a, b) => Number(!!a.concluidaEm) - Number(!!b.concluidaEm) || a.prazo.localeCompare(b.prazo));
  const op = ops[0];
  const wa = (tel: string) => `https://wa.me/55${tel.replace(/\D/g, "")}`;

  return (
    <div class="pagina">
      <Cabecalho
        titulo={f.nome}
        voltar={{ href: href("crm", "familias"), rotulo: "Famílias" }}
        sub={`${f.bairro} · chegou por ${f.origem} em ${data(f.criadaEm)} · responsável: ${nomeDe(banco, f.responsavelId)}`}
        acoes={
          op &&
          !["matriculado", "perdido"].includes(op.estagio) && (
            <>
              <Botao variante="secundario" icone="calendario" onClick={() => setVisita(op.id)}>
                {op.visita ? "Remarcar visita" : "Agendar visita"}
              </Botao>
              <Botao variante="secundario" onClick={() => setPerda(op.id)}>
                Perdido
              </Botao>
              <Botao icone="ok" onClick={() => setMatricula(op.id)}>
                Matricular
              </Botao>
            </>
          )
        }
      />
      {op && (
        <ol class="trilha" aria-label="Estágio no funil">
          {ESTAGIOS.filter((e) => e.id !== "perdido").map((e, i, arr) => {
            const atual = arr.findIndex((x) => x.id === op.estagio);
            return (
              <li key={e.id} class={i < atual ? "feito" : i === atual ? "atual" : undefined} aria-current={i === atual ? "step" : undefined}>
                {e.rotulo}
              </li>
            );
          })}
          {op.estagio === "perdido" && <li class="perdido">Perdido: {op.motivoPerda}</li>}
        </ol>
      )}
      <div class="grade-2 grade-2--larga">
        <div>
          <Secao titulo="Linha do tempo">
            <form
              class="nota-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (resultado(loja.executar((b, a, ag) => acao.anotarCrm(b, a, id, nota, ag, op?.id)))) setNota("");
              }}
            >
              <label class="visualmente-oculto" for="n-txt">
                Nova anotação
              </label>
              <textarea id="n-txt" rows={2} placeholder="Registrar ligação, conversa ou visita" value={nota} onInput={(e) => setNota(e.currentTarget.value)} />
              <Botao type="submit" pequeno>
                Anotar
              </Botao>
            </form>
            <ol class="tempo">
              {notas.map((n) => (
                <li key={n.id}>
                  <Avatar nome={nomeDe(banco, n.autorId)} tamanho={26} />
                  <div>
                    <p class="tempo__meta">
                      {nomeDe(banco, n.autorId)} · {quando(n.em, agora)}
                    </p>
                    <p>{n.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Secao>
        </div>
        <div>
          <Secao titulo="Contatos">
            <div class="linhas">
              {contatos.map((c) => (
                <div class="linha" key={c.id}>
                  <span class="linha__principal">
                    <span class="linha__titulo">
                      {c.nome} {c.principal && <Selo>Principal</Selo>}
                    </span>
                    <span class="linha__meta">
                      {c.relacao} · {c.telefone}
                      {c.email && ` · ${c.email}`}
                    </span>
                  </span>
                  <a class="btn btn--secundario btn--pequeno" href={wa(c.telefone)} target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                </div>
              ))}
            </div>
          </Secao>
          <Secao titulo="Crianças">
            <div class="linhas">
              {cands.map((c) => (
                <div class="linha" key={c.id}>
                  <span class="linha__principal">
                    <span class="linha__titulo">{c.nome}</span>
                    <span class="linha__meta">
                      {ANO_CAPTACAO - c.anoNascimento} anos em {ANO_CAPTACAO} · {c.serieInteresse} ({rotuloEtapa(c.etapa)}){c.escolaAtual && ` · vem de ${c.escolaAtual}`}
                    </span>
                  </span>
                  {c.alunoId && <Selo tom="ok">Aluno</Selo>}
                </div>
              ))}
            </div>
          </Secao>
          {op && (
            <Secao titulo="Oportunidade">
              <dl class="revisao">
                <div>
                  <dt>Estágio</dt>
                  <dd>{rotuloEstagio(op.estagio)}</dd>
                </div>
                <div>
                  <dt>Mensalidade estimada</dt>
                  <dd>{reais(op.valorMensal)}</dd>
                </div>
                {op.visita && (
                  <div>
                    <dt>Visita</dt>
                    <dd>
                      {data(op.visita.data)}, {op.visita.hora} · {op.visita.unidade}
                    </dd>
                  </div>
                )}
                <div>
                  <dt>Tipo</dt>
                  <dd>{op.tipo === "rematricula" ? "Rematrícula" : "Captação"}</dd>
                </div>
              </dl>
            </Secao>
          )}
          <Secao titulo="Tarefas">
            <div class="linhas">
              {tarefas.map((t) => (
                <ItemTarefa key={t.id} id={t.id} />
              ))}
            </div>
            <form
              class="nota-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (resultado(loja.executar((b, a, ag) => acao.criarTarefaCrm(b, a, { titulo: tarefa, prazo: new Date(`${prazoT}T17:00:00`).toISOString(), familiaId: id, oportunidadeId: op?.id }, ag)))) setTarefa("");
              }}
            >
              <label class="visualmente-oculto" for="t-novo">
                Nova tarefa
              </label>
              <input id="t-novo" placeholder="Próximo passo" value={tarefa} onInput={(e) => setTarefa(e.currentTarget.value)} />
              <label class="visualmente-oculto" for="t-prazo">
                Prazo
              </label>
              <input id="t-prazo" type="date" value={prazoT} onInput={(e) => setPrazoT(e.currentTarget.value)} />
              <Botao type="submit" pequeno>
                Criar
              </Botao>
            </form>
          </Secao>
        </div>
      </div>
      <JanelaPerda id={perda} aoFechar={() => setPerda(null)} />
      <JanelaVisita id={visita} aoFechar={() => setVisita(null)} />
      <JanelaMatricula id={matricula} aoFechar={() => setMatricula(null)} />
    </div>
  );
}

function ItemTarefa({ id, comFamilia }: { id: string; comFamilia?: boolean }) {
  const { banco, agora } = useLoja();
  const t = banco.tarefasCrm.find((x) => x.id === id)!;
  const f = t.familiaId ? familia(banco, t.familiaId) : undefined;
  const atrasada = !t.concluidaEm && t.prazo < agora.toISOString();
  return (
    <div class={`linha tarefa-crm${t.concluidaEm ? " tarefa-crm--feita" : ""}`}>
      <input type="checkbox" checked={!!t.concluidaEm} aria-label={`Concluir: ${t.titulo}`} onChange={() => resultado(loja.executar((b, a, ag) => acao.concluirTarefaCrm(b, a, t.id, ag)))} />
      <span class="linha__principal">
        <span class="linha__titulo">{t.titulo}</span>
        <span class="linha__meta">
          {comFamilia && f && (
            <>
              <a href={href("crm", "familias", f.id)}>{f.nome}</a> ·{" "}
            </>
          )}
          {nomeDe(banco, t.responsavelId)}
        </span>
      </span>
      <span class={atrasada ? "erro-texto" : "suave"}>{t.concluidaEm ? `feita ${quando(t.concluidaEm, agora)}` : prazo(t.prazo, agora)}</span>
    </div>
  );
}

/* ---------- tarefas ---------- */

function Tarefas() {
  const { banco, eu, agora } = useLoja();
  const [so, setSo] = useState<"meus" | "todos">("meus");
  const fimHoje = new Date(agora);
  fimHoje.setHours(23, 59, 59);
  const lista = banco.tarefasCrm.filter((t) => !t.concluidaEm && (so === "todos" || t.responsavelId === eu!.id)).sort((a, b) => a.prazo.localeCompare(b.prazo));
  const atrasadas = lista.filter((t) => t.prazo < agora.toISOString());
  const hoje = lista.filter((t) => t.prazo >= agora.toISOString() && t.prazo <= fimHoje.toISOString());
  const depois = lista.filter((t) => t.prazo > fimHoje.toISOString());
  const bloco = (titulo: string, itens: typeof lista) =>
    itens.length > 0 && (
      <Secao titulo={`${titulo} (${itens.length})`}>
        <div class="linhas">
          {itens.map((t) => (
            <ItemTarefa key={t.id} id={t.id} comFamilia />
          ))}
        </div>
      </Secao>
    );
  return (
    <div class="pagina pagina--estreita">
      <Cabecalho titulo="Tarefas de relacionamento" sub="Retornos, confirmações de visita e envio de propostas. Nenhuma família sem próximo passo." />
      <Abas rotulo="Responsável" ativa={so} aoMudar={setSo} abas={[{ id: "meus", rotulo: "Minhas" }, { id: "todos", rotulo: "Da equipe" }]} />
      {bloco("Atrasadas", atrasadas)}
      {bloco("Hoje", hoje)}
      {bloco("Próximas", depois)}
      {!lista.length && <Estado icone="ok" titulo="Nenhuma tarefa aberta." />}
    </div>
  );
}

/* ---------- relatórios ---------- */

function Relatorios() {
  const { banco } = useLoja();
  const r = resumoFunil(banco, ANO_CAPTACAO);
  const ops = banco.oportunidades.filter((o) => o.anoLetivo === ANO_CAPTACAO && o.tipo === "captacao");
  const porEstagio = ESTAGIOS.map((e) => ({ ...e, n: ops.filter((o) => o.estagio === e.id).length }));
  const max = Math.max(1, ...porEstagio.map((e) => e.n));
  const origens = ORIGENS.map((o) => {
    const fams = banco.familias.filter((f) => f.origem === o).map((f) => f.id);
    const daOrigem = ops.filter((x) => fams.includes(x.familiaId));
    return { o, total: daOrigem.length, ganhas: daOrigem.filter((x) => x.estagio === "matriculado").length };
  }).filter((x) => x.total);
  const motivos = Object.entries(
    ops.filter((o) => o.motivoPerda).reduce<Record<string, number>>((acc, o) => {
      const m = o.motivoPerda!.split(":")[0].replace(/\.$/, "");
      acc[m] = (acc[m] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const etapas = ETAPAS.map((e) => ({ e, n: ops.filter((o) => !["perdido"].includes(o.estagio) && candidatosDe(banco, o).some((c) => c.etapa === e.id)).length }));

  return (
    <div class="pagina">
      <Cabecalho titulo={`Relatórios da captação ${ANO_CAPTACAO}`} sub="Calculados das oportunidades cadastradas. Rematrículas ficam fora destes números." />
      <div class="numeros">
        <Numero valor={r.total} rotulo="famílias no funil" />
        <Numero valor={r.conversao === null ? "–" : `${Math.round(r.conversao * 100)}%`} rotulo="conversão das fechadas" detalhe={`${r.ganhas} matrículas, ${r.perdidas} perdidas`} />
        <Numero valor={reais(r.receitaAberta)} rotulo="mensalidades em negociação" />
        <Numero valor={reais(r.receitaGanha)} rotulo="mensalidades conquistadas" tom="ok" />
      </div>
      <div class="grade-2">
        <Secao titulo="Famílias por estágio">
          <ul class="barras" role="list">
            {porEstagio.map((e) => (
              <li key={e.id}>
                <span class="barras__rotulo">{e.rotulo}</span>
                <span class="barras__trilho">
                  <span class={`barras__valor barras__valor--${e.id}`} style={{ width: `${(e.n / max) * 100}%` }} />
                </span>
                <span class="barras__n">{e.n}</span>
              </li>
            ))}
          </ul>
        </Secao>
        <Secao titulo="Por origem">
          <table class="tabela">
            <thead>
              <tr>
                <th scope="col">Origem</th>
                <th scope="col">Famílias</th>
                <th scope="col">Matrículas</th>
              </tr>
            </thead>
            <tbody>
              {origens.map((o) => (
                <tr key={o.o}>
                  <th scope="row">{o.o}</th>
                  <td>{o.total}</td>
                  <td>{o.ganhas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Secao>
        <Secao titulo="Motivos de perda">
          {motivos.length ? (
            <ul class="barras" role="list">
              {motivos.map(([m, n]) => (
                <li key={m}>
                  <span class="barras__rotulo">{m}</span>
                  <span class="barras__trilho">
                    <span class="barras__valor barras__valor--perdido" style={{ width: `${(n / motivos[0][1]) * 100}%` }} />
                  </span>
                  <span class="barras__n">{n}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p class="suave">Nenhuma perda registrada.</p>
          )}
        </Secao>
        <Secao titulo="Interesse por etapa">
          <ul class="barras" role="list">
            {etapas.map(({ e, n }) => (
              <li key={e.id}>
                <span class="barras__rotulo">{e.rotulo}</span>
                <span class="barras__trilho">
                  <span class="barras__valor" style={{ width: `${(n / Math.max(1, ...etapas.map((x) => x.n))) * 100}%` }} />
                </span>
                <span class="barras__n">{n}</span>
              </li>
            ))}
          </ul>
        </Secao>
      </div>
    </div>
  );
}

export { ir, plural, dataHora, Linha };
