import "server-only";

import { NextResponse, type NextRequest } from "next/server";

/**
 * Vercel Cron Jobs enviam automaticamente o header
 * `Authorization: Bearer $CRON_SECRET` quando a variável de ambiente
 * CRON_SECRET está configurada no projeto. Isso garante que só o
 * agendador da Vercel (ou alguém com o segredo) consiga disparar essas
 * rotas — sem isso, qualquer pessoa poderia acionar uma sincronização
 * completa só acessando a URL.
 */
export function verifyCronRequest(request: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET não configurado." }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  return null;
}
