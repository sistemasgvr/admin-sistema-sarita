<template>
  <AppModal v-model="open" title="Convertir a guía de remisión" size="xl" @close="handleClose">
    <div class="space-y-5">
      <!-- Datos SUNAT -->
      <section class="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
        <h4 class="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <AppIcon :name="ICONS.fileText" :size="14" />
          Datos de la guía
        </h4>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AppInput v-model="form.serie" label="Serie (4 caracteres)" required maxlength="4" placeholder="T001" />
          <AppSelect
            v-model="form.idTipoGuiaRemision"
            label="Tipo de guía"
            :placeholder="catalogosQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
            :options="tipoGuiaOptions"
            :disabled="catalogosQuery.isLoading.value"
          />
          <AppSelect
            v-model="form.idMotivoTraslado"
            label="Motivo de traslado"
            :placeholder="catalogosQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
            :options="motivoTrasladoOptions"
            :disabled="catalogosQuery.isLoading.value"
          />
          <AppSelect
            v-model="form.idModalidadTraslado"
            label="Modalidad"
            :placeholder="catalogosQuery.isLoading.value ? 'Cargando...' : 'Selecciona...'"
            :options="modalidadTrasladoOptions"
            :disabled="catalogosQuery.isLoading.value"
          />
          <AppInput v-model.number="form.pesoBruto" type="number" step="0.0001" label="Peso bruto (kg)" />
          <AppInput v-model.number="form.numeroBultos" type="number" label="N° bultos" />
        </div>
      </section>

      <!-- Origen / Llegada -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section class="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
          <h4 class="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <AppIcon :name="ICONS.warehouse" :size="14" />
            Punto de origen
          </h4>
          <div class="space-y-3">
            <AppInput v-model="form.direccionOrigen" label="Dirección" placeholder="Almacén / punto de partida" />
            <UbigeoCascadeSelect
              v-model:id-pais="origenPaisId"
              v-model:id-departamento="origenDeptoId"
              v-model:id-provincia="origenProvId"
              v-model:id-distrito="form.idDistritoOrigen"
              v-model:presetting="origenPresetting"
            />
          </div>
        </section>

        <section class="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
          <div class="mb-3 flex items-center justify-between">
            <h4 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <AppIcon :name="ICONS.mapPin" :size="14" />
              Punto de llegada
            </h4>
            <button
              v-if="documento?.direccion_entrega"
              type="button"
              class="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              @click="usarDireccionEntrega"
            >
              <AppIcon :name="ICONS.mapPin" :size="12" />
              Usar dirección de entrega
            </button>
          </div>
          <div class="space-y-3">
            <AppInput v-model="form.direccionLlegada" label="Dirección" placeholder="Dirección del destinatario" />
            <UbigeoCascadeSelect
              v-model:id-pais="llegadaPaisId"
              v-model:id-departamento="llegadaDeptoId"
              v-model:id-provincia="llegadaProvId"
              v-model:id-distrito="form.idDistritoLlegada"
              v-model:presetting="llegadaPresetting"
            />
          </div>
        </section>
      </div>

      <!-- Transporte -->
      <section class="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
        <h4 class="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <AppIcon :name="ICONS.truck" :size="14" />
          Transporte
        </h4>
        <p class="mb-3 text-xs text-gray-500 dark:text-gray-400">
          Modalidad <strong>privada</strong>: flota y chofer propios. Modalidad <strong>pública</strong>: un
          transportista de terceros (cliente identificado por RUC) traslada la carga. Completa el bloque que
          corresponda a la modalidad elegida arriba.
        </p>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="flex items-end gap-2">
            <SearchableSelect
              v-model="form.idChofer"
              label="Chofer"
              placeholder="Busca chofer..."
              :model-label="choferLabel"
              :search-fn="searchChoferes"
              class="min-w-0 flex-1"
            />
            <button
              type="button"
              title="Nuevo chofer"
              class="mb-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-500 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10"
              @click="choferModalOpen = true"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
            </button>
          </div>
          <div class="flex items-end gap-2">
            <SearchableSelect
              v-model="form.idVehiculo"
              label="Vehículo"
              placeholder="Busca vehículo..."
              :model-label="vehiculoLabel"
              :search-fn="searchVehiculos"
              class="min-w-0 flex-1"
            />
            <button
              type="button"
              title="Nuevo vehículo"
              class="mb-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-500 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10"
              @click="vehiculoModalOpen = true"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
            </button>
          </div>
          <div class="flex items-end gap-2 sm:col-span-2">
            <SearchableSelect
              v-model="form.idTransportista"
              label="Transportista (RUC)"
              placeholder="Busca transportista..."
              :model-label="transportistaLabel"
              :search-fn="searchClientes"
              class="min-w-0 flex-1"
            />
            <button
              type="button"
              title="Nuevo transportista"
              class="mb-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 text-brand-500 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10"
              @click="transportistaModalOpen = true"
            >
              <AppIcon :name="ICONS.plus" :size="18" />
            </button>
          </div>
        </div>
      </section>
    </div>

    <ChoferFormModal v-model="choferModalOpen" mode="create" @saved="onChoferCreado" />
    <VehiculoFormModal v-model="vehiculoModalOpen" mode="create" @saved="onVehiculoCreado" />
    <ClienteFormModal v-model="transportistaModalOpen" mode="create" @saved="onTransportistaCreado" />

    <template #footer>
      <button
        type="button"
        class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
        @click="handleClose"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-70"
        :disabled="!form.serie || mutation.isPending.value"
        @click="onGuardar"
      >
        {{ mutation.isPending.value ? 'Guardando...' : 'Guardar' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import ClienteFormModal from '@/modules/clientes/components/ClienteFormModal.vue'
import type { Cliente } from '@/modules/clientes/interfaces/cliente.interface'
import { clientesService } from '@/modules/clientes/services/clientes.service'
import { getClienteOptionLabel } from '@/modules/clientes/utils/clienteNombre'
import ChoferFormModal from '@/modules/choferes/components/ChoferFormModal.vue'
import { choferesService } from '@/modules/choferes/services/choferes.service'
import type { Chofer } from '@/modules/choferes/interfaces/chofer.interface'
import VehiculoFormModal from '@/modules/vehiculos/components/VehiculoFormModal.vue'
import { vehiculosService } from '@/modules/vehiculos/services/vehiculos.service'
import type { Vehiculo } from '@/modules/vehiculos/interfaces/vehiculo.interface'
import { useDocumentoSalidaCatalogosQuery } from '../composables/useDocumentosSalidaQuery'
import { useConvertirAGreMutation } from '../composables/useDocumentoSalidaMutations'
import type { DocumentoSalida } from '../interfaces/documento-salida.interface'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'
import { AppInput, AppModal, AppSelect, UbigeoCascadeSelect } from '@/shared/components'
import SearchableSelect from '@/shared/components/form/SearchableSelect.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { ICONS } from '@/shared/constants/icons'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import { toastApiError } from '@/shared/composables/useToast'

const props = defineProps<{
  documento: DocumentoSalida | null | undefined
}>()

const open = defineModel<boolean>({ default: false })

const authStore = useAuthStore()

const catalogosQuery = useDocumentoSalidaCatalogosQuery()
const tipoGuiaOptions = ref<SelectOption[]>([])
const motivoTrasladoOptions = ref<SelectOption[]>([])
const modalidadTrasladoOptions = ref<SelectOption[]>([])
watch(
  catalogosQuery.data,
  (data) => {
    tipoGuiaOptions.value =
      data?.tiposGuia.map((o) => ({ value: o.id, label: formatListaOpcionLabel(o.nombre, o.descripcion) })) ?? []
    motivoTrasladoOptions.value =
      data?.motivosTraslado.map((o) => ({ value: o.id, label: formatListaOpcionLabel(o.nombre, o.descripcion) })) ?? []
    modalidadTrasladoOptions.value =
      data?.modalidadesTraslado.map((o) => ({ value: o.id, label: formatListaOpcionLabel(o.nombre, o.descripcion) })) ??
      []
  },
  { immediate: true },
)

const form = reactive({
  serie: '',
  idTipoGuiaRemision: '' as number | '',
  idMotivoTraslado: '' as number | '',
  idModalidadTraslado: '' as number | '',
  direccionOrigen: '',
  idDistritoOrigen: undefined as number | undefined,
  direccionLlegada: '',
  idDistritoLlegada: undefined as number | undefined,
  idTransportista: undefined as number | undefined,
  idChofer: undefined as number | undefined,
  idVehiculo: undefined as number | undefined,
  pesoBruto: undefined as number | undefined,
  numeroBultos: undefined as number | undefined,
})

// ---- Ubigeo en cascada ----
const origenPaisId = ref<number | undefined>(undefined)
const origenDeptoId = ref<number | undefined>(undefined)
const origenProvId = ref<number | undefined>(undefined)
const origenPresetting = ref(false)
const llegadaPaisId = ref<number | undefined>(undefined)
const llegadaDeptoId = ref<number | undefined>(undefined)
const llegadaProvId = ref<number | undefined>(undefined)
const llegadaPresetting = ref(false)

function usarDireccionEntrega() {
  const d = props.documento
  if (!d?.direccion_entrega) return
  form.direccionLlegada = d.direccion_entrega
  llegadaPresetting.value = true
  llegadaPaisId.value = d.id_pais_entrega ?? undefined
  llegadaDeptoId.value = d.id_departamento_entrega ?? undefined
  llegadaProvId.value = d.id_provincia_entrega ?? undefined
  form.idDistritoLlegada = d.id_distrito_entrega ?? undefined
  requestAnimationFrame(() => {
    llegadaPresetting.value = false
  })
}

// ---- Chofer / Vehículo / Transportista — buscadores que golpean el
// endpoint de listar al abrir el select (SearchableSelect llama a
// search-fn en @focus, ver src/shared/components/form/SearchableSelect.vue) ----
const choferModalOpen = ref(false)
const vehiculoModalOpen = ref(false)
const transportistaModalOpen = ref(false)
const choferLabel = ref<string | null>(null)
const vehiculoLabel = ref<string | null>(null)
const transportistaLabel = ref<string | null>(null)

async function searchChoferes(query: string): Promise<SelectOption[]> {
  const response = await choferesService.listar({ buscar: query || undefined, pagina: 1, limite: 30, isActivos: 1 })
  return response.data.map((c: Chofer) => ({
    value: c.id,
    label: `${c.nombres} ${c.apellido_paterno ?? ''}`.trim() + (c.numero_documento ? ` · ${c.numero_documento}` : ''),
  }))
}

async function searchVehiculos(query: string): Promise<SelectOption[]> {
  const response = await vehiculosService.listar({ buscar: query || undefined, pagina: 1, limite: 30 })
  return response.data.map((v: Vehiculo) => ({
    value: v.id,
    label: v.marca ? `${v.placa} · ${v.marca}` : v.placa,
  }))
}

async function searchClientes(query: string): Promise<SelectOption[]> {
  const response = await clientesService.listar({ buscar: query || undefined, pagina: 1, limite: 30, soloActivos: 1 })
  return response.data.map((c) => ({ value: c.id, label: getClienteOptionLabel(c) }))
}

function onChoferCreado(chofer?: Chofer) {
  if (!chofer) return
  form.idChofer = chofer.id
  choferLabel.value = `${chofer.nombres} ${chofer.apellido_paterno ?? ''}`.trim()
}

function onVehiculoCreado(vehiculo?: Vehiculo) {
  if (!vehiculo) return
  form.idVehiculo = vehiculo.id
  vehiculoLabel.value = vehiculo.placa
}

function onTransportistaCreado(cliente?: Cliente) {
  if (!cliente) return
  form.idTransportista = cliente.id
  transportistaLabel.value = getClienteOptionLabel(cliente)
}

watch(open, (isOpen) => {
  if (!isOpen || !props.documento) return
  const d = props.documento

  form.serie = d.serie ?? ''
  form.idTipoGuiaRemision = d.id_tipo_guia_remision ?? ''
  form.idMotivoTraslado = d.id_motivo_traslado ?? ''
  form.idModalidadTraslado = d.id_modalidad_traslado ?? ''
  form.direccionOrigen = d.direccion_origen ?? ''
  form.direccionLlegada = d.direccion_llegada ?? d.direccion_entrega ?? ''
  form.pesoBruto = d.peso_bruto ?? undefined
  form.numeroBultos = d.numero_bultos ?? undefined
  form.idTransportista = d.id_transportista ?? undefined
  form.idChofer = d.id_chofer ?? undefined
  form.idVehiculo = d.id_vehiculo ?? undefined
  choferLabel.value = d.nombre_chofer?.trim() || null
  vehiculoLabel.value = d.placa_vehiculo ?? null
  transportistaLabel.value = d.nombre_transportista ?? null

  origenPresetting.value = true
  origenPaisId.value = d.id_pais_origen ?? undefined
  origenDeptoId.value = d.id_departamento_origen ?? undefined
  origenProvId.value = d.id_provincia_origen ?? undefined
  form.idDistritoOrigen = d.id_distrito_origen ?? undefined

  llegadaPresetting.value = true
  if (d.id_distrito_llegada) {
    llegadaPaisId.value = d.id_pais_llegada ?? undefined
    llegadaDeptoId.value = d.id_departamento_llegada ?? undefined
    llegadaProvId.value = d.id_provincia_llegada ?? undefined
    form.idDistritoLlegada = d.id_distrito_llegada
  } else if (d.id_distrito_entrega) {
    // Precarga automática: si el documento ya tiene dirección de entrega y
    // todavía no se convirtió a GRE, usarla como punto de llegada por defecto.
    llegadaPaisId.value = d.id_pais_entrega ?? undefined
    llegadaDeptoId.value = d.id_departamento_entrega ?? undefined
    llegadaProvId.value = d.id_provincia_entrega ?? undefined
    form.idDistritoLlegada = d.id_distrito_entrega
  } else {
    llegadaPaisId.value = undefined
    llegadaDeptoId.value = undefined
    llegadaProvId.value = undefined
    form.idDistritoLlegada = undefined
  }

  requestAnimationFrame(() => {
    origenPresetting.value = false
    llegadaPresetting.value = false
  })
})

const mutation = useConvertirAGreMutation()

async function onGuardar() {
  if (!props.documento || !form.serie) return
  try {
    await mutation.mutateAsync({
      id: props.documento.id,
      payload: {
        serie: form.serie.toUpperCase(),
        idTipoGuiaRemision: form.idTipoGuiaRemision ? Number(form.idTipoGuiaRemision) : undefined,
        idMotivoTraslado: form.idMotivoTraslado ? Number(form.idMotivoTraslado) : undefined,
        idModalidadTraslado: form.idModalidadTraslado ? Number(form.idModalidadTraslado) : undefined,
        direccionOrigen: form.direccionOrigen || undefined,
        idDistritoOrigen: form.idDistritoOrigen,
        direccionLlegada: form.direccionLlegada || undefined,
        idDistritoLlegada: form.idDistritoLlegada,
        idTransportista: form.idTransportista,
        idChofer: form.idChofer,
        idVehiculo: form.idVehiculo,
        pesoBruto: form.pesoBruto,
        numeroBultos: form.numeroBultos,
        idUsuarioAuditoria: authStore.user?.id,
      },
    })
    open.value = false
  } catch (error) {
    toastApiError(error, 'No se pudo completar la guía')
  }
}

function handleClose() {
  open.value = false
}
</script>
