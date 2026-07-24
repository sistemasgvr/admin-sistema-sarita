export interface PaginationMeta {
  pagina: number
  limite: number
  total: number
  resumen?: Record<string, unknown> | null
}

export interface PaginationSummary {
  from: number
  to: number
  total: number
}

export type PaginationItem = number | 'ellipsis'
