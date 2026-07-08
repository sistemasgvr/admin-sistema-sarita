import type { IconName } from '@/shared/constants/icons'

export interface DetailSectionItem {
  label: string
  value?: string | null
  fullWidth?: boolean
}

export interface DetailSection {
  title: string
  icon?: IconName
  items: DetailSectionItem[]
  fullWidth?: boolean
}
