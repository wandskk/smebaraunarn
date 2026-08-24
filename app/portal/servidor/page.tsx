import { TriangleAlert } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { getServidorBySession } from "@/lib/queries/portal";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/card";

export default async function ServidorHomePage() {
  const session = await requireSession(["SERVIDOR_GERAL"]);
  const servidor = await getServidorBySession(session);
  if (!servidor) return null;

  const turnos = [...new Set(servidor.turmas.map((t) => t.turno).filter(Boolean))];
  const cargaTotal = servidor.turmas.reduce((sum, t) => sum + (t.cargaTrabalho ?? 0), 0);

  const fields = [
    { label: "Matrícula", value: servidor.matricula },
    { label: "Cargo", value: servidor.cargo },
    { label: "Função", value: servidor.funcao },
    { label: "Tipo de Vínculo", value: servidor.tipoVinculo },
    { label: "Escola", value: servidor.escolaNome ?? servidor.escola?.nome },
    { label: "Turno", value: turnos.length > 0 ? turnos.join(", ") : null },
    { label: "Status", value: servidor.status },
    { label: "Carga de Trabalho", value: servidor.turmas.length > 0 ? `${cargaTotal}h` : null },
  ];

  return (
    <div>
      <PageHeader
        title={`Olá, ${servidor.nome.split(" ")[0]}`}
        description="Seus dados funcionais sincronizados com o SIGEduc."
      />

      <SectionCard title="Dados funcionais" className="mt-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.label}>
              <dt className="text-xs text-foreground-muted">{field.label}</dt>
              <dd className="text-sm font-medium text-foreground">{field.value ?? "-"}</dd>
            </div>
          ))}
        </dl>
      </SectionCard>

      {servidor.pendenciaPedagogica && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-subtle p-5 text-sm text-warning-subtle-foreground">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p>
            <strong>Pendência pedagógica:</strong> {servidor.pendenciaPedagogica}
          </p>
        </div>
      )}
    </div>
  );
}
