# ETAPA 07 — Rollout: Portal da Direção

## Status
DONE

## Objetivo

Migrar a página inicial do Portal da Direção (`/portal/direcao`) para utilizar o seletor persistente `AnosLetivosFiltro` (ETAPA 02), escopado estritamente à escola vinculada ao Diretor escolar na sessão (`escolaId`), substituindo o formulário local legado (`<Select>` + `Button`) e garantindo consistência com a navegação multi-ano do restante da aplicação.

## Por que esta etapa existe

No Portal da Direção, os gestores escolares acompanham os indicadores da sua unidade em comparação direta com a rede municipal. Anteriormente, a página usava um `<Select>` manual simples que não persistia via cookies nem aceitava a sintaxe de seleção multi-ano (`?anos=`). Com o rollout, o Diretor passa a usufruir da persistência do cookie `sme_anos_letivos`, enquanto `getAnosLetivosDisponiveis({ escolaId })` garante que apenas os anos letivos com dados reais daquela escola sejam selecionáveis.

## Escopo desta etapa

1. `app/portal/direcao/page.tsx`:
   - Leitura de cookies `sme_anos_letivos` e resolução com `resolverSelecaoAnosLetivos`.
   - Derivação de `anoLetivo = anoReferencia(selecao)`.
   - `PageHeader` atualizado para renderizar `AnosLetivosFiltro` com `pathname="/portal/direcao"`.
   - Remoção dos componentes locais `<Select>`, `<Button>` e do helper legado `resolverAnoLetivo`.
2. Atualização de `docs/indicadores-historico-multianos/PROGRESSO.md`.

## Fora de escopo

- Nova página de avaliações do município `/admin/indicadores/avaliacoes` (ETAPA 08).
- Atualização da Central de Indicadores `/admin/indicadores` (ETAPA 09).

## Decisões técnicas

- **Escopo estrito por escola (`escolaId`)**:
  - A lista de anos disponíveis obtida via `getAnosLetivosDisponiveis({ escolaId })` continua restrita à escola da sessão do usuário (`DIRETOR`). Um diretor nunca visualiza anos em que sua unidade não tenha notas, frequência ou avaliações registradas.
- **Tratamento gracioso para escolas com histórico único**:
  - Quando a unidade escolar possui dados de apenas 1 ano letivo no sistema, o `AnosLetivosFiltro` renderiza automaticamente texto simples ("Ano letivo XXXX") sem popover interativo, preservando o layout limpo sem controles desnecessários.
- **Ancoragem operacional no ano de referência**:
  - Os insights acionáveis (`getInsightsAtencaoEscola`), o comparativo com a rede (`SchoolOverview`) e o cálculo de janelas temporais utilizam `anoLetivo = anoReferencia(selecao)` (o ano mais recente da seleção em caso de modos múltiplos/todos).

## Verificação

- `npm test`: 298/298 testes passando.
- `npm run typecheck`: 0 erros de compilação TypeScript.
- `npm run lint`: 0 avisos ou erros de linting.
- `npm run build`: compilação completa sem erros, gerando as 52 rotas da aplicação.

## Critério de pronto

- [x] Seletor persistente `AnosLetivosFiltro` integrado em `/portal/direcao`.
- [x] Anos disponíveis filtrados por `escolaId` da sessão do Diretor.
- [x] Remoção do formulário local legado (`<Select>` / `<Button>` / `resolverAnoLetivo`).
- [x] Bateria de testes e verificações (`npm test`, `typecheck`, `lint`, `build`) 100% verde.
