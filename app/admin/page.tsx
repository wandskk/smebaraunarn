import Link from "next/link";
import { AlertTriangle, ClipboardList, FileText, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";
import { getStatusSincronizacao, ROTULO_MODULO } from "@/lib/queries/qualidade-dados";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { Card } from "@/components/ui/card";
import { DataFreshnessBadge } from "@/components/ui/data-freshness-badge";
import { buttonVariants } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const [totalPosts, totalServidores, totalEstudantes, totalAvaliacoes, { modulos }] = await Promise.all([
    prisma.post.count(),
    prisma.servidor.count(),
    prisma.estudante.count(),
    prisma.avaliacao.count(),
    getStatusSincronizacao(),
  ]);

  const modulosComProblema = modulos.filter((m) => m.situacao !== "em-dia");

  const cards = [
    { label: "Publicações no CMS", value: totalPosts, href: "/admin/posts", icon: FileText, accent: "warning" as const },
    { label: "Servidores cadastrados", value: totalServidores, href: "/admin/servidores", icon: Users, accent: "success" as const },
    { label: "Estudantes enturmados", value: totalEstudantes, href: "/admin/estudantes", icon: GraduationCap, accent: "primary" as const },
    { label: "Avaliações municipais", value: totalAvaliacoes, href: "/admin/avaliacoes", icon: ClipboardList, accent: "education" as const },
  ];

  return (
    <div>
      <PageHeader title="Visão Geral" description="Resumo do portal e da base de dados sincronizada." />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <MetricCard
            key={card.label}
            label={card.label}
            value={formatNumber(card.value)}
            icon={card.icon}
            href={card.href}
            accent={card.accent}
          />
        ))}
      </div>

      <Card className="mt-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                modulosComProblema.length > 0 ? "bg-warning-subtle text-warning-subtle-foreground" : "bg-success-subtle text-success-subtle-foreground"
              }`}
            >
              {modulosComProblema.length > 0 ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            </span>
            <div>
              <div className="text-sm font-semibold text-foreground">Saúde da base</div>
              <p className="mt-0.5 text-sm text-foreground-muted">
                {modulosComProblema.length === 0
                  ? "Todos os módulos sincronizados estão em dia."
                  : `${modulosComProblema.length} módulo(s) atrasado(s) ou sem sincronização — os indicadores que dependem deles podem estar desatualizados.`}
              </p>
            </div>
          </div>
          <Link href="/admin/sincronizacao" className={buttonVariants({ variant: "secondary" })}>
            Ir para Sincronização
          </Link>
        </div>

        <div className="mt-4 grid gap-2 border-t border-border pt-4 sm:grid-cols-3 lg:grid-cols-6">
          {modulos.map((m) => (
            <div key={m.modulo} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-foreground-muted">{ROTULO_MODULO[m.modulo]}</span>
              <DataFreshnessBadge situacao={m.situacao} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
