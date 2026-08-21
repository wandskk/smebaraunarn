"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, UserCog } from "lucide-react";
import { logoutAction } from "@/app/logout/actions";
import type { SessionPayload } from "@/lib/auth";
import { cn } from "@/lib/utils";

/**
 * Une "Minha Conta" + "Sair" (antes dois links/botões separados no topbar) num
 * único menu de usuário — mesmos destino (/conta) e Server Action
 * (logoutAction) de antes, só a apresentação muda.
 */
export function UserMenu({ session }: { session: SessionPayload }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-surface-muted"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-sm font-semibold text-primary-subtle-foreground">
          {session.nome.charAt(0).toUpperCase()}
        </span>
        <span className="hidden leading-tight sm:block">
          <span className="block text-sm font-medium text-foreground">{session.nome}</span>
          <span className="block text-xs text-foreground-muted">{session.role}</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-foreground-muted transition", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-lg border border-border bg-surface shadow-card"
        >
          <Link
            href="/conta"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground transition hover:bg-surface-muted"
          >
            <UserCog className="h-4 w-4" />
            Minha Conta
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition hover:bg-surface-muted"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
