import { notFound } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";
import { PortalAppShell } from "@/components/portal/app-shell";
import { logoutAction } from "@/app/logout/actions";

export default async function DirecaoLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession(["DIRETOR"]);

  if (!session.escolaId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-xl border border-warning/30 bg-warning-subtle p-6 text-center">
          <TriangleAlert className="mx-auto mb-3 h-8 w-8 text-warning" />
          <h1 className="text-lg font-semibold text-foreground">Conta ainda não vinculada a uma escola</h1>
          <p className="mt-2 text-sm text-warning-subtle-foreground">
            Seu cadastro de direção não está associado a nenhuma escola no SIGEduc — isso
            acontece porque, na fonte de dados, cargos de direção ficam vinculados à Secretaria,
            não a uma unidade escolar específica. Peça à Secretaria de Educação para vincular sua
            conta à escola correta em <strong>Usuários e Acessos</strong>.
          </p>
          <form action={logoutAction} className="mt-4">
            <button
              type="submit"
              className="rounded-lg border border-warning/30 px-4 py-2 text-sm font-medium text-warning-subtle-foreground hover:bg-warning-subtle"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    );
  }

  const escola = await prisma.escola.findUnique({ where: { id: session.escolaId } });
  if (!escola) notFound();

  return (
    <PortalAppShell session={session} subtitle={escola.nome}>
      {children}
    </PortalAppShell>
  );
}
