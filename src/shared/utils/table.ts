import type {
  TableColumn,
  TableColumnAlign,
  TableMobileLayout,
  TableRowKey,
} from '@/shared/interfaces/table.interface'

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

const BADGE_COLUMN_KEY_PATTERN = /(^|_)(estado|status)(_|$)|nombre_estado/i
const PRIMARY_COLUMN_KEY_PATTERN =
  /codigo|nombre|cliente|prestamo|producto|usuario|cilindro|balon|descripcion|titulo/i
const DATE_FIRST_COLUMN_PATTERN = /^fecha/i

function isBadgeColumn<T extends object>(column: TableColumn<T>): boolean {
  return BADGE_COLUMN_KEY_PATTERN.test(column.key) || /^estado$/i.test(column.label.trim())
}

function isDateLikeColumn<T extends object>(column?: TableColumn<T>): boolean {
  if (!column) return false
  return (
    DATE_FIRST_COLUMN_PATTERN.test(column.key) ||
    /^(fecha|creado|solicitado)$/i.test(column.label.trim())
  )
}

function resolveDefaultPrimaryColumn<T extends object>(
  visible: TableColumn<T>[],
): TableColumn<T> | undefined {
  const explicit = visible.find((column) => column.mobile === 'primary')
  if (explicit) return explicit

  const first = visible[0]
  if (isDateLikeColumn(first)) {
    const candidate = visible.find(
      (column) =>
        column.mobile !== 'hidden' && PRIMARY_COLUMN_KEY_PATTERN.test(column.key),
    )
    if (candidate) return candidate
  }

  return first
}

export function resolveMobileLayout<T extends object>(
  columns: TableColumn<T>[],
  overrides?: { primaryKey?: string; badgeKey?: string },
): TableMobileLayout<T> {
  const visible = columns.filter((column) => !column.hidden)

  const primary =
    (overrides?.primaryKey
      ? visible.find((column) => column.key === overrides.primaryKey)
      : undefined) ?? resolveDefaultPrimaryColumn(visible)

  let badge =
    visible.find((column) => column.mobile === 'badge' && column !== primary) ??
    (overrides?.badgeKey
      ? visible.find((column) => column.key === overrides.badgeKey && column !== primary)
      : undefined)

  if (!badge) {
    badge = visible.find(
      (column) => column !== primary && column.mobile !== 'hidden' && isBadgeColumn(column),
    )
  }

  const fields = visible.filter((column) => {
    if (column === primary || column === badge) return false
    if (column.mobile === 'hidden') return false
    return true
  })

  return { primary, badge, fields }
}
