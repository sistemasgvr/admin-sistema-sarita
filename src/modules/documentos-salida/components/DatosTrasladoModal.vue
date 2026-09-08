<template>
  <AppModal
    v-model="open"
    title="Datos de traslado"
    subtitle="Son los que imprime el PDF y los que reutiliza la guía de remisión."
    size="md"
  >
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AppSelect
        v-model="form.idMotivoTraslado"
        label="Motivo de traslado"
        :placeholder="catalogosQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
        :options="motivoOptions"
        :disabled="catalogosQuery.isLoading.value || mutation.isPending.value"
      />
      <AppSelect
        v-model="form.idModalidadTraslado"
        label="Modalidad"
        :placeholder="catalogosQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
        :options="modalidadOptions"
        :disabled="catalogosQuery.isLoading.value || mutation.isPending.value"
      />
      <AppInput
        v-model.number="form.pesoBruto"
        type="number"
        min="0"
        step="0.01"
        label="Peso bruto (kg)"
        :disabled="mutation.isPending.value"
      />
      <AppInput
        v-model.number="form.numeroBultos"
        type="number"
        min="0"
        step="1"
        label="N° de bultos"
        :disabled="mutation.isPending.value"
      />
    </div>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
        :disabled="mutation.isPending.value"
        @click="open = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-70 sm:w-auto"
        :disabled="mutation.isPending.value"
        @click="onGuardar"
      >
        {{ mutation.isPending.value ? 'Guardando...' : 'Guardar' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useDocumentoSalidaCatalogosQuery } from '@/modules/documentos-salida/composables/useDocumentosSalidaQuery'
import { useActualizarTrasladoMutation } from '@/modules/documentos-salida/composables/useDocumentoSalidaMutations'
import type { DocumentoSalida } from '@/modules/documentos-salida/interfaces/documento-salida.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppSelect } from '@/shared/components'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'

const props = defineProps<{ documento: DocumentoSalida | null | undefined }>()

const open = defineModel<boolean>({ default: false })

const authStore = useAuthStore()
const catalogosQuery = useDocumentoSalidaCatalogosQuery()
const mutation = useActualizarTrasladoMutation()

const form = reactive<{
  idMotivoTraslado: number | ''
  idModalidadTraslado: number | ''
  pesoBruto: number | ''
  numeroBultos: number | ''
}>({
  idMotivoTraslado: '',
  idModalidadTraslado: '',
  pesoBruto: '',
  numeroBultos: '',
})

const motivoOptions = computed(
  () =>
    catalogosQuery.data.value?.motivosTraslado.map((o) => ({
      value: o.id,
      label: formatListaOpcionLabel(o.nombre, o.descripcion),
    })) ?? [],
)

const modalidadOptions = computed(
  () =>
    catalogosQuery.data.value?.modalidadesTraslado.map((o) => ({
      value: o.id,
      label: formatListaOpcionLabel(o.nombre, o.descripcion),
    })) ?? [],
)

watch(open, (abierto) => {
  if (!abierto || !props.documento) return
  const d = props.documento
  form.idMotivoTraslado = d.id_motivo_traslado ?? ''
  form.idModalidadTraslado = d.id_modalidad_traslado ?? ''
  form.pesoBruto = d.peso_bruto ?? ''
  form.numeroBultos = d.numero_bultos ?? ''
})

async function onGuardar() {
  if (!props.documento) return
  try {
    await mutation.mutateAsync({
      id: props.documento.id,
      payload: {
        idMotivoTraslado: form.idMotivoTraslado === '' ? undefined : Number(form.idMotivoTraslado),
        idModalidadTraslado:
          form.idModalidadTraslado === '' ? undefined : Number(form.idModalidadTraslado),
        pesoBruto: form.pesoBruto === '' ? undefined : Number(form.pesoBruto),
        numeroBultos: form.numeroBultos === '' ? undefined : Number(form.numeroBultos),
        idUsuarioAuditoria: authStore.user?.id,
      },
    })
    open.value = false
  } catch {
    // toast en mutation
  }
}
</script>
