/** Nombres de iconos Iconify usados en la app (colección lucide) */
export const ICONS = {
  dashboard: 'lucide:layout-grid',
  users: 'lucide:users',
  package: 'lucide:package',
  clipboardList: 'lucide:clipboard-list',
  settings: 'lucide:settings',
  chevronDown: 'lucide:chevron-down',
  chevronLeft: 'lucide:chevron-left',
  chevronRight: 'lucide:chevron-right',
  ellipsis: 'lucide:ellipsis',
  userCircle: 'lucide:user-circle',
  logOut: 'lucide:log-out',
  sun: 'lucide:sun',
  moon: 'lucide:moon',
  menu: 'lucide:menu',
  x: 'lucide:x',
  search: 'lucide:search',
  bell: 'lucide:bell',
  construction: 'lucide:construction',
  eye: 'lucide:eye',
  eyeOff: 'lucide:eye-off',
  check: 'lucide:check',
} as const

export type IconName = (typeof ICONS)[keyof typeof ICONS]
