import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-brand-100">
            Prefeitura Municipal de Baraúna - RN
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            Educação pública de qualidade para todas as crianças de Baraúna
          </h1>
          <p className="mt-4 max-w-xl text-brand-100">
            Portal oficial da Secretaria Municipal de Educação. Acompanhe notícias, acesse
            documentos e utilize o sistema integrado ao SIGEduc para consultar boletins,
            frequência e declarações escolares.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
            >
              Acessar Área Restrita
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/documentos"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <FileText className="h-4 w-4" />
              Ver Documentos
            </Link>
          </div>
        </div>
        <div className="hidden lg:block" aria-hidden>
          <div className="aspect-square w-full rounded-3xl bg-white/5 ring-1 ring-white/10" />
        </div>
      </div>
    </section>
  );
}
