<template>
  <div class="relative" ref="dropdownRef">
    <button
      type="button"
      class="flex items-center text-gray-700 dark:text-gray-400"
      @click.prevent="toggleDropdown"
    >
      <span
        class="mr-3 flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-brand-500 text-sm font-semibold text-white"
      >
        {{ userInitials }}
      </span>
      <span class="block mr-1 font-medium text-theme-sm">{{ userName }}</span>
      <AppIcon
        :name="ICONS.chevronDown"
        :size="20"
        class="transition-transform"
        :class="{ 'rotate-180': dropdownOpen }"
      />
    </button>

    <div
      v-if="dropdownOpen"
      class="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"
    >
      <div>
        <span class="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
          {{ userName }}
        </span>
        <span class="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
          {{ userEmail }}
        </span>
      </div>

      <button
        type="button"
        class="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 disabled:opacity-60"
        :disabled="logoutMutation.isPending.value"
        @click="signOut"
      >
        <AppIcon
          :name="ICONS.logOut"
          :size="20"
          class="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
        />
        {{ logoutMutation.isPending.value ? 'Cerrando sesión...' : 'Cerrar sesión' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useLogoutMutation } from '@/modules/auth/composables/useLogoutMutation'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

const authStore = useAuthStore()
const { userName, userEmail, userInitials } = storeToRefs(authStore)
const logoutMutation = useLogoutMutation()

const dropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

const signOut = () => {
  closeDropdown()
  logoutMutation.mutate()
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
