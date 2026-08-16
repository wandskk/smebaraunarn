import { AvaliacaoForm } from "./avaliacao-form";

export default function NewAvaliacaoPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Nova Avaliação Municipal</h1>
      <p className="mt-1 text-sm text-slate-500">
        Cadastre uma avaliação de Fluência Leitora, SPADEB, simulado ou prova municipal.
      </p>
      <div className="mt-6">
        <AvaliacaoForm />
      </div>
    </div>
  );
}
