export interface PaginationMeta {
  pagina: number
  limite: number
  total: number
}

export interface PaginationSummary {
  from: number
  to: number
  total: number
}

export type PaginationItem = number | 'ellipsis'
