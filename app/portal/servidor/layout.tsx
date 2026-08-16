import { notFound } from "next/navigation";
import { requireSession } from "@/lib/require-session";
import { getServidorBySession } from "@/lib/queries/portal";
import { PortalTopbar } from "@/components/portal/topbar";

export default async function ServidorLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession(["SERVIDOR_GERAL"]);
  const servidor = await getServidorBySession(session);
  if (!servidor) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <PortalTopbar session={session} subtitle={servidor.escolaNome ?? servidor.escola?.nome ?? "SME Baraúna"} />
      <main className="flex-1 p-4 lg:p-6">{children}</main>
    </div>
  );
}
