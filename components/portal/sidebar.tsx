"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  FileDown,
  GraduationCap,
  LayoutDashboard,
  LayoutGrid,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { SessionPayload } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface PortalNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Definida aqui (dentro do client component), não recebida via prop do
 * layout (Server Component) — componentes de ícone não são serializáveis
 * através da fronteira RSC, então a navegação de cada papel precisa viver
 * inteiramente no client.
 */
const NAV_BY_ROLE: Partial<Record<SessionPayload["role"], PortalNavItem[]>> = {
  ALUNO: [
    { href: "/portal/aluno", label: "Início", icon: LayoutDashboard },
    { href: "/portal/aluno/boletim", label: "Boletim", icon: BookOpen },
    { href: "/portal/aluno/frequencia", label: "Frequência", icon: CalendarCheck },
    { href: "/portal/aluno/declaracao", label: "Declaração de Matrícula", icon: FileDown },
  ],
  DIRETOR: [
    { href: "/portal/direcao", label: "Início", icon: LayoutDashboard },
    { href: "/portal/direcao/servidores", label: "Servidores", icon: Users },
    { href: "/portal/direcao/turmas", label: "Turmas", icon: LayoutGrid },
    { href: "/portal/direcao/estudantes", label: "Estudantes", icon: GraduationCap },
    { href: "/portal/direcao/notas", label: "Notas", icon: BookOpen },
    { href: "/portal/direcao/frequencia", label: "Frequência", icon: CalendarCheck },
    { href: "/portal/direcao/avaliacoes", label: "Avaliações Municipais", icon: ClipboardList },
  ],
  PROFESSOR: [
    { href: "/portal/professor", label: "Início", icon: LayoutDashboard },
    { href: "/portal/professor/turma", label: "Minha Turma", icon: Users },
  ],
};

function NavList({ items, pathname }: { items: PortalNavItem[]; pathname: string }) {
  const homeHref = items[0]?.href;
  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
      {items.map((item) => {
        const active = item.href === homeHref ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition",
              active
                ? "bg-primary-subtle text-primary-subtle-foreground"
                : "text-foreground-muted hover:bg-surface-muted hover:text-foreground",
            )}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-subtle">
              <item.icon className="h-3.5 w-3.5 text-primary" />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBrand({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <GraduationCap className="h-5 w-5" />
      </span>
      <div className="min-w-0 leading-tight">
        <div className="truncate text-sm font-semibold text-foreground">SME Baraúna</div>
        <div className="truncate text-xs text-foreground-muted">{subtitle}</div>
      </div>
    </div>
  );
}

export interface PortalSidebarProps {
  role: SessionPayload["role"];
  subtitle: string;
  mobileOpen: boolean;
  onClose: () => void;
}

/** Sidebar padrão do portal — mesma estrutura da AdminSidebar, sem agrupamento (nav de cada papel é curta). */
export function PortalSidebar({ role, subtitle, mobileOpen, onClose }: PortalSidebarProps) {
  const pathname = usePathname();
  const items = NAV_BY_ROLE[role] ?? [];

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onClose]);

  return (
    <>
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <SidebarBrand subtitle={subtitle} />
        <NavList items={items} pathname={pathname} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden="true" />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            className="relative flex h-full w-72 max-w-[85vw] flex-col bg-surface shadow-xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar menu"
              className="absolute right-3 top-4 z-10 rounded-lg p-1.5 text-foreground-muted transition hover:bg-surface-muted"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarBrand subtitle={subtitle} />
            <NavList items={items} pathname={pathname} />
          </aside>
        </div>
      )}
    </>
  );
}
