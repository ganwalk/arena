import type { ComponentChildren } from "preact";
import { disciplina, MEDIA_APROVACAO, nomeDe, notasDoAluno, type SituacaoTarefa } from "../dominio/regras";
import type { Aviso, Banco, Papel } from "../dominio/tipos";
import { Avatar, Botao, Icone, Selo, type Tom } from "./base";
import { data, dataHora, nota, quando } from "./formato";

export const SITUACAO: Record<SituacaoTarefa, { rotulo: string; tom: Tom }> = {
  pendente: { rotulo: "Para entregar", tom: "acao" },
  atrasada: { rotulo: "Atrasada", tom: "perigo" },
  enviada: { rotulo: "Entregue", tom: "ok" },
  "enviada-com-atraso": { rotulo: "Entregue com atraso", tom: "alerta" },
  conferida: { rotulo: "Conferida", tom: "ok" },
  devolvida: { rotulo: "Refazer", tom: "alerta" },
};

/** Atalhos para os serviços que continuam fora da plataforma, sempre marcados como externos. */
export function Servicos({ banco, papel }: { banco: Banco; papel: Papel }) {
  const lista = banco.servicos.filter((s) => s.ativo && s.publico.includes(papel));
  if (!lista.length) return null;
  return (
    <ul class="servicos" role="list">
      {lista.map((s) => (
        <li key={s.id}>
          <a class="servico" href={s.url} target="_blank" rel="noopener noreferrer">
            <span>
              <span class="servico__nome">{s.nome}</span>
              <span class="servico__desc">{s.descricao}</span>
            </span>
            <span class="servico__externo">
              Abre fora <Icone nome="externo" tamanho={14} />
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function ItemAviso({
  banco,
  aviso,
  agora,
  extra,
  ciencia,
}: {
  banco: Banco;
  aviso: Aviso;
  agora: Date;
  extra?: ComponentChildren;
  ciencia?: { dada: boolean; aoDar: () => void };
}) {
  return (
    <article class="aviso">
      <div class="aviso__topo">
        <Selo tom={aviso.categoria === "Saúde" ? "alerta" : aviso.categoria === "Evento" ? "acao" : "neutro"}>{aviso.categoria}</Selo>
        <span class="aviso__quando">{quando(aviso.publicadoEm, agora)}</span>
      </div>
      <h3 class="aviso__titulo">{aviso.titulo}</h3>
      <p class="aviso__corpo">{aviso.corpo}</p>
      <p class="aviso__autor">
        <Avatar id={aviso.autorId} nome={nomeDe(banco, aviso.autorId)} tamanho={22} />
        {nomeDe(banco, aviso.autorId)}
        {extra}
      </p>
      {ciencia &&
        (ciencia.dada ? (
          <p class="aviso__ciencia">
            <Icone nome="ok" tamanho={16} /> Ciência registrada
          </p>
        ) : (
          <Botao pequeno icone="ok" onClick={ciencia.aoDar}>
            Estou ciente
          </Botao>
        ))}
    </article>
  );
}

export function TabelaNotas({ banco, alunoId }: { banco: Banco; alunoId: string }) {
  const linhas = notasDoAluno(banco, alunoId);
  if (!linhas.length) return <p class="suave">Nenhuma nota lançada ainda.</p>;
  const periodos = [...new Set(linhas.flatMap((l) => l.notas.map((n) => n.periodo)))].sort();
  const ultima = linhas.flatMap((l) => l.notas).sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm))[0];
  return (
    <>
      <div class="tabela-rolagem">
        <table class="tabela tabela--notas">
          <caption class="visualmente-oculto">Notas por disciplina e bimestre</caption>
          <thead>
            <tr>
              <th scope="col">Disciplina</th>
              {periodos.map((p) => (
                <th scope="col" key={p}>
                  {p.replace(" bimestre", " bim.")}
                </th>
              ))}
              <th scope="col">Média</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.disciplinaId}>
                <th scope="row">{disciplina(banco, l.disciplinaId)?.nome}</th>
                {periodos.map((p) => {
                  const n = l.notas.find((x) => x.periodo === p);
                  return (
                    <td key={p} class={n && n.valor < MEDIA_APROVACAO ? "abaixo" : undefined}>
                      {n ? nota(n.valor) : <span class="suave" aria-label="sem nota">–</span>}
                    </td>
                  );
                })}
                <td class={`media${l.media < MEDIA_APROVACAO ? " abaixo" : ""}`}>{nota(l.media)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p class="fonte">
        Fonte: {ultima.origem}. Atualizado em {data(ultima.atualizadoEm)}. Média para aprovação: {MEDIA_APROVACAO},0. Notas em
        vermelho estão abaixo dela.
      </p>
    </>
  );
}

export function Linha({ children, href, destaque }: { children: ComponentChildren; href?: string; destaque?: boolean }) {
  const cls = `linha${destaque ? " linha--destaque" : ""}`;
  return href ? (
    <a class={cls} href={href}>
      {children}
      <Icone nome="seta" tamanho={18} />
    </a>
  ) : (
    <div class={cls}>{children}</div>
  );
}

export { dataHora };
