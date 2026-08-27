import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { requireSession } from "@/lib/require-session";
import { ImportarCaedForm } from "./importar-caed-form";

export default async function ImportarCaedPage() {
  await requireSession(["ADMIN", "SECRETARIA"]);
  const anoAtual = new Date().getFullYear();

  return (
    <div>
      <PageHeader
        title="Importar indicadores do CAEd (Criança Alfabetizada)"
        description="Importa os CSVs de 'Habilidade, Participação e Desempenho - Turma' baixados do portal Criança Alfabetizada, casando cada escola pelo código INEP embutido no nome."
        breadcrumbs={
          <Link href="/admin/avaliacoes" className="text-primary hover:underline">
            ← Avaliações
          </Link>
        }
      />

      <div className="mt-6 max-w-3xl space-y-2 rounded-lg border border-border bg-surface p-4 text-sm text-foreground-muted">
        <p>
          No portal <span className="font-mono text-xs">criancaalfabetizada.caeddigital.net</span>, para cada
          combinação de <strong>Ano escolar</strong> e <strong>Componente curricular</strong> que você quiser
          trazer: selecione os filtros, abra a aba <strong>&quot;Participação e desempenho&quot;</strong> (ou
          &quot;Acerto por habilidade&quot;), clique em <strong>&quot;Baixar dados&quot;</strong> e marque a opção{" "}
          <strong>&quot;Turma&quot;</strong>.
        </p>
        <p>
          Um único ciclo (Ciclo I ou Ciclo II) pode ter até 5 anos escolares × 4 componentes = 20 arquivos. Selecione
          o ciclo/ano abaixo e envie todos os CSVs desse ciclo de uma vez — cada linha do CSV já traz o ano escolar e
          o componente curricular, então não precisa separar por arquivo.
        </p>
      </div>

      <div className="mt-6">
        <ImportarCaedForm anoAtual={anoAtual} />
      </div>
    </div>
  );
}
