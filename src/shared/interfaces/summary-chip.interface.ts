import type { BadgeColor } from '@/shared/interfaces/badge.interface'
export interface SummaryChip {
  label: string
  value: number | string
  color?: BadgeColor
}
