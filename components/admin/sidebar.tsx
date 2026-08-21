"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  FileText,
  Folder,
  GaugeCircle,
  GraduationCap,
  LayoutDashboard,
  RefreshCw,
  School,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Mesmos 10 destinos de sempre, só reorganizados em grupos — nenhuma URL muda. */
const NAV_GROUPS: NavGroup[] = [
  { label: "Visão Geral", items: [{ href: "/admin", label: "Painel", icon: LayoutDashboard }] },
  {
    label: "Rede Escolar",
    items: [
      { href: "/admin/escolas", label: "Escolas", icon: School },
      { href: "/admin/estudantes", label: "Estudantes", icon: GraduationCap },
      { href: "/admin/servidores", label: "Servidores", icon: Users },
    ],
  },
  {
    label: "Avaliação & Dados",
    items: [
      { href: "/admin/avaliacoes", label: "Avaliações Municipais", icon: ClipboardList },
      { href: "/admin/indicadores", label: "Central de Indicadores", icon: GaugeCircle },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { href: "/admin/posts", label: "Notícias / CMS", icon: FileText },
      { href: "/admin/documentos", label: "Documentos", icon: Folder },
    ],
  },
  {
    label: "Administração",
    items: [
      { href: "/admin/usuarios", label: "Usuários e Acessos", icon: Users },
      { href: "/admin/sincronizacao", label: "Sincronização SIGEduc", icon: RefreshCw },
    ],
  },
];

function NavGroupList({ pathname }: { pathname: string }) {
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="px-3 text-xs font-semibold uppercase tracking-wide text-foreground-muted/70">
            {group.label}
          </div>
          <div className="mt-1 space-y-0.5">
            {group.items.map((item) => {
              const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-primary-subtle text-primary-subtle-foreground"
                      : "text-foreground-muted hover:bg-surface-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarBrand() {
  return (
    <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <GraduationCap className="h-5 w-5" />
      </span>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-foreground">SME Baraúna</div>
        <div className="text-xs text-foreground-muted">Painel Administrativo</div>
      </div>
    </div>
  );
}

export interface AdminSidebarProps {
  /** Controla o drawer mobile — a versão desktop (lg+) é sempre visível. */
  mobileOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ mobileOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  // Fecha o drawer ao navegar — cada Link já troca a rota, isso só evita o
  // menu mobile ficar aberto por cima da página seguinte.
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
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <SidebarBrand />
        <NavGroupList pathname={pathname} />
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
            <SidebarBrand />
            <NavGroupList pathname={pathname} />
          </aside>
        </div>
      )}
    </>
  );
}
