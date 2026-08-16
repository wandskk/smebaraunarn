import { prisma } from "@/lib/prisma";
import { DocumentoForm } from "./documento-form";
import { DeleteDocumentoButton } from "./delete-documento-button";

export default async function AdminDocumentosPage() {
  const documentos = await prisma.documentoPublico.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Documentos Públicos</h1>
      <p className="mt-1 text-sm text-slate-500">
        Portarias, resoluções, editais e calendário escolar exibidos no portal.
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Novo documento</h2>
        <DocumentoForm />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Acessos</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documentos.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{d.titulo}</td>
                <td className="px-4 py-3 text-slate-500">{d.categoria}</td>
                <td className="px-4 py-3 text-slate-500">{d.acessos}</td>
                <td className="px-4 py-3 text-right">
                  <DeleteDocumentoButton id={d.id} />
                </td>
              </tr>
            ))}
            {documentos.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                  Nenhum documento publicado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
