<template>
  <AppModal v-model="isOpen" title="Registrar movimiento de inventario" size="md">
    <form class="space-y-4" @submit.prevent="onSubmit">
      <AppSelect
        v-model="form.naturaleza"
        label="Naturaleza"
        :options="naturalezaOptions"
        placeholder="Seleccionar"
        required
        :error="errors.naturaleza"
      />

      <AppSelectWithCreate
        :can-create="canCreateListaOpcion"
        create-title="Nuevo tipo de movimiento"
        :disabled="!form.naturaleza || tipoMovimientoQuery.isLoading.value"
        @create="tipoMovimientoModalOpen = true"
      >
        <AppSelect
          v-model="form.codigoTipoMovimiento"
          label="Tipo de movimiento"
          :options="tipoMovimientoOptions"
          :placeholder="tipoMovimientoQuery.isLoading.value ? 'Cargando...' : 'Seleccionar'"
          required
          :disabled="!form.naturaleza || tipoMovimientoQuery.isLoading.value"
          :error="errors.codigoTipoMovimiento"
        />
      </AppSelectWithCreate>

      <AppDatePicker
        v-model="form.fecha"
        label="Fecha"
        placeholder="dd/mm/aaaa"
      />

      <div v-if="form.naturaleza === 'PRODUCTO'" class="space-y-4">
        <AppSelectSearch
          v-model="form.idProducto"
          label="Producto"
          :options="productosOptions"
          placeholder="Buscar producto..."
          :disabled="productosQuery.isLoading.value"
          :searchable="true"
          :error="errors.idProducto"
        />
      </div>

      <div v-if="form.naturaleza === 'BALON'" class="space-y-4">
        <AppSelectSearch
          v-model="form.idBalon"
          label="Balón"
          :options="balonesOptions"
          placeholder="Buscar balón..."
          :disabled="balonesQuery.isLoading.value"
          :searchable="true"
          :error="errors.idBalon"
        />
      </div>

      <div v-if="form.naturaleza === 'BALON'" class="space-y-4">
        <ClienteSelectField
          v-model="form.idCliente"
          label="Cliente / proveedor"
          placeholder="Opcional: a quién queda / de quién viene el balón"
          :required="false"
        />
      </div>

      <AppInput
        v-model="form.cantidad"
        label="Cantidad"
        type="number"
        :min="1"
        required
        :error="errors.cantidad"
      />

      <div v-if="isAjuste" class="space-y-4">
        <AppSelect
          v-model="form.sentidoAjuste"
          label="Sentido del ajuste"
          :options="sentidoAjusteOptions"
          placeholder="Seleccionar"
          required
        />
      </div>

      <div v-if="form.naturaleza === 'PRODUCTO' || isTraslado" class="space-y-4">
        <AppSelect
          v-model="form.idAlmacenOrigen"
          :label="isTraslado ? 'Almacén origen' : 'Almacén'"
          :options="almacenesOptions"
          placeholder="Seleccionar"
          :disabled="almacenesQuery.isLoading.value"
          :error="errors.idAlmacenOrigen"
        />
      </div>

      <div v-if="isTraslado" class="space-y-4">
        <AppSelect
          v-model="form.idAlmacenDestino"
          label="Almacén destino"
          :options="almacenesOptions"
          placeholder="Seleccionar"
          :disabled="almacenesQuery.isLoading.value"
          :error="errors.idAlmacenDestino"
        />
      </div>

      <div v-else-if="form.naturaleza === 'BALON'" class="space-y-4">
        <AppSelect
          v-model="form.idAlmacenDestino"
          label="Almacén destino"
          :options="almacenesOptions"
          placeholder="Seleccionar"
          :disabled="almacenesQuery.isLoading.value"
        />
      </div>

      <AppTextarea
        v-model="form.glosa"
        label="Glosa"
        placeholder="Descripción del movimiento..."
        :rows="2"
      />
    </form>

    <template #footer>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:w-auto"
        :disabled="mutation.isPending.value"
        @click="isOpen = false"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        :disabled="mutation.isPending.value || !isFormValid"
        @click="onSubmit"
      >
        {{ mutation.isPending.value ? 'Registrando...' : 'Registrar movimiento' }}
      </button>
    </template>
  </AppModal>

  <ListaOpcionFormModal
    v-model="tipoMovimientoModalOpen"
    :id-lista="ListaIds.TIPO_MOV_INV_UNIFICADO"
    title="Nuevo tipo de movimiento"
    :subtitle="tipoMovimientoModalSubtitle"
    nombre-placeholder="Ej. SALIDA_MERMA / ENTRADA_AJUSTE"
    @saved="onTipoMovimientoCreated"
  />
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useAuthStore } from '@/modules/auth/stores/auth.store'
import {
  AppDatePicker,
  AppInput,
  AppModal,
  AppSelect,
  AppTextarea,
} from '@/shared/components'
import AppSelectSearch from '@/shared/components/form/AppSelectSearch.vue'
import AppSelectWithCreate from '@/shared/components/form/AppSelectWithCreate.vue'
import ClienteSelectField from '@/modules/clientes/components/ClienteSelectField.vue'
import ListaOpcionFormModal from '@/modules/catalogos/components/ListaOpcionFormModal.vue'
import { useCreateInventarioMovimientoMutation } from '../composables/useInventarioMovimientoMutations'
import type { CreateInventarioMovimientoPayload } from '../interfaces/inventario-movimiento.interface'
import { useProductosQuery } from '@/modules/productos/articulos/composables/useProductosQuery'
import { useBalonesQuery } from '@/modules/balones/cilindros/composables/useBalonesQuery'
import { useAlmacenesQuery } from '@/modules/configuracion/almacenes/composables/useAlmacenesQuery'
import { useListaOpcionesQuery } from '@/modules/catalogos/composables/useListaOpcionesQuery'
import type { ListaOpcion } from '@/modules/catalogos/interfaces/lista-opcion.interface'
import { ListaIds } from '@/shared/constants/lista-ids'
import { PermisoBanderas } from '@/shared/constants/permissions'
import { formatListaOpcionLabel } from '@/shared/utils/formatListaOpcion'

export type InventarioMovimientoPrefill = {
  tipo?: 'AJUSTE' | 'TRASLADO'
  idProducto?: number
  idAlmacen?: number
  naturaleza?: 'PRODUCTO' | 'BALON'
}

const isOpen = defineModel<boolean>({ default: false })
const props = defineProps<{
  prefill?: InventarioMovimientoPrefill | null
}>()

const authStore = useAuthStore()
const mutation = useCreateInventarioMovimientoMutation()

const naturalezaOptions = [
  { value: 'PRODUCTO', label: 'Producto' },
  { value: 'BALON', label: 'Balón' },
]

const TIPOS_PRODUCTO_MANUAL = new Set(['AJUSTE', 'TRASLADO', 'REPOSICION', 'CONSUMO_INTERNO'])
const TIPOS_BALON_MANUAL = new Set([
  'SALIDA_MANTENIMIENTO',
  'ENTRADA_DEVOLUCION',
  'ENTRADA_MANTENIMIENTO',
  'TRASLADO_LIMA',
  'RETORNO_LIMA',
])

const tipoMovInvUnificadoId = ref(ListaIds.TIPO_MOV_INV_UNIFICADO)
const tipoMovimientoQuery = useListaOpcionesQuery(tipoMovInvUnificadoId)

const canCreateListaOpcion = computed(() =>
  authStore.hasPermission(PermisoBanderas.INVENTARIO_MOVIMIENTOS_CREAR),
)
const tipoMovimientoModalOpen = ref(false)

const tiposSesionExtra = reactive<{ producto: Set<string>; balon: Set<string> }>({
  producto: new Set(),
  balon: new Set(),
})

const tipoMovimientoModalSubtitle = computed(() => {
  if (form.naturaleza === 'BALON') {
    return 'Usa MAYÚSCULAS_CON_GUION_BAJO empezando con SALIDA_ o ENTRADA_ (define el signo automáticamente). ' +
      'Ojo: si no es uno de los tipos ya conocidos por el sistema, el balón no cambiará de custodia ' +
      '(a quién/dónde está) — solo quedará el registro del movimiento. Avisa a soporte técnico si necesitas que también mueva la custodia.'
  }
  return 'Usa MAYÚSCULAS_CON_GUION_BAJO empezando con SALIDA_ o ENTRADA_ para que el sistema sepa si resta o suma stock automáticamente.'
})

function onTipoMovimientoCreated(opcion: ListaOpcion) {
  if (form.naturaleza === 'BALON') {
    tiposSesionExtra.balon.add(opcion.nombre)
  } else {
    tiposSesionExtra.producto.add(opcion.nombre)
  }
  form.codigoTipoMovimiento = opcion.nombre
}

const sentidoAjusteOptions = [
  { value: 'MAS', label: 'Sumar (+)' },
  { value: 'MENOS', label: 'Restar (-)' },
]

const form = reactive<Omit<CreateInventarioMovimientoPayload, 'idUsuarioAuditoria'>>({
  naturaleza: '' as CreateInventarioMovimientoPayload['naturaleza'],
  codigoTipoMovimiento: '',
  fecha: new Date().toISOString().split('T')[0],
  idProducto: undefined,
  idBalon: undefined,
  cantidad: 1,
  idAlmacenOrigen: undefined,
  idAlmacenDestino: undefined,
  idCliente: undefined,
  glosa: '',
  sentidoAjuste: undefined,
})

const errors = reactive<Record<string, string>>({})

const productosFilters = ref({ pagina: 1, limite: 100 })
const productosQuery = useProductosQuery(productosFilters)
const productosOptions = computed(() =>
  (productosQuery.data.value?.data ?? []).map((p) => ({
    value: p.id,
    label: p.nombre,
  })),
)

const balonesFilters = ref({ pagina: 1, limite: 100 })
const balonesQuery = useBalonesQuery(balonesFilters)
const balonesOptions = computed(() =>
  (balonesQuery.data.value?.data ?? []).map((b) => ({
    value: b.id,
    label: `${b.numero_serie} - ${b.nombre_tipo_balon ?? ''}`,
  })),
)

const almacenesFilters = ref({ pagina: 1, limite: 100 })
const almacenesQuery = useAlmacenesQuery(almacenesFilters)
const almacenesOptions = computed(() =>
  (almacenesQuery.data.value?.data ?? []).map((a) => ({
    value: a.id,
    label: a.nombre,
  })),
)

const tipoMovimientoOptions = computed(() => {
  const esBalon = form.naturaleza === 'BALON'
  const permitidos = esBalon ? TIPOS_BALON_MANUAL : TIPOS_PRODUCTO_MANUAL
  const extra = esBalon ? tiposSesionExtra.balon : tiposSesionExtra.producto
  return (tipoMovimientoQuery.data.value ?? [])
    .filter((opcion) => permitidos.has(opcion.nombre) || extra.has(opcion.nombre))
    .map((opcion) => ({
      value: opcion.nombre,
      label: formatListaOpcionLabel(opcion.nombre, opcion.descripcion),
    }))
})

const isAjuste = computed(() => form.codigoTipoMovimiento === 'AJUSTE')
const isTraslado = computed(() => form.codigoTipoMovimiento === 'TRASLADO')

const isFormValid = computed(() => {
  if (!form.naturaleza || !form.codigoTipoMovimiento || form.cantidad <= 0) return false
  if (form.naturaleza === 'PRODUCTO' && !form.idProducto) return false
  if (form.naturaleza === 'BALON' && !form.idBalon) return false
  if (isTraslado.value) {
    if (!form.idAlmacenOrigen || !form.idAlmacenDestino) return false
    if (form.idAlmacenOrigen === form.idAlmacenDestino) return false
  }
  if (isAjuste.value && !form.sentidoAjuste) return false
  return true
})

function applyPrefill(prefill: InventarioMovimientoPrefill | null | undefined) {
  if (!prefill) return
  form.naturaleza = prefill.naturaleza ?? 'PRODUCTO'
  if (prefill.tipo === 'AJUSTE' || prefill.tipo === 'TRASLADO') {
    form.codigoTipoMovimiento = prefill.tipo
  }
  if (prefill.idProducto) form.idProducto = prefill.idProducto
  if (prefill.idAlmacen) form.idAlmacenOrigen = prefill.idAlmacen
}

function validate(): boolean {
  Object.keys(errors).forEach((k) => delete errors[k])
  let valid = true

  if (!form.naturaleza) {
    errors.naturaleza = 'Requerido'
    valid = false
  }
  if (!form.codigoTipoMovimiento) {
    errors.codigoTipoMovimiento = 'Requerido'
    valid = false
  }
  if (!form.cantidad || form.cantidad <= 0) {
    errors.cantidad = 'Debe ser mayor a 0'
    valid = false
  }
  if (form.naturaleza === 'PRODUCTO' && !form.idProducto) {
    errors.idProducto = 'Seleccione un producto'
    valid = false
  }
  if (form.naturaleza === 'BALON' && !form.idBalon) {
    errors.idBalon = 'Seleccione un balón'
    valid = false
  }
  if (isTraslado.value) {
    if (!form.idAlmacenOrigen) {
      errors.idAlmacenOrigen = 'Seleccione almacén origen'
      valid = false
    }
    if (!form.idAlmacenDestino) {
      errors.idAlmacenDestino = 'Seleccione almacén destino'
      valid = false
    }
    if (
      form.idAlmacenOrigen &&
      form.idAlmacenDestino &&
      form.idAlmacenOrigen === form.idAlmacenDestino
    ) {
      errors.idAlmacenDestino = 'Debe ser distinto al origen'
      valid = false
    }
  }

  return valid
}

function onSubmit() {
  if (!validate()) return

  const payload: CreateInventarioMovimientoPayload = {
    naturaleza: form.naturaleza,
    codigoTipoMovimiento: form.codigoTipoMovimiento,
    fecha: form.fecha,
    cantidad: form.cantidad,
    idUsuarioAuditoria: authStore.user?.id ?? 0,
    ...(form.naturaleza === 'PRODUCTO' ? { idProducto: form.idProducto } : {}),
    ...(form.naturaleza === 'BALON' ? { idBalon: form.idBalon } : {}),
    ...(form.idAlmacenOrigen ? { idAlmacenOrigen: form.idAlmacenOrigen } : {}),
    ...(form.idAlmacenDestino ? { idAlmacenDestino: form.idAlmacenDestino } : {}),
    ...(form.naturaleza === 'BALON' && form.idCliente ? { idCliente: form.idCliente } : {}),
    ...(isAjuste.value && form.sentidoAjuste ? { sentidoAjuste: form.sentidoAjuste } : {}),
    ...(form.glosa ? { glosa: form.glosa } : {}),
  }

  mutation.mutate(payload, {
    onSuccess: () => {
      isOpen.value = false
      resetForm()
    },
  })
}

function resetForm() {
  form.naturaleza = '' as CreateInventarioMovimientoPayload['naturaleza']
  form.codigoTipoMovimiento = ''
  form.fecha = new Date().toISOString().split('T')[0]
  form.idProducto = undefined
  form.idBalon = undefined
  form.cantidad = 1
  form.idAlmacenOrigen = undefined
  form.idAlmacenDestino = undefined
  form.idCliente = undefined
  form.glosa = ''
  form.sentidoAjuste = undefined
  Object.keys(errors).forEach((k) => delete errors[k])
}

watch(isOpen, (open) => {
  if (open) {
    resetForm()
    applyPrefill(props.prefill)
  } else {
    resetForm()
  }
})

watch(
  () => props.prefill,
  (prefill) => {
    if (isOpen.value) applyPrefill(prefill)
  },
)

watch(() => form.naturaleza, () => {
  if (!props.prefill?.tipo) form.codigoTipoMovimiento = ''
  if (!props.prefill?.idProducto) form.idProducto = undefined
  form.idBalon = undefined
  form.idCliente = undefined
})
</script>
