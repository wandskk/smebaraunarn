import { AvaliacaoForm } from "./avaliacao-form";
import { PageHeader } from "@/components/ui/page-header";

export default function NewAvaliacaoPage() {
  return (
    <div>
      <PageHeader
        title="Nova Avaliação Municipal"
        description="Cadastre uma avaliação de Fluência Leitora, SPADEB, simulado ou prova municipal."
      />
      <div className="mt-6">
        <AvaliacaoForm />
      </div>
    </div>
  );
}
