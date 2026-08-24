import { GraduationCap, Menu } from "lucide-react";
import type { SessionPayload } from "@/lib/auth";
import { UserMenu } from "@/components/ui/user-menu";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<SessionPayload["role"], string> = {
  ADMIN: "Administrador",
  SECRETARIA: "Secretaria",
  DIRETOR: "Direção Escolar",
  PROFESSOR: "Professor(a)",
  SERVIDOR_GERAL: "Servidor(a)",
  ALUNO: "Aluno / Responsável",
};

export interface PortalTopbarProps {
  session: SessionPayload;
  /** Nome da escola (ou "SME Baraúna" como fallback) exibido sob a marca. */
  subtitle: string;
  /** Presente apenas quando a página tem sidebar (o botão fica oculto em telas lg+, onde a sidebar já é visível). */
  onOpenMobileNav?: () => void;
}

export function PortalTopbar({ session, subtitle, onOpenMobileNav }: PortalTopbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {onOpenMobileNav && (
          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Abrir menu de navegação"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted transition hover:bg-surface-muted lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className={cn("flex items-center gap-2", onOpenMobileNav && "lg:hidden")}>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-4 w-4" />
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold text-foreground">SME Baraúna</div>
            <div className="truncate text-xs text-foreground-muted">{subtitle}</div>
          </div>
        </div>
      </div>

      <UserMenu session={session} roleLabel={ROLE_LABEL[session.role]} />
    </header>
  );
}
