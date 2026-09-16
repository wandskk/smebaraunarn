import { Loader2 } from "lucide-react";

/**
 * Fallback do segmento raiz — cobre as rotas públicas sem `loading.tsx`
 * próprio (`/`, `/login`, `/noticias`, `/noticias/[slug]`, `/documentos`,
 * `/conta`), que têm formas de página bem diferentes entre si (hero, form,
 * listagem, perfil) pra valer um skeleton dedicado por página. `/admin` e
 * `/portal/*` já têm seu próprio `loading.tsx` (DashboardSkeleton) e não
 * usam este.
 */
export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Carregando" />
    </div>
  );
}
