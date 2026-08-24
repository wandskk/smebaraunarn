import { Info, Mail, Phone, TriangleAlert } from "lucide-react";
import { requireSession } from "@/lib/require-session";
import { getServidorBySession } from "@/lib/queries/portal";
import { getStatusSincronizacao } from "@/lib/queries/qualidade-dados";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/card";
import { DataFreshnessBadge } from "@/components/ui/data-freshness-badge";

const NAO_INFORMADO = "Não informado pela fonte";

export default async function ServidorHomePage() {
  const session = await requireSession(["SERVIDOR_GERAL"]);
  const [servidor, { modulos }] = await Promise.all([getServidorBySession(session), getStatusSincronizacao()]);
  if (!servidor) return null;

  const freshnessServidores = modulos.find((m) => m.modulo === "SERVIDORES");

  // Turno/carga: com turma vinculada, a fonte de verdade é a atribuição
  // pedagógica (ServidorTurma, pode variar por turma); sem turma, cai no
  // fallback funcional gravado direto no Servidor (ETAPA 08) — antes desta
  // etapa esse valor era perdido silenciosamente quando não havia turma.
  const temTurmas = servidor.turmas.length > 0;
  const turnos = temTurmas ? [...new Set(servidor.turmas.map((t) => t.turno).filter(Boolean))] : [];
  const turnoValor = temTurmas ? (turnos.length > 0 ? turnos.join(", ") : null) : servidor.turno;
  const cargaValor = temTurmas
    ? servidor.turmas.reduce((sum, t) => sum + (t.cargaTrabalho ?? 0), 0)
    : servidor.cargaTrabalho;

  const camposFuncionais = [
    { label: "Matrícula", value: servidor.matricula },
    { label: "Cargo", value: servidor.cargo },
    { label: "Função", value: servidor.funcao },
    { label: "Tipo de Vínculo", value: servidor.tipoVinculo },
    { label: "Status", value: servidor.status },
    { label: "Turno", value: turnoValor },
    { label: "Carga de Trabalho", value: cargaValor !== null ? `${cargaValor}h` : null },
  ];

  // A origem manda o nome da escola como texto solto (escolaNome) e,
  // separadamente, o vínculo estruturado (escola). Quando os dois existem e
  // divergem, mostrar o aviso em vez de escolher um silenciosamente — o
  // usuário é quem sabe qual está certo.
  const escolaEstruturada = servidor.escola?.nome ?? null;
  const escolaDivergente =
    escolaEstruturada !== null && servidor.escolaNome !== null && escolaEstruturada !== servidor.escolaNome;

  return (
    <div>
      <PageHeader
        title={`Olá, ${servidor.nome.split(" ")[0]}`}
        description={`${servidor.cargo ?? "Servidor(a)"} · ${servidor.escolaNome ?? escolaEstruturada ?? "Lotação na Secretaria"}`}
        metadata={
          freshnessServidores && (
            <span className="inline-flex items-center gap-1.5">
              Dados funcionais <DataFreshnessBadge situacao={freshnessServidores.situacao} />
            </span>
          )
        }
      />

      {escolaDivergente && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-subtle p-4 text-sm text-warning-subtle-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p>
            A escola informada pela origem (<strong>{servidor.escolaNome}</strong>) é diferente da unidade
            estruturada vinculada (<strong>{escolaEstruturada}</strong>). Se algo parecer errado, procure a
            Secretaria para confirmar sua lotação correta.
          </p>
        </div>
      )}

      <SectionCard title="Vínculo e lotação" className="mt-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          {camposFuncionais.map((field) => (
            <div key={field.label}>
              <dt className="text-xs text-foreground-muted">{field.label}</dt>
              <dd className="text-sm font-medium text-foreground">{field.value ?? NAO_INFORMADO}</dd>
            </div>
          ))}
        </dl>
      </SectionCard>

      {(servidor.email || servidor.telefone) && (
        <SectionCard
          title="Contato cadastrado"
          description="Sincronizado do SIGEduc — a correção não é feita por aqui."
          className="mt-6"
        >
          <dl className="grid gap-4 sm:grid-cols-2">
            {servidor.email && (
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-foreground-muted">
                  <Mail className="h-3.5 w-3.5" /> E-mail
                </dt>
                <dd className="text-sm font-medium text-foreground">{servidor.email}</dd>
              </div>
            )}
            {servidor.telefone && (
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-foreground-muted">
                  <Phone className="h-3.5 w-3.5" /> Telefone
                </dt>
                <dd className="text-sm font-medium text-foreground">{servidor.telefone}</dd>
              </div>
            )}
          </dl>
        </SectionCard>
      )}

      {servidor.pendenciaPedagogica && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-surface p-5 text-sm text-foreground">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-foreground-muted" />
          <div>
            <p>
              <strong>Pendência pedagógica:</strong> {servidor.pendenciaPedagogica}
            </p>
            <p className="mt-1 text-xs text-foreground-muted">
              Campo sincronizado do SIGEduc como veio da origem, sem interpretação adicional do SME — se o rótulo não
              fizer sentido para o seu cargo, ou se precisar de orientação sobre o que fazer a respeito, procure a
              Secretaria.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
