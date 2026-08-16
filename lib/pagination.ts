export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export interface PaginationSearchParams {
  page?: string;
  pageSize?: string;
}

export interface ParsePaginationOptions {
  defaultPageSize?: number;
  /** Valores aceitos para `pageSize` (deve bater com as opções exibidas no PageSizeSelect da página). */
  allowedPageSizes?: readonly number[];
}

/** Lê `page`/`pageSize` da query string e calcula `skip`/`take` para o Prisma. */
export function parsePaginationParams(
  searchParams: PaginationSearchParams,
  { defaultPageSize = DEFAULT_PAGE_SIZE, allowedPageSizes = PAGE_SIZE_OPTIONS }: ParsePaginationOptions = {},
): PaginationParams {
  const page = Math.max(1, Math.trunc(Number(searchParams.page)) || 1);
  const rawPageSize = Math.trunc(Number(searchParams.pageSize)) || defaultPageSize;
  const pageSize = allowedPageSizes.includes(rawPageSize) ? rawPageSize : defaultPageSize;
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function totalPagesFor(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
