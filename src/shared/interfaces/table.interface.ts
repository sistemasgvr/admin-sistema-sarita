export type TableColumnAlign = 'left' | 'center' | 'right'

export type TableColumnMobileRole = 'primary' | 'badge' | 'field' | 'hidden'

export interface TableColumn<T = object> {
  key: string
  label: string
  align?: TableColumnAlign
  headerClass?: string
  cellClass?: string
  formatter?: (value: unknown, row: T) => string
  hidden?: boolean
  mobile?: TableColumnMobileRole
}

export type TableRowKey<T> = keyof T | ((row: T) => string | number)

export interface TableMobileLayout<T = object> {
  primary?: TableColumn<T>
  badge?: TableColumn<T>
  fields: TableColumn<T>[]
}
