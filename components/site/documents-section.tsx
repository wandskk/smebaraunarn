import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import type { DocumentoPublico } from "@prisma/client";

export function DocumentsSection({ documentos }: { documentos: DocumentoPublico[] }) {
  return (
    <section className="bg-slate-100 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Documentos e Editais</h2>
            <p className="text-sm text-slate-500">Portarias, resoluções, editais e calendário escolar</p>
          </div>
          <Link
            href="/documentos"
            className="hidden items-center gap-1 text-sm font-medium text-brand-700 hover:underline sm:flex"
          >
            Ver todos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {documentos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
            Nenhum documento publicado até o momento.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {documentos.map((doc) => (
              <a
                key={doc.id}
                href={doc.arquivoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <FileText className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-900">{doc.titulo}</span>
                  <span className="text-xs text-slate-500">
                    {doc.categoria}
                    {doc.tamanho ? ` · ${doc.tamanho}` : ""}
                  </span>
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
