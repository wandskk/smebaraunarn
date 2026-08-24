import { Download } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { getEstudanteBySession } from "@/lib/queries/portal";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function DeclaracaoPage() {
  const session = await requireSession(["ALUNO"]);
  const estudante = await getEstudanteBySession(session);
  if (!estudante) return null;

  const ano = new Date().getFullYear();

  return (
    <div>
      <PageHeader
        title="Declaração de Matrícula"
        description={`Documento oficial emitido pelo SIGEduc, referente ao ano letivo de ${ano}.`}
      />

      <Card className="mt-6 max-w-md">
        <p className="text-sm text-foreground-muted">
          Matrícula <strong className="text-foreground">{estudante.matricula}</strong> — {estudante.nome}
        </p>
        <a
          href={`/portal/aluno/declaracao/download?ano=${ano}`}
          className={cn(buttonVariants({ size: "lg" }), "mt-5 w-full")}
        >
          <Download className="h-4 w-4" />
          Baixar declaração (PDF)
        </a>
      </Card>
    </div>
  );
}
