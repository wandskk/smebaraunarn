# ETAPA 08 — Hardening e roteiro de demonstração

## Status
PENDING

## Objetivo

Verificação final funcional, acessibilidade, responsividade e build, mais
roteiro de demonstração com dados reais.

## Escopo (seção "ETAPA 08" do plano)

**Funcional:** ano preservado nos links, filtros, deep-links, RBAC, nenhum
CPF/PII na Central, dados reais, null/empty states, freshness.

**Acessibilidade:** estado nunca só por cor, labels, contraste, navegação
por teclado, `prefers-reduced-motion`.

**Responsividade:** verificar no mínimo 375px, 768px, 1440px.

**Build:**
```bash
npm test
npm run typecheck
npm run lint
npm run build
```

**Demo:** preparar três casos reais (uma escola com situação interessante de
frequência; uma situação de aprendizagem ou distorção; uma avaliação
municipal real) e criar `docs/mvp-indicadores-inteligentes/ROTEIRO_DEMO.md`.

## Definition of Done do MVP (seção 19 do plano)

Checklist completo a validar nesta etapa — ver
`../../PLANO_MVP_INDICADORES_INTELIGENTES.md` seção 19.

## Próximo passo permitido

Nenhum — última etapa do roteiro. MVP concluído mediante aceite do usuário.
