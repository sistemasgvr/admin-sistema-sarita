import type { IconName } from '@/shared/constants/icons'

export interface AppTabItem {
  key: string
  label: string
  icon?: IconName
  badge?: number
  disabled?: boolean
}
