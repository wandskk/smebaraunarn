import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getIndicadores } from "@/lib/queries/site";
import { IndicadoresForm } from "./indicadores-form";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/card";

export default async function PortalPublicoIndicadoresPage() {
  const indicadores = await getIndicadores();

  return (
    <div>
      <Link href="/admin/indicadores" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Central de Indicadores
      </Link>

      <PageHeader
        className="mt-3"
        title="Números da Página Inicial"
        description="Números institucionais exibidos publicamente na página inicial do site — não fazem parte da Central de Indicadores (que usa dados sincronizados do SIGEduc automaticamente)."
      />

      <SectionCard title="Editar números" className="mt-6">
        <IndicadoresForm indicadores={indicadores} />
      </SectionCard>
    </div>
  );
}
