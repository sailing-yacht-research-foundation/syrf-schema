export interface PaginationFilter {
  field: string;
  value: string | number | Date;
  opr: string;
  isNested?: boolean;
  query?: object;
  order?: ([any, any] | any)[];
  isCustom?: boolean;
}

export interface PaginationRequest {
  query: string;
  page: number;
  size: number;
  sort: string;
  draw: number;
  srdir: -1 | 1;
  multiSort: Array<[string, 'ASC' | 'DESC']>;
  filters: PaginationFilter[];
  customCountField?: string;
  forceDefaultSort?: boolean;
  defaultSort: Array<[string | any, 'ASC' | 'DESC']>;
}

export interface PaginationResponse<T> {
  count: number;
  rows: Array<T>;
  page: number;
  size: number;
  sort: string;
  srdir: string;
  q: string;
  multiSort: Array<[string, 'ASC' | 'DESC']>;
  filters: PaginationFilter[];
}
