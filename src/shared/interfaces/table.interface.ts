export type TableColumnAlign = 'left' | 'center' | 'right'

export interface TableColumn<T = object> {
  key: string
  label: string
  align?: TableColumnAlign
  headerClass?: string
  cellClass?: string
  formatter?: (value: unknown, row: T) => string
  hidden?: boolean
}

export type TableRowKey<T> = keyof T | ((row: T) => string | number)
