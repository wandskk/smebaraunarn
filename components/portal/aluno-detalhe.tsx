import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AlunoDetalheCompleto } from "@/lib/queries/academico";

interface AlunoDetalheProps {
  dados: AlunoDetalheCompleto;
  ano: number;
}

export function AlunoDetalhe({ dados, ano }: AlunoDetalheProps) {
  const { estudante, notas, frequencias } = dados;

  const porDisciplina = notas.reduce<Record<string, typeof notas>>((acc, nota) => {
    (acc[nota.disciplina] ??= []).push(nota);
    return acc;
  }, {});

  const totalAulas = frequencias.reduce((sum, r) => sum + r.quantidadeAula, 0);
  const totalFaltas = frequencias.reduce((sum, r) => sum + r.falta, 0);
  const totalAbonadas = frequencias.filter((r) => r.abonada).length;
  const percentualPresenca = totalAulas > 0 ? ((totalAulas - totalFaltas) / totalAulas) * 100 : null;

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">{estudante.nome}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Matrícula {estudante.matricula} · {estudante.turmaSerie ?? "Sem turma"} ·{" "}
        {estudante.nomeEscola ?? estudante.escola?.nome}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <dt className="text-xs text-slate-500">Responsável</dt>
          <dd className="text-sm font-medium text-slate-900">{estudante.nomeResponsavel ?? "-"}</dd>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <dt className="text-xs text-slate-500">Data de nascimento</dt>
          <dd className="text-sm font-medium text-slate-900">{estudante.dataNascimento ?? "-"}</dd>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <dt className="text-xs text-slate-500">Frequência ({frequencias.length} registro(s))</dt>
          <dd className="text-sm font-medium text-slate-900">
            {percentualPresenca !== null ? `${percentualPresenca.toFixed(1)}%` : "-"}
          </dd>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <dt className="text-xs text-slate-500">Faltas / abonadas</dt>
          <dd className="text-sm font-medium text-slate-900">
            {totalFaltas} / {totalAbonadas}
          </dd>
        </div>
      </div>

      <h2 className="mt-8 text-sm font-semibold text-slate-900">Boletim — {ano}</h2>
      {Object.keys(porDisciplina).length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
          Nenhuma nota lançada para {ano} ainda.
        </p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Disciplina</th>
                <th className="px-4 py-3">1ª Un.</th>
                <th className="px-4 py-3">2ª Un.</th>
                <th className="px-4 py-3">3ª Un.</th>
                <th className="px-4 py-3">4ª Un.</th>
                <th className="px-4 py-3">Média</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(porDisciplina).map(([disciplina, unidades]) => {
                const porUnidade = new Map(unidades.map((u) => [u.unidade, u.nota]));
                const media = unidades.reduce((sum, u) => sum + u.nota, 0) / (unidades.length || 1);
                return (
                  <tr key={disciplina}>
                    <td className="px-4 py-3 font-medium text-slate-900">{disciplina}</td>
                    {[1, 2, 3, 4].map((u) => (
                      <td key={u} className="px-4 py-3 text-slate-600">
                        {porUnidade.get(u) ?? "-"}
                      </td>
                    ))}
                    <td className="px-4 py-3 font-semibold text-slate-900">{media.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-8 text-sm font-semibold text-slate-900">Frequência recente</h2>
      {frequencias.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
          Nenhum registro de frequência encontrado.
        </p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Disciplina</th>
                <th className="px-4 py-3">Situação</th>
                <th className="px-4 py-3">Abonada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {frequencias.map((f) => (
                <tr key={f.id}>
                  <td className="px-4 py-3 text-slate-900">
                    {format(new Date(f.data), "dd/MM/yyyy", { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{f.disciplina ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{f.falta > 0 ? "Falta" : "Presente"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {f.abonada ? `Sim${f.motivoAbono ? ` (${f.motivoAbono})` : ""}` : "Não"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
