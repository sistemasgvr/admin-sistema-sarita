<template>
  <AppModal v-model="open" title="Corrección o cambio de balón" :subtitle="venta ? `${venta.serie}-${venta.numero}` : undefined" size="lg">
    <p v-if="cargando" class="py-6 text-sm">Cargando venta y movimientos...</p>
    <div v-else-if="venta && contexto" class="space-y-4">
      <p class="text-sm text-gray-600 dark:text-gray-300">Selecciona si el balón todavía está reservado o si el cliente lo devuelve para recibir otro del mismo gas, tipo y propietario. La venta y sus cobros conservan su historial.</p>
      <label class="block text-sm font-medium">Operación
        <select v-model="tipo" class="mt-1 w-full rounded-lg border border-gray-300 bg-transparent p-2.5" :disabled="guardando">
          <option value="CAMBIO">Devolución y cambio físico después de la entrega</option>
          <option value="CORRECCION_RESERVA">Corregir selección antes del despacho</option>
        </select>
      </label>
      <label class="block text-sm font-medium">Balón actual de la venta
        <select v-model="actualId" class="mt-1 w-full rounded-lg border border-gray-300 bg-transparent p-2.5" :disabled="guardando">
          <option :value="0">Selecciona el balón</option>
          <option v-for="b in contexto.balones" :key="b.id" :value="b.id">{{ b.codigo_balon }} · {{ b.estado.replaceAll('_', ' ') }}</option>
        </select>
      </label>
      <AlmacenSelectField v-model="almacen" label="Almacén del cambio" required :disabled="guardando || tipo === 'CORRECCION_RESERVA'" />
      <PosBalonSelectField v-model="nuevoId" label="Balón de reemplazo" mode="general" :id-almacen="almacen" :disabled="guardando || !actual" :extra-filters="actual ? { idTipoBalon: actual.id_tipo_balon, idProductoGas: actual.id_producto_gas } : undefined" :client-filter="b => b.id !== actualId && b.nombre_estado_balon === 'DISPONIBLE'" hint="La disponibilidad, propiedad y prueba hidrostática se vuelven a validar al guardar." />
      <template v-if="tipo === 'CAMBIO'">
        <p class="rounded-lg bg-gray-50 p-3 text-sm dark:bg-white/5">Gas que saldrá con el reemplazo: <strong>{{ actual?.cantidad_salida ?? 'No determinado' }}</strong>, en la unidad de stock del producto.</p>
        <label class="block text-sm font-medium">Gas utilizable que regresa, medido en la misma unidad
          <input v-model="devuelto" type="number" min="0" :max="Number(actual?.cantidad_salida ?? 0)" step="0.0001" class="mt-1 w-full rounded-lg border border-gray-300 bg-transparent p-2.5" :disabled="guardando || condicion === 'EN_MANTENIMIENTO'" />
        </label>
        <p class="text-xs text-gray-500">Un balón vacío devuelve 0 de gas. Si está dañado o el gas no se puede utilizar, registra 0.</p>
        <label class="block text-sm font-medium">Condición del balón devuelto
          <select v-model="condicion" class="mt-1 w-full rounded-lg border border-gray-300 bg-transparent p-2.5" :disabled="guardando">
            <option value="DISPONIBLE">Disponible después de revisión</option>
            <option value="EN_MANTENIMIENTO">Requiere mantenimiento</option>
          </select>
        </label>
      </template>
      <p v-else class="rounded-lg bg-gray-50 p-3 text-sm dark:bg-white/5">El balón anterior se libera y el nuevo queda reservado para esta venta. Esta corrección no mueve gas y requiere que todavía no exista un despacho vigente.</p>
      <AppTextarea v-model="motivo" label="Motivo" placeholder="Explica la corrección o el cambio (mínimo 5 caracteres)" :rows="2" :disabled="guardando" />
      <p class="text-xs text-gray-500">Para cambiar de producto, capacidad o propietario, o modificar el importe cobrado, se necesita una devolución comercial y una nueva venta. Este cambio conserva las condiciones de la venta original.</p>
      <div v-if="contexto.historial.length" class="space-y-2 border-t border-gray-200 pt-3 dark:border-gray-800">
        <p class="text-sm font-semibold">Historial de correcciones y cambios</p>
        <div v-for="h in contexto.historial" :key="h.id" class="rounded-lg bg-gray-50 p-2 text-sm dark:bg-white/5">
          <p>{{ h.tipo === 'CORRECCION' ? 'Corrección de venta' : h.datos.tipoOperacion === 'CORRECCION_RESERVA' ? 'Corrección de reserva' : 'Cambio físico' }} · {{ new Date(h.fecha).toLocaleString('es-PE', { timeZone: 'America/Lima' }) }}</p>
          <p class="text-gray-500">{{ h.motivo }}</p>
        </div>
      </div>
    </div>
    <template #footer>
      <button class="rounded-lg border px-4 py-2 text-sm" :disabled="guardando" @click="open = false">Cerrar</button>
      <button class="rounded-lg bg-brand-500 px-4 py-2 text-sm text-white disabled:opacity-50" :disabled="!puedeGuardar || guardando" @click="guardar">{{ guardando ? 'Registrando...' : 'Registrar operación' }}</button>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { AppModal, AppTextarea } from '@/shared/components'
import AlmacenSelectField from '@/modules/configuracion/almacenes/components/AlmacenSelectField.vue'
import PosBalonSelectField from './PosBalonSelectField.vue'
import { comprobantesService } from '../services/comprobantes.service'
import type { CambioBalonVsdPayload, Comprobante, OperacionesVsd } from '../interfaces/comprobante.interface'
import { toastApiError, toastSuccess, toastWarning } from '@/shared/composables/useToast'

const props = defineProps<{ modelValue: boolean; ventaId: number | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const open = computed({ get: () => props.modelValue, set: value => emit('update:modelValue', value) })
const queryClient = useQueryClient()
const venta = ref<Comprobante | null>(null)
const contexto = ref<OperacionesVsd | null>(null)
const cargando = ref(false)
const guardando = ref(false)
const tipo = ref<CambioBalonVsdPayload['tipoOperacion']>('CAMBIO')
const actualId = ref(0)
const nuevoId = ref<number | ''>('')
const almacen = ref<number | ''>('')
const devuelto = ref('0')
const condicion = ref<CambioBalonVsdPayload['condicionDevolucion']>('DISPONIBLE')
const motivo = ref('')
const solicitud = ref('')
let intento: CambioBalonVsdPayload | null = null
const actual = computed(() => contexto.value?.balones.find(b => b.id === Number(actualId.value)))
const puedeGuardar = computed(() => venta.value?.permite_edicion_segura === true && venta.value?.version && actual.value && nuevoId.value && almacen.value && motivo.value.trim().length >= 5 && (tipo.value === 'CORRECCION_RESERVA' || Number(actual.value.cantidad_salida) > 0))
watch(condicion, value => { if (value === 'EN_MANTENIMIENTO') devuelto.value = '0' })
watch([tipo, actualId, almacen], () => { nuevoId.value = ''; devuelto.value = '0' })
watch(() => [props.modelValue, props.ventaId] as const, async ([visible, id]) => {
  if (!visible || !id) return
  cargando.value = true
  venta.value = null
  contexto.value = null
  motivo.value = ''; actualId.value = 0; nuevoId.value = ''; devuelto.value = '0'; condicion.value = 'DISPONIBLE'
  solicitud.value = crypto.randomUUID(); intento = null
  try {
    const [v, c] = await Promise.all([comprobantesService.obtenerPorId(id), comprobantesService.operacionesVsd(id)])
    if (!props.modelValue || props.ventaId !== id) return
    venta.value = v; contexto.value = c; almacen.value = v.id_almacen ?? ''
    if (c.balones.length === 1) actualId.value = c.balones[0]!.id
    tipo.value = c.balones.some(b => b.estado === 'PENDIENTE_ENVIO') ? 'CORRECCION_RESERVA' : 'CAMBIO'
  } catch (error) { toastApiError(error, 'No se pudo cargar la venta') }
  finally { cargando.value = false }
}, { immediate: true })

async function guardar() {
  if (!venta.value || !actual.value || !puedeGuardar.value || guardando.value) return
  const cantidad = Number(devuelto.value)
  if (!Number.isFinite(cantidad) || cantidad < 0 || cantidad > Number(actual.value.cantidad_salida)) {
    toastWarning('Revisa la cantidad de gas que regresa'); return
  }
  const payload: CambioBalonVsdPayload = {
    tipoOperacion: tipo.value, solicitud: solicitud.value, versionEsperada: venta.value.version!,
    idBalonActual: actual.value.id, idBalonNuevo: Number(nuevoId.value), idAlmacen: Number(almacen.value),
    cantidadGasDevuelta: tipo.value === 'CAMBIO' ? cantidad : 0,
    cantidadGasSalida: tipo.value === 'CAMBIO' ? Number(actual.value.cantidad_salida) : 0,
    condicionDevolucion: tipo.value === 'CAMBIO' ? condicion.value : 'DISPONIBLE', motivo: motivo.value.trim(),
  }
  // Same payload keeps its idempotency key across network retries.
  if (intento && JSON.stringify(intento) !== JSON.stringify(payload)) {
    payload.solicitud = crypto.randomUUID(); solicitud.value = payload.solicitud
  }
  intento = payload
  guardando.value = true
  try {
    await comprobantesService.cambiarBalonVsd(venta.value.id, payload)
    await queryClient.invalidateQueries()
    toastSuccess('Operación registrada con su devolución, salida e historial')
    open.value = false
  } catch (error) { toastApiError(error, 'No se pudo registrar la operación. Recarga la venta si sus datos cambiaron.') }
  finally { guardando.value = false }
}
</script>
