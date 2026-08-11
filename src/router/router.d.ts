import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    guest?: boolean
    requiresAuth?: boolean
    permission?: string
    module?: string
    /** Listados de flota/cuentas propios (id_cliente IS NULL). */
    soloEmpresa?: boolean
  }
}

export {}
