"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ANOS_LETIVOS_COOKIE_NAME } from "@/lib/queries/anos-letivos";

const COOKIE_MAX_AGE_SEGUNDOS = 60 * 60 * 24 * 180; // 180 dias
const PREFIXO_QUERY_PARAM_EXTRA = "extra_";

/**
 * Restringe a um caminho relativo interno (`/algo`, nunca `//algo` — que o
 * browser trataria como protocol-relative para outro host) — o campo vem de
 * um hidden input de um Client Component, então é dado do formulário, não
 * algo que o servidor já validou; sem isso, `redirect()` viraria um
 * open-redirect (achado real de revisão adversarial na ETAPA 02).
 */
function caminhoSeguro(pathname: string): string {
  return pathname.startsWith("/") && !pathname.startsWith("//") ? pathname : "/";
}

/**
 * Grava a seleção de ano(s) letivo(s) no cookie `sme_anos_letivos` (mesmas
 * opções de `lib/auth.ts`) e redireciona de volta para a própria página com
 * `?anos=` já refletindo a escolha — o cookie é o que faz a seleção
 * sobreviver a uma navegação pela sidebar (que não propaga `?anos=`); a
 * query string continua sendo a fonte de verdade imediata da página atual.
 * Escrever cookie exige Server Action no App Router — não dá pra fazer só
 * com `<form method="get">`.
 */
export async function salvarSelecaoAnosLetivosAction(formData: FormData) {
  const pathname = caminhoSeguro(String(formData.get("pathname") ?? "/"));
  const modo = String(formData.get("modo") ?? "unico");
  const anos = formData.getAll("anos").map(String);

  (await cookies()).set(ANOS_LETIVOS_COOKIE_NAME, JSON.stringify({ modo, anos }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEGUNDOS,
  });

  const params = new URLSearchParams();
  // Preserva qualquer outro filtro que a página já tivesse na URL (ex.:
  // disciplina/unidade em Aprendizagem, sinal em Comparativos) — sem isso, o
  // filtro de ano resetaria filtros que não são da sua responsabilidade.
  for (const [chave, valor] of formData.entries()) {
    if (chave.startsWith(PREFIXO_QUERY_PARAM_EXTRA) && typeof valor === "string") {
      params.set(chave.slice(PREFIXO_QUERY_PARAM_EXTRA.length), valor);
    }
  }
  if (modo === "todos") {
    params.set("anos", "todos");
  } else {
    for (const ano of anos) params.append("anos", ano);
  }
  redirect(`${pathname}?${params.toString()}`);
}
