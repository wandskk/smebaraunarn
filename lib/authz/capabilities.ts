import type { Role } from "@prisma/client";

/**
 * Capabilities reais já existentes no sistema, extraídas dos
 * `requireSession([...])` atuais (ver app/admin/**\/actions.ts) — não são
 * invenção: hoje só "usuarios:manage" distingue ADMIN de SECRETARIA no
 * código (app/admin/usuarios/actions.ts exige só ["ADMIN"]; toda outra ação
 * administrativa aceita ["ADMIN", "SECRETARIA"]). As demais capabilities
 * listadas aqui documentam esse estado atual em um único lugar, para a
 * ETAPA 04 usar ao decidir o que esconder/desabilitar na UI para SECRETARIA
 * (achado P0: "ADMIN e SECRETARIA só veem ações que realmente podem
 * executar").
 */
export type Capability =
  | "usuarios:manage"
  | "servidores:manage"
  | "posts:manage"
  | "documentos:manage"
  | "avaliacoes:manage"
  | "sincronizacao:executar"
  | "indicadores-landing:editar";

const CAPABILITIES_BY_ROLE: Record<Role, ReadonlySet<Capability>> = {
  ADMIN: new Set<Capability>([
    "usuarios:manage",
    "servidores:manage",
    "posts:manage",
    "documentos:manage",
    "avaliacoes:manage",
    "sincronizacao:executar",
    "indicadores-landing:editar",
  ]),
  SECRETARIA: new Set<Capability>([
    "servidores:manage",
    "posts:manage",
    "documentos:manage",
    "avaliacoes:manage",
    "sincronizacao:executar",
    "indicadores-landing:editar",
  ]),
  DIRETOR: new Set<Capability>(),
  PROFESSOR: new Set<Capability>(),
  SERVIDOR_GERAL: new Set<Capability>(),
  ALUNO: new Set<Capability>(),
};

export function hasCapability(role: Role, capability: Capability): boolean {
  return CAPABILITIES_BY_ROLE[role].has(capability);
}
