import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Formata uma data no formato ISO (YYYY-MM-DD, como `FrequenciaEstudante.data`
 * e as janelas de `lib/analytics/frequencia.ts:calcularJanelaDias`) para
 * dd/MM/yyyy. O `T00:00:00` (sem `Z`) força o parse no fuso local, evitando
 * que uma data-only string "role" um dia para trás/frente conforme o fuso.
 */
export function formatarDataIso(data: string): string {
  return format(new Date(`${data}T00:00:00`), "dd/MM/yyyy", { locale: ptBR });
}
