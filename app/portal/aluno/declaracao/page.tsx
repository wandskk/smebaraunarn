import { Download } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { getEstudanteBySession } from "@/lib/queries/portal";

export default async function DeclaracaoPage() {
  const session = await requireSession(["ALUNO"]);
  const estudante = await getEstudanteBySession(session);
  if (!estudante) return null;

  const ano = new Date().getFullYear();

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Declaração de Matrícula</h1>
      <p className="mt-1 text-sm text-slate-500">
        Documento oficial emitido pelo SIGEduc, referente ao ano letivo de {ano}.
      </p>

      <div className="mt-6 max-w-md rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-600">
          Matrícula <strong>{estudante.matricula}</strong> — {estudante.nome}
        </p>
        <a
          href={`/portal/aluno/declaracao/download?ano=${ano}`}
          className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          <Download className="h-4 w-4" />
          Baixar declaração (PDF)
        </a>
      </div>
    </div>
  );
}
