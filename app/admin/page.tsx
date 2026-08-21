import Link from "next/link";
import { ClipboardList, FileText, GraduationCap, RefreshCw, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const [totalPosts, totalServidores, totalEstudantes, totalAvaliacoes] = await Promise.all([
    prisma.post.count(),
    prisma.servidor.count(),
    prisma.estudante.count(),
    prisma.avaliacao.count(),
  ]);

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

      <Card className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary-subtle-foreground">
            <RefreshCw className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm font-semibold text-foreground">Sincronização SIGEduc</div>
            <p className="mt-0.5 text-sm text-foreground-muted">
              Utilize a sincronização para importar escolas, servidores e estudantes a partir da API Educ 21.
            </p>
          </div>
        </div>
        <Link href="/admin/sincronizacao" className={buttonVariants({ variant: "secondary" })}>
          Ir para Sincronização
        </Link>
      </Card>
    </div>
  );
}
