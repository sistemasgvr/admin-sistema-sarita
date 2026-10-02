import type { PaginatedResult } from '@/shared/api/interfaces/api.interface'
import type { PaginationItem, PaginationSummary } from '@/shared/interfaces/pagination.interface'

/** Trae todas las páginas de un listado paginado (selects / exports). */
export async function fetchAllPaginated<F extends { pagina?: number; limite?: number }, X>(
  listar: (filters: F) => Promise<PaginatedResult<X[]>>,
  baseFilters: F,
  pageSize = 500,
): Promise<X[]> {
  const primera = await listar({ ...baseFilters, pagina: 1, limite: pageSize })
  const registros = [...primera.data]
  const totalPaginas = Math.ceil((primera.meta.total || registros.length) / pageSize)

  for (let pagina = 2; pagina <= totalPaginas; pagina++) {
    const siguiente = await listar({ ...baseFilters, pagina, limite: pageSize })
    registros.push(...siguiente.data)
  }

  return registros
}

export function getTotalPages(total: number, limite: number): number {
  if (limite <= 0 || total <= 0) return 0
  return Math.ceil(total / limite)
}

export function getPaginationSummary(
  pagina: number,
  limite: number,
  total: number,
): PaginationSummary {
  if (total <= 0) {
    return { from: 0, to: 0, total: 0 }
  }

  const from = (pagina - 1) * limite + 1
  const to = Math.min(pagina * limite, total)

  return { from, to, total }
}

export function createPaginationRange(
  currentPage: number,
  totalPages: number,
  siblingCount = 1,
): PaginationItem[] {
  if (totalPages <= 0) return []
  if (totalPages === 1) return [1]

  const totalNumbers = siblingCount * 2 + 5

  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages)
  const shouldShowLeftDots = leftSiblingIndex > 2
  const shouldShowRightDots = rightSiblingIndex < totalPages - 1

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + 2 * siblingCount
    const leftRange = Array.from({ length: leftItemCount }, (_, index) => index + 1)
    return [...leftRange, 'ellipsis', totalPages]
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + 2 * siblingCount
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, index) => totalPages - rightItemCount + index + 1,
    )
    return [1, 'ellipsis', ...rightRange]
  }

  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, index) => leftSiblingIndex + index,
  )

  return [1, 'ellipsis', ...middleRange, 'ellipsis', totalPages]
}
