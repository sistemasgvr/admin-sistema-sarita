<template>
  <div>
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-2">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">Recargas</h2>
        <AppHelpTip :text="helpText" />
      </div>

      <nav class="flex shrink-0 items-center gap-3">
        <router-link
          class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          :to="{ name: 'admin-documentos-salida', query: { codigoTipoOrden: 'RECARGA_PLANTA_EXTERNA' } }"
        >
          Planta externa →
        </router-link>
        <ol class="flex items-center gap-1.5">
          <li>
            <router-link
              class="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
              to="/admin/balones"
            >
              Balones
              <svg
                class="stroke-current"
                width="17"
                height="16"
                viewBox="0 0 17 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                  stroke=""
                  stroke-width="1.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </router-link>
          </li>
          <li class="text-sm text-gray-800 dark:text-white/90">Recargas</li>
        </ol>
      </nav>
    </div>

    <RecargasListView embedded />
  </div>
</template>

<script setup lang="ts">
// La pestaña "Planta externa" se unificó en Documentos de salida (Fase 2):
// las órdenes de recarga en planta ahora viven en doc_salida junto con las
// órdenes de venta y las guías de remisión, no en esta pantalla — de ahí el
// enlace de arriba en vez de una segunda pestaña embebida.
import RecargasListView from '@/modules/balones/recargas/views/RecargasListView.vue'
import { AppHelpTip } from '@/shared/components'

const helpText =
  'Recargas de cliente en mostrador (POS). Los envíos de vacíos propios a planta externa se gestionan en Documentos de salida.'
</script>
