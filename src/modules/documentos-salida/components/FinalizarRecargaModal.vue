<template>
  <AppModal v-model="open" title="Registrar retorno de recarga" size="md">
    <div class="grid grid-cols-1 gap-4">
      <AppDatePicker
        v-model="form.fechaLlegadaAlmacen"
        label="Fecha de llegada al almacén"
        required
      />
      <AppSelect
        v-model="form.idAlmacen"
        label="Almacén de retorno"
        required
        :options="almacenOptions"
      />
      <!--
        El lote y su vencimiento no se piden acá: son datos de la ficha ICP, que
        se registra con "Registrar lote y protocolo" y trae además los análisis y
        los envases aprobados. Duplicarlos en dos sitios los dejaba desalineados.
      -->
      <AppDatePicker v-model="form.fechaPruebaHidrostatica" label="Prueba hidrostática" />
      <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input v-model="form.guardarBalonesAlmacen" type="checkbox" class="h-4 w-4" />
        Actualizar custodia de los balones (DISPONIBLE) y registrar entrada de gas
      </label>
    </div>

    <template #footer>
      <button
        type="button"
        class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
        :disabled="mutation.isPending.value"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-70"
        :disabled="!puedeGuardar || mutation.isPending.value"
        @click="onGuardar"
      >
        {{ mutation.isPending.value ? 'Guardando...' : 'Guardar' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useFinalizarRecargaMutation } from '@/modules/documentos-salida/composables/useDocumentoSalidaMutations'
import type { DocumentoSalida } from '@/modules/documentos-salida/interfaces/documento-salida.interface'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppDatePicker, AppModal, AppSelect } from '@/shared/components'
import { ref } from 'vue'

const props = defineProps<{ documento: DocumentoSalida | null | undefined }>()

const open = defineModel<boolean>({ default: false })

const authStore = useAuthStore()
const mutation = useFinalizarRecargaMutation()

const almacenesFilters = ref({ pagina: 1, limite: 200 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)
const almacenOptions = computed(
  () => almacenesQuery.data.value?.data?.map((a) => ({ value: a.id, label: a.nombre })) ?? [],
)

const form = reactive({
  fechaLlegadaAlmacen: '',
  idAlmacen: '' as number | '',
  fechaPruebaHidrostatica: '',
  guardarBalonesAlmacen: true,
})

const puedeGuardar = computed(
  () => Boolean(form.fechaLlegadaAlmacen) && form.idAlmacen !== '',
)

watch(open, (abierto) => {
  if (!abierto || !props.documento) return
  // El almacén de retorno por defecto es el del documento.
  form.idAlmacen = props.documento.id_almacen
})

async function onGuardar() {
  if (!props.documento || !puedeGuardar.value) return
  await mutation.mutateAsync({
    id: props.documento.id,
    payload: {
      fechaLlegadaAlmacen: form.fechaLlegadaAlmacen,
      idAlmacen: Number(form.idAlmacen),
      fechaPruebaHidrostatica: form.fechaPruebaHidrostatica || undefined,
      guardarBalonesAlmacen: form.guardarBalonesAlmacen,
      idUsuarioAuditoria: authStore.user?.id,
    },
  })
  open.value = false
}
</script>
