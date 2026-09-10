# ETAPA 01 — Corrigir contagem de população histórica

## Status
DONE

## Objetivo

Fazer `totalEstudantes`/`escolasAtivas`/`totalTurmas` (em
`getIndicadoresGeraisRede`) usarem a mesma fonte de verdade histórica que a
distorção idade-série já usa **dentro da mesma função**, para qualquer ano
selecionado — não só o ano corrente.

## Por que esta etapa existe

Achado na ETAPA 00, quantificado com dado real: `getIndicadoresGeraisRede`
contava população via `prisma.estudante.findMany({where:{ano:anoLetivo}})`
(ingênuo — `Estudante.ano` é só o snapshot mais recente de cada aluno),
enquanto a distorção, na mesma função, já usava `resolverMatriculaPorAno`
(correto — nota do ano, senão snapshot só se `Estudante.ano === anoLetivo`).
Isso subcontava a população de anos históricos em ~65-70%.

## Escopo desta etapa

1. Generalizar `resolverMatriculaPorAno(ano)` → `resolverMatriculaPorAnos(anos[])`
   em `lib/queries/distorcao.ts`, batchando as consultas independentes de ano
   (todos os estudantes, todas as escolas, mapa turma→série) uma única vez
   para N anos.
2. Corrigir `getIndicadoresGeraisRede` para derivar
   `totalEstudantes`/`escolasAtivas`/`totalTurmas` do mesmo mapa resolvido já
   usado para distorção, eliminando a segunda fonte de verdade.
3. Verificar a correção com dado real do banco local.
4. Rodar revisão adversarial (4 dimensões independentes) sobre o diff antes
   de fechar a etapa, dado que é uma correção de bug em produção.

## Fora de escopo

- Seletor de ano na UI (ETAPA 02).
- Qualquer gráfico de evolução (ETAPA 03+).
- Construir infraestrutura nova de qualidade de dados para sinalizar nomes
  de escola não resolvidos (ver "Risco aceito" abaixo) — isso pertenceria a
  `lib/queries/qualidade-dados.ts`, fora do escopo desta correção pontual.

## Decisões técnicas

- **`resolverMatriculaPorAnos(anos)`** busca `Estudante` (tabela inteira,
  sem `where` — já era assim antes, é o snapshot atual de todo mundo),
  `Escola` (tabela inteira) e `getSeriePorTurma` **uma única vez**,
  independente de quantos anos forem pedidos — só `NotaEstudante` é
  filtrada por ano, com `where: {ano: {in: anos}}, distinct:
  ["estudanteMatricula", "ano"]` numa única query. Resolve por ano em
  memória a partir desses 3 conjuntos. Chamar isto num loop `anos.map(a =>
  resolverMatriculaPorAno(a))` reintroduziria o N+1 que esta etapa existe
  para evitar — documentado como comentário na própria função.
- **`resolverMatriculaPorAno(ano)`** vira wrapper fino:
  `(await resolverMatriculaPorAnos([ano])).get(ano) ?? new Map()`. Mesma
  assinatura e mesmo comportamento — os 3 chamadores existentes
  (`getDistorcaoPorEscolaESerie`, `getFrequenciaPorEscola`,
  `getIndicadoresGeraisRede`) não precisaram de nenhuma outra mudança.
- **Novo campo `turma`** em `MatriculaResolvida` (código interno da turma,
  ex. "EFAFM6A" — resolvido da nota do ano ou do snapshot atual, mesma regra
  de precedência do resto do objeto), necessário porque `totalTurmas` não
  pode ser derivado de `serieTexto` (série ≠ turma — `NotaEstudante.serie` e
  `NotaEstudante.turma` são colunas distintas no schema). Campo aditivo, não
  quebra os 2 chamadores que não o usam.
- **`getIndicadoresGeraisRede`**: `resolverMatriculaPorAno(anoLetivo)` agora
  é chamado uma única vez (antes: duas — uma vez implícito para população,
  outra explícito para distorção) e reaproveitado para os dois blocos.

## Revisão adversarial (antes de fechar a etapa)

4 agentes independentes revisaram o diff (corretude do batching,
N+1/performance, regressão nos 3 chamadores, integridade de dados),
seguidos de verificação adversarial de cada achado por um agente separado,
cético por padrão. Resultado: **1 achado confirmado (moderado)**, 2
descartados como falso-positivo após verificação independente.

**Achado confirmado e corrigido:** `escolasAtivas` passou a depender de
correspondência exata de string entre `NotaEstudante.escola` (nome livre,
importado do SIGEduc) e `Escola.nome` — antes vinha de `Estudante.escolaId`,
uma FK obrigatória que nunca falha. Um nome com espaço em branco extra
falharia silenciosamente (o aluno some da contagem, sem log/sinal, ao
contrário de `getDistorcaoPorEscolaESerie`, que já bucketiza esse mesmo caso
como "Escola não identificada" — visível). No dataset atual isso não causa
nenhuma contagem errada (os 21 nomes distintos de `escola` batem
exatamente), mas era um risco latente. **Corrigido** com `.trim()` nos dois
lados da comparação (`lib/queries/distorcao.ts`) — mitiga a causa mais
provável (espaço em branco de importação) sem mudar nenhum resultado do
dataset atual (reverificado após o fix: números idênticos).

**Risco aceito, não corrigido nesta etapa:** a correspondência continua
sendo por nome exato (mesmo com trim), sem normalização de acentuação/caixa,
e sem nenhum contador visível se uma escola renomeada/nova causar uma falha
de match no futuro. Construir essa visibilidade pertence a
`lib/queries/qualidade-dados.ts` (que já existe exatamente para esse tipo de
sinal) — não faz parte do escopo desta correção pontual e não há evidência
de que já esteja acontecendo. Registrado aqui para retomar se um dia os
números de `escolasAtivas` parecerem baixos sem explicação.

**Achados descartados (falso-positivo, confirmado por verificação
independente):** equivalência dos 3 chamadores existentes com o novo
batching (nenhum depende de ordem de iteração do Map nem quebra com o campo
`turma` adicional) e ausência de N+1 residual (nenhuma query nem
`getSeriePorTurma` roda mais de 1 vez por chamada, independente de quantos
anos).

## Verificação com dado real (Postgres local)

| Ano | `totalEstudantes` (antes) | `totalEstudantes` (depois) | `escolasAtivas` | `totalTurmas` |
|---|---|---|---|---|
| 2024 | 737 | **2088** | 26 | 104 |
| 2025 | 608 | **1933** | 28 | 123 |
| 2026 (corrente) | 3936 | 3936 | 28 | 139 |

Confirmado também, byte a byte: `resolverMatriculaPorAno(ano)` produz
exatamente o mesmo resultado que `resolverMatriculaPorAnos([ano]).get(ano)`
para os 3 anos — a refatoração não alterou nenhum comportamento existente,
só corrigiu a fonte usada por `getIndicadoresGeraisRede`.

## Testes executados

```bash
npm test        # 263/263
npm run typecheck  # sem erros
npm run lint       # sem warnings/erros
npm run build      # sucesso, 63 rotas
```

Scripts de verificação (`tsx` temporários) comparando fonte antiga vs. nova
e confirmando a equivalência singular/plural, removidos após uso.

## Critério de pronto

- [x] `resolverMatriculaPorAnos` batchando corretamente, sem N+1.
- [x] `resolverMatriculaPorAno` preservado como wrapper, sem mudança de
      comportamento para os 3 chamadores existentes.
- [x] `getIndicadoresGeraisRede` corrigido — subcontagem de 2024/2025
      eliminada, confirmada com dado real.
- [x] Revisão adversarial executada; achado real corrigido, achados
      descartados verificados independentemente.
- [x] `npm test`/`typecheck`/`lint`/`build` passam.

## Próximo passo permitido

ETAPA 02 — aguardando autorização explícita do usuário.
