import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QuestaoForm } from "./questao-form";
import { ResultadoForm } from "./resultado-form";
import { DeleteRowButton } from "./row-actions";
import { deleteQuestaoAction, deleteResultadoAction, deleteAvaliacaoAction } from "../actions";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/card";
import { DataTable, TableHeader, TableBody, TableRow, TableHeadCell, TableCell } from "@/components/ui/table";

interface PageProps {
  params: { id: string };
}

const NIVEL_LABEL: Record<string, string> = {
  NAO_LEITOR: "Não leitor",
  LEITOR_DE_SILABAS: "Leitor de sílabas",
  LEITOR_DE_PALAVRAS: "Leitor de palavras",
  LEITOR_DE_FRASES: "Leitor de frases",
  LEITOR_SEM_FLUENCIA: "Leitor sem fluência",
  LEITOR_FLUENTE: "Leitor fluente",
};

export default async function AvaliacaoDetailPage({ params }: PageProps) {
  const avaliacao = await prisma.avaliacao.findUnique({
    where: { id: params.id },
    include: {
      questoes: { orderBy: { numero: "asc" } },
      resultados: { include: { estudante: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!avaliacao) notFound();

  return (
    <div className="space-y-10">
      <PageHeader
        title={avaliacao.nome}
        description={`${avaliacao.codigo} · ${avaliacao.ano} · ${avaliacao.etapaEnsino ?? "Etapa não informada"}`}
        actions={
          <form action={deleteAvaliacaoAction.bind(null, avaliacao.id)}>
            <button type="submit" className="text-sm text-danger hover:underline">
              Excluir avaliação
            </button>
          </form>
        }
      />

      <section>
        <SectionCard title={`Questões (${avaliacao.questoes.length})`}>
          <QuestaoForm avaliacaoId={avaliacao.id} />
        </SectionCard>
        {avaliacao.questoes.length > 0 && (
          <div className="mt-4">
            <DataTable>
              <TableHeader>
                <tr>
                  <TableHeadCell>Nº</TableHeadCell>
                  <TableHeadCell>Descritor</TableHeadCell>
                  <TableHeadCell>Gabarito</TableHeadCell>
                  <TableHeadCell>Peso</TableHeadCell>
                  <TableHeadCell className="text-right">Ações</TableHeadCell>
                </tr>
              </TableHeader>
              <TableBody>
                {avaliacao.questoes.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="text-foreground">{q.numero}</TableCell>
                    <TableCell className="text-foreground-muted">{q.descritor ?? "-"}</TableCell>
                    <TableCell className="text-foreground-muted">{q.gabaritoCorreto ?? "-"}</TableCell>
                    <TableCell className="text-foreground-muted">{q.peso}</TableCell>
                    <TableCell className="text-right">
                      <DeleteRowButton onDelete={deleteQuestaoAction.bind(null, avaliacao.id, q.id)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          </div>
        )}
      </section>

      <section>
        <SectionCard title={`Resultados (${avaliacao.resultados.length})`}>
          <ResultadoForm avaliacaoId={avaliacao.id} />
        </SectionCard>
        {avaliacao.resultados.length > 0 && (
          <div className="mt-4">
            <DataTable>
              <TableHeader>
                <tr>
                  <TableHeadCell>Aluno</TableHeadCell>
                  <TableHeadCell>Turma</TableHeadCell>
                  <TableHeadCell>Pontuação</TableHeadCell>
                  <TableHeadCell>Nível</TableHeadCell>
                  <TableHeadCell className="text-right">Ações</TableHeadCell>
                </tr>
              </TableHeader>
              <TableBody>
                {avaliacao.resultados.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-foreground">{r.estudante.nome}</TableCell>
                    <TableCell className="text-foreground-muted">{r.turma}</TableCell>
                    <TableCell className="text-foreground-muted">{r.pontuacao ?? "-"}</TableCell>
                    <TableCell className="text-foreground-muted">
                      {r.nivelDesempenho ? NIVEL_LABEL[r.nivelDesempenho] : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteRowButton onDelete={deleteResultadoAction.bind(null, avaliacao.id, r.id)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          </div>
        )}
      </section>
    </div>
  );
}
