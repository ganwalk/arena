# Plataforma Arena: protótipo de alta fidelidade

Um só endereço (`/plataforma/`), cinco portais: **Aluno**, **Professor**, **Família**, **Gestão** e **Captação (CRM)**. Fica no mesmo deploy da landing. Quem tem mais de um papel troca de portal pela barra de cima (ou com `Alt+1…5`) sem sair da conta.

Todas as telas funcionam com dados fictícios. As ações (publicar, entregar, entrar na fila, matricular…) passam pelas mesmas regras de permissão que o backend vai usar, então o protótipo serve para teste de uso e também como especificação para a construção.

## Endereços e o fluxo único

| Endereço | O que é |
|---|---|
| `/` | Página inicial da Plataforma Arena: o fluxo em sete etapas, “uma ação, várias telas”, os módulos com telas reais e o antes e depois. Cada etapa abre o protótipo já como a pessoa certa (`/plataforma/?como=u-marcos#/crm`). |
| `/site/` | Site de captação do colégio (a landing). É a etapa 1: o formulário “Agende uma visita” chama `pedirVisitaPeloSite`, que cria família, contato, criança, oportunidade e tarefa de retorno no funil do relacionamento. Depois do envio, um link leva ao contato no CRM. |
| `/plataforma/` | Os cinco portais. |

As imagens de produto da página inicial (`public/plataforma/telas/`) são capturas do próprio protótipo, nos dois temas. Para regenerar depois de mudar as telas, capture de novo com o servidor rodando (1280 × 800 para computador, 390 × 780 para celular).

## Como abrir

```sh
npm run dev      # http://localhost:4321/plataforma/
npm test         # regras e critérios de aceite (vitest)
```

Na entrada, escolha uma pessoa. No menu da pessoa (canto superior direito) dá para:

- **Ver como** outra persona, sem sair;
- **Simular estados**: sem conexão e sessão expirada;
- **Restaurar dados** para a semente original.

Os dados ficam no `localStorage` do navegador e são compartilhados entre abas. Com o aluno numa aba e o professor em outra, a fila do plantão e as entregas aparecem nas duas.

### Personas

| Pessoa | Papel | Portais | Bom para mostrar |
|---|---|---|---|
| Lucas Andrade | Aluno, 3ª série A | Aluno | Materiais, plantão em grupo, notas |
| Marina Martins | Aluna, 1ª série B | Aluno | Tarefa com foto pelo celular e comprovante |
| Theo Martins | Aluno, 5º ano A | Aluno | Fundamental I |
| Cláudia Martins | Mãe de Marina e Theo | Família | Dois filhos, ciência de avisos, atendimento com prazo |
| Rafael Nunes | Professor de História **e** pai do Gabriel | Professor, Família | Troca de portal; publicar; rascunho |
| Beatriz Lima | Professora de Biologia | Professor | Fila do plantão ao vivo |
| Sérgio Prado | Professor de Matemática | Professor | Material retirado, link de vídeo |
| Fernanda Alves | Coordenação do Médio | Gestão | Painel, retirada com justificativa, avisos |
| Juliana Reis | Secretaria | Gestão, Captação | Atendimento, vínculos e **matrícula** |
| Paula Siqueira | Direção | Gestão, Captação | Visão geral e funil |
| Marcos Teixeira | Relacionamento | Captação | Funil e tarefas |

## Interface

- **Cor pontual.** A base é neutra (grafite, cinzas frios, branco). O petróleo da marca aparece só na ação principal de cada tela, nos links, no foco do teclado e no marcador da seção ativa. Verde, âmbar e vermelho só indicam estado: um ponto no selo ou um número que exige atenção, sempre com texto ao lado. Nada depende só de cor.
- **Claro e escuro.** Tokens semânticos em `plataforma.css` (`--fundo`, `--sup`, `--texto`, `--linha`, `--acao`…), com tema escuro próprio, não uma inversão. Segue o sistema por padrão; o botão de sol/lua na barra e o menu da pessoa (“Aparência”) fixam claro, escuro ou automático. A escolha é aplicada antes da primeira pintura, sem piscar.
- **Pessoas com rosto.** Retratos de exemplo do Pexels (licença livre), guardados em `public/plataforma/pessoas/` com a lista de origem em `CREDITOS.md`. Sem foto, o avatar mostra as iniciais em cinza. Em produção, a foto vem do cadastro da escola, com a autorização devida; os retratos de exemplo não devem ir para o ar.
- **Acessibilidade.** Alvos de toque de 44 px, foco visível, rótulos em todos os campos, estados anunciados (`aria-live`), navegação por teclado, contraste AA nos dois temas e `prefers-reduced-motion`.

## Dores observadas e o que cada portal responde

Referências E01–E24 são do dossiê (`Dossie_Arena_Equipe.pdf`, A8).

| Dor | Hoje | Na plataforma |
|---|---|---|
| Material do professor em vários canais; HD Virtual travado (E10–E12, E16) | P+ HD Virtual, WhatsApp, AirDrop, QR code, papel | Professor publica uma vez para várias turmas; aluno encontra por disciplina e tema e abre no celular. Estados claros para retirado, sem permissão e arquivo indisponível |
| Tarefa exigia passar fotos para o computador (E22) | Foto da lista, foto da resolução, computador, P+ | “Tirar foto” direto no celular, progresso por arquivo, envio só com tudo pronto, comprovante com protocolo |
| Plantão em site à parte, sem saber a posição (E06–E08) | Site Plantões Arena | Fila no mesmo app, individual ou em grupo, dúvida opcional, posição ao vivo; professor chama o próximo |
| Notas num app, simulados noutro (E03, E17–E19) | EduConnect + Evolucional | Boletim com fonte e data de atualização; simulados como atalho externo rotulado |
| WhatsApp pessoal do professor sem resposta (E20) | Contato informal | “Fale com a escola”: protocolo, setor, prazo de resposta e histórico. Gestão vê o que venceu |
| Avisos sem confirmação de leitura (E04) | Feed do EduConnect | Aviso por turma ou escola, para alunos e/ou famílias, com ciência opcional e adesão medida |
| Muitas entradas diferentes (E02, E23) | 4+ acessos | Um login, portais por papel, atalhos externos marcados “Abre fora” |
| Captação sem registro | Formulário de WhatsApp na landing | CRM com funil de matrícula, famílias, tarefas, motivos de perda e matrícula que cria os acessos |

## Mapa de telas

**Aluno** (celular primeiro): Início · Materiais (lista, filtro, busca, detalhe, leitor) · Tarefas (lista, entrega com foto, comprovante, reenvio) · Plantões (fila individual/grupo, posição, próximos dias) · Notas · Avisos e agenda.

**Professor**: Hoje · Materiais (publicados/rascunhos/retirados; publicar com revisão dos destinatários; corrigir com nova versão; retirar com motivo; histórico) · Tarefas (nova tarefa; entregas por aluno; conferir ou devolver) · Plantão (fila ao vivo, chamar próximo, escala) · Avisos (para as próprias turmas, com ciência) · Turmas (situação das tarefas por aluno).

**Família**: Resumo por filho · Avisos (com ciência) · Notas · Tarefas (acompanhamento) · Agenda · Fale com a escola (nova solicitação, conversa, prazos por setor). Seletor de filho quando há mais de um.

**Gestão**: Painel (materiais na semana, entrega no prazo, plantão, atendimento vencido, ciência dos avisos, alunos para acompanhar) · Turmas e pessoas (busca, vínculos, mudar turma, saída) · Atendimento (fila por prazo) · Avisos (escola ou turmas) · Materiais (retirar com justificativa) · Plantões (escala e movimento) · Serviços externos (catálogo de atalhos) · Auditoria.

**Captação (CRM)**: Funil kanban (arrastar ou “Mover para”, filtros por etapa e responsável, alertas de tarefa vencida e de oportunidade parada) · Novo contato (família, contato, uma ou mais crianças) · Família (linha do tempo, contatos com WhatsApp, crianças, oportunidade, tarefas, agendar visita, perdido com motivo, matricular) · Tarefas (atrasadas, hoje, próximas) · Relatórios (por estágio, origem, motivo de perda, etapa).

### Estados cobertos

Lista vazia · filtro sem resultado · envio em andamento · arquivo recusado (formato, tamanho, extensão falsa) · falha de rede no envio com “tentar de novo” · sem conexão (nada é salvo) · sessão expirada · material retirado (com motivo) · material de outra turma · material inexistente · arquivo indisponível · link externo · prazo vencido · reenvio bloqueado · plantão encerrado · sem plantão hoje · responsável sem filho vinculado · ação sem permissão (ex.: comercial tentando matricular).

## Por que não um fork do Relaticle

O Relaticle foi a referência de modelo e de experiência do CRM (Company → Família, People → Contato, Opportunity → Oportunidade, Tasks, Notes, funil em kanban). O código não foi incorporado porque:

1. **Licença AGPL-3.0.** Um serviço de rede derivado dele obriga a oferecer o código-fonte completo aos usuários (incluindo a escola e as famílias). Para uma solução vendida ao colégio, isso precisa ser uma decisão comercial consciente, não um efeito colateral.
2. **Pilha diferente.** Laravel 13, Filament 5 e PHP 8.5, com Horizon, Reverb e Postgres. A landing e os outros quatro portais estão em TypeScript; juntar tudo exigiria dois runtimes no mesmo deploy.
3. **Escopo.** É um CRM de vendas multiempresa (workspaces, cobrança, IA, MCP). O funil escolar precisa de família com várias crianças, visita agendada, rematrícula e a passagem para aluno matriculado.

Se a equipe preferir Filament, o desenho de domínio aqui (entidades, regras, ações) se traduz direto para Models, Policies e Actions do Laravel.

## Pronto para construir: como o código está organizado

```
src/plataforma/
  dominio/            ← vira o backend
    tipos.ts          entidades (tabelas)
    regras.ts         leitura e permissão (policies)
    acoes.ts          mudanças, com validação e auditoria (rotas/serviços)
    semente.ts        dados fictícios (seed)
    regras.test.ts    critérios de aceite do dossiê (P03–P05)
  estado/
    loja.ts           banco local + rotas por hash  ← trocar por chamadas à API
    arquivos.ts       IndexedDB                      ← trocar por bucket privado com URL temporária
  ui/                 componentes (botão, estado vazio, janela, envio de arquivos, leitor…)
  portais/            Aluno, Professor, Pais, Gestao, Crm
  App.tsx             casca: barra, troca de portal e de pessoa
  plataforma.css      tema (tokens da landing)
src/pages/plataforma/index.astro
```

`dominio/` não depende de navegador nem de Preact. A troca para produção é:

1. Cada função de `acoes.ts` vira uma rota (`POST /api/materiais`, `POST /api/entregas`…). O servidor carrega o estado necessário do banco, chama a mesma função e grava o resultado numa transação. A assinatura `(banco, atorId, dados, agora) → Resultado` já isola quem age e o relógio.
2. As consultas de `regras.ts` viram as rotas de leitura e as políticas de acesso. `acessoMaterial` é revalidada a cada abertura de arquivo antes de emitir a URL temporária.
3. `loja.executar` passa a fazer `fetch`; a interface não muda.
4. `tipos.ts` vira o esquema. Ex.: `Material.historico` → tabela `material_versions`; `Material.turmaIds` → `material_audiences` (mesmo desenho do dossiê, B9).

### Ações (futuros endpoints)

| Área | Ações |
|---|---|
| Materiais | `criarMaterial` (com chave idempotente), `editarRascunho`, `corrigirMaterial` (nova versão, nota obrigatória), `retirarMaterial` (motivo obrigatório), `excluirRascunho` |
| Tarefas | `criarTarefa`, `enviarEntrega` (chave idempotente, só com anexos prontos, protocolo), `avaliarEntrega` (conferir/devolver) |
| Plantão | `entrarNaFila` (grupo numa posição), `sairDaFila` (sai só quem pediu), `chamarProximo` |
| Comunicação | `publicarAviso` (escola só pela coordenação/secretaria), `darCiencia` |
| Atendimento | `abrirSolicitacao` (só sobre o próprio filho; prazo por setor em dias úteis), `responderSolicitacao` |
| Gestão | `moverAluno` (encerra vínculo e abre outro), `alternarServico`, `salvarServico` |
| CRM | `criarLead`, `moverOportunidade` (perda exige motivo), `agendarVisita`, `anotarCrm`, `criarTarefaCrm`, `concluirTarefaCrm`, `matricular` (cria aluno, responsável e vínculos) |

### Matriz de acesso implementada

| Papel | Pode | Não pode |
|---|---|---|
| Aluno | Ver materiais, tarefas e avisos das turmas com vínculo vigente; entregar; entrar na fila | Abrir material de outra turma, mesmo pelo endereço; ver entregas de colegas |
| Professor | Publicar, passar tarefa e avisar só nas turmas/disciplinas em que ensina; corrigir e retirar o que é seu; conferir entregas das suas tarefas; chamar a própria fila | Publicar em outra turma ou disciplina; editar material de colega |
| Responsável | Ver avisos, notas, tarefas e agenda dos filhos com vínculo ativo; abrir solicitações sobre eles | Ver qualquer aluno sem vínculo explícito |
| Coordenação | Tudo da gestão; retirar qualquer material com justificativa; avisos para a escola | Matricular (secretaria) |
| Secretaria | Gestão, CRM e matrícula | — |
| Comercial | CRM | Matricular; gestão escolar |

## O que falta para produção

Na ordem do dossiê (B6, P10), depois da validação com a escola em 7/10:

- **Backend**: Postgres + armazenamento privado de arquivos; autenticação (com MFA para quem administra); as ações acima como rotas transacionais.
- **Cadastro real**: importação de turmas, alunos, professores e responsáveis (CSV no piloto), com rotina de atualização e saída.
- **Notificações**: push/e-mail para aviso novo, tarefa, chamada no plantão e resposta de atendimento.
- **Integrações**: os serviços externos ficam como atalhos (nível 1). Integração de notas e simulados só com documentação e autorização dos fornecedores (D05).
- **Landing → CRM**: o formulário “Agende uma visita” passa a criar o contato no funil além de abrir o WhatsApp.
- **LGPD e ECA Digital**: registro de finalidades, retenção e responsáveis antes de usar dados reais (B5).
- **Decisões abertas**: endereços dos serviços externos, mensalidades usadas nas estimativas do CRM e prazos de resposta por setor são valores de exemplo, a confirmar com o colégio.
