import { getIndicadores } from "@/lib/queries/site";
import { IndicadoresForm } from "./indicadores-form";

export default async function AdminIndicadoresPage() {
  const indicadores = await getIndicadores();

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Indicadores do Portal</h1>
      <p className="mt-1 text-sm text-slate-500">
        Números exibidos na página inicial do site institucional.
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <IndicadoresForm indicadores={indicadores} />
      </div>
    </div>
  );
}
