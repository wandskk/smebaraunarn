import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getEstudanteBySession } from "@/lib/queries/portal";
import { baixarDeclaracaoMatricula, SigeducApiError } from "@/lib/sigeduc";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ALUNO") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const estudante = await getEstudanteBySession(session);
  if (!estudante) {
    return NextResponse.json({ error: "Estudante não encontrado." }, { status: 404 });
  }

  const ano = Number(request.nextUrl.searchParams.get("ano")) || new Date().getFullYear();

  try {
    const blob = await baixarDeclaracaoMatricula(estudante.matricula, ano);
    return new NextResponse(blob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="declaracao-matricula-${estudante.matricula}.pdf"`,
      },
    });
  } catch (error) {
    const status = error instanceof SigeducApiError ? error.status : 502;
    return NextResponse.json({ error: "Não foi possível gerar a declaração no momento." }, { status });
  }
}
