import { SearchInput } from "./search-input";
import { PageSizeSelect } from "./page-size-select";

interface ListToolbarProps {
  searchPlaceholder?: string;
  searchParamName?: string;
  pageSizeOptions?: readonly number[];
  defaultPageSize?: number;
}

/** Barra padrão de listagens: busca + seletor de itens por página. */
export function ListToolbar({
  searchPlaceholder,
  searchParamName,
  pageSizeOptions,
  defaultPageSize,
}: ListToolbarProps) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <SearchInput placeholder={searchPlaceholder} paramName={searchParamName} />
      <PageSizeSelect options={pageSizeOptions} defaultValue={defaultPageSize} />
    </div>
  );
}
