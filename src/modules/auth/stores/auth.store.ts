import { computed } from 'vue'
import { defineStore } from 'pinia'
import { hasPermissionFlag } from '@/shared/constants/permissions'
import { setAuthPersistMode } from '@/shared/plugins/pinia'
import type { AuthUser } from '@/modules/auth/interfaces/auth.interface'

interface AuthState {
  token: string | null
  user: AuthUser | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    user: null,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    userName: (state) => state.user?.nombre ?? '',
    userEmail: (state) => state.user?.correo ?? '',
    userInitials: (state) => {
      const name = state.user?.nombre?.trim()
      if (!name) return 'OS'

      const parts = name.split(/\s+/).filter(Boolean)
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

      return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
    },
    permisos: (state) => state.user?.permisos ?? [],
    hasPermission: (state) => (permission: string) =>
      hasPermissionFlag(state.user?.permisos ?? [], permission),
  },

  actions: {
    setSession(token: string, user: AuthUser, keepLoggedIn = false) {
      setAuthPersistMode(keepLoggedIn)
      this.token = token
      this.user = user
    },

    updateUser(user: Partial<AuthUser>) {
      if (!this.user) return
      this.user = { ...this.user, ...user }
    },

    clearSession() {
      this.token = null
      this.user = null
    },
  },

  persist: {
    pick: ['token', 'user'],
  },
})

export function useAuth() {
  const authStore = useAuthStore()

  return {
    ...authStore,
    isAuthenticated: computed(() => authStore.isAuthenticated),
    userName: computed(() => authStore.userName),
    userEmail: computed(() => authStore.userEmail),
    userInitials: computed(() => authStore.userInitials),
    permisos: computed(() => authStore.permisos),
    hasPermission: (permission: string) => authStore.hasPermission(permission),
  }
}
