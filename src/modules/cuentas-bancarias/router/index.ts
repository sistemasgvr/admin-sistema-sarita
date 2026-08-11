import type { RouteRecordRaw } from 'vue-router'

/** Rutas legacy bajo Clientes → redirigen a Configuración (cuentas empresa). */
export const cuentasBancariasRoutes: RouteRecordRaw[] = [
  {
    path: 'clientes/cuentas-bancarias',
    redirect: { name: 'admin-configuracion-cuentas-bancarias' },
  },
]
