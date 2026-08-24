import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    guest?: boolean
    requiresAuth?: boolean
    permission?: string
    /** Basta con uno (OR). Si está definido, tiene prioridad sobre `permission`. */
    anyPermission?: string[]
    module?: string
    /** Listados de flota/cuentas propios (id_cliente IS NULL). */
    soloEmpresa?: boolean
    /**
     * Path del ítem de menú a resaltar (cuando la URL no coincide con el subítem).
     * Ej. ajustes/traslados en /movimientos deben resaltar Stock.
     */
    sidebarActivePath?: string
  }
}

export {}
