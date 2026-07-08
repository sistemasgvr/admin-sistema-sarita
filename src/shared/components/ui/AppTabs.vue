<template>
  <div class="app-tabs" :class="{ 'app-tabs--full': fullWidth }">
    <div class="app-tabs__bar" role="tablist" :aria-label="ariaLabel">
      <button
        v-for="(tab, index) in tabs"
        :key="tab.key"
        type="button"
        role="tab"
        :aria-selected="modelValue === tab.key"
        :disabled="tab.disabled"
        class="app-tabs__tab"
        :class="{
          'app-tabs__tab--active': modelValue === tab.key,
          'app-tabs__tab--divider': showDivider(index),
        }"
        @click="selectTab(tab.key)"
      >
        <AppIcon
          v-if="tab.icon"
          :name="tab.icon"
          :size="16"
          class="app-tabs__icon shrink-0"
        />
        <span class="app-tabs__label truncate">{{ tab.label }}</span>
        <span
          v-if="tab.badge != null && tab.badge > 0"
          class="app-tabs__badge shrink-0"
          :class="{ 'app-tabs__badge--active': modelValue === tab.key }"
        >
          {{ tab.badge }}
        </span>
      </button>
    </div>

    <div v-if="!inline" class="app-tabs__panel">
      <slot :name="modelValue" />
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'
import type { AppTabItem } from '@/shared/interfaces/tabs.interface'

const props = withDefaults(
  defineProps<{
    tabs: AppTabItem[]
    ariaLabel?: string
    /** Solo renderiza la barra de pestañas (sin panel). */
    inline?: boolean
    /** La barra ocupa todo el ancho disponible. */
    fullWidth?: boolean
  }>(),
  {
    ariaLabel: 'Secciones',
    inline: false,
    fullWidth: false,
  },
)

const modelValue = defineModel<string>({ required: true })

const isActive = (key: string) => modelValue.value === key

const showDivider = (index: number) => {
  if (index === 0) return false

  const prevKey = props.tabs[index - 1]?.key
  const currentKey = props.tabs[index]?.key
  if (!prevKey || !currentKey) return false

  return !isActive(prevKey) && !isActive(currentKey)
}

const selectTab = (key: string) => {
  modelValue.value = key
}
</script>

<style scoped>
.app-tabs {
  --tabs-border: #d1d5db;
  --tabs-inactive-bg: transparent;
  --tabs-inactive-hover: rgba(0, 0, 0, 0.04);
  --tabs-inactive-text: #6b7280;
  --tabs-active-text: #2563eb;
  --tabs-indicator: #2563eb;
  --tabs-divider: rgba(0, 0, 0, 0.12);
}

:global(.dark) .app-tabs {
  --tabs-border: #374151;
  --tabs-inactive-bg: transparent;
  --tabs-inactive-hover: rgba(255, 255, 255, 0.05);
  --tabs-inactive-text: #9ca3af;
  --tabs-active-text: #60a5fa;
  --tabs-indicator: #60a5fa;
  --tabs-divider: rgba(255, 255, 255, 0.1);
}

.app-tabs--full .app-tabs__bar {
  width: 100%;
}

.app-tabs__bar {
  display: flex;
  align-items: flex-end;
  gap: 0;
  min-height: 2.5rem;
  padding: 0.375rem 0 0;
  background: transparent;
  border-bottom: 1px solid var(--tabs-border);
}

.app-tabs__tab {
  position: relative;
  display: inline-flex;
  max-width: 15rem;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0.125rem;
  padding: 0.5rem 1rem 0.625rem;
  border: none;
  border-radius: 0.5rem 0.5rem 0 0;
  background: var(--tabs-inactive-bg);
  color: var(--tabs-inactive-text);
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.25rem;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.app-tabs__tab:hover:not(.app-tabs__tab--active):not(:disabled) {
  background: var(--tabs-inactive-hover);
}

.app-tabs__tab:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.app-tabs__tab--divider::before {
  content: '';
  position: absolute;
  left: -0.125rem;
  top: 25%;
  bottom: 25%;
  width: 1px;
  background: var(--tabs-divider);
}

.app-tabs__tab--active {
  color: var(--tabs-active-text);
  font-weight: 600;
}

.app-tabs__tab--active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  z-index: 1;
  height: 2px;
  background: var(--tabs-indicator);
  border-radius: 2px 2px 0 0;
}

.app-tabs__icon {
  opacity: 0.75;
}

.app-tabs__tab--active .app-tabs__icon {
  opacity: 1;
  color: var(--tabs-active-text);
}

.app-tabs__badge {
  display: inline-flex;
  min-width: 1.125rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: rgba(217, 119, 6, 0.15);
  padding: 0.125rem 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #b45309;
}

.app-tabs__badge--active {
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
}

:global(.dark) .app-tabs__badge {
  background: rgba(245, 158, 11, 0.18);
  color: #fbbf24;
}

:global(.dark) .app-tabs__badge--active {
  background: rgba(96, 165, 250, 0.18);
  color: #93c5fd;
}

.app-tabs__panel {
  margin-top: 0;
}
</style>
