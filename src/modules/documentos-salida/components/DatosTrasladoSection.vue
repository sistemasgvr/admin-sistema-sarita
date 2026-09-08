<template>
  <div
    class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]"
  >
    <div
      class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-6 py-3.5 dark:border-gray-800"
    >
      <div class="flex items-center gap-2">
        <div
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400"
        >
          <AppIcon :name="ICONS.truck" :size="15" />
        </div>
        <h3 class="text-sm font-bold tracking-tight text-gray-800 dark:text-white/90">
          Datos de traslado
        </h3>
      </div>

      <button
        v-if="editable && !editando"
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
        @click="empezarEdicion"
      >
        <AppIcon :name="ICONS.pencil" :size="13" />
        Editar
      </button>
    </div>

    <!-- Lectura -->
    <div v-if="!editando" class="grid grid-cols-2 gap-4 px-6 py-4 text-xs sm:grid-cols-4">
      <div>
        <span class="block text-[11px] text-gray-400">Motivo</span>
        <span class="font-semibold text-gray-800 dark:text-white/90">
          {{ documento?.nombre_motivo_traslado?.replace(/_/g, ' ') ?? '—' }}
        </span>
      </div>
      <div>
        <span class="block text-[11px] text-gray-400">Modalidad</span>
        <span class="font-semibold text-gray-800 dark:text-white/90">
          {{ documento?.nombre_modalidad_traslado?.replace(/_/g, ' ') ?? '—' }}
        </span>
      </div>
      <div>
        <span class="block text-[11px] text-gray-400">Peso bruto</span>
        <span class="font-semibold text-gray-800 dark:text-white/90">
          {{ documento?.peso_bruto != null ? `${documento.peso_bruto} kg` : '—' }}
        </span>
      </div>
      <div>
        <span class="block text-[11px] text-gray-400">N° de bultos</span>
        <span class="font-semibold text-gray-800 dark:text-white/90">
          {{ documento?.numero_bultos ?? '—' }}
        </span>
      </div>
    </div>

    <!-- Edición en el mismo sitio, sin sacar al usuario de la página -->
    <div v-else class="space-y-4 px-6 py-4">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div class="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          class="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
          :disabled="mutation.isPending.value"
          @click="editando = false"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="rounded-lg bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-70"
          :disabled="mutation.isPending.value"
          @click="onGuardar"
        >
          {{ mutation.isPending.value ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useDocumentoSalidaCatalogosQuery } from '@/modules/documentos-salida/composables/useDocumentosSalidaQuery'
import { useActualizarTrasladoMutation } from '@/modules/documentos-salida/composables/useDocumentoSalidaMutations'
import type { DocumentoSalida } from '@/modules/documentos-salida/interfaces/documento-salida.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppSelect } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'

const props = defineProps<{
  documento: DocumentoSalida | null | undefined
  editable?: boolean
}>()

const authStore = useAuthStore()
const catalogosQuery = useDocumentoSalidaCatalogosQuery()
const mutation = useActualizarTrasladoMutation()

const editando = ref(false)

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

function empezarEdicion() {
  const d = props.documento
  form.idMotivoTraslado = d?.id_motivo_traslado ?? ''
  form.idModalidadTraslado = d?.id_modalidad_traslado ?? ''
  form.pesoBruto = d?.peso_bruto ?? ''
  form.numeroBultos = d?.numero_bultos ?? ''
  editando.value = true
}

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
    editando.value = false
  } catch {
    // toast en mutation
  }
}
</script>
