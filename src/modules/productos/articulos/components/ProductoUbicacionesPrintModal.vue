<template>
  <AppModal
    v-model="open"
    title="Imprimir ubicaciones"
    subtitle="Selecciona productos con código de ubicación para generar tarjetas imprimibles."
    size="lg"
    @close="handleClose"
  >
    <div class="relative min-h-[14rem] space-y-4">
      <div
        v-if="isLoading"
        class="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80 dark:bg-gray-900/80"
      >
        <p class="text-sm text-gray-500 dark:text-gray-400">Cargando productos...</p>
      </div>

      <AppInput
        v-model="buscar"
        type="search"
        placeholder="Buscar por ubicación, código o nombre..."
        :disabled="isLoading || isGenerating"
      />

      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ selectedCount }} seleccionados
          <span v-if="filteredProductos.length">
            · {{ filteredProductos.length }} con ubicación
          </span>
        </p>

        <div class="flex gap-2">
          <button
            type="button"
            class="rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-50 dark:hover:bg-brand-500/10"
            :disabled="isLoading || !filteredProductos.length"
            @click="selectAllFiltered"
          >
            Seleccionar todos
          </button>
          <button
            type="button"
            class="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-white/5"
            :disabled="isLoading || !selectedCount"
            @click="clearSelection"
          >
            Limpiar
          </button>
        </div>
      </div>

      <div
        class="max-h-[22rem] space-y-1 overflow-y-auto rounded-xl border border-gray-200 p-2 dark:border-gray-800"
        :class="isLoading ? 'pointer-events-none opacity-60' : ''"
      >
        <label
          v-for="producto in filteredProductos"
          :key="producto.id"
          class="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
        >
          <AppCheckbox
            :model-value="selectedIds.has(producto.id)"
            :disabled="isGenerating"
            @update:model-value="(checked) => setSelected(producto.id, checked)"
          />
          <span class="min-w-0 flex-1">
            <span class="flex flex-wrap items-center gap-2">
              <span
                class="inline-flex rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
              >
                {{ producto.codigo_ubicacion }}
              </span>
              <span class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ producto.nombre }}
              </span>
            </span>
            <span class="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
              {{ producto.codigo }}
            </span>
          </span>
        </label>

        <p
          v-if="!isLoading && !filteredProductos.length"
          class="px-2 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          {{
            productos.length
              ? 'No hay coincidencias con la búsqueda.'
              : 'No hay productos activos con código de ubicación.'
          }}
        </p>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03] sm:w-auto"
        :disabled="isGenerating"
        @click="handleClose"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="isLoading || isGenerating || !selectedCount"
        @click="generatePdf"
      >
        {{ isGenerating ? 'Generando...' : 'Generar PDF' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Producto } from '@/modules/productos/articulos/interfaces/producto.interface'
import { productosService } from '@/modules/productos/articulos/services/productos.service'
import { downloadBlob, openPdfPrintWindow, printBlobInWindow } from '@/modules/ventas/comprobantes/utils/comprobantePdf'
import { AppCheckbox, AppInput, AppModal } from '@/shared/components'
import { toastApiError, toastSuccess } from '@/shared/composables/useToast'

const open = defineModel<boolean>({ default: false })

const isLoading = ref(false)
const isGenerating = ref(false)
const buscar = ref('')
const productos = ref<Producto[]>([])
const selectedIds = ref<Set<number>>(new Set())

const selectedCount = computed(() => selectedIds.value.size)

const filteredProductos = computed(() => {
  const term = buscar.value.trim().toLowerCase()
  if (!term) return productos.value

  return productos.value.filter((producto) => {
    const haystack = [
      producto.codigo_ubicacion,
      producto.codigo,
      producto.nombre,
      producto.marca,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(term)
  })
})

const loadProductos = async () => {
  isLoading.value = true
  try {
    const response = await productosService.listar({
      pagina: 1,
      limite: 500,
      soloActivos: 1,
    })

    productos.value = response.data.filter(
      (producto) => (producto.codigo_ubicacion ?? '').trim().length > 0,
    )
  } catch (error) {
    productos.value = []
    toastApiError(error, 'No se pudieron cargar los productos')
  } finally {
    isLoading.value = false
  }
}

const setSelected = (id: number, checked: boolean) => {
  const next = new Set(selectedIds.value)
  if (checked) next.add(id)
  else next.delete(id)
  selectedIds.value = next
}

const selectAllFiltered = () => {
  const next = new Set(selectedIds.value)
  for (const producto of filteredProductos.value) {
    next.add(producto.id)
  }
  selectedIds.value = next
}

const clearSelection = () => {
  selectedIds.value = new Set()
}

const handleClose = () => {
  if (isGenerating.value) return
  open.value = false
}

const generatePdf = async () => {
  const ids = [...selectedIds.value]
  if (!ids.length) {
    toastApiError(new Error('Selecciona al menos un producto con ubicación'), 'Sin ubicación')
    return
  }

  const printWindow = openPdfPrintWindow()
  isGenerating.value = true
  try {
    const blob = await productosService.imprimirUbicacionesPdf(ids)
    const stamp = new Date().toISOString().slice(0, 10)
    downloadBlob(blob, `ubicaciones-productos-${stamp}.pdf`)

    if (printWindow) {
      printBlobInWindow(printWindow, blob)
    } else {
      toastApiError(
        new Error('El navegador bloqueó la ventana de impresión'),
        'PDF descargado. Permite ventanas emergentes para imprimir.',
      )
    }

    toastSuccess('PDF de ubicaciones generado')
    open.value = false
  } catch (error) {
    printWindow?.close()
    toastApiError(error, 'No se pudo generar el PDF')
  } finally {
    isGenerating.value = false
  }
}

watch(open, async (isOpen) => {
  if (!isOpen) {
    buscar.value = ''
    selectedIds.value = new Set()
    productos.value = []
    return
  }

  await loadProductos()
})
</script>
