import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

/**
 * Retenciones viven bajo compras (compras/retenciones). Las vistas son las compartidas de
 * `tributos-sunat` parametrizadas por tipo: misma pantalla que retenciones/percepciones.
 */
export const retencionesRoutes: RouteRecordRaw[] = [
  {
    path: 'compras/retenciones',
    name: 'admin-retenciones',
    component: () => import('@/modules/tributos-sunat/components/TributoListView.vue'),
    props: { tipo: 'retencion' },
    meta: { title: 'Retenciones', module: 'compras', permission: PermisoBanderas.RETENCIONES_LISTAR },
  },
  {
    path: 'compras/retenciones/nueva',
    name: 'admin-retenciones-nueva',
    component: () => import('@/modules/tributos-sunat/components/TributoFormView.vue'),
    props: { tipo: 'retencion' },
    meta: { title: 'Nueva retención', module: 'compras', permission: PermisoBanderas.RETENCIONES_CREAR },
  },
  {
    path: 'compras/retenciones/:id(\\d+)',
    name: 'admin-retenciones-detalle',
    component: () => import('@/modules/tributos-sunat/components/TributoDetailView.vue'),
    props: { tipo: 'retencion' },
    meta: { title: 'Detalle de retención', module: 'compras', permission: PermisoBanderas.RETENCIONES_VER },
  },
]
