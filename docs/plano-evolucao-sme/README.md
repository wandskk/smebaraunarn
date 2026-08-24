# Plano de Evolução Incremental do SME Baraúna

Este diretório é o rastreador de trabalho da evolução incremental do SME Baraúna
conduzida a partir do `CLAUDE_CODE_MASTER_PROMPT_SME_BARAUNA.md` (na raiz do
repositório, em `claude_code_sme_base/`). Ele **não substitui**
[`docs/PLANO_DESENVOLVIMENTO.md`](../PLANO_DESENVOLVIMENTO.md) — os dois documentos
coexistem:

- `docs/PLANO_DESENVOLVIMENTO.md`: plano de desenvolvimento técnico geral do
  Centro de Inteligência e Indicadores Educacionais (histórico, princípios de
  engenharia, diagnóstico do repositório em 2026-08-18).
- `docs/plano-evolucao-sme/`: execução por etapas do plano de evolução por
  perfil (Admin, Diretor, Professor, Aluno, Servidor Geral), guiada pelos 5
  documentos DOCX em `base/` e pelo master prompt.

## Como este diretório está organizado

```text
plano-evolucao-sme/
├── README.md                    este arquivo
├── PROGRESSO.md                 estado atual de cada etapa (00-11)
├── MATRIZ_REAPROVEITAMENTO.md   matriz núcleo x perfil (o que é compartilhado)
├── base/                        documentação funcional de referência
│   ├── Plano_Evolucao_MVP_*.docx      os 5 DOCX originais (não editar)
│   └── extratos/                      extração em Markdown de cada DOCX
├── etapas/                      1 arquivo por etapa (00 a 11), status vivo
└── decisoes/                    decisões técnicas relevantes registradas
    └── README.md                índice das decisões
```

## Regras de trabalho

1. Cada etapa só começa depois que a anterior está `DONE` (ou explicitamente
   `BLOCKED` com justificativa aceita pelo usuário).
2. Nenhuma etapa avança automaticamente para a próxima — a execução para ao
   final de cada uma e aguarda autorização.
3. Os 5 DOCX em `base/` são a fonte funcional de referência; os extratos em
   `base/extratos/` são apoio de leitura rápida gerado automaticamente a
   partir do XML interno de cada DOCX (não têve `python-docx` disponível no
   ambiente local, então a extração foi feita lendo `word/document.xml`
   diretamente — ver nota em cada extrato).
4. `PROGRESSO.md` é a fonte de verdade sobre qual etapa está pendente,
   em andamento, bloqueada ou concluída.
5. `MATRIZ_REAPROVEITAMENTO.md` é atualizada conforme o código real evolui —
   a versão inicial (ETAPA 00) é preliminar, baseada em inspeção do
   repositório e leitura dos 5 DOCX.

## Estado documental na ETAPA 00

Os 5 documentos DOCX estavam disponíveis em
`claude_code_sme_base/docs_base/` (fora da estrutura `docs/`) e foram
copiados para `base/` nesta etapa, sem remover os originais. Nenhum
comportamento funcional do sistema foi alterado na ETAPA 00 — apenas
documentação e baseline de testes foram criados/registrados.

Consulte [`etapas/00-auditoria-e-baseline.md`](etapas/00-auditoria-e-baseline.md)
para o relatório completo da auditoria inicial.
