import type { TableColumnAlign, TableRowKey } from '@/shared/interfaces/table.interface'

export function getTableCellValue<T extends Record<string, unknown>>(
  row: T,
  key: string,
): unknown {
  return key.split('.').reduce<unknown>((value, part) => {
    if (value && typeof value === 'object' && part in value) {
      return (value as Record<string, unknown>)[part]
    }
    return undefined
  }, row)
}

export function formatTableCellValue<T extends Record<string, unknown>>(
  row: T,
  column: { key: string; formatter?: (value: unknown, row: T) => string },
): string {
  const value = getTableCellValue(row, column.key)

  if (column.formatter) {
    return column.formatter(value, row)
  }

  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return String(value)
}

export function resolveTableRowKey<T extends Record<string, unknown>>(
  row: T,
  index: number,
  rowKey?: TableRowKey<T>,
): string | number {
  if (typeof rowKey === 'function') {
    return rowKey(row)
  }

  if (rowKey && row[rowKey as string] !== undefined) {
    return row[rowKey as string] as string | number
  }

  if (row.id !== undefined) {
    return row.id as string | number
  }

  return index
}

export function getTableAlignClass(align: TableColumnAlign = 'left'): string {
  const classes: Record<TableColumnAlign, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }

  return classes[align]
}
