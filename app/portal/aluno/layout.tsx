import { notFound } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { getEstudanteBySession } from "@/lib/queries/portal";
import { PortalAppShell } from "@/components/portal/app-shell";

export default async function AlunoLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession(["ALUNO"]);
  const estudante = await getEstudanteBySession(session);
  if (!estudante) notFound();

  return (
    <PortalAppShell session={session} subtitle={estudante.nomeEscola ?? estudante.escola.nome}>
      {children}
    </PortalAppShell>
  );
}
