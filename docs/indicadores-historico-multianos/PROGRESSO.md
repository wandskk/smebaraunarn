# Progresso — Observação Multi-Ano nos Indicadores + Avaliações do Município

**Última atualização:** 2026-09-10 (ETAPA 01 concluída — aguardando autorização
para iniciar a ETAPA 02)

Este arquivo é a fonte de verdade sobre qual etapa está pendente, em
andamento ou concluída. Ao final de cada etapa, atualizar esta tabela junto
com o Markdown correspondente em `etapas/`.

## Estado geral

| Etapa | Nome | Status | Concluída em |
|---|---|---|---|
| 00 | Fonte única de "anos letivos disponíveis" | **DONE** | 2026-09-10 |
| 01 | Corrigir contagem de população histórica | **DONE** | 2026-09-10 |
| 02 | Seletor de ano persistente (URL + cookie) | PENDENTE | |
| 03 | Componente de gráfico de evolução histórica | PENDENTE | |
| 04 | Queries de evolução histórica por indicador | PENDENTE | |
| 05 | Rollout: Frequência e Aprendizagem | PENDENTE | |
| 06 | Rollout: Fluxo-Trajetória e Comparativos | PENDENTE | |
| 07 | Rollout: Portal da Direção | PENDENTE | |
| 08 | Nova página `/admin/indicadores/avaliacoes` | PENDENTE | |
| 09 | Atualizar a Central (`/admin/indicadores`) | PENDENTE | |
| 10 | Validação final e fechamento | PENDENTE | |

## Resumo da ETAPA 00

Nova `getAnosLetivosDisponiveis(scope?: {escolaId})` em
`lib/queries/anos-letivos.ts`, combinando `DISTINCT ano` de `NotaEstudante` e
`Avaliacao` com o ano extraído de `FrequenciaEstudante.data` (reduzido em
memória, sem SQL cru). Substituiu `prisma.estudante.groupBy({by:["ano"]})` em
10 páginas: `app/admin/indicadores/page.tsx`, `aprendizagem/page.tsx`,
`frequencia/page.tsx`, `comparativos/page.tsx`, `fluxo-trajetoria/page.tsx`,
`app/portal/direcao/page.tsx`, `app/admin/escolas/[id]/page.tsx`,
`app/admin/page.tsx`, `app/admin/turmas/page.tsx`, `app/admin/estudantes/page.tsx`.
(`app/admin/avaliacoes/page.tsx` e `app/portal/aluno/boletim/page.tsx` já
derivavam anos corretamente de `Avaliacao`/`NotaEstudante` próprios — não
precisaram de alteração.) Imports de `prisma` removidos nos 5 arquivos onde
ficaram sem outro uso.

Com o dataset atual, a nova fonte retornou a mesma lista que a antiga
(`[2026, 2025, 2024]` nos dois casos) — o problema de "anos que somem da
lista" é uma condição de borda que ainda não se manifestou nos dados de hoje,
mas a fonte antiga continuava estruturalmente errada (dependia de
`Estudante.ano`, um snapshot sobrescrito) e agora está corrigida na raiz.

**Achado quantificado nesta etapa (vira a ETAPA 01):** comparando
`prisma.estudante.count({where:{ano}})` (fonte ingênua, hoje usada em
`getIndicadoresGeraisRede`) com `resolverMatriculaPorAno(ano).size` (fonte
correta, já usada para distorção na mesma função) com o banco real:

| Ano | Contagem ingênua | Contagem correta | Subcontagem |
|---|---|---|---|
| 2024 | 737 | 2088 | ~65% |
| 2025 | 608 | 1933 | ~68% |
| 2026 (corrente) | 3936 | 3936 | 0% |

Confirma que `totalEstudantes`/`escolasAtivas`/`totalTurmas` da Central estão
fortemente errados para qualquer ano histórico hoje — invisível até agora
porque nenhuma página deixava o usuário escolher um ano histórico de
propósito.

## Testes executados

```bash
npm test        # 263/263
npm run typecheck  # sem erros
npm run lint       # sem warnings/erros
npm run build      # sucesso, 63 rotas
```

Verificação adicional: script temporário (`npx tsx --conditions=react-server`)
comparando fonte antiga vs. nova diretamente no Postgres local, removido após
uso (não fica no repositório).

## Critério de pronto

- [x] `getAnosLetivosDisponiveis` criada e testada contra o banco real.
- [x] As 10 páginas afetadas migradas, sem import não usado sobrando.
- [x] `npm test`/`typecheck`/`lint`/`build` passam.
- [x] Bug da ETAPA 01 quantificado com dado real (não só suspeitado).

## Resumo da ETAPA 01

`resolverMatriculaPorAno` (`lib/queries/distorcao.ts`) generalizado para
`resolverMatriculaPorAnos(anos[])`, batchando as 3 consultas
independentes-de-ano (estudantes, escolas, turma→série) uma única vez para N
anos; a versão de 1 ano virou wrapper fino. `getIndicadoresGeraisRede`
corrigido para derivar `totalEstudantes`/`escolasAtivas`/`totalTurmas` do
mesmo mapa já usado para distorção, eliminando a segunda fonte de verdade.
Confirmado com dado real: `totalEstudantes` de 2024 subiu de 737 → **2088**,
2025 de 608 → **1933** (2026, ano corrente, permanece em 3936 — sem
mudança). Revisão adversarial (4 dimensões + verificação independente de
cada achado) encontrou 1 risco real (moderado): `escolasAtivas` passou a
depender de match exato de nome de escola, sem normalização nem sinal
visível de falha — corrigido com `.trim()` nos dois lados da comparação;
risco residual de nome divergente (acentuação/renomeação futura) documentado
e aceito, sem impacto no dataset atual. `npm test` (263/263),
`typecheck`/`lint`/`build` seguem limpos após o fix. Detalhe completo em
[`etapas/01-corrigir-contagem-populacao-historica.md`](etapas/01-corrigir-contagem-populacao-historica.md).

## Próximo passo permitido

ETAPA 02 — aguardando autorização explícita do usuário.
