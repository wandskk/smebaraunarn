import { notFound } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { getServidorBySession } from "@/lib/queries/portal";
import { PortalAppShell } from "@/components/portal/app-shell";

export default async function ProfessorLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession(["PROFESSOR"]);
  const servidor = await getServidorBySession(session);
  if (!servidor) notFound();

  return (
    <PortalAppShell session={session} subtitle={servidor.escolaNome ?? servidor.escola?.nome ?? "Escola"}>
      {children}
    </PortalAppShell>
  );
}
