<template>
  <div class="flex w-full flex-col gap-2 sm:gap-3">
    <!-- Fila 1: búsqueda (+ extras como pistola) -->
    <div v-if="showSearch" class="flex min-w-0 items-center gap-2">
      <div class="min-w-0 flex-1 lg:max-w-md">
        <AppInput
          v-model="search"
          type="search"
          :placeholder="searchPlaceholder"
        />
      </div>
      <div v-if="slots['search-extra']" class="shrink-0">
        <slot name="search-extra" />
      </div>
    </div>

    <!-- Fila 2: filtros + herramientas + acciones (mismo flujo, altura uniforme) -->
    <div
      v-if="hasTrailingActions"
      class="app-list-toolbar__bar flex flex-wrap items-center gap-2"
      :class="alignEndOnDesktop ? 'lg:justify-end' : ''"
    >
      <AppDynamicFilters
        v-if="filterFields?.length"
        v-model="filters"
        :fields="filterFields"
        :preload-all-fields="preloadAllFields"
        @change="emit('filter-change')"
      />

      <!-- contents: los hijos del slot participan del mismo flex-wrap -->
      <div v-if="slots.tools" class="contents">
        <slot name="tools" />
      </div>

      <div v-if="slots.actions" class="contents">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { AppInput } from '@/shared/components'
import AppDynamicFilters from '@/shared/components/filters/AppDynamicFilters.vue'
import type {
  DynamicFilterFieldDef,
  DynamicFilterValues,
} from '@/shared/interfaces/dynamic-filter.interface'

const props = withDefaults(
  defineProps<{
    filterFields?: DynamicFilterFieldDef[]
    searchPlaceholder?: string
    showSearch?: boolean
    preloadAllFields?: boolean
    /** En desktop alinea controles a la derecha (listados con pocas acciones). */
    alignEndOnDesktop?: boolean
  }>(),
  {
    searchPlaceholder: 'Buscar...',
    showSearch: true,
    preloadAllFields: true,
    alignEndOnDesktop: true,
  },
)

const slots = useSlots()

const search = defineModel<string>('search', { default: '' })
const filters = defineModel<DynamicFilterValues>('filters', { default: () => ({}) })

const emit = defineEmits<{
  'filter-change': []
}>()

const hasTrailingActions = computed(
  () =>
    (props.filterFields?.length ?? 0) > 0 ||
    Boolean(slots.actions) ||
    Boolean(slots.tools),
)
</script>

<style scoped>
/*
  Normaliza altura/caja de todos los controles del toolbar para que
  el wrap en móvil quede alineado (filtros, excel, selects, CTAs).
*/
.app-list-toolbar__bar :deep(> *) {
  box-sizing: border-box;
}

/* Botón de filtros */
.app-list-toolbar__bar :deep(> .relative > button) {
  height: 2.75rem;
  min-height: 2.75rem;
  min-width: 2.75rem;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}

/* Botones y enlaces de acción */
.app-list-toolbar__bar :deep(> button),
.app-list-toolbar__bar :deep(> a) {
  height: 2.75rem;
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Wrappers de selects (w-full sm:w-40, etc.): no empujar toda la fila */
.app-list-toolbar__bar :deep(> div.w-full),
.app-list-toolbar__bar :deep(> div[class*='w-full']),
.app-list-toolbar__bar :deep(> div[class*='sm:w-']) {
  flex: 1 1 9.5rem;
  width: auto !important;
  min-width: min(100%, 9.5rem);
  max-width: 100%;
}

.app-list-toolbar__bar :deep(> div.w-full .relative > button),
.app-list-toolbar__bar :deep(> div[class*='w-full'] .relative > button),
.app-list-toolbar__bar :deep(> div[class*='sm:w-'] .relative > button) {
  height: 2.75rem;
  min-height: 2.75rem;
}

/* Móvil: CTAs (enlaces) reparte el espacio de forma pareja */
@media (max-width: 639px) {
  .app-list-toolbar__bar :deep(> a) {
    flex: 1 1 calc(33.333% - 0.35rem);
    min-width: 2.75rem;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }

  .app-list-toolbar__bar :deep(> a span) {
    display: none;
  }
}

/* Tablet: iconos + menos padding en enlaces con texto largo */
@media (min-width: 640px) and (max-width: 1279px) {
  .app-list-toolbar__bar :deep(> a) {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
}
</style>
