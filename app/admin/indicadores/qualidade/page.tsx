import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import {
  getStatusSincronizacao,
  getColisoesCodigoTurma,
  type StatusModuloSincronizacao,
} from "@/lib/queries/qualidade-dados";

const ROTULO_MODULO: Record<string, string> = {
  ESCOLAS: "Escolas",
  CARGOS: "Cargos",
  SERVIDORES: "Servidores",
  ESTUDANTES: "Estudantes",
  NOTAS: "Notas",
  FREQUENCIA: "Frequência",
};

function formatarData(data: Date | null): string {
  return data ? data.toLocaleString("pt-BR") : "nunca";
}

function formatarDuracao(ms: number | null): string {
  if (ms === null) return "-";
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}

function SituacaoBadge({ situacao }: { situacao: StatusModuloSincronizacao["situacao"] }) {
  if (situacao === "em-dia") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" /> Em dia
      </span>
    );
  }
  if (situacao === "atrasado") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
        <Clock className="h-3.5 w-3.5" /> Atrasado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
      <XCircle className="h-3.5 w-3.5" /> Sem sincronização
    </span>
  );
}

function StatusLogBadge({ status }: { status: string }) {
  const style =
    status === "SUCESSO"
      ? "bg-emerald-50 text-emerald-700"
      : status === "ERRO"
        ? "bg-red-50 text-red-700"
        : "bg-slate-100 text-slate-600";
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>{status}</span>;
}

export default async function QualidadeDadosPage() {
  const [{ modulos, historico }, colisoes] = await Promise.all([
    getStatusSincronizacao(),
    getColisoesCodigoTurma(),
  ]);

  const colisoesDivergentes = colisoes.filter((c) => c.divergente);

  return (
    <div>
      <Link href="/admin/indicadores" className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Central de Indicadores
      </Link>

      <h1 className="mt-3 text-xl font-semibold text-slate-900">Qualidade dos Dados</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        Os indicadores acima só valem o que a sincronização entrega. Este painel mostra a saúde de cada módulo
        sincronizado do SIGEduc e checagens de integridade sobre os dados já carregados.
      </p>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">Saúde da sincronização</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Módulo</th>
              <th className="px-4 py-3">Situação</th>
              <th className="px-4 py-3">Última execução</th>
              <th className="px-4 py-3">Registros</th>
              <th className="px-4 py-3">Duração</th>
              <th className="px-4 py-3">Erros (7 dias)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {modulos.map((m) => (
              <tr key={m.modulo}>
                <td className="px-4 py-3 font-medium text-slate-900">{ROTULO_MODULO[m.modulo] ?? m.modulo}</td>
                <td className="px-4 py-3">
                  <SituacaoBadge situacao={m.situacao} />
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {m.ultimoLog ? (
                    <div className="flex items-center gap-2">
                      <StatusLogBadge status={m.ultimoLog.status} />
                      <span>{formatarData(m.ultimoLog.createdAt)}</span>
                    </div>
                  ) : (
                    "nunca sincronizado"
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{m.ultimoLog ? formatNumber(m.ultimoLog.registros) : "-"}</td>
                <td className="px-4 py-3 text-slate-600">{formatarDuracao(m.ultimoLog?.duracaoMs ?? null)}</td>
                <td className="px-4 py-3">
                  {m.errosUltimos7Dias > 0 ? (
                    <span className="font-semibold text-red-700">{m.errosUltimos7Dias}</span>
                  ) : (
                    <span className="text-slate-400">0</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modulos.some((m) => m.ultimoLog?.status === "ERRO" && m.ultimoLog?.mensagem) && (
        <div className="mt-3 space-y-1">
          {modulos
            .filter((m) => m.ultimoLog?.status === "ERRO" && m.ultimoLog?.mensagem)
            .map((m) => (
              <p key={m.modulo} className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">
                <strong>{ROTULO_MODULO[m.modulo] ?? m.modulo}:</strong> {m.ultimoLog!.mensagem}
              </p>
            ))}
        </div>
      )}

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Integridade — código de turma reutilizado entre escolas
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        A origem (SIGEduc) não garante que um código de turma seja único na rede. Isso não é um erro por si só —
        vira risco quando escolas diferentes atribuem séries diferentes ao mesmo código, o que poderia levar o
        indicador de distorção idade-série a usar a série errada para uma turma.
      </p>
      {colisoes.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">Nenhum código de turma reutilizado entre escolas no momento.</p>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-2 text-sm">
            {colisoesDivergentes.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 font-medium text-red-800">
                <AlertTriangle className="h-4 w-4" />
                {colisoesDivergentes.length} código(s) com série divergente entre escolas — revisar
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                {formatNumber(colisoes.length)} código(s) reutilizado(s), mas a série resolvida é consistente entre
                as escolas
              </span>
            )}
          </div>

          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Código da turma</th>
                  <th className="px-4 py-3">Escolas</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {colisoes.map((c) => (
                  <tr key={c.turma}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{c.turma}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <ul className="space-y-0.5">
                        {c.escolas.map((e) => (
                          <li key={e.escolaId}>
                            {e.nomeEscola}{" "}
                            <span className="text-slate-400">
                              ({e.series.length > 0 ? e.series.join(", ") : "sem série resolvida"})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3">
                      {c.divergente ? (
                        <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                          Divergente
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Consistente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Histórico recente de sincronização
      </h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Módulo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Registros</th>
              <th className="px-4 py-3">Duração</th>
              <th className="px-4 py-3">Mensagem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {historico.map((h) => (
              <tr key={h.id}>
                <td className="px-4 py-3 text-slate-600">{formatarData(h.createdAt)}</td>
                <td className="px-4 py-3 text-slate-900">{ROTULO_MODULO[h.modulo] ?? h.modulo}</td>
                <td className="px-4 py-3">
                  <StatusLogBadge status={h.status} />
                </td>
                <td className="px-4 py-3 text-slate-600">{formatNumber(h.registros)}</td>
                <td className="px-4 py-3 text-slate-600">{formatarDuracao(h.duracaoMs)}</td>
                <td className="px-4 py-3 max-w-xs truncate text-slate-500" title={h.mensagem ?? undefined}>
                  {h.mensagem ?? "-"}
                </td>
              </tr>
            ))}
            {historico.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                  Nenhuma sincronização registrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
