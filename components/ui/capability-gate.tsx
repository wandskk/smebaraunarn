import type { ReactNode } from "react";

export interface CapabilityGateProps {
  /**
   * Resultado já calculado no servidor (ex.: `hasCapability(session.role,
   * "usuarios:manage")` de `lib/authz/capabilities.ts`, ou um predicado de
   * `lib/authz/authorize.ts`). CapabilityGate é só o complemento de UI —
   * nunca a fonte da autorização: a Server Action correspondente deve
   * validar a mesma capability de novo, independentemente do que a UI
   * mostrou (regra do master prompt: "toda ação sensível deve ter
   * autorização no servidor, não somente ocultação visual").
   */
  allowed: boolean;
  children: ReactNode;
  /** Renderizado no lugar de `children` quando `allowed` é falso. Padrão: nada. */
  fallback?: ReactNode;
}

/**
 * Esconde/substitui um controle de UI conforme uma capability já resolvida
 * no servidor. Não faz nenhuma checagem própria — é puramente apresentacional,
 * para não deixar o usuário "descobrir pelo erro da Server Action" que uma
 * ação não é permitida (achado P0 do documento de Admin).
 */
export function CapabilityGate({ allowed, children, fallback = null }: CapabilityGateProps) {
  return allowed ? <>{children}</> : <>{fallback}</>;
}
