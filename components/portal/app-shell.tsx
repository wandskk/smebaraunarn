"use client";

import { useState, type ReactNode } from "react";
import type { SessionPayload } from "@/lib/auth";
import { PageContainer } from "@/components/ui/page-container";
import { PortalSidebar } from "./sidebar";
import { PortalTopbar } from "./topbar";

/** Papéis com nav própria na sidebar — SERVIDOR_GERAL fica sem sidebar (tem só uma página). */
const ROLES_WITH_SIDEBAR: SessionPayload["role"][] = ["ALUNO", "DIRETOR", "PROFESSOR"];

export interface PortalAppShellProps {
  session: SessionPayload;
  subtitle: string;
  children: ReactNode;
}

/** Estrutura visual do portal: sidebar (quando o papel tem nav) + topbar + conteúdo, com drawer mobile — mesmo padrão do AppShell administrativo. */
export function PortalAppShell({ session, subtitle, children }: PortalAppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const hasSidebar = ROLES_WITH_SIDEBAR.includes(session.role);

  return (
    <div className="flex min-h-screen bg-background">
      {hasSidebar && (
        <PortalSidebar
          role={session.role}
          subtitle={subtitle}
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <PortalTopbar
          session={session}
          subtitle={subtitle}
          onOpenMobileNav={hasSidebar ? () => setMobileNavOpen(true) : undefined}
        />
        <main className="flex-1 p-4 lg:p-6">
          <PageContainer>{children}</PageContainer>
        </main>
      </div>
    </div>
  );
}
