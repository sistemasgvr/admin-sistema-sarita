import type { TableColumnAlign, TableRowKey } from '@/shared/interfaces/table.interface'

export function getTableCellValue<T extends object>(row: T, key: string): unknown {
  return key.split('.').reduce<unknown>((value, part) => {
    if (value && typeof value === 'object' && part in value) {
      return (value as Record<string, unknown>)[part]
    }
    return undefined
  }, row)
}

export function formatTableCellValue<T extends object>(
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

export function resolveTableRowKey<T extends object>(
  row: T,
  index: number,
  rowKey?: TableRowKey<T>,
): string | number {
  if (typeof rowKey === 'function') {
    return rowKey(row)
  }

  const record = row as Record<string, unknown>

  if (rowKey && record[rowKey as string] !== undefined) {
    return record[rowKey as string] as string | number
  }

  if (record.id !== undefined) {
    return record.id as string | number
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
