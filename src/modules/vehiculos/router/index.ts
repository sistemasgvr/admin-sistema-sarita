import type { RouteRecordRaw } from 'vue-router'

/** Rutas legacy bajo Clientes → redirigen a Configuración (flota empresa). */
export const vehiculosRoutes: RouteRecordRaw[] = [
  {
    path: 'clientes/vehiculos',
    redirect: { name: 'admin-configuracion-vehiculos' },
  },
]
