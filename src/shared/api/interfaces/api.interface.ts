import type { PaginationMeta } from '@/shared/interfaces/pagination.interface'

export type { PaginationMeta }

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  meta?: PaginationMeta
}

export interface PaginatedResult<T> {
  data: T
  meta: PaginationMeta
}

export interface ApiErrorResponse {
  success: false
  message: string
  data: null
  errors: string[] | null
  statusCode: number
}
