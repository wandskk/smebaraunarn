"use client";

import { useState, type ReactNode } from "react";
import type { SessionPayload } from "@/lib/auth";
import { PageContainer } from "@/components/ui/page-container";
import { AdminSidebar } from "./sidebar";
import { AdminTopbar } from "./topbar";

export interface AppShellProps {
  session: SessionPayload;
  children: ReactNode;
}

/** Estrutura visual da área administrativa: sidebar + topbar + conteúdo, com drawer mobile. */
export function AppShell({ session, children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar session={session} onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">
          <PageContainer>{children}</PageContainer>
        </main>
      </div>
    </div>
  );
}
