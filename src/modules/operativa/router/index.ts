import type { RouteRecordRaw } from 'vue-router'
import { actividadesRoutes } from '@/modules/operativa/actividades/router'

export const operativaRoutes: RouteRecordRaw[] = [...actividadesRoutes]
