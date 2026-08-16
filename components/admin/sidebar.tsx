"use client";

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
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard },
  { href: "/admin/posts", label: "Notícias / CMS", icon: FileText },
  { href: "/admin/documentos", label: "Documentos", icon: Folder },
  { href: "/admin/avaliacoes", label: "Avaliações Municipais", icon: ClipboardList },
  { href: "/admin/servidores", label: "Servidores", icon: Users },
  { href: "/admin/estudantes", label: "Estudantes", icon: GraduationCap },
  { href: "/admin/escolas", label: "Escolas", icon: School },
  { href: "/admin/usuarios", label: "Usuários e Acessos", icon: Users },
  { href: "/admin/sincronizacao", label: "Sincronização SIGEduc", icon: RefreshCw },
  { href: "/admin/indicadores", label: "Indicadores do Portal", icon: GaugeCircle },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
      <nav className="flex flex-col gap-1 p-3">
        {NAV.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
