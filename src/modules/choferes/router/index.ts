import type { RouteRecordRaw } from 'vue-router'

/** Rutas legacy bajo Clientes → redirigen a Configuración (flota empresa). */
export const choferesRoutes: RouteRecordRaw[] = [
  {
    path: 'clientes/choferes',
    redirect: { name: 'admin-configuracion-choferes' },
  },
]
