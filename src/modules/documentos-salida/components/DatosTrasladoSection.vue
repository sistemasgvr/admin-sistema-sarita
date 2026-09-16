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
    <div v-if="!editando" class="space-y-4 px-6 py-4 text-xs">
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <span class="block text-[11px] text-gray-400">Tipo de guía</span>
          <span class="font-semibold text-gray-800 dark:text-white/90">{{ tipoGuiaLabel }}</span>
        </div>
        <div>
          <span class="block text-[11px] text-gray-400">Motivo</span>
          <span class="font-semibold text-gray-800 dark:text-white/90">
            {{ documento?.nombre_motivo_traslado?.replace(/_/g, ' ') ?? '—' }}
          </span>
        </div>
        <div>
          <span class="block text-[11px] text-gray-400">Modalidad</span>
          <span class="font-semibold text-gray-800 dark:text-white/90">{{ modalidadLabel }}</span>
        </div>
        <div>
          <span class="block text-[11px] text-gray-400">Fecha de traslado</span>
          <span class="font-semibold text-gray-800 dark:text-white/90">
            {{ documento?.fecha_traslado?.slice(0, 10) ?? '—' }}
          </span>
        </div>
        <div>
          <span class="block text-[11px] text-gray-400">Fecha emisión GRE</span>
          <span class="font-semibold text-gray-800 dark:text-white/90">
            {{ documento?.fecha_emision_gre?.slice(0, 10) ?? '—' }}
          </span>
        </div>
        <div v-if="documento?.gre_entorno">
          <span class="block text-[11px] text-gray-400">Entorno</span>
          <span
            class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
            :class="documento.gre_entorno === 'produccion'
              ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'"
          >
            {{ documento.gre_entorno === 'produccion' ? 'PRODUCCIÓN' : 'PRUEBAS' }}
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
        <!--
          Lo que SUNAT recibirá como transporte según el caso: flota propia
          (privado o GRE transportista) o el tercero con RUC (público).
        -->
        <template v-if="flotaPropia">
          <div>
            <span class="block text-[11px] text-gray-400">Chofer</span>
            <span class="font-semibold text-gray-800 dark:text-white/90">
              {{ documento?.nombre_chofer?.trim() || '—' }}
            </span>
          </div>
          <div>
            <span class="block text-[11px] text-gray-400">Vehículo</span>
            <span class="font-semibold text-gray-800 dark:text-white/90">
              {{ documento?.placa_vehiculo ?? '—' }}
            </span>
          </div>
        </template>
        <div v-else class="col-span-2">
          <span class="block text-[11px] text-gray-400">Transportista (RUC)</span>
          <span class="font-semibold text-gray-800 dark:text-white/90">
            {{ documento?.nombre_transportista ?? '—' }}
          </span>
        </div>
      </div>
      <div
        v-if="documento?.direccion_origen || documento?.direccion_llegada"
        class="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <div>
          <span class="block text-[11px] text-gray-400">Punto de partida</span>
          <span class="font-semibold text-gray-800 dark:text-white/90">
            {{ documento?.direccion_origen || '—' }}
            <span v-if="documento?.ubigeo_origen" class="font-normal text-gray-400">· {{ documento.ubigeo_origen }}</span>
          </span>
        </div>
        <div>
          <span class="block text-[11px] text-gray-400">Punto de llegada</span>
          <span class="font-semibold text-gray-800 dark:text-white/90">
            {{ documento?.direccion_llegada || '—' }}
            <span v-if="documento?.ubigeo_llegada" class="font-normal text-gray-400">· {{ documento.ubigeo_llegada }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Edición en el mismo sitio, sin sacar al usuario de la página -->
    <div v-else class="space-y-4 px-6 py-4">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AppSelect
          v-model="form.idMotivoTraslado"
          label="Motivo de traslado"
          :placeholder="motivosQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
          :options="motivoOptions"
          :disabled="motivosQuery.isLoading.value || mutation.isPending.value"
        />
        <AppSelect
          v-model="form.idModalidadTraslado"
          label="Modalidad"
          :placeholder="modalidadesQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
          :options="modalidadOptions"
          :disabled="modalidadesQuery.isLoading.value || mutation.isPending.value || esGreTransportista"
          :hint="
            esGreTransportista
              ? 'En la guía de transportista es siempre pública'
              : 'Chofer, vehículo o transportista se cambian en «Editar datos GRE»'
          "
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
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import { useActualizarTrasladoMutation } from '@/modules/documentos-salida/composables/useDocumentoSalidaMutations'
import type { DocumentoSalida } from '@/modules/documentos-salida/interfaces/documento-salida.interface'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppSelect } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import { ListaIds } from '@/shared/constants/lista-ids'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'

const props = defineProps<{
  documento: DocumentoSalida | null | undefined
  editable?: boolean
}>()

const authStore = useAuthStore()
const motivosQuery = useListaOpcionesQuery(ref(ListaIds.MOTIVO_TRASLADO))
const modalidadesQuery = useListaOpcionesQuery(ref(ListaIds.MODALIDAD_TRASLADO))
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
    motivosQuery.data.value?.map((o) => ({
      value: o.id,
      label: formatListaOpcionLabel(o.nombre, o.descripcion),
    })) ?? [],
)

const modalidadOptions = computed(
  () =>
    modalidadesQuery.data.value?.map((o) => ({
      value: o.id,
      label: formatListaOpcionLabel(o.nombre, o.descripcion),
    })) ?? [],
)

/** 09 GRE Remitente (carga propia) · 31 GRE Transportista (carga de un tercero). */
const tipoGuiaLabel = computed(() => {
  const codigo = props.documento?.codigo_tipo_guia
  if (codigo === '31') return 'Transportista (31)'
  if (codigo === '09') return 'Remitente (09)'
  return 'Sin definir'
})

const esGreTransportista = computed(() => props.documento?.codigo_tipo_guia === '31')

const modalidadLabel = computed(() => {
  if (esGreTransportista.value) return 'Transporte público (fija en la 31)'
  const nombre = props.documento?.nombre_modalidad_traslado
  if (nombre === 'PRIVADO') return 'Transporte privado (flota propia)'
  if (nombre === 'PUBLICO') return 'Transporte público (tercero con RUC)'
  return nombre?.replace(/_/g, ' ') ?? '—'
})

/** Vehículo + chofer propios: privado o GRE transportista; si no, va el tercero. */
const flotaPropia = computed(
  () => esGreTransportista.value || props.documento?.nombre_modalidad_traslado !== 'PUBLICO',
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
