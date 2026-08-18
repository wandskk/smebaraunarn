import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getIndicadores } from "@/lib/queries/site";
import { IndicadoresForm } from "./indicadores-form";

export default async function PortalPublicoIndicadoresPage() {
  const indicadores = await getIndicadores();

  return (
    <div>
      <Link href="/admin/indicadores" className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Central de Indicadores
      </Link>

      <h1 className="mt-3 text-xl font-semibold text-slate-900">Números da Página Inicial</h1>
      <p className="mt-1 text-sm text-slate-500">
        Números institucionais exibidos publicamente na página inicial do site — não fazem parte da
        Central de Indicadores (que usa dados sincronizados do SIGEduc automaticamente).
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <IndicadoresForm indicadores={indicadores} />
      </div>
    </div>
  );
}
