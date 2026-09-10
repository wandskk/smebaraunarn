# Observação Multi-Ano nos Indicadores + Avaliações do Município

Este diretório é o rastreador de trabalho do roadmap iniciado em 2026-09-10,
depois de uma sincronização histórica do SIGEduc (2024-2026): dar suporte, em
todas as páginas de indicadores, a observar/comparar anos anteriores com
gráfico de evolução, com um seletor de ano (único, múltiplos, ou "todos os
anos") que **persiste ao navegar entre páginas** — e criar um indicador de
Avaliações do Município que hoje não existe como KPI de verdade.

Não pertence a nenhum dos 4 roadmaps anteriores (`docs/PLANO_DESENVOLVIMENTO.md`,
`docs/plano-evolucao-sme/`, `docs/redesign-visual/`, `docs/mvp-indicadores-inteligentes/`)
— todos estavam `DONE` quando este trabalho começou. O plano completo (contexto,
decisões técnicas, riscos) está em
`C:\Users\wande\.claude\plans\purrfect-launching-dahl.md`.

## Como este diretório está organizado

```text
indicadores-historico-multianos/
├── README.md      este arquivo
├── PROGRESSO.md    estado atual de cada etapa (00-10)
└── etapas/         1 arquivo por etapa, status vivo
```

## Regras de trabalho

1. Cada etapa só começa depois que a anterior está `DONE`.
2. Nenhuma etapa avança automaticamente para a próxima — a execução para ao
   final de cada uma e aguarda autorização explícita do usuário (mesmo regime
   de `docs/plano-evolucao-sme/`, escolhido pelo usuário em 2026-09-10 dado
   que a ETAPA 01 corrige um bug de contagem que afeta KPIs já em produção).
3. `PROGRESSO.md` é a fonte de verdade sobre qual etapa está pendente, em
   andamento ou concluída.

## Achado que motiva a ordem das etapas

A fonte de "anos letivos disponíveis" usada em ~10 páginas
(`prisma.estudante.groupBy({by:["ano"]})`) subestima os anos com dado real,
porque `Estudante.ano` é só o snapshot de matrícula mais recente de cada
aluno. Pior: `getIndicadoresGeraisRede` usa essa mesma fonte errada para
contar população de um ano histórico, enquanto a distorção idade-série na
mesma função já usa a resolução correta — números medidos na ETAPA 00
confirmaram uma subcontagem real de ~65% para 2024 (737 vs. 2088 estudantes)
e ~68% para 2025 (608 vs. 1933). Por isso a fundação (ETAPA 00-04) vem antes
de qualquer rollout de UI.
