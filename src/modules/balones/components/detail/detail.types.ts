export interface DetailSectionItem {
  label: string
  value?: string | null
  fullWidth?: boolean
}

export interface DetailSection {
  title: string
  items: DetailSectionItem[]
  fullWidth?: boolean
}
