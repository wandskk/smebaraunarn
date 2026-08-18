import { BookOpen, FileStack, School, Users } from "lucide-react";
import type { getIndicadores } from "@/lib/queries/site";
import { formatNumber } from "@/lib/utils";

type Indicadores = Awaited<ReturnType<typeof getIndicadores>>;

export function Indicators({ indicadores }: { indicadores: Indicadores }) {
  const items = [
    { label: "Escolas Municipais", value: indicadores.totalEscolas, icon: School },
    { label: "Alunos Matriculados", value: indicadores.totalAlunos, icon: Users },
    { label: "Documentos Publicados", value: indicadores.totalDocumentos, icon: FileStack },
    { label: "Acessos ao Portal", value: indicadores.totalAcessos, icon: BookOpen },
  ];

  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <item.icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{formatNumber(item.value)}</div>
            <div className="text-xs text-slate-500">{item.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
