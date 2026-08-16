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
  cpf: string;
  matricula: string;
  data_nascimento: string;
  cargo: string;
  funo: string;
  disciplina: string;
  escola: string;
  codigo_inep_escola: string;
  pendencia_pedagogica: string;
  tipo_vinculo: string;
  status: string;
  email: string;
  telefone: string;
  carga_trabalho: number;
  turma: string;
  serie: string;
  turno: string;
}

export interface PaginatedResponse<T> {
  dados: T[];
  pagina: number;
  tamanho: number;
  totalElementos: number;
  temProximaPagina: boolean;
}

export interface EstudanteResponse {
  id: number;
  nome: string;
  matricula: string;
  cpf: string;
  data_nascimento: string;
  ano: number;
  nome_turma_serie: string;
  nomeEscola: string;
  nome_filiacao_1: string;
  nome_filiacao_2: string;
  nome_responsavel: string;
  documento_Responsavel: string;
  codigo_Nis: string;
}

export interface NotaBimestral {
  unidade: number;
  nota: number;
  descricao: string;
}

export interface FrequenciaRegistro {
  data: string;
  falta: number;
  quantidade_aula: number;
  abonada: boolean;
  motivo_abono: string | null;
  disciplina: string;
  turma: string;
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
): Promise<PaginatedResponse<unknown>> {
  return sigeducFetch<PaginatedResponse<unknown>>("/api/v1/consulta-nota", {
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
): Promise<PaginatedResponse<FrequenciaRegistro>> {
  return sigeducFetch<PaginatedResponse<FrequenciaRegistro>>("/api/v1/consulta-frequencia", {
    method: "GET",
    searchParams: { data_inicio: dataInicio, data_fim: dataFim, pagina, tamanho },
  });
}

export function consultarFrequenciaIndividual(
  identificador: string,
  dataInicio: string,
  dataFim: string,
): Promise<FrequenciaRegistro[]> {
  return sigeducFetch<FrequenciaRegistro[]>(
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
