import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QuestaoForm } from "./questao-form";
import { ResultadoForm } from "./resultado-form";
import { DeleteRowButton } from "./row-actions";
import { deleteQuestaoAction, deleteResultadoAction, deleteAvaliacaoAction } from "../actions";

interface PageProps {
  params: { id: string };
}

const NIVEL_LABEL: Record<string, string> = {
  NAO_LEITOR: "Não leitor",
  LEITOR_DE_SILABAS: "Leitor de sílabas",
  LEITOR_DE_PALAVRAS: "Leitor de palavras",
  LEITOR_DE_FRASES: "Leitor de frases",
  LEITOR_SEM_FLUENCIA: "Leitor sem fluência",
  LEITOR_FLUENTE: "Leitor fluente",
};

export default async function AvaliacaoDetailPage({ params }: PageProps) {
  const avaliacao = await prisma.avaliacao.findUnique({
    where: { id: params.id },
    include: {
      questoes: { orderBy: { numero: "asc" } },
      resultados: { include: { estudante: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!avaliacao) notFound();

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{avaliacao.nome}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {avaliacao.codigo} · {avaliacao.ano} · {avaliacao.etapaEnsino ?? "Etapa não informada"}
          </p>
        </div>
        <form action={deleteAvaliacaoAction.bind(null, avaliacao.id)}>
          <button type="submit" className="text-sm text-red-600 hover:underline">
            Excluir avaliação
          </button>
        </form>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Questões ({avaliacao.questoes.length})</h2>
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
          <QuestaoForm avaliacaoId={avaliacao.id} />
        </div>
        {avaliacao.questoes.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nº</th>
                  <th className="px-4 py-3">Descritor</th>
                  <th className="px-4 py-3">Gabarito</th>
                  <th className="px-4 py-3">Peso</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {avaliacao.questoes.map((q) => (
                  <tr key={q.id}>
                    <td className="px-4 py-3">{q.numero}</td>
                    <td className="px-4 py-3 text-slate-500">{q.descritor ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-500">{q.gabaritoCorreto ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-500">{q.peso}</td>
                    <td className="px-4 py-3 text-right">
                      <DeleteRowButton onDelete={deleteQuestaoAction.bind(null, avaliacao.id, q.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Resultados ({avaliacao.resultados.length})
        </h2>
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
          <ResultadoForm avaliacaoId={avaliacao.id} />
        </div>
        {avaliacao.resultados.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Aluno</th>
                  <th className="px-4 py-3">Turma</th>
                  <th className="px-4 py-3">Pontuação</th>
                  <th className="px-4 py-3">Nível</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {avaliacao.resultados.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{r.estudante.nome}</td>
                    <td className="px-4 py-3 text-slate-500">{r.turma}</td>
                    <td className="px-4 py-3 text-slate-500">{r.pontuacao ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {r.nivelDesempenho ? NIVEL_LABEL[r.nivelDesempenho] : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DeleteRowButton onDelete={deleteResultadoAction.bind(null, avaliacao.id, r.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
