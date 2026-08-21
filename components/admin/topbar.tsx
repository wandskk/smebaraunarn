import { GraduationCap, Menu } from "lucide-react";
import type { SessionPayload } from "@/lib/auth";
import { UserMenu } from "./user-menu";

export interface AdminTopbarProps {
  session: SessionPayload;
  onOpenMobileNav: () => void;
}

/**
 * Simplificado: a identidade principal e a navegação já vivem na sidebar no
 * desktop — o topbar existe para o botão de menu mobile e o acesso à conta.
 */
export function AdminTopbar({ session, onOpenMobileNav }: AdminTopbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Abrir menu de navegação"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted transition hover:bg-surface-muted lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 lg:hidden">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-foreground">SME Baraúna</span>
        </div>
      </div>

      <UserMenu session={session} />
    </header>
  );
}
