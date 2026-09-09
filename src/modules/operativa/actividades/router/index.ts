import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const actividadesRoutes: RouteRecordRaw[] = [
  {
    path: 'operativa/actividades',
    name: 'admin-operativa-actividades',
    component: () => import('@/modules/operativa/actividades/views/ActividadesView.vue'),
    meta: {
      title: 'Actividades',
      module: 'operativa-actividades',
      permission: PermisoBanderas.ACTIVIDADES_LISTAR,
    },
  },
  {
    path: 'operativa/actividades/nueva',
    name: 'admin-operativa-actividades-nueva',
    component: () => import('@/modules/operativa/actividades/views/ActividadFormView.vue'),
    meta: {
      title: 'Nueva actividad',
      module: 'operativa-actividades',
      permission: PermisoBanderas.ACTIVIDADES_CREAR,
    },
  },
  {
    // Antes el detalle era un modal sobre el listado. Pasó a vista propia
    // porque su pie ponía "Cancelar" (que cancela la actividad) junto a
    // "Cerrar", y se pulsaba por error creyendo que cerraba el diálogo.
    path: 'operativa/actividades/:id(\\d+)',
    name: 'admin-operativa-actividades-detalle',
    component: () => import('@/modules/operativa/actividades/views/ActividadDetalleView.vue'),
    meta: {
      title: 'Detalle de actividad',
      module: 'operativa-actividades',
      permission: PermisoBanderas.ACTIVIDADES_VER,
    },
  },
  {
    path: 'operativa/actividades/:id(\\d+)/editar',
    name: 'admin-operativa-actividades-editar',
    component: () => import('@/modules/operativa/actividades/views/ActividadFormView.vue'),
    meta: {
      title: 'Editar actividad',
      module: 'operativa-actividades',
      permission: PermisoBanderas.ACTIVIDADES_EDITAR,
    },
  },
]
