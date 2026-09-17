import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

/**
 * Percepciones viven bajo ventas (ventas/percepciones). Las vistas son las compartidas de
 * `tributos-sunat` parametrizadas por tipo: misma pantalla que retenciones/percepciones.
 */
export const percepcionesRoutes: RouteRecordRaw[] = [
  {
    path: 'ventas/percepciones',
    name: 'admin-percepciones',
    component: () => import('@/modules/tributos-sunat/components/TributoListView.vue'),
    props: { tipo: 'percepcion' },
    meta: { title: 'Percepciones', module: 'ventas', permission: PermisoBanderas.PERCEPCIONES_LISTAR },
  },
  {
    path: 'ventas/percepciones/nueva',
    name: 'admin-percepciones-nueva',
    component: () => import('@/modules/tributos-sunat/components/TributoFormView.vue'),
    props: { tipo: 'percepcion' },
    meta: { title: 'Nueva percepción', module: 'ventas', permission: PermisoBanderas.PERCEPCIONES_CREAR },
  },
  {
    path: 'ventas/percepciones/:id(\\d+)',
    name: 'admin-percepciones-detalle',
    component: () => import('@/modules/tributos-sunat/components/TributoDetailView.vue'),
    props: { tipo: 'percepcion' },
    meta: { title: 'Detalle de percepción', module: 'ventas', permission: PermisoBanderas.PERCEPCIONES_VER },
  },
]
