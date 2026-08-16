import "server-only";

/**
 * Cliente para a API SIGEduc (Educ 21).
 * Documentação de referência: endpoints mapeados internamente pela SME Baraúna.
 */

const BASE_URL = process.env.SIGEDUC_API_BASE_URL ?? "https://api.educ21.com.br";

function getHeaders(): HeadersInit {
  const apiKey = process.env.SIGEDUC_API_KEY;
  const clientId = process.env.SIGEDUC_CLIENT_ID;
  if (!apiKey || !clientId) {
    throw new Error("SIGEDUC_API_KEY / SIGEDUC_CLIENT_ID não configurados.");
  }
  return {
    "X-API-KEY": apiKey,
    "X-CLIENT-ID": clientId,
    Accept: "application/json",
  };
}

export class SigeducApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "SigeducApiError";
    this.status = status;
  }
}

async function sigeducFetch<T>(
  path: string,
  init: RequestInit & { searchParams?: Record<string, string | number | boolean | undefined> } = {},
): Promise<T> {
  const { searchParams, ...rest } = init;
  const url = new URL(path.replace(/^\//, ""), BASE_URL + "/");

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: HeadersInit = {
    ...getHeaders(),
    ...(rest.body ? { "Content-Type": "application/json" } : {}),
    ...rest.headers,
  };

  const response = await fetch(url.toString(), {
    ...rest,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new SigeducApiError(
      `SIGEduc ${response.status} em ${path}: ${text || response.statusText}`,
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

// ---------- Tipos ----------

export interface EscolaResponse {
  id: number;
  nome: string;
  codigo_inep: string;
}

export interface CargoResponse {
  id: number;
  categoria: string;
  denominacao: string;
  nivelCargo: string;
}

export interface ServidorResponse {
  nome: string;
  cpf: string | null;
  matricula: string | null;
  data_nascimento: string | null;
  cargo: string | null;
  funo: string | null;
  disciplina: string | null;
  escola: string | null;
  codigo_inep_escola: string | null;
  pendencia_pedagogica: string | null;
  tipo_vinculo: string | null;
  status: string | null;
  email: string | null;
  telefone: string | null;
  carga_trabalho: number | null;
  turma: string | null;
  serie: string | null;
  turno: string | null;
}

export interface PaginatedResponse<T> {
  dados: T[];
  pagina: number;
  tamanho: number;
  totalElementos: number;
  totalPaginas: number;
  temProximaPagina: boolean;
}

export interface EstudanteResponse {
  id: number;
  nome: string;
  matricula: string;
  cpf: string | null;
  data_nascimento: string | null;
  ano: number;
  nome_turma_serie: string | null;
  nomeEscola: string | null;
  nome_filiacao_1: string | null;
  nome_filiacao_2: string | null;
  nome_responsavel: string | null;
  documento_Responsavel: string | null;
  codigo_Nis: string | null;
}

/**
 * Formato real observado em produção — bastante diferente do descrito
 * originalmente. `consulta-nota` é paginada por ALUNO (não por nota):
 * cada elemento de `dados` traz um aluno com todas as suas disciplinas e
 * bimestres aninhados em `turmas_componentes[].notas[]`.
 */
export interface NotaBimestral {
  unidade: number; // bimestre (1-4)
  nota: number;
  descricao: string;
}

export interface TurmaComponenteNota {
  escola: string;
  etapa_ensino: string;
  serie: string;
  turma: string;
  disciplina: string;
  quantidade_notas: number;
  notas: NotaBimestral[];
}

export interface ConsultaNotaAluno {
  matricula: string;
  estudante: string;
  cpf: string | null;
  turmas_componentes: TurmaComponenteNota[];
}

/**
 * `consulta-frequencia` também é paginada por ALUNO, com os registros
 * diários aninhados em `frequencias[]`. Atenção: o campo `unidade` aqui
 * traz o NOME DA ESCOLA (nome herdado de um esquema interno da Educ21),
 * não tem relação com bimestre — não confundir com `NotaBimestral.unidade`.
 */
export interface FrequenciaRegistro {
  unidade: string; // nome da escola (ver nota acima)
  etapa_ensino: string;
  serie: string;
  turma: string;
  disciplina: string;
  data: string;
  falta: number;
  quantidade_aula: number;
  abonada: boolean;
  motivo_abono: string | null;
}

export interface ConsultaFrequenciaAluno {
  matricula: string;
  estudante: string;
  cpf: string | null;
  quantidade_frequencia: number;
  frequencias: FrequenciaRegistro[];
}

// ---------- Escolas / Cargos ----------

export function consultarEscolas(nome?: string): Promise<EscolaResponse[]> {
  return sigeducFetch<EscolaResponse[]>("/api/v1/consulta-escola", {
    method: "GET",
    searchParams: { nome },
  });
}

export function consultarCargos(denominacao?: string): Promise<CargoResponse[]> {
  return sigeducFetch<CargoResponse[]>("/api/v1/consulta-cargo", {
    method: "GET",
    searchParams: { denominacao },
  });
}

// ---------- Servidores ----------

export interface ConsultaServidorBody {
  cpf?: string;
  matricula?: string;
  idsEscolas?: number[];
  idsCargos?: number[];
}

export function consultarServidores(
  body: ConsultaServidorBody,
  pagina = 0,
  tamanho = 1000,
): Promise<PaginatedResponse<ServidorResponse>> {
  return sigeducFetch<PaginatedResponse<ServidorResponse>>("/api/v1/consulta-servidor", {
    method: "POST",
    searchParams: { pagina, tamanho },
    body: JSON.stringify(body),
  });
}

// ---------- Estudantes ----------

export interface ConsultaEstudanteBody {
  ano?: number;
  idEscola?: number;
  idTurmaSerie?: number;
  nome?: string;
  cpf?: string;
  ordenarPor?: string;
  direcaoOrdenacao?: string;
}

export function consultarEstudantesEnturmados(
  body: ConsultaEstudanteBody,
  pagina = 0,
  tamanho = 1000,
): Promise<PaginatedResponse<EstudanteResponse>> {
  return sigeducFetch<PaginatedResponse<EstudanteResponse>>(
    "/api/v1/consulta-estudante/enturmado",
    {
      method: "POST",
      searchParams: { pagina, tamanho },
      body: JSON.stringify(body),
    },
  );
}

// ---------- Notas ----------

export function consultarNotas(
  ano: number,
  pagina = 0,
  tamanho = 1000,
): Promise<PaginatedResponse<ConsultaNotaAluno>> {
  return sigeducFetch<PaginatedResponse<ConsultaNotaAluno>>("/api/v1/consulta-nota", {
    method: "GET",
    searchParams: { ano, pagina, tamanho },
  });
}

export function consultarBoletimIndividual(identificador: string, ano: number): Promise<unknown> {
  return sigeducFetch<unknown>(`/api/v1/consulta-nota/${encodeURIComponent(identificador)}`, {
    method: "GET",
    searchParams: { ano },
  });
}

// ---------- Frequência ----------

export function consultarFrequencia(
  dataInicio: string,
  dataFim: string,
  pagina = 0,
  tamanho = 1000,
): Promise<PaginatedResponse<ConsultaFrequenciaAluno>> {
  return sigeducFetch<PaginatedResponse<ConsultaFrequenciaAluno>>("/api/v1/consulta-frequencia", {
    method: "GET",
    searchParams: { data_inicio: dataInicio, data_fim: dataFim, pagina, tamanho },
  });
}

export function consultarFrequenciaIndividual(
  identificador: string,
  dataInicio: string,
  dataFim: string,
): Promise<unknown> {
  return sigeducFetch<unknown>(
    `/api/v1/consulta-frequencia/${encodeURIComponent(identificador)}`,
    {
      method: "GET",
      searchParams: { data_inicio: dataInicio, data_fim: dataFim },
    },
  );
}

// ---------- Documentos ----------

export async function baixarDeclaracaoMatricula(
  identificador: string,
  ano: number,
): Promise<Blob> {
  const url = new URL("api/v1/documento/declaracao-matricula", BASE_URL + "/");
  url.searchParams.set("identificador", identificador);
  url.searchParams.set("ano", String(ano));
  url.searchParams.set("download", "true");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new SigeducApiError(
      `SIGEduc ${response.status} ao baixar declaração de matrícula`,
      response.status,
    );
  }

  return response.blob();
}
