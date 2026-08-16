import { RefreshCw } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  syncCargosAction,
  syncEscolasAction,
  syncEstudantesAction,
  syncServidoresAction,
} from "./actions";

export default async function SincronizacaoPage() {
  const logs = await prisma.logSincronizacao.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const anoAtual = new Date().getFullYear();

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Sincronização SIGEduc</h1>
      <p className="mt-1 text-sm text-slate-500">
        Importa dados diretamente da API Educ 21. Execute nesta ordem: Escolas → Cargos →
        Servidores → Estudantes.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <form action={syncEscolasAction}>
          <SyncCard title="1. Escolas" desc="Consulta /consulta-escola" />
        </form>
        <form action={syncCargosAction}>
          <SyncCard title="2. Cargos" desc="Consulta /consulta-cargo" />
        </form>
        <form action={syncServidoresAction}>
          <SyncCard title="3. Servidores" desc="Consulta /consulta-servidor por escola" />
        </form>
        <form action={syncEstudantesAction}>
          <input type="hidden" name="ano" value={anoAtual} />
          <SyncCard title={`4. Estudantes (${anoAtual})`} desc="Consulta /consulta-estudante/enturmado" />
        </form>
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Histórico de Sincronizações</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Módulo</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Registros</th>
                <th className="px-4 py-3">Duração</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Mensagem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{log.modulo}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        log.status === "SUCESSO"
                          ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                          : "rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700"
                      }
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{log.registros}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {log.duracaoMs ? `${(log.duracaoMs / 1000).toFixed(1)}s` : "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {log.createdAt.toLocaleString("pt-BR")}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-slate-500">{log.mensagem ?? "-"}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Nenhuma sincronização executada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SyncCard({ title, desc }: { title: string; desc: string }) {
  return (
    <button
      type="submit"
      className="flex w-full flex-col items-start gap-2 rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-brand-300 hover:shadow-sm"
    >
      <RefreshCw className="h-5 w-5 text-brand-600" />
      <span className="text-sm font-semibold text-slate-900">{title}</span>
      <span className="text-xs text-slate-500">{desc}</span>
    </button>
  );
}
