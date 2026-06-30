import type { RouteRecordRaw } from 'vue-router'
import { PermisoBanderas } from '@/shared/constants/permissions'

export const configuracionRoutes: RouteRecordRaw[] = [
  {
    path: 'configuracion',
    children: [
      {
        path: '',
        name: 'admin-configuracion',
        component: () => import('@/modules/configuracion/views/ConfiguracionHubView.vue'),
        meta: {
          title: 'Configuración',
          module: 'configuracion',
          permission: PermisoBanderas.CONFIGURACION_VER,
        },
      },
      {
        path: 'sucursales',
        name: 'admin-configuracion-sucursales',
        component: () =>
          import('@/modules/configuracion/sucursales/views/SucursalesListView.vue'),
        meta: {
          title: 'Sucursales',
          module: 'configuracion',
          permission: PermisoBanderas.SUCURSALES_LISTAR,
        },
      },
      {
        path: 'almacenes',
        name: 'admin-configuracion-almacenes',
        component: () => import('@/modules/configuracion/almacenes/views/AlmacenesListView.vue'),
        meta: {
          title: 'Almacenes',
          module: 'configuracion',
          permission: PermisoBanderas.ALMACENES_LISTAR,
        },
      },
      {
        path: 'condiciones-pago',
        name: 'admin-configuracion-condiciones-pago',
        component: () =>
          import('@/modules/configuracion/condiciones-pago/views/CondicionesPagoListView.vue'),
        meta: {
          title: 'Condiciones de pago',
          module: 'configuracion',
          permission: PermisoBanderas.CONDICIONES_PAGO_LISTAR,
        },
      },
      {
        path: 'empresas',
        name: 'admin-configuracion-empresas',
        component: () => import('@/modules/configuracion/empresas/views/EmpresaSettingsView.vue'),
        meta: {
          title: 'Empresa',
          module: 'configuracion',
          permission: PermisoBanderas.EMPRESAS_VER,
        },
      },
      {
        path: 'sunat',
        name: 'admin-configuracion-sunat',
        component: () => import('@/modules/configuracion/sunat/views/SunatSettingsView.vue'),
        meta: {
          title: 'SUNAT',
          module: 'configuracion',
          permission: PermisoBanderas.CONFIGURACION_SUNAT_VER,
        },
      },
      {
        path: 'servicios',
        name: 'admin-configuracion-servicios',
        component: () => import('@/modules/configuracion/servicios/views/ServiciosListView.vue'),
        meta: {
          title: 'Servicios externos',
          module: 'configuracion',
          permission: PermisoBanderas.CONFIGURACION_SERVICIOS_LISTAR,
        },
      },
    ],
  },
]
