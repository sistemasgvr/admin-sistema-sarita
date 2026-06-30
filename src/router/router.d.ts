import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    guest?: boolean
    requiresAuth?: boolean
    permission?: string
    module?: string
  }
}

export {}
