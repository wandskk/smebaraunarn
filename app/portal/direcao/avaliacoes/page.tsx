import { requireSession } from "@/lib/require-session";
import { prisma } from "@/lib/prisma";

const NIVEL_LABEL: Record<string, string> = {
  NAO_LEITOR: "Não leitor",
  LEITOR_DE_SILABAS: "Leitor de sílabas",
  LEITOR_DE_PALAVRAS: "Leitor de palavras",
  LEITOR_DE_FRASES: "Leitor de frases",
  LEITOR_SEM_FLUENCIA: "Leitor sem fluência",
  LEITOR_FLUENTE: "Leitor fluente",
};

export default async function DirecaoAvaliacoesPage() {
  const session = await requireSession(["DIRETOR"]);

  const resultados = await prisma.avaliacaoResultadoAluno.findMany({
    where: { escolaId: session.escolaId! },
    include: { avaliacao: true, estudante: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const porAvaliacao = resultados.reduce<Record<string, typeof resultados>>((acc, r) => {
    (acc[r.avaliacao.nome] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Avaliações Municipais</h1>
      <p className="mt-1 text-sm text-slate-500">Resultados registrados para a sua escola.</p>

      {Object.keys(porAvaliacao).length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
          Nenhum resultado de avaliação registrado ainda.
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {Object.entries(porAvaliacao).map(([nome, itens]) => (
            <div key={nome} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
                {nome}
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Aluno</th>
                    <th className="px-4 py-3">Turma</th>
                    <th className="px-4 py-3">Pontuação</th>
                    <th className="px-4 py-3">Nível</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itens.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">{r.estudante.nome}</td>
                      <td className="px-4 py-3 text-slate-500">{r.turma}</td>
                      <td className="px-4 py-3 text-slate-500">{r.pontuacao ?? "-"}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {r.nivelDesempenho ? NIVEL_LABEL[r.nivelDesempenho] : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
