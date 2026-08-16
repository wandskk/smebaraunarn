import { requireSession } from "@/lib/require-session";
import { getServidorBySession } from "@/lib/queries/portal";

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
      <h1 className="text-xl font-semibold text-slate-900">Olá, {servidor.nome.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-slate-500">Seus dados funcionais sincronizados com o SIGEduc.</p>

      <div className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.label}>
            <dt className="text-xs text-slate-500">{field.label}</dt>
            <dd className="text-sm font-medium text-slate-900">{field.value ?? "-"}</dd>
          </div>
        ))}
      </div>

      {servidor.pendenciaPedagogica && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          <strong>Pendência pedagógica:</strong> {servidor.pendenciaPedagogica}
        </div>
      )}
    </div>
  );
}
