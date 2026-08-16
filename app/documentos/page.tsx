import { FileText } from "lucide-react";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { prisma } from "@/lib/prisma";

export default async function DocumentosPage() {
  const documentos = await prisma.documentoPublico.findMany({
    orderBy: { createdAt: "desc" },
  });

  const porCategoria = documentos.reduce<Record<string, typeof documentos>>((acc, doc) => {
    (acc[doc.categoria] ??= []).push(doc);
    return acc;
  }, {});

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-2xl font-bold text-slate-900">Documentos e Editais</h1>
        <p className="mt-1 text-sm text-slate-500">
          Portarias, resoluções, editais e demais documentos públicos da SME Baraúna.
        </p>

        {Object.keys(porCategoria).length === 0 && (
          <p className="mt-10 rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
            Nenhum documento publicado até o momento.
          </p>
        )}

        <div className="mt-8 space-y-10">
          {Object.entries(porCategoria).map(([categoria, docs]) => (
            <div key={categoria}>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">{categoria}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {docs.map((doc) => (
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
                      <span className="block truncate text-sm font-medium text-slate-900">
                        {doc.titulo}
                      </span>
                      {doc.descricao && (
                        <span className="block truncate text-xs text-slate-500">{doc.descricao}</span>
                      )}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
