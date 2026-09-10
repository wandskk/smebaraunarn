"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ChevronDown } from "lucide-react";
import { salvarSelecaoAnosLetivosAction } from "@/lib/actions/anos-letivos";
import type { SelecaoAnosLetivos } from "@/lib/queries/anos-letivos";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AnosLetivosFiltroProps {
  anosDisponiveis: number[];
  selecaoAtual: SelecaoAnosLetivos;
  /** Rota da própria página — cada chamador passa a sua; sem descoberta dinâmica via headers(). */
  pathname: string;
  /**
   * Outros parâmetros de busca da página atual a preservar no redirect (ex.:
   * `{disciplina: "MATEMATICA", unidade: "2"}`) — sem isso, aplicar o filtro
   * de ano resetaria qualquer outro filtro que a página já tivesse na URL.
   */
  preservarQueryParams?: Record<string, string>;
}

function rotuloSelecao(selecao: SelecaoAnosLetivos): string {
  if (selecao.modo === "todos") return "Todos os anos";
  if (selecao.modo === "unico") return `Ano letivo ${selecao.ano}`;
  const ordenados = [...selecao.anos].sort((a, b) => a - b);
  return `${ordenados[0]}–${ordenados[ordenados.length - 1]} (${ordenados.length} anos)`;
}

function anosDaSelecao(selecao: SelecaoAnosLetivos, anosDisponiveis: number[]): Set<number> {
  if (selecao.modo === "unico") return new Set([selecao.ano]);
  if (selecao.modo === "multiplos") return new Set(selecao.anos);
  return new Set(anosDisponiveis);
}

function BotaoAplicar({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" className="mt-3 w-full" disabled={disabled || pending}>
      {pending ? "Aplicando…" : "Aplicar"}
    </Button>
  );
}

/**
 * Seletor de ano(s) letivo(s) persistente — único componente compartilhado
 * de "contexto de ano" do app (deliberadamente adiado em
 * docs/plano-evolucao-sme/etapas/02 e 03 por só haver 1 caso de uso real na
 * época; este roadmap tem 7+ usos reais simultâneos, cruzando o limite que
 * justificava esperar). Não guarda estado entre páginas sozinho — quem
 * persiste é o cookie gravado pela Server Action; este componente só é a
 * superfície de interação client-side sobre o `<form>` que a aciona.
 */
export function AnosLetivosFiltro({ anosDisponiveis, selecaoAtual, pathname, preservarQueryParams }: AnosLetivosFiltroProps) {
  const [open, setOpen] = useState(false);
  const [todos, setTodos] = useState(selecaoAtual.modo === "todos");
  const [selecionados, setSelecionados] = useState<Set<number>>(() => anosDaSelecao(selecaoAtual, anosDisponiveis));
  const containerRef = useRef<HTMLDivElement>(null);
  const primeiroCampoRef = useRef<HTMLInputElement>(null);
  const popoverId = useId();

  // Resincroniza o estado local sempre que o servidor resolve uma seleção
  // diferente — necessário porque o redirect da Server Action é pra mesma
  // rota (só muda a query string), então o React reconcilia este componente
  // como a MESMA instância em vez de remontar, e os `useState` iniciais não
  // rodam de novo (achado real de revisão adversarial na ETAPA 02: sem isso,
  // marcar "Todos os anos" e aplicar deixava o Set de anos selecionados
  // "preso" na seleção anterior, aparecendo errado da próxima vez que o
  // usuário abrisse o popover).
  useEffect(() => {
    setTodos(selecaoAtual.modo === "todos");
    setSelecionados(anosDaSelecao(selecaoAtual, anosDisponiveis));
  }, [selecaoAtual, anosDisponiveis]);

  useEffect(() => {
    if (!open) return;

    primeiroCampoRef.current?.focus();

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

  if (anosDisponiveis.length === 0) return null;

  // Só 1 ano disponível: mostra o rótulo (mesma informação que as páginas já
  // exibem hoje em texto simples), sem popover — nada pra filtrar.
  if (anosDisponiveis.length === 1) {
    return <span className="text-sm font-medium text-foreground">Ano letivo {anosDisponiveis[0]}</span>;
  }

  function alternarAno(ano: number) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(ano)) novo.delete(ano);
      else novo.add(ano);
      return novo;
    });
  }

  const modoFinal = todos ? "todos" : selecionados.size > 1 ? "multiplos" : "unico";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={popoverId}
        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition hover:bg-surface-muted"
      >
        {rotuloSelecao(selecaoAtual)}
        <ChevronDown className={cn("h-4 w-4 text-foreground-muted transition", open && "rotate-180")} />
      </button>

      {open && (
        <form
          id={popoverId}
          role="dialog"
          aria-label="Filtrar por ano letivo"
          action={salvarSelecaoAnosLetivosAction}
          className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-border bg-surface p-3 shadow-card"
        >
          <input type="hidden" name="pathname" value={pathname} />
          <input type="hidden" name="modo" value={modoFinal} />
          {!todos && Array.from(selecionados).map((ano) => <input key={ano} type="hidden" name="anos" value={ano} />)}
          {Object.entries(preservarQueryParams ?? {}).map(([chave, valor]) => (
            <input key={chave} type="hidden" name={`extra_${chave}`} value={valor} />
          ))}

          <label className="flex items-center gap-2 border-b border-border pb-2 text-sm font-medium text-foreground">
            <Checkbox ref={primeiroCampoRef} checked={todos} onChange={(e) => setTodos(e.target.checked)} />
            Todos os anos
          </label>

          <div className={cn("mt-2 flex flex-col gap-1.5", todos && "pointer-events-none opacity-50")}>
            {anosDisponiveis.map((ano) => (
              <label key={ano} className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox checked={todos || selecionados.has(ano)} onChange={() => alternarAno(ano)} disabled={todos} />
                Ano letivo {ano}
              </label>
            ))}
          </div>

          <BotaoAplicar disabled={!todos && selecionados.size === 0} />
        </form>
      )}
    </div>
  );
}
