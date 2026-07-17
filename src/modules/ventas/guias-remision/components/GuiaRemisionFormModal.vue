<template>
  <AppModal
    v-model="open"
    :title="isEdit ? 'Editar guía de remisión' : 'Nueva guía de remisión'"
    :subtitle="
      isEdit
        ? 'Solo guías no aceptadas por SUNAT. Serie y número no se modifican.'
        : 'Remitente (09 / T…) o Transportista (31 / V…). Privado usa flota propia.'
    "
    size="xl"
    @close="handleClose"
  >
    <div
      v-if="isEdit && loadingGuia"
      class="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
    >
      Cargando guía...
    </div>

    <form
      v-else
      id="guia-remision-form"
      class="space-y-5"
      autocomplete="off"
      @submit.prevent="onSubmit"
    >
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AppSelect
          v-model="idTipoGuiaRemision"
          label="Tipo"
          placeholder="09 Remitente"
          required
          :options="tipoGuiaOptions"
          :disabled="saving || isEdit || catalogosQuery.isLoading.value"
          :error="errors.idTipoGuiaRemision"
        />
        <AppInput
          v-model="serie"
          label="Serie"
          placeholder="T001"
          required
          :disabled="saving || isEdit"
          :error="errors.serie"
        />
        <AppInput v-model="numero" label="Número" placeholder="Automático" disabled />
        <AppInput v-model="fecha" label="Fecha" type="date" required :disabled="saving" :error="errors.fecha" />
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AppInput
          v-model="fechaTraslado"
          label="Fecha traslado"
          type="date"
          required
          :disabled="saving"
          :error="errors.fechaTraslado"
        />
        <AppSelect
          v-model="idMotivoTraslado"
          label="Motivo"
          placeholder="Venta, traslado..."
          required
          :options="motivoOptions"
          :disabled="saving"
          :error="errors.idMotivoTraslado"
        />
        <AppSelect
          v-model="idModalidadTraslado"
          label="Modalidad"
          placeholder="Público / Privado"
          required
          :options="modalidadOptions"
          :disabled="saving"
          :error="errors.idModalidadTraslado"
        />
        <AppSelect
          v-model="idUnidadMedida"
          label="Und. peso"
          placeholder="KGM"
          :options="unidadPesoOptions"
          :disabled="saving"
        />
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AppSelect
          v-model="idSucursal"
          label="Sucursal"
          placeholder="Selecciona"
          required
          :options="sucursalOptions"
          :disabled="saving || sucursalesQuery.isLoading.value"
          :error="errors.idSucursal"
        />
        <AppSelect
          v-model="idAlmacen"
          label="Almacén"
          placeholder="Selecciona"
          required
          :options="almacenOptions"
          :disabled="saving || almacenesQuery.isLoading.value"
          :error="errors.idAlmacen"
        />
        <AppInput
          v-model="pesoBruto"
          label="Peso bruto"
          type="number"
          step="0.01"
          min="0.01"
          required
          :disabled="saving"
          :error="errors.pesoBruto"
        />
        <AppInput
          v-model="numeroBultos"
          label="N° bultos"
          type="number"
          min="1"
          :disabled="saving"
        />
      </div>

      <SearchableSelect
        v-if="esTipo31"
        v-model="idRemitente"
        label="Remitente"
        placeholder="Cliente que remite la mercancía..."
        required
        :model-label="remitenteLabel"
        :disabled="saving"
        :error="remitenteError"
        :search-fn="searchClientes"
      />

      <SearchableSelect
        v-model="idDestinatario"
        label="Destinatario"
        placeholder="Busca cliente..."
        required
        :model-label="destinatarioLabel"
        :disabled="saving"
        :error="errors.idDestinatario"
        :search-fn="searchClientes"
      />

      <div class="grid gap-4 lg:grid-cols-2">
        <div class="space-y-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800">
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">Punto de partida</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Se completa con la dirección de la sucursal seleccionada.
          </p>
          <AppInput
            v-model="direccionOrigen"
            label="Dirección origen"
            placeholder="Av. ..."
            required
            :disabled="saving"
            :error="errors.direccionOrigen"
          />
          <div class="grid gap-3 sm:grid-cols-3">
            <AppSelect
              v-model="idDepartamentoOrigen"
              label="Departamento"
              :options="departamentosOptions"
              :disabled="saving"
            />
            <AppSelect
              v-model="idProvinciaOrigen"
              label="Provincia"
              :options="provinciasOrigenOptions"
              :disabled="saving || !idDepartamentoOrigen"
            />
            <AppSelect
              v-model="idDistritoOrigen"
              label="Distrito"
              required
              :options="distritosOrigenOptions"
              :disabled="saving || !idProvinciaOrigen"
              :error="distritoOrigenError"
            />
          </div>
        </div>

        <div class="space-y-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800">
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">Punto de llegada</p>
          <AppSelect
            v-model="idDireccionLlegada"
            label="Dirección del destinatario"
            placeholder="Selecciona destinatario primero"
            :options="direccionLlegadaOptions"
            :disabled="saving || !idDestinatario || cargandoDirecciones"
            :error="direccionLlegadaSelectError"
          />
          <AppInput
            v-model="direccionLlegada"
            label="Dirección llegada"
            placeholder="Se completa al elegir dirección del cliente"
            required
            :disabled="saving"
            :error="errors.direccionLlegada"
          />
          <div class="grid gap-3 sm:grid-cols-3">
            <AppSelect
              v-model="idDepartamentoLlegada"
              label="Departamento"
              :options="departamentosOptions"
              :disabled="saving"
            />
            <AppSelect
              v-model="idProvinciaLlegada"
              label="Provincia"
              :options="provinciasLlegadaOptions"
              :disabled="saving || !idDepartamentoLlegada"
            />
            <AppSelect
              v-model="idDistritoLlegada"
              label="Distrito"
              required
              :options="distritosLlegadaOptions"
              :disabled="saving || !idProvinciaLlegada"
              :error="distritoLlegadaError"
            />
          </div>
        </div>
      </div>

      <div v-if="esPrivado" class="grid gap-3 sm:grid-cols-2">
        <SearchableSelect
          v-model="idChofer"
          label="Chofer"
          placeholder="Flota propia o del destinatario..."
          required
          :model-label="choferLabel"
          :disabled="saving"
          :error="errors.idChofer"
          :search-fn="searchChoferes"
        />
        <SearchableSelect
          v-model="idVehiculo"
          label="Vehículo"
          placeholder="Flota propia o del destinatario..."
          required
          :model-label="vehiculoLabel"
          :disabled="saving"
          :error="errors.idVehiculo"
          :search-fn="searchVehiculos"
        />
      </div>

      <div v-else class="grid gap-3 sm:grid-cols-1">
        <SearchableSelect
          v-model="idTransportista"
          label="Transportista (RUC)"
          placeholder="Busca transportista..."
          required
          :model-label="transportistaLabel"
          :disabled="saving"
          :error="errors.idTransportista"
          :search-fn="searchClientes"
        />
      </div>

      <AppInput
        v-model="observaciones"
        label="Observaciones"
        placeholder="Opcional"
        :disabled="saving"
      />

      <div class="space-y-3">
        <div class="flex items-center justify-between gap-2">
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">Ítems</p>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
            :disabled="saving"
            @click="agregarLinea"
          >
            <AppIcon :name="ICONS.plus" :size="14" />
            Agregar
          </button>
        </div>

        <p v-if="detallesError" class="text-xs text-error-500">{{ detallesError }}</p>

        <div
          v-for="(linea, index) in lineas"
          :key="linea.key"
          class="grid gap-2 rounded-xl border border-gray-100 p-3 dark:border-gray-800 sm:grid-cols-[1fr_100px_40px]"
        >
          <SearchableSelect
            v-model="linea.idProducto"
            label="Producto"
            placeholder="Busca producto..."
            :model-label="linea.productoLabel"
            :disabled="saving"
            :search-fn="searchProductos"
            @update:model-value="(v) => onProductoSelected(index, v)"
          />
          <AppInput
            v-model="linea.cantidad"
            label="Cantidad"
            type="number"
            min="0.01"
            step="0.01"
            :disabled="saving"
          />
          <button
            type="button"
            class="mt-6 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-700"
            :disabled="saving || lineas.length <= 1"
            title="Quitar"
            @click="quitarLinea(index)"
          >
            <AppIcon :name="ICONS.trash" :size="14" />
          </button>
        </div>
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
        :disabled="saving"
        @click="handleClose"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="guia-remision-form"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-70 sm:w-auto"
        :disabled="saving || (isEdit && loadingGuia)"
      >
        {{ saving ? 'Guardando...' : isEdit ? 'Actualizar guía' : 'Guardar guía' }}
      </button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import {
  useDepartamentosQuery,
  useDistritosQuery,
  usePaisesQuery,
  useProvinciasQuery,
} from '@/modules/catalogos/composables/useUbigeoQueries'
import { toSelectOptions } from '@/modules/catalogos/utils/toSelectOptions'
import { getClienteOptionLabel } from '@/modules/clientes/utils/clienteNombre'
import { clientesService } from '@/modules/clientes/services/clientes.service'
import { choferesService } from '@/modules/choferes/services/choferes.service'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import { useSucursalesQuery } from '@/modules/configuracion/sucursales/composables/useSucursalesQuery'
import { direccionesService } from '@/modules/direcciones/services/direcciones.service'
import type { Direccion } from '@/modules/direcciones/interfaces/direccion.interface'
import { productosService } from '@/modules/productos/articulos/services/productos.service'
import {
  useCreateGuiaRemisionMutation,
  useUpdateGuiaRemisionMutation,
} from '@/modules/ventas/guias-remision/composables/useGuiaRemisionMutations'
import {
  useGuiaRemisionCatalogosQuery,
  useGuiaRemisionQuery,
} from '@/modules/ventas/guias-remision/composables/useGuiasRemisionQuery'
import { guiasRemisionService } from '@/modules/ventas/guias-remision/services/guias-remision.service'
import { vehiculosService } from '@/modules/vehiculos/services/vehiculos.service'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import { AppInput, AppModal, AppSelect } from '@/shared/components'
import AppIcon from '@/shared/components/AppIcon.vue'
import SearchableSelect from '@/shared/components/form/SearchableSelect.vue'
import { ICONS } from '@/shared/constants/icons'
import type { SelectOption } from '@/shared/interfaces/form.interface'
import { toastWarning } from '@/shared/composables/useToast'

const props = defineProps<{
  guiaId?: number | null
}>()

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: [id: number] }>()

const authStore = useAuthStore()
const createMutation = useCreateGuiaRemisionMutation()
const updateMutation = useUpdateGuiaRemisionMutation()
const catalogosQuery = useGuiaRemisionCatalogosQuery()

const isEdit = computed(() => Boolean(props.guiaId))
const guiaEditId = computed(() => (open.value && props.guiaId ? props.guiaId : null))
const guiaQuery = useGuiaRemisionQuery(guiaEditId)
const loadingGuia = computed(() => isEdit.value && guiaQuery.isFetching.value)

const sucursalesFilters = ref({ pagina: 1, limite: 100 })
const almacenesFilters = ref<{ pagina: number; limite: number; idSucursal?: number }>({
  pagina: 1,
  limite: 100,
})
const sucursalesQuery = useSucursalesQuery(sucursalesFilters)
const almacenesQuery = useAlmacenesQuery(almacenesFilters)

const destinatarioLabel = ref<string | null>(null)
const remitenteLabel = ref<string | null>(null)
const idRemitente = ref<number | ''>('')
const remitenteError = ref('')
const choferLabel = ref<string | null>(null)
const vehiculoLabel = ref<string | null>(null)
const transportistaLabel = ref<string | null>(null)
const detallesError = ref('')
const distritoOrigenError = ref('')
const distritoLlegadaError = ref('')
const direccionLlegadaSelectError = ref('')
const cargandoDirecciones = ref(false)
const idDireccionLlegada = ref<number | ''>('')
const direccionesDestinatario = ref<Direccion[]>([])
const productosCache = new Map<number, { idUnidadMedida?: number; nombre: string; codigo: string }>()
const suppressUbigeoClear = ref(false)
const suppressDestinatarioReset = ref(false)

type LineaForm = {
  key: string
  idProducto: number | ''
  productoLabel: string | null
  cantidad: number
  idUnidadMedida?: number
  descripcion?: string
}

const lineas = reactive<LineaForm[]>([
  { key: crypto.randomUUID(), idProducto: '', productoLabel: null, cantidad: 1 },
])

const idPais = ref<number | ''>('')
const idDepartamentoOrigen = ref<number | ''>('')
const idProvinciaOrigen = ref<number | ''>('')
const idDistritoOrigen = ref<number | ''>('')
const idDepartamentoLlegada = ref<number | ''>('')
const idProvinciaLlegada = ref<number | ''>('')
const idDistritoLlegada = ref<number | ''>('')

const paisesQuery = usePaisesQuery()
const departamentosQuery = useDepartamentosQuery(idPais)
const provinciasOrigenQuery = useProvinciasQuery(idDepartamentoOrigen)
const distritosOrigenQuery = useDistritosQuery(idProvinciaOrigen)
const provinciasLlegadaQuery = useProvinciasQuery(idDepartamentoLlegada)
const distritosLlegadaQuery = useDistritosQuery(idProvinciaLlegada)

const departamentosOptions = computed(() => toSelectOptions(departamentosQuery.data.value))
const provinciasOrigenOptions = computed(() => toSelectOptions(provinciasOrigenQuery.data.value))
const distritosOrigenOptions = computed(() => toSelectOptions(distritosOrigenQuery.data.value))
const provinciasLlegadaOptions = computed(() => toSelectOptions(provinciasLlegadaQuery.data.value))
const distritosLlegadaOptions = computed(() => toSelectOptions(distritosLlegadaQuery.data.value))
const direccionLlegadaOptions = computed(() =>
  direccionesDestinatario.value.map((d) => ({
    value: d.id,
    label: `${d.direccion}${d.nombre_distrito ? ` · ${d.nombre_distrito}` : ''}${
      d.es_principal ? ' (principal)' : ''
    }`,
  })),
)

const tipoGuiaOptions = computed(() =>
  (catalogosQuery.data.value?.tiposGuia ?? []).map((t) => ({
    value: t.id,
    label: `${(t.nombre ?? '').replace(/_/g, ' ')} (${t.descripcion ?? ''})`,
    codigo: t.descripcion ?? '',
  })),
)
const motivoOptions = computed(() =>
  (catalogosQuery.data.value?.motivosTraslado ?? []).map((t) => ({
    value: t.id,
    label: `${(t.nombre ?? '').replace(/_/g, ' ')} (${t.descripcion ?? ''})`,
  })),
)
const modalidadOptions = computed(() =>
  (catalogosQuery.data.value?.modalidadesTraslado ?? []).map((t) => ({
    value: t.id,
    label: `${(t.nombre ?? '').replace(/_/g, ' ')} (${t.descripcion ?? ''})`,
    codigo: t.descripcion ?? '',
  })),
)
const unidadPesoOptions = computed(() =>
  toSelectOptions(
    (catalogosQuery.data.value?.unidadesMedida ?? []).filter(
      (u) =>
        (u.nombre ?? '').toUpperCase().includes('KG') ||
        (u.descripcion ?? '').toUpperCase().includes('KG'),
    ),
  ),
)
const sucursalOptions = computed(() =>
  (sucursalesQuery.data.value?.data ?? []).map((s) => ({ value: s.id, label: s.nombre })),
)
const almacenOptions = computed(() =>
  (almacenesQuery.data.value?.data ?? []).map((a) => ({ value: a.id, label: a.nombre })),
)

const { defineField, handleSubmit, resetForm, errors, setValues, values } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      idTipoGuiaRemision: yup.number().required('Tipo obligatorio'),
      serie: yup.string().required('Serie obligatoria').max(10),
      fecha: yup.string().required('Fecha obligatoria'),
      fechaTraslado: yup.string().required('Fecha de traslado obligatoria'),
      idMotivoTraslado: yup.number().required('Motivo obligatorio'),
      idModalidadTraslado: yup.number().required('Modalidad obligatoria'),
      idUnidadMedida: yup.number().optional().nullable(),
      idSucursal: yup.number().required('Sucursal obligatoria'),
      idAlmacen: yup.number().required('Almacén obligatorio'),
      pesoBruto: yup.number().typeError('Peso inválido').min(0.01, 'Peso > 0').required(),
      numeroBultos: yup.number().optional().nullable(),
      idDestinatario: yup.number().required('Destinatario obligatorio'),
      direccionOrigen: yup.string().required('Dirección origen obligatoria'),
      direccionLlegada: yup.string().required('Dirección llegada obligatoria'),
      idChofer: yup.number().optional().nullable(),
      idVehiculo: yup.number().optional().nullable(),
      idTransportista: yup.number().optional().nullable(),
      observaciones: yup.string().optional().nullable(),
    }),
  ),
  initialValues: {
    idTipoGuiaRemision: undefined as number | undefined,
    serie: 'T001',
    fecha: new Date().toISOString().slice(0, 10),
    fechaTraslado: new Date().toISOString().slice(0, 10),
    idMotivoTraslado: undefined as number | undefined,
    idModalidadTraslado: undefined as number | undefined,
    idUnidadMedida: undefined as number | undefined,
    idSucursal: undefined as number | undefined,
    idAlmacen: undefined as number | undefined,
    pesoBruto: 1,
    numeroBultos: 1,
    idDestinatario: undefined as number | undefined,
    direccionOrigen: '',
    direccionLlegada: '',
    idChofer: undefined as number | undefined,
    idVehiculo: undefined as number | undefined,
    idTransportista: undefined as number | undefined,
    observaciones: '',
  },
})

const [idTipoGuiaRemision] = defineField('idTipoGuiaRemision')
const [serie] = defineField('serie')
const [fecha] = defineField('fecha')
const [fechaTraslado] = defineField('fechaTraslado')
const [idMotivoTraslado] = defineField('idMotivoTraslado')
const [idModalidadTraslado] = defineField('idModalidadTraslado')
const [idUnidadMedida] = defineField('idUnidadMedida')
const [idSucursal] = defineField('idSucursal')
const [idAlmacen] = defineField('idAlmacen')
const [pesoBruto] = defineField('pesoBruto')
const [numeroBultos] = defineField('numeroBultos')
const [idDestinatario] = defineField('idDestinatario')
const [direccionOrigen] = defineField('direccionOrigen')
const [direccionLlegada] = defineField('direccionLlegada')
const [idChofer] = defineField('idChofer')
const [idVehiculo] = defineField('idVehiculo')
const [idTransportista] = defineField('idTransportista')
const [observaciones] = defineField('observaciones')

const numero = ref('')
const saving = computed(
  () => createMutation.isPending.value || updateMutation.isPending.value,
)

const codigoModalidad = computed(() => {
  const opt = modalidadOptions.value.find((o) => o.value === values.idModalidadTraslado)
  return opt?.codigo ?? ''
})
const esPrivado = computed(() => codigoModalidad.value === '02' || !codigoModalidad.value)
const codigoTipoGuia = computed(() => {
  const opt = tipoGuiaOptions.value.find((t) => t.value === values.idTipoGuiaRemision)
  return opt?.codigo ?? ''
})
const esTipo31 = computed(() => codigoTipoGuia.value === '31')

watch(
  paisesQuery.data,
  (paises) => {
    if (!idPais.value && paises?.length) {
      idPais.value = paises[0].id
    }
  },
  { immediate: true },
)

watch(idDepartamentoOrigen, () => {
  if (suppressUbigeoClear.value) return
  idProvinciaOrigen.value = ''
  idDistritoOrigen.value = ''
})
watch(idProvinciaOrigen, () => {
  if (suppressUbigeoClear.value) return
  idDistritoOrigen.value = ''
})
watch(idDepartamentoLlegada, () => {
  if (suppressUbigeoClear.value) return
  idProvinciaLlegada.value = ''
  idDistritoLlegada.value = ''
})
watch(idProvinciaLlegada, () => {
  if (suppressUbigeoClear.value) return
  idDistritoLlegada.value = ''
})

watch(idTipoGuiaRemision, (id) => {
  if (isEdit.value) return
  const tipo = tipoGuiaOptions.value.find((t) => t.value === id)
  if (!tipo) return
  if (tipo.codigo === '09' && !String(serie.value ?? '').toUpperCase().startsWith('T')) {
    serie.value = 'T001'
  }
  if (tipo.codigo === '31' && !String(serie.value ?? '').toUpperCase().startsWith('V')) {
    serie.value = 'V001'
  }
  if (tipo.codigo !== '31') {
    idRemitente.value = ''
    remitenteLabel.value = null
    remitenteError.value = ''
  }
})

watch(
  () => [serie.value, open.value, isEdit.value] as const,
  async ([s, isOpen, edit]) => {
    if (!isOpen || edit || !s?.trim()) {
      if (!edit) numero.value = ''
      return
    }
    try {
      const result = await guiasRemisionService.obtenerSiguienteNumero(String(s).trim())
      numero.value = result.numero
    } catch {
      numero.value = ''
    }
  },
)

function applyCatalogDefaults() {
  const cats = catalogosQuery.data.value
  if (!cats || isEdit.value) return

  if (!values.idTipoGuiaRemision) {
    const rem = cats.tiposGuia.find((t) => t.descripcion === '09')
    if (rem) idTipoGuiaRemision.value = rem.id
  }
  if (!values.idModalidadTraslado) {
    const priv = cats.modalidadesTraslado.find((t) => t.descripcion === '02')
    if (priv) idModalidadTraslado.value = priv.id
  }
  if (!values.idMotivoTraslado) {
    const venta = cats.motivosTraslado.find((t) => t.descripcion === '01')
    if (venta) idMotivoTraslado.value = venta.id
  }
  if (!values.idUnidadMedida) {
    const kgm = cats.unidadesMedida.find(
      (u) =>
        (u.nombre ?? '').toUpperCase() === 'KGM' ||
        (u.nombre ?? '').toUpperCase() === 'KG' ||
        (u.descripcion ?? '').toUpperCase().includes('KILO'),
    )
    if (kgm) idUnidadMedida.value = kgm.id
  }
}

function applySucursalAlmacenDefaults() {
  if (isEdit.value) return

  const sucursales = sucursalesQuery.data.value?.data ?? []
  if (!values.idSucursal && sucursales.length) {
    idSucursal.value = sucursales[0].id
  }

  const almacenes = almacenesQuery.data.value?.data ?? []
  if (!values.idAlmacen && almacenes.length) {
    const principal = almacenes.find((a) =>
      (a.nombre ?? '').toLowerCase().includes('principal'),
    )
    idAlmacen.value = principal?.id ?? almacenes[0].id
  }
}

watch(
  () => catalogosQuery.data.value,
  () => applyCatalogDefaults(),
  { immediate: true },
)

watch(
  () => [sucursalesQuery.data.value?.data, almacenesQuery.data.value?.data, open.value] as const,
  () => {
    if (open.value && !isEdit.value) applySucursalAlmacenDefaults()
  },
  { immediate: true },
)

watch(idSucursal, async (id, prev) => {
  almacenesFilters.value = {
    pagina: 1,
    limite: 100,
    idSucursal: id ? Number(id) : undefined,
  }

  if (suppressUbigeoClear.value || isEdit.value) return
  if (!id) return

  if (prev != null && id !== prev) {
    idAlmacen.value = undefined
  }

  const sucursal = (sucursalesQuery.data.value?.data ?? []).find((s) => s.id === Number(id))
  if (sucursal) {
    await applyOrigenDesdeSucursal(sucursal)
  }

  await nextTick()
  applySucursalAlmacenDefaults()
})

watch(idDestinatario, async (id, prev) => {
  if (suppressDestinatarioReset.value) return
  if (id === prev) return

  if (!isEdit.value || prev != null) {
    idChofer.value = undefined
    idVehiculo.value = undefined
    choferLabel.value = null
    vehiculoLabel.value = null
    idDireccionLlegada.value = ''
    direccionLlegada.value = ''
    idDepartamentoLlegada.value = ''
    idProvinciaLlegada.value = ''
    idDistritoLlegada.value = ''
  }

  direccionesDestinatario.value = []
  direccionLlegadaSelectError.value = ''

  if (!id) {
    destinatarioLabel.value = null
    return
  }

  await loadDireccionesDestinatario(Number(id))
})

watch(idDireccionLlegada, async (id) => {
  if (!id) return
  const dir = direccionesDestinatario.value.find((d) => d.id === Number(id))
  if (!dir) return
  await applyDireccionLlegada(dir)
})

watch(idRemitente, (id) => {
  if (id) remitenteError.value = ''
})

watch(idDistritoOrigen, () => {
  distritoOrigenError.value = ''
})
watch(idDistritoLlegada, () => {
  distritoLlegadaError.value = ''
})

async function applyOrigenDesdeSucursal(sucursal: {
  direccion?: string | null
  id_departamento?: number | null
  id_provincia?: number | null
  id_distrito?: number | null
}) {
  suppressUbigeoClear.value = true
  if (sucursal.direccion?.trim()) {
    direccionOrigen.value = sucursal.direccion.trim()
  }
  idDepartamentoOrigen.value = sucursal.id_departamento ?? ''
  await nextTick()
  idProvinciaOrigen.value = sucursal.id_provincia ?? ''
  await nextTick()
  idDistritoOrigen.value = sucursal.id_distrito ?? ''
  await nextTick()
  suppressUbigeoClear.value = false
}

async function loadDireccionesDestinatario(idCliente: number) {
  cargandoDirecciones.value = true
  try {
    const response = await direccionesService.listar({
      idCliente,
      pagina: 1,
      limite: 100,
      soloActivos: 1,
    })
    direccionesDestinatario.value = response.data
    const principal = response.data.find((d) => d.es_principal) ?? response.data[0]
    if (principal) {
      idDireccionLlegada.value = principal.id
      await applyDireccionLlegada(principal)
    } else {
      direccionLlegadaSelectError.value = 'El destinatario no tiene direcciones registradas'
    }
  } catch {
    direccionesDestinatario.value = []
    direccionLlegadaSelectError.value = 'No se pudieron cargar las direcciones del destinatario'
  } finally {
    cargandoDirecciones.value = false
  }
}

async function applyDireccionLlegada(dir: Direccion) {
  suppressUbigeoClear.value = true
  direccionLlegada.value = dir.direccion
  if (dir.id_pais) idPais.value = dir.id_pais
  idDepartamentoLlegada.value = dir.id_departamento ?? ''
  await nextTick()
  idProvinciaLlegada.value = dir.id_provincia ?? ''
  await nextTick()
  idDistritoLlegada.value = dir.id_distrito ?? ''
  await nextTick()
  suppressUbigeoClear.value = false
  direccionLlegadaSelectError.value = ''
}

async function searchClientes(query: string): Promise<SelectOption[]> {
  const response = await clientesService.listar({
    buscar: query || undefined,
    pagina: 1,
    limite: 20,
    soloActivos: 1,
  })
  return response.data.map((c) => ({
    value: c.id,
    label: getClienteOptionLabel(c),
  }))
}

function mapChoferOption(c: {
  id: number
  nombres: string
  apellido_paterno?: string | null
  apellido_materno?: string | null
  numero_documento?: string | null
  id_cliente?: number | null
}): SelectOption {
  const nombre =
    [c.nombres, c.apellido_paterno, c.apellido_materno].filter(Boolean).join(' ') ||
    c.numero_documento ||
    `Chofer ${c.id}`
  const scope = c.id_cliente == null ? 'Flota propia' : 'Cliente'
  return {
    value: c.id,
    label: `${nombre}${c.numero_documento ? ` · ${c.numero_documento}` : ''} (${scope})`,
  }
}

async function searchChoferes(query: string): Promise<SelectOption[]> {
  const idDest = values.idDestinatario
  const generales = await choferesService.listar({
    buscar: query || undefined,
    pagina: 1,
    limite: 50,
    isActivos: 1,
  })

  let delCliente: typeof generales.data = []
  if (idDest) {
    const response = await choferesService.listar({
      buscar: query || undefined,
      pagina: 1,
      limite: 20,
      isActivos: 1,
      idCliente: Number(idDest),
    })
    delCliente = response.data
  }

  const flotaPropia = generales.data.filter((c) => c.id_cliente == null)
  const map = new Map<number, SelectOption>()
  for (const c of [...delCliente, ...flotaPropia]) {
    map.set(c.id, mapChoferOption(c))
  }
  return [...map.values()]
}

async function searchVehiculos(query: string): Promise<SelectOption[]> {
  const idDest = values.idDestinatario
  const generales = await vehiculosService.listar({
    buscar: query || undefined,
    pagina: 1,
    limite: 50,
  })

  let delCliente: typeof generales.data = []
  if (idDest) {
    const response = await vehiculosService.listar({
      buscar: query || undefined,
      pagina: 1,
      limite: 20,
      idCliente: Number(idDest),
    })
    delCliente = response.data
  }

  const flotaPropia = generales.data.filter((v) => v.id_cliente == null)
  const map = new Map<number, SelectOption>()
  for (const v of [...delCliente, ...flotaPropia]) {
    const scope = v.id_cliente == null ? 'Flota propia' : 'Cliente'
    map.set(v.id, {
      value: v.id,
      label: `${v.placa || `Vehículo ${v.id}`} (${scope})`,
    })
  }
  return [...map.values()]
}

async function searchProductos(query: string): Promise<SelectOption[]> {
  const response = await productosService.listar({
    buscar: query || undefined,
    pagina: 1,
    limite: 20,
  })
  return response.data.map((p) => {
    productosCache.set(p.id, {
      idUnidadMedida: p.id_unidad_medida,
      nombre: p.nombre,
      codigo: p.codigo,
    })
    return {
      value: p.id,
      label: `${p.codigo} — ${p.nombre}`,
    }
  })
}

function onProductoSelected(index: number, value: number | string | null | undefined) {
  const linea = lineas[index]
  if (!linea) return
  if (value == null || value === '') {
    linea.idProducto = ''
    linea.productoLabel = null
    linea.idUnidadMedida = undefined
    linea.descripcion = undefined
    return
  }
  const id = Number(value)
  const cached = productosCache.get(id)
  linea.idProducto = id
  linea.productoLabel = cached ? `${cached.codigo} — ${cached.nombre}` : null
  linea.idUnidadMedida = cached?.idUnidadMedida
  linea.descripcion = cached?.nombre
}

function agregarLinea() {
  lineas.push({
    key: crypto.randomUUID(),
    idProducto: '',
    productoLabel: null,
    cantidad: 1,
  })
}

function quitarLinea(index: number) {
  if (lineas.length <= 1) return
  lineas.splice(index, 1)
}

function resetLocal() {
  resetForm()
  destinatarioLabel.value = null
  remitenteLabel.value = null
  idRemitente.value = ''
  remitenteError.value = ''
  choferLabel.value = null
  vehiculoLabel.value = null
  transportistaLabel.value = null
  numero.value = ''
  idDepartamentoOrigen.value = ''
  idProvinciaOrigen.value = ''
  idDistritoOrigen.value = ''
  idDepartamentoLlegada.value = ''
  idProvinciaLlegada.value = ''
  idDistritoLlegada.value = ''
  idDireccionLlegada.value = ''
  direccionesDestinatario.value = []
  almacenesFilters.value = { pagina: 1, limite: 100 }
  lineas.splice(0, lineas.length, {
    key: crypto.randomUUID(),
    idProducto: '',
    productoLabel: null,
    cantidad: 1,
  })
  detallesError.value = ''
  distritoOrigenError.value = ''
  distritoLlegadaError.value = ''
  direccionLlegadaSelectError.value = ''
}

function handleClose() {
  open.value = false
  resetLocal()
}

watch(open, async (v) => {
  if (!v || props.guiaId) return
  resetLocal()
  await nextTick()
  applyCatalogDefaults()
  applySucursalAlmacenDefaults()
  const sucursalId = values.idSucursal
  if (sucursalId) {
    const sucursal = (sucursalesQuery.data.value?.data ?? []).find(
      (s) => s.id === Number(sucursalId),
    )
    if (sucursal) await applyOrigenDesdeSucursal(sucursal)
  }
})

watch(
  () => [open.value, guiaQuery.data.value, props.guiaId] as const,
  async ([isOpen, guia, id]) => {
    if (!isOpen || !id || !guia) return

    suppressDestinatarioReset.value = true
    suppressUbigeoClear.value = true

    setValues({
      idTipoGuiaRemision: guia.id_tipo_guia_remision,
      serie: guia.serie,
      fecha: String(guia.fecha).slice(0, 10),
      fechaTraslado: String(guia.fecha_traslado ?? guia.fecha).slice(0, 10),
      idMotivoTraslado: guia.id_motivo_traslado ?? undefined,
      idModalidadTraslado: guia.id_modalidad_traslado ?? undefined,
      idUnidadMedida: guia.id_unidad_medida ?? undefined,
      idSucursal: guia.id_sucursal,
      idAlmacen: guia.id_almacen,
      pesoBruto: Number(guia.peso_bruto ?? 1),
      numeroBultos: Number(guia.numero_bultos ?? 1),
      idDestinatario: guia.id_destinatario ?? undefined,
      direccionOrigen: guia.direccion_origen ?? '',
      direccionLlegada: guia.direccion_llegada ?? '',
      idChofer: guia.id_chofer ?? undefined,
      idVehiculo: guia.id_vehiculo ?? undefined,
      idTransportista: guia.id_transportista ?? undefined,
      observaciones: guia.observaciones ?? '',
    })

    numero.value = guia.numero
    destinatarioLabel.value = guia.nombre_destinatario ?? null
    choferLabel.value = guia.nombre_chofer ?? null
    vehiculoLabel.value = guia.placa_vehiculo ?? null
    transportistaLabel.value = guia.nombre_transportista ?? null

    if (guia.codigo_tipo_guia === '31' && guia.id_cliente) {
      idRemitente.value = guia.id_cliente
      remitenteLabel.value = guia.nombre_cliente ?? null
    } else {
      idRemitente.value = ''
      remitenteLabel.value = null
    }

    almacenesFilters.value = {
      pagina: 1,
      limite: 100,
      idSucursal: guia.id_sucursal,
    }

    if (guia.id_pais_origen) idPais.value = guia.id_pais_origen
    else if (guia.id_pais_llegada) idPais.value = guia.id_pais_llegada

    idDepartamentoOrigen.value = guia.id_departamento_origen ?? ''
    await nextTick()
    idProvinciaOrigen.value = guia.id_provincia_origen ?? ''
    await nextTick()
    idDistritoOrigen.value = guia.id_distrito_origen ?? ''

    idDepartamentoLlegada.value = guia.id_departamento_llegada ?? ''
    await nextTick()
    idProvinciaLlegada.value = guia.id_provincia_llegada ?? ''
    await nextTick()
    idDistritoLlegada.value = guia.id_distrito_llegada ?? ''

    lineas.splice(
      0,
      lineas.length,
      ...(guia.detalles?.length
        ? guia.detalles.map((d) => ({
            key: crypto.randomUUID(),
            idProducto: d.id_producto,
            productoLabel: d.codigo_producto
              ? `${d.codigo_producto} — ${d.nombre_producto ?? d.descripcion ?? ''}`
              : (d.nombre_producto ?? d.descripcion ?? null),
            cantidad: Number(d.cantidad),
            idUnidadMedida: d.id_unidad_medida ?? undefined,
            descripcion: d.descripcion ?? d.nombre_producto ?? undefined,
          }))
        : [{ key: crypto.randomUUID(), idProducto: '' as const, productoLabel: null, cantidad: 1 }]),
    )

    if (guia.id_destinatario) {
      await loadDireccionesDestinatario(guia.id_destinatario)
    }

    await nextTick()
    suppressUbigeoClear.value = false
    suppressDestinatarioReset.value = false
  },
)

const onSubmit = handleSubmit(async (formValues) => {
  const userId = authStore.user?.id
  if (!userId) return

  const tipoOpt = tipoGuiaOptions.value.find((t) => t.value === formValues.idTipoGuiaRemision)
  const es31 = tipoOpt?.codigo === '31'

  if (es31 && !idRemitente.value) {
    remitenteError.value = 'Remitente obligatorio para GRE transportista (31)'
    toastWarning('Selecciona el remitente de la mercancía')
    return
  }

  if (!idDistritoOrigen.value || !idDistritoLlegada.value) {
    if (!idDistritoOrigen.value) distritoOrigenError.value = 'Selecciona distrito de origen'
    if (!idDistritoLlegada.value) distritoLlegadaError.value = 'Selecciona distrito de llegada'
    toastWarning('Completa el ubigeo de origen y destino')
    return
  }

  const modalidadCodigo = codigoModalidad.value
  if (modalidadCodigo === '02' && (!formValues.idChofer || !formValues.idVehiculo)) {
    toastWarning('Transporte privado requiere chofer y vehículo')
    return
  }
  if (modalidadCodigo === '01' && !formValues.idTransportista) {
    toastWarning('Transporte público requiere transportista')
    return
  }

  const detalles = lineas
    .filter((l) => l.idProducto && Number(l.cantidad) > 0)
    .map((l, i) => ({
      item: i + 1,
      idProducto: Number(l.idProducto),
      cantidad: Number(l.cantidad),
      idUnidadMedida: l.idUnidadMedida,
      descripcion: l.descripcion,
    }))

  if (detalles.length === 0) {
    detallesError.value = 'Agrega al menos un producto'
    toastWarning('Agrega al menos un producto')
    return
  }
  detallesError.value = ''

  const idClientePayload = es31
    ? Number(idRemitente.value)
    : Number(formValues.idDestinatario)

  const payloadBase = {
    fecha: formValues.fecha,
    fechaTraslado: formValues.fechaTraslado,
    idSucursal: Number(formValues.idSucursal),
    idAlmacen: Number(formValues.idAlmacen),
    idCliente: idClientePayload,
    idMotivoTraslado: Number(formValues.idMotivoTraslado),
    idUnidadMedida: formValues.idUnidadMedida ? Number(formValues.idUnidadMedida) : undefined,
    pesoBruto: Number(formValues.pesoBruto),
    numeroBultos: formValues.numeroBultos ? Number(formValues.numeroBultos) : 1,
    direccionOrigen: formValues.direccionOrigen,
    idDistritoOrigen: Number(idDistritoOrigen.value),
    idDestinatario: Number(formValues.idDestinatario),
    direccionLlegada: formValues.direccionLlegada,
    idDistritoLlegada: Number(idDistritoLlegada.value),
    idModalidadTraslado: Number(formValues.idModalidadTraslado),
    idTransportista: formValues.idTransportista
      ? Number(formValues.idTransportista)
      : undefined,
    idChofer: formValues.idChofer ? Number(formValues.idChofer) : undefined,
    idVehiculo: formValues.idVehiculo ? Number(formValues.idVehiculo) : undefined,
    observaciones: formValues.observaciones || undefined,
    detalles,
    idUsuarioAuditoria: userId,
  }

  if (isEdit.value && props.guiaId) {
    const updated = await updateMutation.mutateAsync({
      id: props.guiaId,
      payload: payloadBase,
    })
    emit('saved', updated.id)
  } else {
    const created = await createMutation.mutateAsync({
      idTipoGuiaRemision: Number(formValues.idTipoGuiaRemision),
      serie: String(formValues.serie).trim().toUpperCase(),
      ...payloadBase,
    })
    emit('saved', created.id)
  }

  handleClose()
})
</script>
