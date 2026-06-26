<template>
  <div class="relative" ref="dropdownRef">
    <button
      type="button"
      class="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full h-11 w-11 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      @click="toggleDropdown"
    >
      <span
        v-if="notifying"
        class="absolute right-0 top-0.5 z-1 flex h-2 w-2 rounded-full bg-sarita-500"
      >
        <span
          class="absolute inline-flex w-full h-full rounded-full bg-sarita-500 opacity-75 -z-1 animate-ping"
        ></span>
      </span>
      <AppIcon :name="ICONS.bell" :size="20" />
    </button>

    <div
      v-if="dropdownOpen"
      class="absolute -right-[240px] mt-[17px] flex w-[320px] flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 sm:w-[340px] lg:right-0"
    >
      <div
        class="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-800"
      >
        <h5 class="text-lg font-semibold text-gray-800 dark:text-white/90">Notificaciones</h5>
        <button type="button" @click="closeDropdown" class="text-gray-500 dark:text-gray-400">
          <AppIcon :name="ICONS.x" :size="24" />
        </button>
      </div>

      <p class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        No hay notificaciones nuevas
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'

const dropdownOpen = ref(false)
const notifying = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
  notifying.value = false
}

const closeDropdown = () => {
  dropdownOpen.value = false
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
